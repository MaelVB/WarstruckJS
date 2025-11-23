'use client';

import { useState } from 'react';
import { Stack, Title, Text, Alert, Button, Group, Card } from '@mantine/core';
import { ReserveZone } from './ReserveZone';
import { GameState, PlayerId, ReservePiece, ReinforcementPiece } from '../../lib/gameTypes';

interface SetupReinforcementsProps {
  gameState: GameState;
  playerId: PlayerId;
  onComplete: (selectedPieceIds: string[]) => void;
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

export function SetupReinforcements({ gameState, playerId, onComplete }: SetupReinforcementsProps) {
  const player = gameState.players[playerId];
  const [selectedReservePieceId, setSelectedReservePieceId] = useState<string | undefined>();
  const [reinforcementSlots, setReinforcementSlots] = useState<(ReservePiece | null)[]>([null, null, null, null]);

  const handleReservePieceClick = (piece: ReservePiece) => {
    // Vérifier que cette pièce n'est pas déjà dans les renforts
    const alreadyInReinforcements = reinforcementSlots.some(slot => slot?.id === piece.id);
    if (alreadyInReinforcements) {
      return;
    }
    setSelectedReservePieceId(piece.id);
  };

  const handleSlotClick = (slotIndex: number) => {
    if (selectedReservePieceId) {
      // Ajouter la pièce au slot
      const piece = player.deck.find(p => p.id === selectedReservePieceId);
      if (piece) {
        const newSlots = [...reinforcementSlots];
        newSlots[slotIndex] = piece;
        setReinforcementSlots(newSlots);
        setSelectedReservePieceId(undefined);
      }
    } else if (reinforcementSlots[slotIndex]) {
      // Retirer la pièce du slot
      const newSlots = [...reinforcementSlots];
      newSlots[slotIndex] = null;
      setReinforcementSlots(newSlots);
    }
  };

  const handleComplete = () => {
    const selectedIds = reinforcementSlots
      .filter((piece): piece is ReservePiece => piece !== null)
      .map(piece => piece.id);
    
    if (selectedIds.length === 4) {
      onComplete(selectedIds);
    }
  };

  const filledSlots = reinforcementSlots.filter(slot => slot !== null).length;
  const canComplete = filledSlots === 4;

  // Filtrer les pièces de la réserve pour ne pas afficher celles déjà dans les renforts
  // ET exclure le général qui doit être placé sur le plateau
  const selectedPieceIds = reinforcementSlots.filter(s => s !== null).map(s => s!.id);
  const availablePieces = player.deck.filter(piece => 
    !selectedPieceIds.includes(piece.id) && piece.pieceType !== 'general'
  );

  return (
    <Stack gap="lg">
      <div>
        <Title order={3}>
          {playerId === 'player1' ? 'Joueur 1' : 'Joueur 2'} - Placement des renforts
        </Title>
        <Text c="dimmed" size="sm" mt="xs">
          Sélectionnez 4 pièces de votre réserve à placer dans votre colonne de renforts (colonne H).
        </Text>
      </div>

      <Alert color={canComplete ? 'green' : 'blue'} title={canComplete ? 'Prêt !' : 'Instructions'}>
        {canComplete 
          ? 'Vous avez sélectionné 4 pièces. Cliquez sur "Valider" pour continuer.'
          : `${filledSlots}/4 pièces sélectionnées. Cliquez sur une pièce dans la réserve, puis sur un emplacement vide dans les renforts.`
        }
      </Alert>

      <Group align="flex-start" gap="lg">
        {/* Zone de réserve */}
        <div style={{ flex: 1 }}>
          <ReserveZone
            pieces={availablePieces}
            playerId={playerId}
            onPieceClick={handleReservePieceClick}
            selectedPieceId={selectedReservePieceId}
          />
        </div>

        {/* Colonne de renforts */}
        <Card withBorder padding="md" style={{ minWidth: '120px' }}>
          <Stack gap="xs">
            <Title order={5}>Colonne H - Renforts</Title>
            <Text size="xs" c="dimmed">
              {playerId === 'player1' ? 'H4 → H1' : 'H5 → H8'}
            </Text>
            
            <Stack gap="xs" mt="sm">
              {reinforcementSlots.map((piece, index) => {
                // Joueur 1: H4, H3, H2, H1 (index 0=H4, 1=H3, 2=H2, 3=H1)
                // Joueur 2: H5, H6, H7, H8 (index 0=H5, 1=H6, 2=H7, 3=H8)
                const position = playerId === 'player1' ? 4 - index : index + 5;
                const isEmpty = !piece;
                
                return (
                  <div
                    key={index}
                    onClick={() => handleSlotClick(index)}
                    style={{
                      width: '80px',
                      height: '80px',
                      border: isEmpty && selectedReservePieceId 
                        ? '2px dashed var(--mantine-color-blue-6)' 
                        : '2px solid var(--mantine-color-dark-4)',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isEmpty 
                        ? 'var(--mantine-color-dark-7)' 
                        : `var(--mantine-color-${getPieceColor(piece.pieceType)}-9)`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <Text size="xs" c="dimmed" style={{ position: 'absolute', top: '4px', right: '4px' }}>
                      H{position}
                    </Text>
                    
                    {!isEmpty && (
                      <Text
                        fw={700}
                        size="xl"
                        style={{
                          color: `var(--mantine-color-${getPieceColor(piece.pieceType)}-4)`,
                        }}
                      >
                        {getPieceName(piece.pieceType)}
                      </Text>
                    )}
                    
                    {isEmpty && (
                      <Text size="xs" c="dimmed">
                        Vide
                      </Text>
                    )}
                  </div>
                );
              })}
            </Stack>
          </Stack>
        </Card>
      </Group>

      <Button
        onClick={handleComplete}
        disabled={!canComplete}
        size="lg"
        color="green"
        fullWidth
      >
        Valider mes renforts
      </Button>
    </Stack>
  );
}
