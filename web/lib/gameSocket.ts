import { io, Socket } from 'socket.io-client';

export interface MatchFoundData {
  gameId: string;
  playerId: 'player1' | 'player2';
  role: 'attacker' | 'defender';
  opponent: string;
}

export interface GameState {
  id: string;
  phase: string;
  board: any[][];
  players: any;
  currentPlayer: string;
  turnNumber: number;
  actionsThisTurn: number;
  winner?: string;
}

export interface ChatMessage {
  playerName: string;
  message: string;
  timestamp: string;
}

export class GameSocketClient {
  private socket: Socket | null = null;
  private serverUrl: string;

  constructor(serverUrl: string = 'http://localhost:3001') {
    this.serverUrl = serverUrl;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to game server');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
        reject(error);
      });

      this.socket.on('error', (data: { message: string }) => {
        console.error('⚠️ Server error:', data.message);
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Disconnected from server');
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // ===== Matchmaking =====

  joinQueue(playerName: string): void {
    this.socket?.emit('join-queue', { playerName });
  }

  leaveQueue(): void {
    this.socket?.emit('leave-queue');
  }

  onQueueJoined(callback: (data: { position: number }) => void): void {
    this.socket?.on('queue-joined', callback);
  }

  onMatchFound(callback: (data: MatchFoundData) => void): void {
    this.socket?.on('match-found', callback);
  }

  // ===== Game Actions =====

  selectDeck(gameId: string, playerId: string, selectedPieces: string[]): void {
    this.socket?.emit('select-deck', { gameId, playerId, selectedPieces });
  }

  placeGeneral(gameId: string, playerId: string, position: { row: number; col: number }): void {
    this.socket?.emit('place-general', { gameId, playerId, position });
  }

  setupReinforcements(gameId: string, playerId: string, pieceIds: string[]): void {
    this.socket?.emit('setup-reinforcements', { gameId, playerId, pieceIds });
  }

  startGame(gameId: string): void {
    this.socket?.emit('start-game', { gameId });
  }

  executeAction(gameId: string, playerId: string, action: any): void {
    this.socket?.emit('execute-action', { gameId, playerId, action });
  }

  getGameState(gameId: string): void {
    this.socket?.emit('get-game-state', { gameId });
  }

  completePostTurn(gameId: string, playerId: string, addReinforcement: boolean, reservePieceId?: string): void {
    this.socket?.emit('complete-post-turn', { gameId, playerId, addReinforcement, reservePieceId });
  }

  // ===== Game Events =====

  onGameUpdated(callback: (gameState: GameState) => void): void {
    this.socket?.on('game-updated', callback);
  }

  onGameStarted(callback: (gameState: GameState) => void): void {
    this.socket?.on('game-started', callback);
  }

  onGameFinished(callback: (data: { winner: string }) => void): void {
    this.socket?.on('game-finished', callback);
  }

  onPhaseChanged(callback: (data: { phase: string }) => void): void {
    this.socket?.on('phase-changed', callback);
  }

  onGameState(callback: (gameState: GameState) => void): void {
    this.socket?.on('game-state', callback);
  }

  onPlayerDisconnected(callback: (data: { playerId: string; playerName: string }) => void): void {
    this.socket?.on('player-disconnected', callback);
  }

  // ===== Chat =====

  sendMessage(gameId: string, message: string): void {
    this.socket?.emit('send-message', { gameId, message });
  }

  onChatMessage(callback: (data: ChatMessage) => void): void {
    this.socket?.on('chat-message', callback);
  }

  // ===== Utilities =====

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Export a singleton instance for convenience
export const gameSocket = new GameSocketClient();
