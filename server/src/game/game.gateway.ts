import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { GameBoardService } from './game-board.service';
import { GameAction, PlayerId } from './interfaces/game.interface';

interface PlayerSocket {
  socketId: string;
  playerId: PlayerId;
  playerName: string;
}

interface GameRoom {
  gameId: string;
  players: PlayerSocket[];
  status: 'waiting' | 'playing' | 'finished';
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(GameGateway.name);
  private gameRooms = new Map<string, GameRoom>(); // gameId -> GameRoom
  private playerSockets = new Map<string, Socket>(); // socketId -> Socket
  private waitingPlayers: PlayerSocket[] = []; // File d'attente pour le matchmaking

  constructor(private readonly gameBoardService: GameBoardService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.playerSockets.set(client.id, client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Retirer de la file d'attente
    this.waitingPlayers = this.waitingPlayers.filter(p => p.socketId !== client.id);
    
    // Gérer la déconnexion dans une partie en cours
    this.gameRooms.forEach((room, gameId) => {
      const playerIndex = room.players.findIndex(p => p.socketId === client.id);
      if (playerIndex !== -1) {
        const disconnectedPlayer = room.players[playerIndex];
        
        // Notifier l'autre joueur
        const otherPlayer = room.players.find(p => p.socketId !== client.id);
        if (otherPlayer) {
          const otherSocket = this.playerSockets.get(otherPlayer.socketId);
          otherSocket?.emit('player-disconnected', {
            playerId: disconnectedPlayer.playerId,
            playerName: disconnectedPlayer.playerName,
          });
        }
        
        // Supprimer la room si la partie n'est pas terminée
        if (room.status !== 'finished') {
          this.gameRooms.delete(gameId);
        }
      }
    });
    
    this.playerSockets.delete(client.id);
  }

  @SubscribeMessage('join-queue')
  async handleJoinQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { playerName: string },
  ) {
    this.logger.log(`Player ${data.playerName} (${client.id}) joining queue`);

    // Vérifier si le joueur est déjà dans la queue
    const alreadyInQueue = this.waitingPlayers.some(p => p.socketId === client.id);
    if (alreadyInQueue) {
      client.emit('error', { message: 'Vous êtes déjà dans la file d\'attente' });
      return;
    }

    // Ajouter le joueur à la file d'attente
    const playerSocket: PlayerSocket = {
      socketId: client.id,
      playerId: 'player1', // Sera défini lors du match
      playerName: data.playerName,
    };
    this.waitingPlayers.push(playerSocket);

    client.emit('queue-joined', { position: this.waitingPlayers.length });

    // Tenter de créer un match si 2 joueurs sont en attente
    if (this.waitingPlayers.length >= 2) {
      await this.createMatch();
    }
  }

  @SubscribeMessage('leave-queue')
  handleLeaveQueue(@ConnectedSocket() client: Socket) {
    this.logger.log(`Player ${client.id} leaving queue`);
    this.waitingPlayers = this.waitingPlayers.filter(p => p.socketId !== client.id);
    client.emit('queue-left');
  }

  private async createMatch() {
    if (this.waitingPlayers.length < 2) {
      return;
    }

    // Prendre les 2 premiers joueurs
    const [player1Socket, player2Socket] = this.waitingPlayers.splice(0, 2);

    try {
      // Créer une nouvelle partie
      const gameState = await this.gameBoardService.createGame();
      
      // Assigner les IDs de joueur
      player1Socket.playerId = 'player1';
      player2Socket.playerId = 'player2';

      // Créer la room
      const room: GameRoom = {
        gameId: gameState.id,
        players: [player1Socket, player2Socket],
        status: 'waiting',
      };
      this.gameRooms.set(gameState.id, room);

      // Faire rejoindre les sockets aux rooms Socket.IO
      const socket1 = this.playerSockets.get(player1Socket.socketId);
      const socket2 = this.playerSockets.get(player2Socket.socketId);
      
      socket1?.join(gameState.id);
      socket2?.join(gameState.id);

      // Notifier les joueurs
      socket1?.emit('match-found', {
        gameId: gameState.id,
        playerId: 'player1',
        role: gameState.players.player1.role,
        opponent: player2Socket.playerName,
      });

      socket2?.emit('match-found', {
        gameId: gameState.id,
        playerId: 'player2',
        role: gameState.players.player2.role,
        opponent: player1Socket.playerName,
      });

      this.logger.log(`Match created: ${gameState.id} between ${player1Socket.playerName} and ${player2Socket.playerName}`);
    } catch (error) {
      this.logger.error('Error creating match:', error);
      
      // Remettre les joueurs dans la queue en cas d'erreur
      this.waitingPlayers.unshift(player1Socket, player2Socket);
    }
  }

