import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { GameBoardService } from './game-board.service';

@Module({
  controllers: [GameController],
  providers: [GameService, GameBoardService],
})
export class GameModule {}
