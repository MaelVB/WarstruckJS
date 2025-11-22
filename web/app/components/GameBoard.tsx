'use client';

import { Box, Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import { BoardPiece, Position } from '../../lib/gameTypes';

interface BoardCellProps {
  piece: BoardPiece | null;
  position: Position;
  isHighlighted?: boolean;
  isDeploymentRow?: boolean;
  isFrontierRow?: boolean;
  isReinforcementColumn?: boolean;
  onClick?: () => void;
}

function BoardCell({ piece, position, isHighlighted, isDeploymentRow, isFrontierRow, isReinforcementColumn, onClick }: BoardCellProps) {
  // Couleur de la case (échiquier)
  const isLightSquare = (position.row + position.col) % 2 === 0;
  let bgColor = isLightSquare ? '#f0d9b5' : '#b58863';
  
  // Surbrillance pour les zones spéciales
  if (isDeploymentRow) {
    bgColor = isLightSquare ? '#d4f1f4' : '#75b7be';
  } else if (isReinforcementColumn) {
    bgColor = isLightSquare ? '#e6e6fa' : '#9370db';
  }
  
  // Surbrillance pour sélection
  if (isHighlighted) {
    bgColor = '#90ee90';
  }

  const getPieceSymbol = (pieceType: string): string => {
    switch (pieceType) {
      case 'general': return '★';
      case 'colonel': return '◆';
      case 'infantryman': return '●';
      case 'scout': return '►';
      default: return '?';
    }
  };

  const getPieceColor = (owner: string): string => {
    return owner === 'player1' ? 'blue' : 'red';
  };

  return (
    <Paper
      shadow="xs"
      p="xs"
      style={{
        width: 60,
        height: 60,
        backgroundColor: bgColor,
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        borderBottom: isFrontierRow && position.row === 3 ? '3px solid #333' : undefined,
      }}
      onClick={onClick}
    >
      {piece ? (
        piece.faceUp ? (
          <ThemeIcon
            size="xl"
            radius="xl"
            color={getPieceColor(piece.owner)}
            variant="filled"
          >
            <Text size="xl" fw={700}>
              {getPieceSymbol(piece.pieceType)}
            </Text>
          </ThemeIcon>
        ) : (
          <ThemeIcon
            size="xl"
            radius="xl"
            color="gray"
            variant="filled"
          >
            <Text size="sm">?</Text>
          </ThemeIcon>
        )
      ) : null}
      
      {/* Coordonnées de la case */}
      <Text
        size="xs"
        c="dimmed"
        style={{
          position: 'absolute',
          bottom: 2,
          right: 4,
          fontSize: 8,
        }}
      >
        {String.fromCharCode(65 + position.col)}{8 - position.row}
      </Text>
    </Paper>
  );
}

interface GameBoardProps {
  board: (BoardPiece | null)[][];
  selectedPosition?: Position;
  validMoves?: Position[];
  onCellClick?: (position: Position) => void;
}

export function GameBoard({ board, selectedPosition, validMoves = [], onCellClick }: GameBoardProps) {
  const isPositionEqual = (pos1: Position, pos2: Position) => {
    return pos1.row === pos2.row && pos1.col === pos2.col;
  };

  const isValidMove = (position: Position) => {
    return validMoves.some(move => isPositionEqual(move, position));
  };

  const isSelected = (position: Position) => {
    return selectedPosition ? isPositionEqual(selectedPosition, position) : false;
  };

  return (
    <Stack gap="xs">
      {/* Plateau avec coordonnées */}
      <Group gap="xs" wrap="nowrap">
        {/* Espace vide en haut à gauche */}
        <Box style={{ width: 30 }} />
        
        {/* Légende des colonnes - alignée avec les cases */}
        <Group gap={0}>
          {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((col) => (
            <Box key={col} style={{ width: 60, textAlign: 'center' }}>
              <Text size="sm" fw={700} c={col === 'H' ? 'violet' : undefined}>
                {col}
              </Text>
            </Box>
          ))}
        </Group>
      </Group>

      {/* Plateau avec numéros de ligne */}
      <Group gap="xs" wrap="nowrap">
        {/* Numéros de ligne */}
        <Stack gap={0}>
          {[8, 7, 6, 5, 4, 3, 2, 1].map((row) => (
            <Box key={row} style={{ width: 30, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text size="sm" fw={700} c={row === 1 || row === 8 ? 'teal' : undefined}>
                {row}
              </Text>
            </Box>
          ))}
        </Stack>

        {/* Cases du plateau */}
        <Stack gap={0}>
          {board.map((row, rowIndex) => (
            <Group key={rowIndex} gap={0}>
              {row.map((piece, colIndex) => {
                const position: Position = { row: rowIndex, col: colIndex };
                return (
                  <BoardCell
                    key={`${rowIndex}-${colIndex}`}
                    piece={piece}
                    position={position}
                    isHighlighted={isSelected(position) || isValidMove(position)}
                    isDeploymentRow={rowIndex === 0 || rowIndex === 7}
                    isFrontierRow={rowIndex === 3 || rowIndex === 4}
                    isReinforcementColumn={colIndex === 7}
                    onClick={() => onCellClick?.(position)}
                  />
                );
              })}
            </Group>
          ))}
        </Stack>
      </Group>
    </Stack>
  );
}
