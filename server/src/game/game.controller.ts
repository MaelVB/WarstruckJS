import { Controller, Get } from '@nestjs/common';
import { GameService } from './game.service';
import { GameConfig } from './game.types';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('config')
  getConfig(): GameConfig {
    return this.gameService.getConfig();
  }
}
