import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { GameBoardService } from './game-board.service';
import { GamePersistenceService } from './game-persistence.service';
import { GameGateway } from './game.gateway';
import { Game, GameSchema } from './schemas/game.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Game.name, schema: GameSchema }]),
  ],
  controllers: [GameController],
  providers: [GameService, GameBoardService, GamePersistenceService, GameGateway],
})
export class GameModule {}
