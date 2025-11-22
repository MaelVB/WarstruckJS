export type PieceCategory = 'high-rank' | 'infantry' | 'scout';
export type PieceId = 'general' | 'colonel' | 'infantryman' | 'scout';

export interface PieceDefinition {
  id: PieceId;
  name: string;
  category: PieceCategory;
  movement: string;
  attack: string;
  influence?: string;
  abilities: Ability[];
}

export interface Ability {
  name: string;
  type: 'passive' | 'active';
  description: string;
  charges?: number;
}

export interface BoardTerminology {
  reinforcementColumn: string;
  frontierRows: string;
  deploymentRows: string;
  reserveZone: string;
}

export interface TurnSummary {
  actionPoints: number;
  actions: string[];
}

export interface GameConfig {
  terminology: BoardTerminology;
  victoryCondition: string;
  openingSequence: string[];
  notes: string[];
  pieces: PieceDefinition[];
}