  @SubscribeMessage('select-deck')
  async handleSelectDeck(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; playerId: PlayerId; selectedPieces: string[] },
  ) {
    try {
      const gameState = await this.gameBoardService.selectDeck(
        data.gameId,
        data.playerId,
        data.selectedPieces as any,
      );

      // Notifier tous les joueurs de la room
      this.server.to(data.gameId).emit('game-updated', gameState);

      // Si la phase est passée à setup, notifier
      if (gameState.phase === 'setup') {
        this.server.to(data.gameId).emit('phase-changed', { phase: 'setup' });
      }
    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('place-general')
  async handlePlaceGeneral(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; playerId: PlayerId; position: { row: number; col: number } },
  ) {
    try {
      const gameState = await this.gameBoardService.placeGeneral(
        data.gameId,
        data.playerId,
        data.position,
      );

      this.server.to(data.gameId).emit('game-updated', gameState);
    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('setup-reinforcements')
  async handleSetupReinforcements(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; playerId: PlayerId; pieceIds: string[] },
  ) {
    try {
      const gameState = await this.gameBoardService.setupReinforcements(
        data.gameId,
        data.playerId,
        data.pieceIds,
      );

      this.server.to(data.gameId).emit('game-updated', gameState);
    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('start-game')
  async handleStartGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string },
  ) {
    try {
      const gameState = await this.gameBoardService.startGame(data.gameId);

      const room = this.gameRooms.get(data.gameId);
      if (room) {
        room.status = 'playing';
      }

      this.server.to(data.gameId).emit('game-started', gameState);
      this.server.to(data.gameId).emit('game-updated', gameState);
    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('execute-action')
  async handleExecuteAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; playerId: PlayerId; action: GameAction },
  ) {
    try {
      const gameState = await this.gameBoardService.executeAction(
        data.gameId,
        data.playerId,
        data.action,
      );

      // Notifier tous les joueurs
      this.server.to(data.gameId).emit('game-updated', gameState);

      // Si la partie est terminée
      if (gameState.phase === 'finished') {
        const room = this.gameRooms.get(data.gameId);
        if (room) {
          room.status = 'finished';
        }
        this.server.to(data.gameId).emit('game-finished', { winner: gameState.winner });
      }
    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('get-game-state')
  async handleGetGameState(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string },
  ) {
    try {
      const gameState = await this.gameBoardService.getGame(data.gameId);
      client.emit('game-state', gameState);
    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('complete-post-turn')
  async handleCompletePostTurn(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; playerId: PlayerId; addReinforcement: boolean; reservePieceId?: string },
  ) {
    try {
      const gameState = await this.gameBoardService.completePostTurn(
        data.gameId,
        data.playerId,
        data.addReinforcement,
        data.reservePieceId,
      );

      this.server.to(data.gameId).emit('game-updated', gameState);
      this.server.to(data.gameId).emit('phase-changed', { phase: gameState.phase });
    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('send-message')
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; message: string },
  ) {
    // Trouver le nom du joueur
    const room = this.gameRooms.get(data.gameId);
    const player = room?.players.find(p => p.socketId === client.id);
    
    if (player) {
      this.server.to(data.gameId).emit('chat-message', {
        playerName: player.playerName,
        message: data.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
