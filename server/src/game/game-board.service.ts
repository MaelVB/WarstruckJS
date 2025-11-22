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

@Injectable()
export class GameBoardService {
  private readonly logger = new Logger(GameBoardService.name);
  private games: Map<string, GameState> = new Map();

  /**
   * Crée une nouvelle partie
   */
  createGame(player1Deck: PieceId[], player2Deck: PieceId[]): GameState {
    this.logger.log('Creating new game with decks');
    if (player1Deck.length !== 20 || player2Deck.length !== 20) {
      throw new BadRequestException('Chaque joueur doit avoir exactement 20 pièces dans son deck');
    }

    const gameId = uuidv4();
    
    // Déterminer l'attaquant et le défenseur aléatoirement
    const isPlayer1Attacker = Math.random() < 0.5;
    
    const player1: Player = {
      id: 'player1',
      role: isPlayer1Attacker ? 'attacker' : 'defender',
      deck: player1Deck.map(pieceType => ({
        id: uuidv4(),
        pieceType,
        owner: 'player1',
      })),
      reinforcements: [],
      actionPoints: 0,
      generalAdvanced: false,
    };

    const player2: Player = {
      id: 'player2',
      role: isPlayer1Attacker ? 'defender' : 'attacker',
      deck: player2Deck.map(pieceType => ({
        id: uuidv4(),
        pieceType,
        owner: 'player2',
      })),
      reinforcements: [],
      actionPoints: 0,
      generalAdvanced: false,
    };

    // Créer le plateau vide (8x8)
    const board: (BoardPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

    const gameState: GameState = {
      id: gameId,
      phase: 'setup',
      board,
      players: { player1, player2 },
      currentPlayer: player1.role === 'defender' ? 'player1' : 'player2', // Le défenseur commence
      turnNumber: 0,
      actionsThisTurn: 0,
    };

    this.games.set(gameId, gameState);
    return gameState;
  }

  /**
   * Obtenir l'état d'une partie
   */
  getGame(gameId: string): GameState {
    const game = this.games.get(gameId);
    if (!game) {
      throw new BadRequestException('Partie introuvable');
    }
    return game;
  }

  /**
   * Placer le général lors du setup
   */
  placeGeneral(gameId: string, playerId: PlayerId, position: Position): GameState {
    const game = this.getGame(gameId);
    
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

    this.games.set(gameId, game);
    return game;
  }

  /**
   * Choisir 4 pièces pour les renforts lors du setup
   */
  setupReinforcements(gameId: string, playerId: PlayerId, pieceIds: string[]): GameState {
    const game = this.getGame(gameId);
    
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

    this.games.set(gameId, game);
    return game;
  }

  /**
   * Démarrer la partie après le setup
   */
  startGame(gameId: string): GameState {
    const game = this.getGame(gameId);
    
    if (game.phase !== 'setup') {
      throw new BadRequestException('La partie a déjà commencé ou est terminée');
    }

    // Vérifier que les deux généraux sont placés
    const player1General = this.findPieceOnBoard(game, 'player1', 'general');
    const player2General = this.findPieceOnBoard(game, 'player2', 'general');
    
    if (!player1General || !player2General) {
      throw new BadRequestException('Les deux généraux doivent être placés');
    }

    // Vérifier que les renforts sont configurés
    if (game.players.player1.reinforcements.length !== 4 || 
        game.players.player2.reinforcements.length !== 4) {
      throw new BadRequestException('Chaque joueur doit avoir 4 pièces en renforts');
    }

    // Avancer le général de l'attaquant d'une case
    const attacker = game.players.player1.role === 'attacker' ? game.players.player1 : game.players.player2;
    const attackerGeneralPiece = this.findPieceOnBoard(game, attacker.id, 'general');
    
    if (attackerGeneralPiece) {
      const newRow = attacker.id === 'player1' ? 
        attackerGeneralPiece.position.row + 1 : 
        attackerGeneralPiece.position.row - 1;
      
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

    this.games.set(gameId, game);
    return game;
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
   * Exécuter une action
   */
  executeAction(gameId: string, playerId: PlayerId, action: GameAction): GameState {
    const game = this.getGame(gameId);
    
    if (game.phase !== 'playing') {
      throw new BadRequestException('La partie n\'est pas en cours');
    }

    if (game.currentPlayer !== playerId) {
      throw new BadRequestException('Ce n\'est pas votre tour');
    }

    const player = game.players[playerId];

    if (action.type === 'endTurn') {
      return this.endTurn(game);
    }

    // Vérifier qu'il reste des points d'action
    if (player.actionPoints <= 0) {
      throw new BadRequestException('Plus de points d\'action disponibles');
    }

    switch (action.type) {
      case 'move':
        this.executeMove(game, action);
        break;
      case 'attack':
        this.executeAttack(game, action);
        break;
      case 'deployFromReinforcements':
        this.executeDeployFromReinforcements(game, action);
        break;
      case 'addToReinforcements':
        this.executeAddToReinforcements(game, action);
        break;
      case 'useAbility':
        this.executeUseAbility(game, action);
        break;
      default:
        throw new BadRequestException('Type d\'action inconnu');
    }

    // Consommer un point d'action
    player.actionPoints--;
    game.actionsThisTurn++;

    // Vérifier la condition de victoire
    this.checkVictory(game);

    this.games.set(gameId, game);
    return game;
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
    if (!this.isValidPosition(action.to)) {
      throw new BadRequestException('Position de destination invalide');
    }

    // TODO: Valider que le déplacement est dans la zone de mouvement de la pièce
    // TODO: Vérifier qu'il n'y a pas de pièce alliée sur la destination
    // TODO: Gérer la destruction d'une pièce adverse si elle est sur la destination

    const targetPiece = game.board[action.to.row][action.to.col];
    
    // Si une pièce adverse est sur la destination, la détruire
    if (targetPiece && targetPiece.owner !== game.currentPlayer) {
      this.destroyPiece(game, targetPiece);
    } else if (targetPiece && targetPiece.owner === game.currentPlayer) {
      throw new BadRequestException('Vous ne pouvez pas vous déplacer sur une pièce alliée');
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

    // TODO: Valider que la cible est dans la zone d'attaque

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
      throw new BadRequestException('Pièce de renfort introuvable');
    }

    // Vérifier que la pièce est en position 0 (prête à être déployée)
    if (reinforcementPiece.queuePosition !== 0) {
      throw new BadRequestException('Seule la pièce en première position peut être déployée');
    }

    // Vérifier que la destination est sur la ligne de déploiement
    const deploymentRow = game.currentPlayer === 'player1' ? 0 : 7;
    if (action.to.row !== deploymentRow) {
      throw new BadRequestException('Vous devez déployer sur votre ligne de déploiement');
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

    // Retirer la pièce des renforts
    player.reinforcements = player.reinforcements.filter(p => p.id !== action.pieceId);

    // Réorganiser la file des renforts
    player.reinforcements.forEach((p, index) => {
      p.queuePosition = index;
      if (index === 0) {
        p.faceUp = true; // La nouvelle première pièce est révélée
      }
    });

    // Placer la pièce sur le plateau
    const newPiece: BoardPiece = {
      id: reinforcementPiece.id,
      pieceType: reinforcementPiece.pieceType,
      owner: game.currentPlayer,
      position: action.to,
      faceUp: true,
      usedAbilities: this.initializeAbilities(reinforcementPiece.pieceType),
    };

    game.board[action.to.row][action.to.col] = newPiece;
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
   * Terminer le tour
   */
  private endTurn(game: GameState): GameState {
    // Changer de joueur
    game.currentPlayer = game.currentPlayer === 'player1' ? 'player2' : 'player1';
    game.turnNumber++;
    game.actionsThisTurn = 0;

    // Recalculer les points d'action
    this.calculateActionPoints(game);

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
    const deploymentRow = playerId === 'player1' ? 0 : 7;
    
    for (let col = 0; col < 8; col++) {
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
