import { Controller, Get, Post, Body, Param, Logger, Query } from '@nestjs/common';
import { GameService } from './game.service';
import { GameBoardService } from './game-board.service';
import { GamePersistenceService } from './game-persistence.service';
import {
  GameConfig,
  GameState,
  PlayerId,
  PieceId,
  GameAction,
  Position,
} from './interfaces/game.interface';
import {
  CreateGameDto,
  SelectDeckDto,
  PlaceGeneralDto,
  SetupReinforcementsDto,
  ExecuteActionDto,
} from './dto/game.dto';
import { GameActionRecord, GameMetadata } from './interfaces/game-history.interface';

@Controller('game')
export class GameController {
  private readonly logger = new Logger(GameController.name);

  constructor(
    private readonly gameService: GameService,
    private readonly gameBoardService: GameBoardService,
    private readonly persistenceService: GamePersistenceService,
  ) {}

  @Get('config')
  getConfig(): GameConfig {
    return this.gameService.getConfig();
  }

  @Post('create')
  async createGame(@Body() createGameDto: CreateGameDto): Promise<GameState> {
    this.logger.log('Creating new game');
    return await this.gameBoardService.createGame();
  }

  @Post(':gameId/select-deck')
  async selectDeck(
    @Param('gameId') gameId: string,
    @Body() selectDeckDto: SelectDeckDto,
  ): Promise<GameState> {
    this.logger.log(`Selecting deck for game: ${gameId}`);
    return await this.gameBoardService.selectDeck(
      gameId,
      selectDeckDto.playerId as PlayerId,
      selectDeckDto.selectedPieces,
    );
  }

  @Get(':gameId')
  async getGame(@Param('gameId') gameId: string): Promise<GameState> {
    this.logger.log(`Fetching game: ${gameId}`);
    return await this.gameBoardService.getGame(gameId);
  }

  @Post(':gameId/place-general')
  async placeGeneral(
    @Param('gameId') gameId: string,
    @Body() placeGeneralDto: PlaceGeneralDto,
  ): Promise<GameState> {
    this.logger.log(`Placing general for game: ${gameId}`);
    return await this.gameBoardService.placeGeneral(
      gameId,
      placeGeneralDto.playerId as PlayerId,
      placeGeneralDto.position,
    );
  }

  @Post(':gameId/setup-reinforcements')
  async setupReinforcements(
    @Param('gameId') gameId: string,
    @Body() setupReinforcementsDto: SetupReinforcementsDto,
  ): Promise<GameState> {
    this.logger.log(`Setting up reinforcements for game: ${gameId}`);
    return await this.gameBoardService.setupReinforcements(
      gameId,
      setupReinforcementsDto.playerId as PlayerId,
      setupReinforcementsDto.pieceIds,
    );
  }

  @Post(':gameId/start')
  async startGame(@Param('gameId') gameId: string): Promise<GameState> {
    this.logger.log(`Starting game: ${gameId}`);
    return await this.gameBoardService.startGame(gameId);
  }

  @Post(':gameId/action')
  async executeAction(
    @Param('gameId') gameId: string,
    @Body() executeActionDto: ExecuteActionDto,
  ): Promise<GameState> {
    this.logger.log(`Executing action for game: ${gameId}`);
    return await this.gameBoardService.executeAction(
      gameId,
      executeActionDto.playerId as PlayerId,
      executeActionDto.action as GameAction,
    );
  }

  @Get('list')
  async listGames(): Promise<GameMetadata[]> {
    this.logger.log('Listing all games');
    return await this.persistenceService.getAllGames();
  }

  @Get(':gameId/history')
  async getGameHistory(@Param('gameId') gameId: string): Promise<GameActionRecord[]> {
    this.logger.log(`Fetching history for game: ${gameId}`);
    return await this.persistenceService.getGameHistory(gameId);
  }

  @Get(':gameId/replay/action/:actionId')
  async replayToAction(
    @Param('gameId') gameId: string,
    @Param('actionId') actionId: string,
  ): Promise<GameState> {
    this.logger.log(`Replaying game ${gameId} to action ${actionId}`);
    return await this.persistenceService.replayToAction(gameId, actionId);
  }

  @Get(':gameId/replay/turn/:turnNumber')
  async replayToTurn(
    @Param('gameId') gameId: string,
    @Param('turnNumber') turnNumber: string,
  ): Promise<GameState> {
    this.logger.log(`Replaying game ${gameId} to turn ${turnNumber}`);
    return await this.persistenceService.replayToTurn(gameId, parseInt(turnNumber, 10));
  }
}
