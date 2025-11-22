'use client';

import { Badge, Card, Group, List, Stack, Text, ThemeIcon } from '@mantine/core';
import { Ability, Piece } from '../../lib/gameData';

function AbilityItem({ ability }: { ability: Ability }) {
  return (
    <List.Item
      icon={
        <ThemeIcon color={ability.type === 'passive' ? 'cyan' : 'yellow'} size="sm" radius="xl">
          {ability.type === 'passive' ? 'P' : 'A'}
        </ThemeIcon>
      }
    >
      <Group justify="space-between" wrap="nowrap">
        <Text fw={600}>{ability.name}</Text>
        {ability.charges ? <Badge variant="light">{ability.charges}x</Badge> : null}
      </Group>
      <Text size="sm" c="dimmed">
        {ability.description}
      </Text>
    </List.Item>
  );
}

export function PieceCard({ piece }: { piece: Piece }) {
  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Stack gap="xs">
        <Group justify="space-between">
          <Text fw={700}>{piece.name}</Text>
          <Badge color={piece.category === 'high-rank' ? 'blue' : piece.category === 'infantry' ? 'green' : 'orange'}>
            {piece.category}
          </Badge>
        </Group>
        <Text size="sm">Déplacement : {piece.movement}</Text>
        <Text size="sm">Attaque : {piece.attack}</Text>
        {piece.influence ? (
          <Text size="sm" c="cyan.3">
            Influence : {piece.influence}
          </Text>
        ) : null}
        <List spacing="xs" size="sm" center>
          {piece.abilities.map((ability) => (
            <AbilityItem key={ability.name} ability={ability} />
          ))}
        </List>
      </Stack>
    </Card>
  );
}
