'use client';

import { Card, Stack, Title, Text, Badge, Group, Box } from '@mantine/core';
import { ReservePiece } from '../../lib/gameTypes';

interface ReserveZoneProps {
  pieces: ReservePiece[];
  playerId: 'player1' | 'player2';
  onPieceClick?: (piece: ReservePiece) => void;
  selectedPieceId?: string;
}

const getPieceColor = (pieceType: string): string => {
  switch (pieceType) {
    case 'general':
      return 'yellow';
    case 'colonel':
      return 'grape';
    case 'infantryman':
      return 'blue';
    case 'scout':
      return 'teal';
    default:
      return 'gray';
  }
};

const getPieceName = (pieceType: string): string => {
  switch (pieceType) {
    case 'general':
      return 'G';
    case 'colonel':
      return 'C';
    case 'infantryman':
      return 'F';
    case 'scout':
      return 'E';
    default:
      return '?';
  }
};

export function ReserveZone({ pieces, playerId, onPieceClick, selectedPieceId }: ReserveZoneProps) {
  const rows = 4;
  const cols = 5;
  const totalSlots = rows * cols;

  // Remplir les emplacements vides
  const displayPieces = [...pieces];
  while (displayPieces.length < totalSlots) {
    displayPieces.push({ id: '', pieceType: 'scout', owner: playerId } as ReservePiece);
  }

  return (
    <Card withBorder padding="md">
      <Stack gap="xs">
        <Group justify="space-between">
          <Title order={4}>
            Zone de réserve - {playerId === 'player1' ? 'Joueur 1' : 'Joueur 2'}
          </Title>
          <Badge color="gray">{pieces.length} pièces</Badge>
        </Group>
        
        <Text size="xs" c="dimmed">
          Cliquez sur une pièce pour la sélectionner
        </Text>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: '4px',
            marginTop: '8px',
          }}
        >
          {displayPieces.slice(0, totalSlots).map((piece, index) => {
            const isEmpty = !piece.id;
            const isSelected = piece.id === selectedPieceId;
            
            return (
              <Box
                key={piece.id || `empty-${index}`}
                onClick={() => !isEmpty && onPieceClick && onPieceClick(piece)}
                style={{
                  aspectRatio: '1',
                  border: isSelected ? '3px solid var(--mantine-color-blue-6)' : '1px solid var(--mantine-color-dark-4)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isEmpty 
                    ? 'var(--mantine-color-dark-7)' 
                    : 'var(--mantine-color-dark-6)',
                  cursor: isEmpty ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (!isEmpty) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isEmpty) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {!isEmpty && (
                  <>
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: `var(--mantine-color-${getPieceColor(piece.pieceType)}-9)`,
                        opacity: 0.3,
                      }}
                    />
                    <Text
                      fw={700}
                      size="lg"
                      style={{
                        color: `var(--mantine-color-${getPieceColor(piece.pieceType)}-4)`,
                        position: 'relative',
                        zIndex: 1,
                      }}
                    >
                      {getPieceName(piece.pieceType)}
                    </Text>
                  </>
                )}
              </Box>
            );
          })}
        </div>
      </Stack>
    </Card>
  );
}
