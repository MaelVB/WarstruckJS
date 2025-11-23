import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  GameState,
  GameAction,
  PlayerId,
} from './interfaces/game.interface';
import {
  GameActionRecord,
  GameMetadata,
  PersistedGame,
} from './interfaces/game-history.interface';
import { Game, GameDocument } from './schemas/game.schema';

/**
 * Service de persistance des parties de jeu avec MongoDB
 * Stocke les parties et l'historique des actions dans MongoDB
 */
@Injectable()
export class GamePersistenceService {
  private readonly logger = new Logger(GamePersistenceService.name);

  constructor(
    @InjectModel(Game.name) private gameModel: Model<GameDocument>,
  ) {}

  /**
   * Sauvegarder une nouvelle partie
   */
  async saveNewGame(gameState: GameState): Promise<void> {
    const gameDoc = new this.gameModel({
      gameId: gameState.id,
      phase: gameState.phase,
      currentState: gameState,
      currentPlayer: gameState.currentPlayer,
      turnNumber: gameState.turnNumber,
      player1Id: gameState.players.player1.id,
      player2Id: gameState.players.player2.id,
      history: [],
    });

    await gameDoc.save();
    this.logger.log(`Game ${gameState.id} saved to MongoDB`);
  }

  /**
   * Enregistrer une action et mettre à jour l'état du jeu
   */
  async recordAction(
    gameId: string,
    playerId: PlayerId,
    action: GameAction,
    gameStateBefore: GameState,
    gameStateAfter: GameState,
  ): Promise<void> {
    const gameDoc = await this.gameModel.findOne({ gameId });
    if (!gameDoc) {
      throw new NotFoundException(`Game ${gameId} not found`);
    }

    const actionRecord: GameActionRecord = {
      id: uuidv4(),
      timestamp: new Date(),
      turnNumber: gameStateBefore.turnNumber,
      playerId,
      action,
      gameStateBefore,
      gameStateAfter,
    };

    gameDoc.history.push(actionRecord);
    gameDoc.currentState = gameStateAfter;
    gameDoc.phase = gameStateAfter.phase;
    gameDoc.currentPlayer = gameStateAfter.currentPlayer;
    gameDoc.turnNumber = gameStateAfter.turnNumber;
    gameDoc.winner = gameStateAfter.winner;

    await gameDoc.save();
    this.logger.debug(`Action ${actionRecord.id} recorded for game ${gameId}`);
  }

  /**
   * Récupérer une partie par son ID
   */
  async getGame(gameId: string): Promise<PersistedGame> {
    const gameDoc = await this.gameModel.findOne({ gameId }).lean<any>();
    if (!gameDoc) {
      this.logger.error(`Game ${gameId} not found in MongoDB`);
      throw new NotFoundException(`Game ${gameId} not found`);
    }

    return {
      metadata: {
        id: gameDoc.gameId,
        createdAt: gameDoc.createdAt || new Date(),
        updatedAt: gameDoc.updatedAt || new Date(),
        phase: gameDoc.phase,
        currentPlayer: gameDoc.currentPlayer,
        turnNumber: gameDoc.turnNumber,
        winner: gameDoc.winner,
        player1Id: gameDoc.player1Id,
        player2Id: gameDoc.player2Id,
      },
      currentState: gameDoc.currentState,
      history: gameDoc.history,
    };
  }

  /**
   * Récupérer l'état actuel d'une partie
   */
  async getCurrentGameState(gameId: string): Promise<GameState> {
    const game = await this.getGame(gameId);
    return game.currentState;
  }

  /**
   * Récupérer l'historique complet d'une partie
   */
  async getGameHistory(gameId: string): Promise<GameActionRecord[]> {
    const game = await this.getGame(gameId);
    return game.history;
  }

  /**
   * Rejouer une partie jusqu'à une action spécifique
   */
  async replayToAction(gameId: string, actionId: string): Promise<GameState> {
    const game = await this.getGame(gameId);
    const actionIndex = game.history.findIndex(a => a.id === actionId);
    
    if (actionIndex === -1) {
      throw new NotFoundException(`Action ${actionId} not found in game ${gameId}`);
    }

    // Retourner l'état du jeu après l'action spécifiée
    return game.history[actionIndex].gameStateAfter;
  }

  /**
   * Rejouer une partie jusqu'à un tour spécifique
   */
  async replayToTurn(gameId: string, turnNumber: number): Promise<GameState> {
    const game = await this.getGame(gameId);
    
    // Trouver la dernière action du tour spécifié
    const actions = game.history.filter(a => a.turnNumber === turnNumber);
    
    if (actions.length === 0) {
      throw new NotFoundException(`Turn ${turnNumber} not found in game ${gameId}`);
    }

    const lastAction = actions[actions.length - 1];
    return lastAction.gameStateAfter;
  }

  /**
   * Lister toutes les parties
   */
  async getAllGames(): Promise<GameMetadata[]> {
    const games = await this.gameModel.find().lean<any>();
    return games.map((g: any) => ({
      id: g.gameId,
      createdAt: g.createdAt || new Date(),
      updatedAt: g.updatedAt || new Date(),
      phase: g.phase,
      currentPlayer: g.currentPlayer,
      turnNumber: g.turnNumber,
      winner: g.winner,
      player1Id: g.player1Id,
      player2Id: g.player2Id,
    }));
  }

  /**
   * Supprimer une partie
   */
  async deleteGame(gameId: string): Promise<void> {
    const result = await this.gameModel.deleteOne({ gameId });
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Game ${gameId} not found`);
    }
    this.logger.log(`Game ${gameId} deleted`);
  }

  /**
   * Vérifier si une partie existe
   */
  async gameExists(gameId: string): Promise<boolean> {
    const count = await this.gameModel.countDocuments({ gameId });
    return count > 0;
  }

  /**
   * Mettre à jour l'état actuel d'une partie (après une action manuelle)
   */
  async updateGameState(gameId: string, gameState: GameState): Promise<void> {
    const gameDoc = await this.gameModel.findOne({ gameId });
    if (!gameDoc) {
      this.logger.error(`Cannot update game ${gameId} - not found in MongoDB`);
      throw new NotFoundException(`Game ${gameId} not found`);
    }

    gameDoc.currentState = gameState;
    gameDoc.phase = gameState.phase;
    gameDoc.currentPlayer = gameState.currentPlayer;
    gameDoc.turnNumber = gameState.turnNumber;
    gameDoc.winner = gameState.winner;

    await gameDoc.save();
    this.logger.debug(`Game ${gameId} updated. Phase: ${gameState.phase}`);
  }
}
