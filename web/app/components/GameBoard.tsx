'use client';

import { Box, Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconStar, IconCircle, IconSword, IconArrowBigRightLines } from '@tabler/icons-react';
import { BoardPiece, Position } from '../../lib/gameTypes';

interface BoardCellProps {
  piece: BoardPiece | null;
  position: Position;
  isHighlighted?: boolean;
  isAttackTarget?: boolean;
  isInfluence?: boolean;
  isDeploymentRow?: boolean;
  isFrontierRow?: boolean;
  isReinforcementColumn?: boolean;
  currentPlayerId?: string;
  onClick?: () => void;
}

function BoardCell({ piece, position, isHighlighted, isAttackTarget, isInfluence, isDeploymentRow, isFrontierRow, isReinforcementColumn, currentPlayerId, onClick }: BoardCellProps) {
  // Couleur de la case (échiquier)
  const isLightSquare = (position.row + position.col) % 2 === 0;
  let bgColor = isLightSquare ? '#f0d9b5' : '#b58863';
  
  // Surbrillance pour les zones spéciales
  if (isDeploymentRow) {
    bgColor = isLightSquare ? '#d4f1f4' : '#75b7be';
  } else if (isReinforcementColumn) {
    bgColor = isLightSquare ? '#e6e6fa' : '#9370db';
  }
  
  if (isAttackTarget) {
    bgColor = '#f5b0b0';
  }

  // Surbrillance pour sélection
  if (isHighlighted) {
    bgColor = '#90ee90';
  }

  const getPieceIcon = (pieceType: string) => {
    switch (pieceType) {
      case 'general': return IconStar;
      case 'colonel': return IconCircle;
      case 'infantryman': return IconSword;
      case 'scout': return IconArrowBigRightLines;
      default: return null;
    }
  };

  const getPieceColor = (owner: string): string => {
    return owner === 'player1' ? 'blue' : 'red';
  };

  // Déterminer si la pièce doit être visible (révélée)
  const shouldRevealPiece = (): boolean => {
    if (!piece) return false;
    
    // Si c'est dans la colonne des renforts
    if (isReinforcementColumn) {
      // Toujours révéler mes propres pièces
      if (piece.owner === currentPlayerId) {
        return true;
      }
      
      // Pour les pièces adverses, révéler uniquement celles en position de déploiement (H1 ou H8)
      const isDeploymentPosition = position.row === 0 || position.row === 7;
      return isDeploymentPosition;
    }
    
    // Hors colonne des renforts, révéler selon faceUp
    return piece.faceUp;
  };

  const cursor = isAttackTarget ? 'crosshair' : onClick ? 'pointer' : 'default';

  return (
    <Paper
      shadow="xs"
      p="xs"
      radius={0}
      style={{
        width: 60,
        height: 60,
        backgroundColor: bgColor,
        cursor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        borderBottom: isFrontierRow && position.row === 3 ? '3px solid #333' : undefined,
      }}
      onClick={onClick}
    >
      {isInfluence && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(80, 140, 255, 0.25)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}
      {piece ? (
        shouldRevealPiece() ? (
          <ThemeIcon
            size="xl"
            radius="xl"
            color={getPieceColor(piece.owner)}
            variant="filled"
            style={{ position: 'relative', zIndex: 2 }}
          >
            {(() => {
              const Icon = getPieceIcon(piece.pieceType);
              return Icon ? <Icon size={24} /> : <Text size="sm">?</Text>;
            })()}
          </ThemeIcon>
        ) : (
          <ThemeIcon
            size="xl"
            radius="xl"
            color="gray"
            variant="filled"
            style={{ position: 'relative', zIndex: 2 }}
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
          zIndex: 3,
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
  attackPositions?: Position[];
  influencePositions?: Position[];
  currentPlayerId?: string;
  onCellClick?: (position: Position) => void;
}

export function GameBoard({ board, selectedPosition, validMoves = [], attackPositions = [], influencePositions = [], currentPlayerId, onCellClick }: GameBoardProps) {
  const toKey = (position: Position) => `${position.row}-${position.col}`;
  const validMoveKeys = new Set(validMoves.map(toKey));
  const attackKeys = new Set(attackPositions.map(toKey));
  const influenceKeys = new Set(influencePositions.map(toKey));
  const selectedKey = selectedPosition ? toKey(selectedPosition) : null;

  const isValidMove = (position: Position) => validMoveKeys.has(toKey(position));
  const isAttackTarget = (position: Position) => attackKeys.has(toKey(position));
  const isInfluence = (position: Position) => influenceKeys.has(toKey(position));
  const isSelected = (position: Position) => selectedKey === toKey(position);

  return (
    <Stack gap="xs" style={{ position: 'relative' }}>
      {/* Plateau avec coordonnées */}
      <Group gap="xs" wrap="nowrap">
        {/* Espace vide en haut à gauche */}
        <Box style={{ width: 30 }} />
        
        {/* Légende des colonnes - alignée avec les cases */}
        <Group gap={0}>
          {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((col) => (
            <Box key={col} style={{ width: 60, textAlign: 'center', marginLeft: col === 'H' ? 10 : 0 }}>
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
        <Stack gap={0} style={{ position: 'relative' }}>
          {board.map((row, rowIndex) => (
            <Group key={rowIndex} gap={0} style={{ position: 'relative' }}>
              {row.map((piece, colIndex) => {
                const position: Position = { row: rowIndex, col: colIndex };
                // Ajouter un espace après la colonne G (index 6)
                const marginLeft = colIndex === 7 ? 10 : 0;
                return (
                  <div key={`${rowIndex}-${colIndex}`} style={{ marginLeft, position: 'relative' }}>
                    <BoardCell
                      piece={piece}
                      position={position}
                      isHighlighted={isSelected(position) || isValidMove(position)}
                      isAttackTarget={isAttackTarget(position)}
                      isInfluence={isInfluence(position)}
                      isDeploymentRow={rowIndex === 0 || rowIndex === 7}
                      isFrontierRow={rowIndex === 3 || rowIndex === 4}
                      isReinforcementColumn={colIndex === 7}
                      currentPlayerId={currentPlayerId}
                      onClick={() => onCellClick?.(position)}
                    />
                    
                    {/* Flèche de déploiement H8 → G8 (row 0, col 7) */}
                    {rowIndex === 0 && colIndex === 7 && (
                      <div
                        style={{
                          position: 'absolute',
                          left: '-5px',
                          top: '50%',
                          transform: 'translateY(-50%) translateX(-50%)',
                          fontSize: '32px',
                          color: '#9370db',
                          fontWeight: 'bold',
                          zIndex: 10,
                        }}
                      >
                        ←
                      </div>
                    )}
                    
                    {/* Flèche de déploiement H1 → G1 (row 7, col 7) */}
                    {rowIndex === 7 && colIndex === 7 && (
                      <div
                        style={{
                          position: 'absolute',
                          left: '-5px',
                          top: '50%',
                          transform: 'translateY(-50%) translateX(-50%)',
                          fontSize: '32px',
                          color: '#9370db',
                          fontWeight: 'bold',
                          zIndex: 10,
                        }}
                      >
                        ←
                      </div>
                    )}
                  </div>
                );
              })}
            </Group>
          ))}
        </Stack>
      </Group>
    </Stack>
  );
}
