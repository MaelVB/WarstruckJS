export type PieceCategory = 'high-rank' | 'infantry' | 'scout';
export type PieceId = 'general' | 'colonel' | 'infantryman' | 'scout';

export interface PieceDefinition {
  id: PieceId;
  name: string;
  category: PieceCategory;
  movement: string;
  attack: string;
  influence?: string;
  abilities: Ability[];
}

export interface Ability {
  name: string;
  type: 'passive' | 'active';
  description: string;
  charges?: number;
}

export interface BoardTerminology {
  reinforcementColumn: string;
  frontierRows: string;
  deploymentRows: string;
  reserveZone: string;
}

export interface GameConfig {
  terminology: BoardTerminology;
  victoryCondition: string;
  openingSequence: string[];
  notes: string[];
  pieces: PieceDefinition[];
}

// ============ GAME STATE TYPES ============

export type PlayerId = 'player1' | 'player2';
export type PlayerRole = 'attacker' | 'defender';

export interface Position {
  row: number; // 0-7 (1-8 dans l'affichage)
  col: number; // 0-7 (A-H dans l'affichage)
}

export interface BoardPiece {
  id: string; // UUID unique pour chaque instance de pièce
  pieceType: PieceId;
  owner: PlayerId;
  position: Position;
  faceUp: boolean; // true si la pièce est révélée
  usedAbilities: { [abilityName: string]: number }; // nombre d'utilisations restantes
}

export interface ReinforcementPiece {
  id: string;
  pieceType: PieceId;
  owner: PlayerId;
  faceUp: boolean;
  queuePosition: number; // 0 = plus proche du plateau, 3 = plus éloigné
}

export interface ReservePiece {
  id: string;
  pieceType: PieceId;
  owner: PlayerId;
}

export interface Player {
  id: PlayerId;
  role: PlayerRole;
  deck: ReservePiece[]; // 20 pièces au total (moins celles déjà utilisées)
  reinforcements: ReinforcementPiece[]; // 4 pièces max
  actionPoints: number;
  generalAdvanced: boolean; // true si le général de l'attaquant a déjà avancé
  deckSelected: boolean; // true si le joueur a choisi son deck
  hasDeployedThisTurn: boolean; // true si le joueur a déjà déployé une unité ce tour
}

export type GamePhase = 
  | 'deck-selection' // Sélection des 20 pièces par chaque joueur
  | 'setup' // Placement du général et choix des 4 pièces de renforts
  | 'playing' // Partie en cours
  | 'post-turn' // Phase après le tour (déplacement des renforts et ajout optionnel)
  | 'finished'; // Partie terminée

export interface GameState {
  id: string;
  phase: GamePhase;
  board: (BoardPiece | null)[][]; // 8x8, [row][col]
  players: { [key in PlayerId]: Player };
  currentPlayer: PlayerId;
  turnNumber: number;
  actionsThisTurn: number; // nombre d'actions effectuées ce tour
  winner?: PlayerId;
}

export type ActionType = 
  | 'move' // Déplacer une pièce
  | 'attack' // Attaquer
  | 'useAbility' // Utiliser un effet
  | 'deployFromReinforcements' // Placer une pièce des renforts sur le plateau
  | 'addToReinforcements' // Ajouter une pièce de la réserve aux renforts
  | 'endTurn' // Terminer le tour
  | 'skipPostTurnReinforcement'; // Passer l'ajout de renfort en phase post-turn

export interface GameAction {
  type: ActionType;
  pieceId?: string;
  from?: Position;
  to?: Position;
  targetPieceId?: string;
  abilityName?: string;
  reservePieceId?: string; // Pour ajouter aux renforts
}
