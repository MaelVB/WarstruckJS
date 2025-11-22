import { IsArray, IsString, IsNumber, ArrayMinSize, ArrayMaxSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PieceId } from '../interfaces/game.interface';

export class CreateGameDto {
  @IsArray()
  @ArrayMinSize(20)
  @ArrayMaxSize(20)
  player1Deck!: PieceId[];

  @IsArray()
  @ArrayMinSize(20)
  @ArrayMaxSize(20)
  player2Deck!: PieceId[];
}

export class PositionDto {
  @IsNumber()
  row!: number;

  @IsNumber()
  col!: number;
}

export class PlaceGeneralDto {
  @IsString()
  playerId!: string;

  @ValidateNested()
  @Type(() => PositionDto)
  position!: PositionDto;
}

export class SetupReinforcementsDto {
  @IsString()
  playerId!: string;

  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  pieceIds!: string[];
}

export class GameActionDto {
  @IsString()
  type!: string;

  pieceId?: string;
  from?: PositionDto;
  to?: PositionDto;
  targetPieceId?: string;
  abilityName?: string;
  reservePieceId?: string;
}

export class ExecuteActionDto {
  @IsString()
  playerId!: string;

  @ValidateNested()
  @Type(() => GameActionDto)
  action!: GameActionDto;
}
