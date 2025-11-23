'use client';

import { useState } from 'react';
import { Card, Stack, Title, Text, Group, Button, Badge, Alert, Grid } from '@mantine/core';
import { PieceId } from '../../lib/gameTypes';

interface DeckSelectionProps {
  playerId: 'player1' | 'player2';
  onDeckSelected: (selectedPieces: PieceId[]) => void;
  disabled?: boolean;
}

interface PieceOption {
  id: PieceId;
  name: string;
  description: string;
  color: string;
}

const availablePieces: PieceOption[] = [
  {
    id: 'colonel',
    name: 'Colonel',
    description: 'Haut gradé - Octroie 1 point d\'action par tour',
    color: 'grape',
  },
  {
    id: 'infantryman',
    name: 'Fantassin',
    description: 'Unité d\'infanterie - Capacité Rage (3 charges)',
    color: 'blue',
  },
  {
    id: 'scout',
    name: 'Éclaireur',
    description: 'Unité rapide - Capacité Adrénaline (3 charges)',
    color: 'teal',
  },
];

export function DeckSelection({ playerId, onDeckSelected, disabled = false }: DeckSelectionProps) {
  const [selectedPieces, setSelectedPieces] = useState<{ [key in PieceId]?: number }>({
    colonel: 0,
    infantryman: 0,
    scout: 0,
  });

  const totalSelected = Object.values(selectedPieces).reduce((sum, count) => sum + (count || 0), 0);
  const remainingSlots = 19 - totalSelected;

  const incrementPiece = (pieceId: PieceId) => {
    if (totalSelected < 19 && !disabled) {
      setSelectedPieces(prev => ({
        ...prev,
        [pieceId]: (prev[pieceId] || 0) + 1,
      }));
    }
  };

  const decrementPiece = (pieceId: PieceId) => {
    if ((selectedPieces[pieceId] || 0) > 0 && !disabled) {
      setSelectedPieces(prev => ({
        ...prev,
        [pieceId]: (prev[pieceId] || 0) - 1,
      }));
    }
  };

  const handleSubmit = () => {
    if (totalSelected === 19) {
      const deckArray: PieceId[] = [];
      Object.entries(selectedPieces).forEach(([pieceId, count]) => {
        for (let i = 0; i < (count || 0); i++) {
          deckArray.push(pieceId as PieceId);
        }
      });
      onDeckSelected(deckArray);
    }
  };

  const canSubmit = totalSelected === 19 && !disabled;

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>
          {playerId === 'player1' ? 'Joueur 1' : 'Joueur 2'} - Sélection du deck
        </Title>
        <Text c="dimmed" size="sm" mt="xs">
          Choisissez 19 pièces parmi les Colonels, Fantassins et Éclaireurs. Le Général sera ajouté automatiquement.
        </Text>
      </div>

      <Card withBorder padding="lg">
        <Group justify="space-between" mb="md">
          <Text fw={600}>Pièces sélectionnées</Text>
          <Badge 
            size="lg" 
            color={remainingSlots === 0 ? 'green' : remainingSlots < 0 ? 'red' : 'blue'}
          >
            {totalSelected} / 19
          </Badge>
        </Group>

        {remainingSlots > 0 && (
          <Alert color="blue" title="Information">
            Il vous reste {remainingSlots} pièce{remainingSlots > 1 ? 's' : ''} à sélectionner.
          </Alert>
        )}

        {remainingSlots === 0 && (
          <Alert color="green" title="Prêt !">
            Vous avez sélectionné 19 pièces. Cliquez sur "Valider mon deck" pour continuer.
          </Alert>
        )}
      </Card>

      <Grid>
        {availablePieces.map(piece => (
          <Grid.Col key={piece.id} span={{ base: 12, sm: 4 }}>
            <Card withBorder padding="md" style={{ height: '100%' }}>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Badge color={piece.color} size="lg">
                    {piece.name}
                  </Badge>
                  <Text size="xl" fw={700}>
                    {selectedPieces[piece.id] || 0}
                  </Text>
                </Group>

                <Text size="sm" c="dimmed">
                  {piece.description}
                </Text>

                <Group gap="xs" grow>
                  <Button
                    onClick={() => decrementPiece(piece.id)}
                    disabled={(selectedPieces[piece.id] || 0) === 0 || disabled}
                    variant="light"
                    color="red"
                  >
                    -
                  </Button>
                  <Button
                    onClick={() => incrementPiece(piece.id)}
                    disabled={totalSelected >= 19 || disabled}
                    variant="light"
                    color="green"
                  >
                    +
                  </Button>
                </Group>
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      <Card withBorder padding="lg" style={{ backgroundColor: 'var(--mantine-color-dark-6)' }}>
        <Stack gap="xs">
          <Group justify="space-between">
            <Text fw={600}>Composition de votre deck:</Text>
          </Group>
          <Text size="sm">
            • Général: <Badge color="yellow" size="sm">1</Badge> (automatique)
          </Text>
          <Text size="sm">
            • Colonels: <Badge color="grape" size="sm">{selectedPieces.colonel || 0}</Badge>
          </Text>
          <Text size="sm">
            • Fantassins: <Badge color="blue" size="sm">{selectedPieces.infantryman || 0}</Badge>
          </Text>
          <Text size="sm">
            • Éclaireurs: <Badge color="teal" size="sm">{selectedPieces.scout || 0}</Badge>
          </Text>
          <Text size="sm" fw={600} mt="xs">
            Total: <Badge color={canSubmit ? 'green' : 'gray'} size="lg">{totalSelected + 1}</Badge> pièces
          </Text>
        </Stack>
      </Card>

      <Button
        onClick={handleSubmit}
        disabled={!canSubmit}
        size="lg"
        color="green"
        fullWidth
      >
        {disabled ? 'Deck validé ✓' : 'Valider mon deck'}
      </Button>
    </Stack>
  );
}
