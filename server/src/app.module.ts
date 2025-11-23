import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GameModule } from './game/game.module';
import { HealthController } from './health.controller';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/warstruck'
    ),
    GameModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
