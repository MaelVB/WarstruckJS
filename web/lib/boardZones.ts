import { BoardPiece, PieceId, PlayerId, Position } from './gameTypes';

export type Offset = { row: number; col: number };

const ADJACENT_OFFSETS: Offset[] = [
  { row: -1, col: -1 },
  { row: -1, col: 0 },
  { row: -1, col: 1 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
];

const ORTHOGONAL_OFFSETS: Offset[] = [
  { row: -1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
  { row: 1, col: 0 },
];

const DIAGONAL_OFFSETS: Offset[] = [
  { row: -1, col: -1 },
  { row: -1, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 1 },
];

const createManhattanOffsets = (radius: number, includeCenter: boolean): Offset[] => {
  const offsets: Offset[] = [];
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      const distance = Math.abs(dr) + Math.abs(dc);
      if (distance > radius) {
        continue;
      }
      if (!includeCenter && dr === 0 && dc === 0) {
        continue;
      }
      offsets.push({ row: dr, col: dc });
    }
  }
  return offsets;
};

const INFANTRYMAN_MOVEMENT_OFFSETS = createManhattanOffsets(2, false);
const GENERAL_INFLUENCE_OFFSETS = createManhattanOffsets(2, true);

const SCOUT_MOVEMENT_OFFSETS: Offset[] = [
  ...ADJACENT_OFFSETS,
  { row: -2, col: -2 },
  { row: -2, col: 2 },
  { row: 2, col: -2 },
  { row: 2, col: 2 },
];

const MOVEMENT_OFFSETS: Record<PieceId, Offset[]> = {
  general: ADJACENT_OFFSETS,
  colonel: ADJACENT_OFFSETS,
  infantryman: INFANTRYMAN_MOVEMENT_OFFSETS,
  scout: SCOUT_MOVEMENT_OFFSETS,
};

const ATTACK_OFFSETS: Record<PieceId, Offset[]> = {
  general: ORTHOGONAL_OFFSETS,
  colonel: ORTHOGONAL_OFFSETS,
  infantryman: ADJACENT_OFFSETS,
  scout: DIAGONAL_OFFSETS,
};

const INFLUENCE_OFFSETS: Partial<Record<PieceId, Offset[]>> = {
  general: GENERAL_INFLUENCE_OFFSETS,
  colonel: [{ row: 0, col: 0 }, ...ORTHOGONAL_OFFSETS],
};

const isActiveBoardPosition = (pos: Position) => pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 7;

const positionKey = (pos: Position) => `${pos.row}-${pos.col}`;

export const getMovementTargets = (board: (BoardPiece | null)[][], piece: BoardPiece): Position[] => {
  if (piece.position.col === 7) {
    return [];
  }

  const offsets = MOVEMENT_OFFSETS[piece.pieceType] || [];
  return offsets
    .map(offset => ({ row: piece.position.row + offset.row, col: piece.position.col + offset.col }))
    .filter(position => isActiveBoardPosition(position))
    .filter(position => !board[position.row][position.col]);
};

export const getAttackTargets = (board: (BoardPiece | null)[][], piece: BoardPiece): Position[] => {
  if (piece.position.col === 7) {
    return [];
  }

  const offsets = ATTACK_OFFSETS[piece.pieceType] || [];
  return offsets
    .map(offset => ({ row: piece.position.row + offset.row, col: piece.position.col + offset.col }))
    .filter(position => isActiveBoardPosition(position))
    .filter(position => {
      const target = board[position.row][position.col];
      return target && target.owner !== piece.owner;
    });
};

export const getInfluencePositions = (board: (BoardPiece | null)[][], playerId: PlayerId): Position[] => {
  const positions: Position[] = [];
  const seen = new Set<string>();

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 7; col++) {
      const piece = board[row][col];
      if (!piece || piece.owner !== playerId) {
        continue;
      }
      const offsets = INFLUENCE_OFFSETS[piece.pieceType];
      if (!offsets) {
        continue;
      }
      for (const offset of offsets) {
        const position = { row: row + offset.row, col: col + offset.col };
        if (!isActiveBoardPosition(position)) {
          continue;
        }
        const key = positionKey(position);
        if (!seen.has(key)) {
          seen.add(key);
          positions.push(position);
        }
      }
    }
  }

  return positions;
};
