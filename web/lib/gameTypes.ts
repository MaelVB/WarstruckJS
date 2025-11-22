// Types partagés entre le serveur et le client
export type PlayerId = 'player1' | 'player2';
export type PlayerRole = 'attacker' | 'defender';
export type PieceId = 'general' | 'colonel' | 'infantryman' | 'scout';

export interface Position {
  row: number;
  col: number;
}

export interface BoardPiece {
  id: string;
  pieceType: PieceId;
  owner: PlayerId;
  position: Position;
  faceUp: boolean;
  usedAbilities: { [abilityName: string]: number };
}

export interface ReinforcementPiece {
  id: string;
  pieceType: PieceId;
  owner: PlayerId;
  faceUp: boolean;
  queuePosition: number;
}

export interface ReservePiece {
  id: string;
  pieceType: PieceId;
  owner: PlayerId;
}

export interface Player {
  id: PlayerId;
  role: PlayerRole;
  deck: ReservePiece[];
  reinforcements: ReinforcementPiece[];
  actionPoints: number;
  generalAdvanced: boolean;
}

export type GamePhase = 'setup' | 'playing' | 'finished';

export interface GameState {
  id: string;
  phase: GamePhase;
  board: (BoardPiece | null)[][];
  players: { [key in PlayerId]: Player };
  currentPlayer: PlayerId;
  turnNumber: number;
  actionsThisTurn: number;
  winner?: PlayerId;
}

export type ActionType = 
  | 'move'
  | 'attack'
  | 'useAbility'
  | 'deployFromReinforcements'
  | 'addToReinforcements'
  | 'endTurn';

export interface GameAction {
  type: ActionType;
  pieceId?: string;
  from?: Position;
  to?: Position;
  targetPieceId?: string;
  abilityName?: string;
  reservePieceId?: string;
}
