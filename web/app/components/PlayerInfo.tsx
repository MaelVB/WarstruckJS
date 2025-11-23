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
      </Stack>
    </Card>
  );
}
