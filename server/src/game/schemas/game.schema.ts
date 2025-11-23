import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GameDocument = Game & Document;

@Schema({ timestamps: true })
export class Game {
  @Prop({ required: true, unique: true })
  gameId!: string;

  @Prop({ required: true })
  phase!: string;

  @Prop({ required: true, type: Object })
  currentState!: any; // État complet du jeu (GameState)

  @Prop({ required: true })
  currentPlayer!: string;

  @Prop({ required: true })
  turnNumber!: number;

  @Prop()
  winner?: string;

  @Prop({ required: true })
  player1Id!: string;

  @Prop({ required: true })
  player2Id!: string;

  @Prop({ type: [Object], default: [] })
  history!: any[]; // Tableau de GameActionRecord

  // Timestamps ajoutés automatiquement par Mongoose
  createdAt?: Date;
  updatedAt?: Date;
}

export const GameSchema = SchemaFactory.createForClass(Game);

// Index pour recherche rapide par gameId
GameSchema.index({ gameId: 1 });
