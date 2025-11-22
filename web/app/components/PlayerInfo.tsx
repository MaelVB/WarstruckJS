'use client';

import { Badge, Box, Card, Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import { Player, PlayerId } from '../../lib/gameTypes';

interface PlayerInfoProps {
  player: Player;
  playerId: PlayerId;
  isCurrentPlayer: boolean;
}

export function PlayerInfo({ player, playerId, isCurrentPlayer }: PlayerInfoProps) {
  const getPieceSymbol = (pieceType: string): string => {
    switch (pieceType) {
      case 'general': return '★';
      case 'colonel': return '◆';
      case 'infantryman': return '●';
      case 'scout': return '►';
      default: return '?';
    }
  };

  const getPieceName = (pieceType: string): string => {
    switch (pieceType) {
      case 'general': return 'Général';
      case 'colonel': return 'Colonel';
      case 'infantryman': return 'Fantassin';
      case 'scout': return 'Éclaireur';
      default: return 'Inconnu';
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        {/* En-tête */}
        <Group justify="space-between">
          <Group gap="xs">
            <Text size="lg" fw={700}>
              {playerId === 'player1' ? 'Joueur 1' : 'Joueur 2'}
            </Text>
            <Badge color={playerId === 'player1' ? 'blue' : 'red'}>
              {player.role === 'attacker' ? 'Attaquant' : 'Défenseur'}
            </Badge>
          </Group>
          {isCurrentPlayer && (
            <Badge color="green" size="lg">
              À JOUER
            </Badge>
          )}
        </Group>

        {/* Points d'action */}
        <Group gap="xs">
          <Text size="sm" fw={600}>Points d'action :</Text>
          <Badge color="yellow" size="lg" variant="filled">
            {player.actionPoints}
          </Badge>
        </Group>

        {/* Renforts */}
        <Box>
          <Text size="sm" fw={600} mb="xs">
            Renforts ({player.reinforcements.length}/4) :
          </Text>
          <Group gap="xs">
            {player.reinforcements.length === 0 ? (
              <Text size="sm" c="dimmed">Aucun renfort</Text>
            ) : (
              player.reinforcements
                .sort((a, b) => a.queuePosition - b.queuePosition)
                .map((reinf, index) => (
                  <Paper
                    key={reinf.id}
                    p="xs"
                    withBorder
                    style={{
                      backgroundColor: reinf.faceUp ? 'transparent' : '#e0e0e0',
                    }}
                  >
                    {reinf.faceUp ? (
                      <Stack gap={4} align="center">
                        <ThemeIcon
                          size="md"
                          radius="xl"
                          color={playerId === 'player1' ? 'blue' : 'red'}
                        >
                          <Text size="sm">{getPieceSymbol(reinf.pieceType)}</Text>
                        </ThemeIcon>
                        <Text size="xs">{getPieceName(reinf.pieceType)}</Text>
                        <Badge size="xs" color="violet">
                          Pos {index + 1}
                        </Badge>
                      </Stack>
                    ) : (
                      <Stack gap={4} align="center">
                        <ThemeIcon size="md" radius="xl" color="gray">
                          <Text size="sm">?</Text>
                        </ThemeIcon>
                        <Text size="xs">Caché</Text>
                        <Badge size="xs" color="gray">
                          Pos {index + 1}
                        </Badge>
                      </Stack>
                    )}
                  </Paper>
                ))
            )}
          </Group>
        </Box>

        {/* Réserve */}
        <Box>
          <Text size="sm" fw={600} mb="xs">
            Réserve : {player.deck.length} pièces
          </Text>
          <Paper p="sm" withBorder style={{ backgroundColor: '#f5f5f5' }}>
            <Group gap="xs">
              {Array(Math.min(player.deck.length, 5)).fill(0).map((_, i) => (
                <ThemeIcon key={i} size="sm" radius="xl" color="gray">
                  <Text size="xs">?</Text>
                </ThemeIcon>
              ))}
              {player.deck.length > 5 && (
                <Text size="xs" c="dimmed">
                  +{player.deck.length - 5} autres
                </Text>
              )}
            </Group>
          </Paper>
        </Box>
      </Stack>
    </Card>
  );
}
