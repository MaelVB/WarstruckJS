import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  root() {
    return {
      status: 'ok',
      message: 'Warstruck API is running',
      version: '0.1.0',
      endpoints: {
        config: '/game/config',
        create: 'POST /game/create',
        game: '/game/:gameId',
      },
    };
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
