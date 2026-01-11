import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  GameState,
  GameAction,
  BoardPiece,
  Position,
  PlayerId,
  PieceId,
  Player,
  ReinforcementPiece,
  ReservePiece,
  PieceDefinition,
} from './interfaces/game.interface';
import { GamePersistenceService } from './game-persistence.service';

type Offset = { row: number; col: number };

const ADJACENT_OFFSETS: Offset[] = [
  { row: -1, col: -1 },
  { row: -1, col: 0 },
  { row: -1, col: 1 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
];

const ORTHOGONAL_OFFSETS: Offset[] = [
  { row: -1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
  { row: 1, col: 0 },
];

const DIAGONAL_OFFSETS: Offset[] = [
  { row: -1, col: -1 },
  { row: -1, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 1 },
];

const createManhattanOffsets = (radius: number, includeCenter: boolean): Offset[] => {
  const offsets: Offset[] = [];
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      const distance = Math.abs(dr) + Math.abs(dc);
      if (distance > radius) {
        continue;
      }
      if (!includeCenter && dr === 0 && dc === 0) {
        continue;
      }
      offsets.push({ row: dr, col: dc });
    }
  }
  return offsets;
};

const INFANTRYMAN_MOVEMENT_OFFSETS = createManhattanOffsets(2, false);
const GENERAL_INFLUENCE_OFFSETS = createManhattanOffsets(2, true);

const SCOUT_MOVEMENT_OFFSETS: Offset[] = [
  ...ADJACENT_OFFSETS,
  { row: -2, col: -2 },
  { row: -2, col: 2 },
  { row: 2, col: -2 },
  { row: 2, col: 2 },
];

const MOVEMENT_OFFSETS: Record<PieceId, Offset[]> = {
  general: ADJACENT_OFFSETS,
  colonel: ADJACENT_OFFSETS,
  infantryman: INFANTRYMAN_MOVEMENT_OFFSETS,
  scout: SCOUT_MOVEMENT_OFFSETS,
};

const ATTACK_OFFSETS: Record<PieceId, Offset[]> = {
  general: ORTHOGONAL_OFFSETS,
  colonel: ORTHOGONAL_OFFSETS,
  infantryman: ADJACENT_OFFSETS,
  scout: DIAGONAL_OFFSETS,
};

const INFLUENCE_OFFSETS: Partial<Record<PieceId, Offset[]>> = {
  general: GENERAL_INFLUENCE_OFFSETS,
  colonel: [{ row: 0, col: 0 }, ...ORTHOGONAL_OFFSETS],
};

@Injectable()
export class GameBoardService {
  private readonly logger = new Logger(GameBoardService.name);

  constructor(private readonly persistenceService: GamePersistenceService) {}

