import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { GameService } from './game.service';
import { GameBoardService } from './game-board.service';
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
  PlaceGeneralDto,
  SetupReinforcementsDto,
  ExecuteActionDto,
} from './dto/game.dto';

@Controller('game')
export class GameController {
  private readonly logger = new Logger(GameController.name);

  constructor(
    private readonly gameService: GameService,
    private readonly gameBoardService: GameBoardService,
  ) {}

  @Get('config')
  getConfig(): GameConfig {
    return this.gameService.getConfig();
  }

  @Post('create')
  createGame(@Body() createGameDto: CreateGameDto): GameState {
    this.logger.log('Creating new game');
    return this.gameBoardService.createGame(
      createGameDto.player1Deck,
      createGameDto.player2Deck,
    );
  }

  @Get(':gameId')
  getGame(@Param('gameId') gameId: string): GameState {
    this.logger.log(`Fetching game: ${gameId}`);
    return this.gameBoardService.getGame(gameId);
  }

  @Post(':gameId/place-general')
  placeGeneral(
    @Param('gameId') gameId: string,
    @Body() placeGeneralDto: PlaceGeneralDto,
  ): GameState {
    this.logger.log(`Placing general for game: ${gameId}`);
    return this.gameBoardService.placeGeneral(
      gameId,
      placeGeneralDto.playerId as PlayerId,
      placeGeneralDto.position,
    );
  }

  @Post(':gameId/setup-reinforcements')
  setupReinforcements(
    @Param('gameId') gameId: string,
    @Body() setupReinforcementsDto: SetupReinforcementsDto,
  ): GameState {
    this.logger.log(`Setting up reinforcements for game: ${gameId}`);
    return this.gameBoardService.setupReinforcements(
      gameId,
      setupReinforcementsDto.playerId as PlayerId,
      setupReinforcementsDto.pieceIds,
    );
  }

  @Post(':gameId/start')
  startGame(@Param('gameId') gameId: string): GameState {
    this.logger.log(`Starting game: ${gameId}`);
    return this.gameBoardService.startGame(gameId);
  }

  @Post(':gameId/action')
  executeAction(
    @Param('gameId') gameId: string,
    @Body() executeActionDto: ExecuteActionDto,
  ): GameState {
    this.logger.log(`Executing action for game: ${gameId}`);
    return this.gameBoardService.executeAction(
      gameId,
      executeActionDto.playerId as PlayerId,
      executeActionDto.action as GameAction,
    );
  }
}
