export interface GameActionRecord {
  id: string; // UUID de l'action
  timestamp: Date;
  turnNumber: number;
  playerId: string;
  action: any; // L'action exécutée
  gameStateBefore?: any; // État du jeu avant l'action (optionnel, pour replay précis)
  gameStateAfter: any; // État du jeu après l'action
}

export interface GameMetadata {
  id: string; // UUID de la partie
  createdAt: Date;
  updatedAt: Date;
  phase: string;
  currentPlayer: string;
  turnNumber: number;
  winner?: string;
  player1Id: string;
  player2Id: string;
}

export interface PersistedGame {
  metadata: GameMetadata;
  currentState: any; // État actuel du jeu
  history: GameActionRecord[]; // Historique complet des actions
}
