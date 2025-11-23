import { IsArray, IsString, IsNumber, ArrayMinSize, ArrayMaxSize, ValidateNested, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PieceId } from '../interfaces/game.interface';

export class CreateGameDto {
  // Maintenant on crée une partie vide, les decks seront choisis après
}

export class SelectDeckDto {
  @IsString()
  playerId!: string;

  @IsArray()
  @ArrayMinSize(19)
  @ArrayMaxSize(19)
  @IsEnum(['colonel', 'infantryman', 'scout'], { each: true })
  selectedPieces!: PieceId[];
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

  @IsOptional()
  @IsString()
  pieceId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PositionDto)
  from?: PositionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PositionDto)
  to?: PositionDto;

  @IsOptional()
  @IsString()
  targetPieceId?: string;

  @IsOptional()
  @IsString()
  abilityName?: string;

  @IsOptional()
  @IsString()
  reservePieceId?: string;
}

export class ExecuteActionDto {
  @IsString()
  playerId!: string;

  @ValidateNested()
  @Type(() => GameActionDto)
  action!: GameActionDto;
}