  /**
   * Crée une nouvelle partie (sans decks, ils seront choisis après)
   */
  async createGame(): Promise<GameState> {
    this.logger.log('Creating new game (deck selection phase)');

    const gameId = uuidv4();
    
    // Déterminer l'attaquant et le défenseur aléatoirement
    const isPlayer1Attacker = Math.random() < 0.5;
    
    const player1: Player = {
      id: 'player1',
      role: isPlayer1Attacker ? 'attacker' : 'defender',
      deck: [],
      reinforcements: [],
      actionPoints: 0,
      generalAdvanced: false,
      deckSelected: false,
      hasDeployedThisTurn: false,
    };

    const player2: Player = {
      id: 'player2',
      role: isPlayer1Attacker ? 'defender' : 'attacker',
      deck: [],
      reinforcements: [],
      actionPoints: 0,
      generalAdvanced: false,
      deckSelected: false,
      hasDeployedThisTurn: false,
    };

    // Créer le plateau vide (8x8)
    const board: (BoardPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

    const gameState: GameState = {
      id: gameId,
      phase: 'deck-selection',
      board,
      players: { player1, player2 },
      currentPlayer: player1.role === 'defender' ? 'player1' : 'player2', // Le défenseur commence
      turnNumber: 0,
      actionsThisTurn: 0,
    };

    // Sauvegarder la nouvelle partie
    await this.persistenceService.saveNewGame(gameState);
    
    return gameState;
  }

  /**
   * Sélectionner le deck d'un joueur
   */
  async selectDeck(gameId: string, playerId: PlayerId, selectedPieces: PieceId[]): Promise<GameState> {
    const game = await this.persistenceService.getCurrentGameState(gameId);
    this.ensureBoardIsArray(game);
    
    if (game.phase !== 'deck-selection') {
      throw new BadRequestException('La sélection des decks n\'est possible qu\'en phase de sélection');
    }

    if (selectedPieces.length !== 19) {
      throw new BadRequestException('Vous devez sélectionner exactement 19 pièces (le Général est ajouté automatiquement)');
    }

    // Vérifier que toutes les pièces sont des types autorisés (colonel, infantryman, scout)
    const allowedTypes: PieceId[] = ['colonel', 'infantryman', 'scout'];
    for (const pieceType of selectedPieces) {
      if (!allowedTypes.includes(pieceType)) {
        throw new BadRequestException(`Type de pièce non autorisé: ${pieceType}. Seuls les Colonels, Fantassins et Éclaireurs peuvent être sélectionnés.`);
      }
    }

    const player = game.players[playerId];

    if (player.deckSelected) {
      throw new BadRequestException('Vous avez déjà sélectionné votre deck');
    }

    // Créer le deck avec un général automatiquement ajouté
    const deckWithGeneral: PieceId[] = ['general', ...selectedPieces];
    
    player.deck = deckWithGeneral.map(pieceType => ({
      id: uuidv4(),
      pieceType,
      owner: playerId,
    }));
    player.deckSelected = true;

    // Si les deux joueurs ont sélectionné leur deck, passer à la phase de setup
    if (game.players.player1.deckSelected && game.players.player2.deckSelected) {
      game.phase = 'setup';
      this.logger.log('Both players have selected their decks. Moving to setup phase.');
    }

    // Mettre à jour la partie persistée
    await this.persistenceService.updateGameState(gameId, game);
    
    return game;
  }

  /**
   * Obtenir l'état d'une partie
   */
  async getGame(gameId: string): Promise<GameState> {
    return await this.persistenceService.getCurrentGameState(gameId);
  }

  /**
   * Placer le général lors du setup
   */
  async placeGeneral(gameId: string, playerId: PlayerId, position: Position): Promise<GameState> {
    const game = await this.persistenceService.getCurrentGameState(gameId);
    this.ensureBoardIsArray(game);
    
    if (game.phase !== 'setup') {
      throw new BadRequestException('Le placement du général n\'est possible qu\'en phase de setup');
    }

    const player = game.players[playerId];
    
    // Vérifier que le général n'est pas déjà placé
    const generalAlreadyPlaced = this.findPieceOnBoard(game, playerId, 'general');
    if (generalAlreadyPlaced) {
      throw new BadRequestException('Le général a déjà été placé');
    }

    // Vérifier que le général est dans le deck
    const generalInDeck = player.deck.find(p => p.pieceType === 'general');
    if (!generalInDeck) {
      throw new BadRequestException('Le général n\'est pas dans le deck');
    }

    // Retirer le général du deck
    player.deck = player.deck.filter(p => p.id !== generalInDeck.id);

    // Placer le général sur le plateau
    const general: BoardPiece = {
      id: generalInDeck.id,
      pieceType: 'general',
      owner: playerId,
      position,
      faceUp: true,
      usedAbilities: {
        'Parachutage': 2,
        'En avant !': 3,
      },
    };

    game.board[position.row][position.col] = general;

    // Mettre à jour la partie persistée
    await this.persistenceService.updateGameState(gameId, game);
    
    return game;
  }

  /**
   * Choisir 4 pièces pour les renforts lors du setup
   */
  async setupReinforcements(gameId: string, playerId: PlayerId, pieceIds: string[]): Promise<GameState> {
    const game = await this.persistenceService.getCurrentGameState(gameId);
    this.ensureBoardIsArray(game);
    
    if (game.phase !== 'setup') {
      throw new BadRequestException('Le setup des renforts n\'est possible qu\'en phase de setup');
    }

    if (pieceIds.length !== 4) {
      throw new BadRequestException('Vous devez choisir exactement 4 pièces pour les renforts');
    }

    const player = game.players[playerId];

    // Vérifier que toutes les pièces sont dans le deck
    const pieces: ReservePiece[] = [];
    for (const pieceId of pieceIds) {
      const piece = player.deck.find(p => p.id === pieceId);
      if (!piece) {
        throw new BadRequestException(`La pièce ${pieceId} n'est pas dans le deck`);
      }
      pieces.push(piece);
    }

    // Retirer les pièces du deck et les ajouter aux renforts
    player.deck = player.deck.filter(p => !pieceIds.includes(p.id));
    
    player.reinforcements = pieces.map((piece, index) => ({
      id: piece.id,
      pieceType: piece.pieceType,
      owner: playerId,
      faceUp: index === 0, // Seule la première pièce est face visible
      queuePosition: index,
    }));

    // Mettre à jour la partie persistée
    await this.persistenceService.updateGameState(gameId, game);
    
    return game;
  }

  /**
   * Démarrer la partie après le setup
   */
  async startGame(gameId: string): Promise<GameState> {
    try {
      const game = await this.persistenceService.getCurrentGameState(gameId);
      
      if (game.phase !== 'setup') {
        throw new BadRequestException('La partie a déjà commencé ou est terminée');
      }

      // Vérifier que les renforts sont configurés
      if (game.players.player1.reinforcements.length !== 4 || 
          game.players.player2.reinforcements.length !== 4) {
        throw new BadRequestException('Chaque joueur doit avoir 4 pièces en renforts');
      }

      // Assurer que le board est un vrai tableau 2D (après désérialisation MongoDB)
      this.logger.debug(`Before ensureBoardIsArray: board exists=${!!game.board}, is array=${Array.isArray(game.board)}`);
      this.ensureBoardIsArray(game);
      this.logger.debug(`After ensureBoardIsArray: board length=${game.board.length}, all rows are arrays=${game.board.every(row => Array.isArray(row))}`);

      // Placer automatiquement les généraux si ce n'est pas déjà fait
      let player1General = this.findPieceOnBoard(game, 'player1', 'general');
      let player2General = this.findPieceOnBoard(game, 'player2', 'general');
    
    if (!player1General) {
      // Placer le général du joueur 1 (défenseur) en D1 (row 7, col 3)
      const generalPiece1 = game.players.player1.deck.find(p => p.pieceType === 'general');
      if (generalPiece1) {
        game.players.player1.deck = game.players.player1.deck.filter(p => p.id !== generalPiece1.id);
        player1General = {
          id: generalPiece1.id,
          pieceType: 'general',
          owner: 'player1',
          position: { row: 7, col: 3 },
          faceUp: true,
          usedAbilities: {
            'Parachutage': 2,
            'En avant !': 3,
          },
        };
        game.board[7][3] = player1General;
        this.logger.log('Général du joueur 1 placé automatiquement en D1');
      }
    }
    
    if (!player2General) {
      // Placer le général du joueur 2 en D8 (row 0, col 3)
      const generalPiece2 = game.players.player2.deck.find(p => p.pieceType === 'general');
      if (generalPiece2) {
        game.players.player2.deck = game.players.player2.deck.filter(p => p.id !== generalPiece2.id);
        player2General = {
          id: generalPiece2.id,
          pieceType: 'general',
          owner: 'player2',
          position: { row: 0, col: 3 },
          faceUp: true,
          usedAbilities: {
            'Parachutage': 2,
            'En avant !': 3,
          },
        };
        game.board[0][3] = player2General;
        this.logger.log('Général du joueur 2 placé automatiquement en D8');
      }
    }

    // Placer automatiquement les renforts sur le plateau dans la colonne H
    this.placeReinforcementsOnBoard(game, 'player1');
    this.placeReinforcementsOnBoard(game, 'player2');

    // Avancer le général de l'attaquant d'une case
    const attacker = game.players.player1.role === 'attacker' ? game.players.player1 : game.players.player2;
    const attackerGeneralPiece = this.findPieceOnBoard(game, attacker.id, 'general');
    
    if (attackerGeneralPiece) {
      const newRow = attacker.id === 'player1' ? 
        attackerGeneralPiece.position.row - 1 : 
        attackerGeneralPiece.position.row + 1;
      
      this.logger.debug(`Moving attacker general from [${attackerGeneralPiece.position.row}, ${attackerGeneralPiece.position.col}] to [${newRow}, ${attackerGeneralPiece.position.col}]`);
      this.logger.debug(`Board exists: ${!!game.board}, Board is array: ${Array.isArray(game.board)}, Board length: ${game.board?.length}`);
      this.logger.debug(`Board[${newRow}] exists: ${!!game.board[newRow]}, is array: ${Array.isArray(game.board[newRow])}`);
      
      // Vérifier que la nouvelle ligne existe
      if (!game.board[newRow]) {
        this.logger.error(`Board row ${newRow} does not exist! Reinitializing...`);
        this.ensureBoardIsArray(game);
      }
      
      // Effacer l'ancienne position
      game.board[attackerGeneralPiece.position.row][attackerGeneralPiece.position.col] = null;
      
      // Nouvelle position
      attackerGeneralPiece.position = { row: newRow, col: attackerGeneralPiece.position.col };
      game.board[newRow][attackerGeneralPiece.position.col] = attackerGeneralPiece;
      
      attacker.generalAdvanced = true;
    }

      game.phase = 'playing';
      game.turnNumber = 1;
      
      // Calculer les points d'action pour le premier tour
      this.calculateActionPoints(game);

      // Mettre à jour la partie persistée
      await this.persistenceService.updateGameState(gameId, game);
      
      return game;
    } catch (error) {
      this.logger.error(`Error starting game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Normaliser le plateau pour s'assurer qu'il est un vrai tableau 2D
   * (utile après désérialisation MongoDB)
   */
  private ensureBoardIsArray(game: GameState): void {
    if (!game.board || !Array.isArray(game.board)) {
      this.logger.warn('Board is not an array, reinitializing');
      game.board = Array(8).fill(null).map(() => Array(8).fill(null));
      return;
    }

    // S'assurer que chaque ligne est un vrai tableau
    for (let i = 0; i < 8; i++) {
      if (!game.board[i] || !Array.isArray(game.board[i])) {
        this.logger.warn(`Board row ${i} is not an array, reinitializing`);
        game.board[i] = Array(8).fill(null);
      }
      // S'assurer que la ligne a 8 colonnes
      if (game.board[i].length !== 8) {
        const oldLength = game.board[i].length;
        game.board[i] = [...game.board[i], ...Array(8 - oldLength).fill(null)].slice(0, 8);
      }
    }
  }

  /**
   * Calculer les points d'action pour le joueur actuel
   * Le terrain actif exclut la colonne H (colonne de renfort)
   */
  private calculateActionPoints(game: GameState): void {
    const currentPlayer = game.players[game.currentPlayer];
    let actionPoints = 0; // Pas de point de base, uniquement ceux des Hauts Gradés

    // Parcourir uniquement les colonnes A-G (0-6), la colonne H (7) est exclue
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 7; col++) { // col < 7 pour exclure la colonne H
        const piece = game.board[row][col];
        if (piece && piece.owner === game.currentPlayer) {
          if (piece.pieceType === 'general') {
            actionPoints += 2; // Commandement suprême : un général octroie 2 pts d'action
          } else if (piece.pieceType === 'colonel') {
            actionPoints += 1; // Relai de commandement : un colonel octroie 1 pt d'action
          }
        }
      }
    }

    currentPlayer.actionPoints = actionPoints;
  }

  /**
   * Placer les renforts sur le plateau dans la colonne H
   */
  private placeReinforcementsOnBoard(game: GameState, playerId: PlayerId): void {
    const player = game.players[playerId];
    const col = 7; // Colonne H

    this.logger.debug(`Placing reinforcements for ${playerId}, board length: ${game.board.length}`);

    // Vérifier si les renforts sont déjà sur le plateau
    const hasReinforcementsOnBoard = player.reinforcements.some(reinf => {
      return game.board.some(row => row?.some(cell => cell?.id === reinf.id));
    });

    if (hasReinforcementsOnBoard) {
      this.logger.debug(`Reinforcements already placed for ${playerId}`);
      return; // Déjà placés
    }

    // Placer les renforts
    player.reinforcements.forEach((reinf, index) => {
      let row: number;
      
      if (playerId === 'player1') {
        // Joueur 1 (ligne 1): 
        // queuePosition 0 → H1 (row 7) - déployable
        // queuePosition 1 → H2 (row 6)
        // queuePosition 2 → H3 (row 5)
        // queuePosition 3 → H4 (row 4)
        row = 7 - index;
      } else {
        // Joueur 2 (ligne 8):
        // queuePosition 0 → H8 (row 0) - déployable
        // queuePosition 1 → H7 (row 1)
        // queuePosition 2 → H6 (row 2)
        // queuePosition 3 → H5 (row 3)
        row = index;
      }

      this.logger.debug(`Attempting to place ${reinf.pieceType} (queuePos ${reinf.queuePosition}) at [${row}, ${col}]. Board[${row}] exists: ${!!game.board[row]}`);

      // Vérifier que la ligne existe
      if (!game.board[row]) {
        this.logger.error(`Board[${row}] is undefined! This should not happen after ensureBoardIsArray`);
        return;
      }

      // Ne placer que si la case est libre
      if (!game.board[row][col]) {
        const reinforcementPiece: BoardPiece = {
          id: reinf.id,
          pieceType: reinf.pieceType,
          owner: playerId,
          position: { row, col },
          faceUp: true,
          usedAbilities: this.initializeAbilities(reinf.pieceType),
        };
        game.board[row][col] = reinforcementPiece;
        this.logger.debug(`Renfort ${reinf.pieceType} du joueur ${playerId} placé en position [${row}, ${col}]`);
      }
    });
  }

  /**
   * Exécuter une action
   */
  async executeAction(gameId: string, playerId: PlayerId, action: GameAction): Promise<GameState> {
    const gameBefore = await this.persistenceService.getCurrentGameState(gameId);
    this.ensureBoardIsArray(gameBefore);
    
    if (gameBefore.phase !== 'playing') {
      throw new BadRequestException('La partie n\'est pas en cours');
    }

    if (gameBefore.currentPlayer !== playerId) {
      throw new BadRequestException('Ce n\'est pas votre tour');
    }

    const player = gameBefore.players[playerId];

    if (action.type === 'endTurn') {
      const gameAfter = this.endTurn(gameBefore);
      // Enregistrer l'action dans l'historique
      await this.persistenceService.recordAction(gameId, playerId, action, gameBefore, gameAfter);
      return gameAfter;
    }

    // Vérifier qu'il reste des points d'action
    if (player.actionPoints <= 0) {
      throw new BadRequestException('Plus de points d\'action disponibles');
    }

    switch (action.type) {
      case 'move':
        this.executeMove(gameBefore, action);
        break;
      case 'attack':
        this.executeAttack(gameBefore, action);
        break;
      case 'deployFromReinforcements':
        this.executeDeployFromReinforcements(gameBefore, action);
        break;
      case 'addToReinforcements':
        this.executeAddToReinforcements(gameBefore, action);
        break;
      case 'useAbility':
        this.executeUseAbility(gameBefore, action);
        break;
      case 'skipPostTurnReinforcement':
        throw new BadRequestException('Utilisez la méthode completePostTurn pour gérer la phase post-turn');
      default:
        throw new BadRequestException('Type d\'action inconnu');
    }

    // Consommer un point d'action
    player.actionPoints--;
    gameBefore.actionsThisTurn++;

    // Vérifier la condition de victoire
    this.checkVictory(gameBefore);

    const gameAfter = gameBefore;

    // Enregistrer l'action dans l'historique
    await this.persistenceService.recordAction(gameId, playerId, action, gameBefore, gameAfter);

    return gameAfter;
  }

  /**
   * Déplacer une pièce
   */
  private executeMove(game: GameState, action: GameAction): void {
    if (!action.pieceId || !action.to) {
      throw new BadRequestException('pieceId et to sont requis pour un déplacement');
    }

    const piece = this.findPieceById(game, action.pieceId);
    if (!piece) {
      throw new BadRequestException('Pièce introuvable');
    }

    if (piece.owner !== game.currentPlayer) {
      throw new BadRequestException('Vous ne pouvez déplacer que vos propres pièces');
    }

    // Vérifier que la destination est valide (dans les limites du plateau)
    if (!this.isActiveBoardPosition(action.to)) {
      throw new BadRequestException('La destination doit etre sur le terrain actif (colonnes A-G)');
    }

    // Vérifier si la pièce est dans la colonne des renforts (colonne H = col 7)
    // Les pièces dans cette colonne NE PEUVENT PAS être déplacées manuellement
    // Elles avancent automatiquement pendant la phase post-turn
    // Le déploiement depuis H8/H1 doit utiliser l'action 'deployFromReinforcements', pas 'move'
    if (piece.position.col === 7) {
      const pieceRowDisplay = 8 - piece.position.row; // Conversion row → numéro de ligne affichée
      throw new BadRequestException(
        `Les pièces dans la colonne des renforts ne peuvent pas être déplacées manuellement. ` +
        `Votre pièce est en H${pieceRowDisplay}. ` +
        `Les renforts avancent automatiquement pendant la phase post-turn. ` +
        `Pour déployer une pièce depuis H1 ou H8, utilisez l'action de déploiement (pas un déplacement).`
      );
    }


    if (!this.isWithinAlliedInfluence(game, piece)) {
      throw new BadRequestException('La piece n\'est pas dans une zone d\'influence alliee');
    }

    if (!this.isWithinMovementZone(piece, action.to)) {
      throw new BadRequestException('Deplacement hors de la zone de mouvement de la piece');
    }

    const targetPiece = game.board[action.to.row][action.to.col];
    
    if (targetPiece) {
      throw new BadRequestException('La case de destination est occupee');
    }

    // Effacer l'ancienne position
    game.board[piece.position.row][piece.position.col] = null;

    // Nouvelle position
    piece.position = action.to;
    game.board[action.to.row][action.to.col] = piece;
  }

  /**
   * Attaquer une pièce
   */
  private executeAttack(game: GameState, action: GameAction): void {
    if (!action.pieceId || !action.targetPieceId) {
      throw new BadRequestException('pieceId et targetPieceId sont requis pour une attaque');
    }

    const attacker = this.findPieceById(game, action.pieceId);
    const target = this.findPieceById(game, action.targetPieceId);

    if (!attacker || !target) {
      throw new BadRequestException('Pièce attaquante ou cible introuvable');
    }

    if (attacker.owner !== game.currentPlayer) {
      throw new BadRequestException('Vous ne pouvez attaquer qu\'avec vos propres pièces');
    }

    if (target.owner === game.currentPlayer) {
      throw new BadRequestException('Vous ne pouvez pas attaquer vos propres pièces');
    }

    if (attacker.position.col === 7) {
      throw new BadRequestException('Les pieces dans la colonne des renforts ne peuvent pas attaquer');
    }

    if (target.position.col === 7) {
      throw new BadRequestException('Impossible d\'attaquer une piece dans la colonne des renforts');
    }

    if (!this.isWithinAlliedInfluence(game, attacker)) {
      throw new BadRequestException('La piece n\'est pas dans une zone d\'influence alliee');
    }

    if (!this.isWithinAttackZone(attacker, target.position)) {
      throw new BadRequestException('La cible est hors de la zone d\'attaque');
    }

    this.destroyPiece(game, target);
  }

  /**
   * Déployer une pièce depuis les renforts
   */
  private executeDeployFromReinforcements(game: GameState, action: GameAction): void {
    if (!action.pieceId || !action.to) {
      throw new BadRequestException('pieceId et to sont requis pour le déploiement');
    }

    const player = game.players[game.currentPlayer];
    const reinforcementPiece = player.reinforcements.find(p => p.id === action.pieceId);

    if (!reinforcementPiece) {
      this.logger.debug(`Pièce ${action.pieceId} non trouvée dans reinforcements. IDs disponibles: ${player.reinforcements.map(r => r.id).join(', ')}`);
      throw new BadRequestException(`Pièce de renfort introuvable. ID recherché: ${action.pieceId}`);
    }

    // Vérifier que la pièce est en position 0 (prête à être déployée)
    if (reinforcementPiece.queuePosition !== 0) {
      this.logger.debug(`Pièce ${action.pieceId} a queuePosition=${reinforcementPiece.queuePosition}, attendu: 0`);
      throw new BadRequestException(`Seule la pièce en première position peut être déployée (position actuelle: ${reinforcementPiece.queuePosition})`);
    }

    // Vérifier que la destination est sur la ligne de déploiement
    // Player1 déploie sur la ligne 1 (row 7)
    // Player2 déploie sur la ligne 8 (row 0)
    const deploymentRow = game.currentPlayer === 'player1' ? 7 : 0;
    const deploymentLine = game.currentPlayer === 'player1' ? 1 : 8;
    if (action.to.row !== deploymentRow) {
      throw new BadRequestException(`Vous devez déployer sur votre ligne de déploiement (ligne ${deploymentLine})`);
    }

    // Vérifier que la destination n'est pas dans la colonne des renforts (col 7 = colonne H)
    if (action.to.col === 7) {
      throw new BadRequestException('Vous ne pouvez pas déployer dans la colonne des renforts');
    }

    // Vérifier qu'il n'y a pas de pièce adverse sur la ligne de déploiement (bloquage)
    const hasEnemyOnDeploymentLine = this.hasEnemyOnDeploymentLine(game, game.currentPlayer);
    if (hasEnemyOnDeploymentLine) {
      throw new BadRequestException('Une pièce adverse bloque votre ligne de déploiement');
    }

    // Vérifier que la case est libre
    if (game.board[action.to.row][action.to.col]) {
      throw new BadRequestException('La case de destination est occupée');
    }

    // Trouver et effacer la pièce de la colonne H sur le plateau
    const col = 7; // Colonne H
    for (let row = 0; row < 8; row++) {
      const piece = game.board[row][col];
      if (piece && piece.id === action.pieceId) {
        game.board[row][col] = null; // Effacer l'ancienne position
        this.logger.debug(`Pièce ${action.pieceId} effacée de sa position en colonne H [${row}, ${col}]`);
        break;
      }
    }

    // Retirer la pièce des renforts
    player.reinforcements = player.reinforcements.filter(p => p.id !== action.pieceId);

    // Réorganiser la file des renforts
    player.reinforcements.forEach((p, index) => {
      p.queuePosition = index;
      if (index === 0) {
        p.faceUp = true; // La nouvelle première pièce est révélée
      }
    });

    // Placer la pièce sur le plateau à sa nouvelle position
    const newPiece: BoardPiece = {
      id: reinforcementPiece.id,
      pieceType: reinforcementPiece.pieceType,
      owner: game.currentPlayer,
      position: action.to,
      faceUp: true,
      usedAbilities: this.initializeAbilities(reinforcementPiece.pieceType),
    };

    game.board[action.to.row][action.to.col] = newPiece;
    this.logger.debug(`Pièce ${action.pieceId} déployée en [${action.to.row}, ${action.to.col}]`);
  }

  /**
   * Ajouter une pièce de la réserve aux renforts
   */
  private executeAddToReinforcements(game: GameState, action: GameAction): void {
    if (!action.reservePieceId) {
      throw new BadRequestException('reservePieceId est requis');
    }

    const player = game.players[game.currentPlayer];
    const reservePiece = player.deck.find(p => p.id === action.reservePieceId);

    if (!reservePiece) {
      throw new BadRequestException('Pièce de réserve introuvable');
    }

    // Retirer de la réserve
    player.deck = player.deck.filter(p => p.id !== action.reservePieceId);

    // Ajouter à la fin de la file de renforts
    const newReinforcement: ReinforcementPiece = {
      id: reservePiece.id,
      pieceType: reservePiece.pieceType,
      owner: game.currentPlayer,
      faceUp: false,
      queuePosition: player.reinforcements.length,
    };

    player.reinforcements.push(newReinforcement);

    // Si c'est la seule pièce, la révéler
    if (player.reinforcements.length === 1) {
      newReinforcement.faceUp = true;
    }
  }

  /**
   * Utiliser une capacité
   */
  private executeUseAbility(game: GameState, action: GameAction): void {
    if (!action.pieceId || !action.abilityName) {
      throw new BadRequestException('pieceId et abilityName sont requis');
    }

    const piece = this.findPieceById(game, action.pieceId);
    if (!piece) {
      throw new BadRequestException('Pièce introuvable');
    }

    if (piece.owner !== game.currentPlayer) {
      throw new BadRequestException('Vous ne pouvez utiliser que les capacités de vos pièces');
    }

    if (piece.position.col === 7) {
      throw new BadRequestException('Les pieces dans la colonne des renforts ne peuvent pas utiliser de capacite');
    }

    if (!this.isWithinAlliedInfluence(game, piece)) {
      throw new BadRequestException('La piece n\'est pas dans une zone d\'influence alliee');
    }

    const remainingCharges = piece.usedAbilities[action.abilityName];
    if (remainingCharges === undefined) {
      throw new BadRequestException('Capacité introuvable pour cette pièce');
    }

    if (remainingCharges <= 0) {
      throw new BadRequestException('Plus de charges disponibles pour cette capacité');
    }

    // TODO: Implémenter les effets des capacités (parachutage, en avant, etc.)

    // Consommer une charge
    piece.usedAbilities[action.abilityName]--;
  }

  /**
   * Terminer le tour - passe en phase post-turn
   */
  private endTurn(game: GameState): GameState {
    const updatedGame = { ...game };
    
    // Passer en phase post-turn pour déplacer les renforts et permettre l'ajout
    updatedGame.phase = 'post-turn';
    
    // Déplacer tous les renforts d'une case vers le bord du plateau
    this.moveReinforcementsTowardBoard(updatedGame, updatedGame.currentPlayer);

    return updatedGame;
  }

  /**
   * Déplacer les renforts d'une case vers la ligne de déploiement
   * Player1: renforts en H4-H1, se déplacent vers H1 (row 7)
   * Player2: renforts en H5-H8, se déplacent vers H8 (row 0)
   */
  private moveReinforcementsTowardBoard(game: GameState, playerId: PlayerId): void {
    const col = 7; // Colonne H
    
    // Identifier les pièces dans la colonne H pour ce joueur
    const reinforcementPieces: BoardPiece[] = [];
    
    for (let row = 0; row < 8; row++) {
      const piece = game.board[row][col];
      if (piece && piece.owner === playerId) {
        reinforcementPieces.push(piece);
      }
    }
    
    this.logger.debug(`Déplacement des renforts pour ${playerId}: ${reinforcementPieces.length} pièces trouvées`);
    
    // Trier les pièces par row (ordre de déplacement)
    // IMPORTANT : Déplacer en commençant par la pièce la PLUS PROCHE de la ligne de déploiement
    // pour éviter les collisions (la case de destination doit être libre)
    if (playerId === 'player1') {
      // Joueur 1: déplacer vers H1 (row 7)
      // H4 (row 4) → H3 (row 5) → H2 (row 6) → H1 (row 7)
      // Déplacer d'abord les pièces avec row le PLUS GRAND (déjà près de H1)
      reinforcementPieces.sort((a, b) => b.position.row - a.position.row);
    } else {
      // Joueur 2: déplacer vers H8 (row 0)
      // H5 (row 3) → H6 (row 2) → H7 (row 1) → H8 (row 0)
      // Déplacer d'abord les pièces avec row le PLUS PETIT (déjà près de H8)
      reinforcementPieces.sort((a, b) => a.position.row - b.position.row);
    }
    
    // Déplacer chaque pièce d'une case vers la ligne de déploiement (dans l'ordre trié)
    reinforcementPieces.forEach(piece => {
      const currentRow = piece.position.row;
      // Player1: avance vers row 7 (H1), donc row augmente
      // Player2: avance vers row 0 (H8), donc row diminue
      const newRow = playerId === 'player1' ? currentRow + 1 : currentRow - 1;
      
      // Vérifier que la nouvelle position est valide et libre
      if (newRow >= 0 && newRow < 8 && !game.board[newRow][col]) {
        // Effacer l'ancienne position
        game.board[currentRow][col] = null;
        
        // Nouvelle position
        piece.position = { row: newRow, col };
        game.board[newRow][col] = piece;
        
        this.logger.debug(`Renfort déplacé de H${8 - currentRow} (row ${currentRow}) vers H${8 - newRow} (row ${newRow})`);
      } else {
        this.logger.debug(`Renfort en H${8 - currentRow} ne peut pas avancer (position ${newRow} invalide ou occupée)`);
      }
    });
  }

  /**
   * Compléter la phase post-turn (avec ou sans ajout de renfort)
   */
  async completePostTurn(gameId: string, playerId: PlayerId, addReinforcement: boolean, reservePieceId?: string): Promise<GameState> {
    const game = await this.persistenceService.getCurrentGameState(gameId);
    this.ensureBoardIsArray(game);
    
    if (game.phase !== 'post-turn') {
      throw new BadRequestException('Aucune phase post-turn en cours');
    }

    if (game.currentPlayer !== playerId) {
      throw new BadRequestException('Ce n\'est pas votre tour');
    }

    // Si le joueur veut ajouter un renfort
    if (addReinforcement && reservePieceId) {
      const player = game.players[playerId];
      const reservePiece = player.deck.find(p => p.id === reservePieceId);

      if (!reservePiece) {
        throw new BadRequestException('Pièce de réserve introuvable');
      }

      // Déterminer la position d'ajout
      // Player1: H4 (row 4) = queuePosition la plus éloignée
      // Player2: H5 (row 3) = queuePosition la plus éloignée
      const targetRow = playerId === 'player1' ? 4 : 3;
      const targetCol = 7; // Colonne H

      // Vérifier que la case est libre
      if (game.board[targetRow][targetCol]) {
        throw new BadRequestException('La position d\'ajout de renfort est occupée');
      }

      // Retirer de la réserve
      player.deck = player.deck.filter(p => p.id !== reservePieceId);

      // Ajouter aux renforts avec la queuePosition la plus élevée
      const newQueuePosition = player.reinforcements.length; // 0, 1, 2, 3, ou 4
      const newReinforcementPiece: ReinforcementPiece = {
        id: reservePiece.id,
        pieceType: reservePiece.pieceType,
        owner: playerId,
        faceUp: false, // Face cachée
        queuePosition: newQueuePosition,
      };
      player.reinforcements.push(newReinforcementPiece);

      // Placer sur le plateau dans la colonne des renforts
      const newBoardPiece: BoardPiece = {
        id: reservePiece.id,
        pieceType: reservePiece.pieceType,
        owner: playerId,
        position: { row: targetRow, col: targetCol },
        faceUp: false, // Face cachée dans les renforts
        usedAbilities: this.initializeAbilities(reservePiece.pieceType),
      };

      game.board[targetRow][targetCol] = newBoardPiece;
    }

    // Passer au tour suivant
    game.phase = 'playing';
    game.currentPlayer = game.currentPlayer === 'player1' ? 'player2' : 'player1';
    game.turnNumber++;
    game.actionsThisTurn = 0;

    // Recalculer les points d'action
    this.calculateActionPoints(game);

    // Mettre à jour la partie persistée
    await this.persistenceService.updateGameState(gameId, game);

    return game;
  }

  /**
   * Vérifier la condition de victoire
   */
  private checkVictory(game: GameState): void {
    const player1General = this.findPieceOnBoard(game, 'player1', 'general');
    const player2General = this.findPieceOnBoard(game, 'player2', 'general');

    if (!player1General) {
      game.phase = 'finished';
      game.winner = 'player2';
    } else if (!player2General) {
      game.phase = 'finished';
      game.winner = 'player1';
    }
  }

  /**
   * Détruire une pièce
   */
  private destroyPiece(game: GameState, piece: BoardPiece): void {
    game.board[piece.position.row][piece.position.col] = null;
  }

  /**
   * Vérifier si une pièce adverse est sur la ligne de déploiement
   */
  private hasEnemyOnDeploymentLine(game: GameState, playerId: PlayerId): boolean {
    // Player1 déploie sur la ligne 1 (row 7)
    // Player2 déploie sur la ligne 8 (row 0)
    const deploymentRow = playerId === 'player1' ? 7 : 0;
    
    // Vérifier uniquement les colonnes A-G (0-6), pas la colonne H (7) qui contient les renforts du joueur
    for (let col = 0; col < 7; col++) {
      const piece = game.board[deploymentRow][col];
      if (piece && piece.owner !== playerId) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Trouver une pièce sur le plateau par son ID
   */
  private findPieceById(game: GameState, pieceId: string): BoardPiece | null {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = game.board[row][col];
        if (piece && piece.id === pieceId) {
          return piece;
        }
      }
    }
    return null;
  }

  /**
   * Trouver une pièce d'un joueur par son type
   */
  private findPieceOnBoard(game: GameState, playerId: PlayerId, pieceType: PieceId): BoardPiece | null {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = game.board[row][col];
        if (piece && piece.owner === playerId && piece.pieceType === pieceType) {
          return piece;
        }
      }
    }
    return null;
  }

  /**
   * Vérifier si une position est valide
   */
  private isValidPosition(pos: Position): boolean {
    return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
  }

  private isActiveBoardPosition(pos: Position): boolean {
    return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 7;
  }

  private isWithinOffsets(source: Position, target: Position, offsets: Offset[]): boolean {
    const rowOffset = target.row - source.row;
    const colOffset = target.col - source.col;
    return offsets.some(offset => offset.row === rowOffset && offset.col === colOffset);
  }

  private isWithinMovementZone(piece: BoardPiece, target: Position): boolean {
    const offsets = MOVEMENT_OFFSETS[piece.pieceType] || [];
    return this.isWithinOffsets(piece.position, target, offsets);
  }

  private isWithinAttackZone(piece: BoardPiece, target: Position): boolean {
    const offsets = ATTACK_OFFSETS[piece.pieceType] || [];
    return this.isWithinOffsets(piece.position, target, offsets);
  }

  private isWithinAlliedInfluence(game: GameState, piece: BoardPiece): boolean {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 7; col++) {
        const source = game.board[row][col];
        if (!source) {
          continue;
        }
        if (source.owner !== piece.owner) {
          continue;
        }
        const offsets = INFLUENCE_OFFSETS[source.pieceType];
        if (!offsets) {
          continue;
        }
        if (this.isWithinOffsets(source.position, piece.position, offsets)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Initialiser les capacités d'une pièce avec leurs charges
   */
  private initializeAbilities(pieceType: PieceId): { [abilityName: string]: number } {
    switch (pieceType) {
      case 'general':
        return {
          'Parachutage': 2,
          'En avant !': 3,
        };
      case 'colonel':
        return {
          'Repli stratégique': 1,
        };
      case 'infantryman':
        return {
          'Rage': 3,
        };
      case 'scout':
        return {
          'Adrénaline': 3,
        };
      default:
        return {};
    }
  }
}
