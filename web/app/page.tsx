'use client';

import { Badge, Box, Button, Container, Grid, Group, List, Stack, Text, Title } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { PieceCard } from './components/PieceCard';
import { pieces, rules } from '../lib/gameData';

export default function HomePage() {
  const router = useRouter();

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Box>
          <Group gap="xs">
            <Title order={1}>Warstruck</Title>
            <Badge color="grape" size="lg">
              Prototype
            </Badge>
          </Group>
          <Text c="dimmed" mt="xs">
            NestJS + Next.js + MongoDB (à venir) + Mantine. Aperçu des règles et des quatre premières unités.
          </Text>
        </Box>

        <Group justify="center" gap="md">
          <Button
            size="lg"
            onClick={() => router.push('/game')}
            color="blue"
            variant="filled"
          >
            🎮 Jouer (Mode Démo)
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
          >
            📖 Voir les règles
          </Button>
        </Group>

        <Box>
          <Title order={2} mb="xs">
            Terminologie du plateau
          </Title>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Badge fullWidth color="blue">{rules.terminology.reinforcementColumn}</Badge>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Badge fullWidth color="orange">{rules.terminology.frontierRows}</Badge>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Badge fullWidth color="teal">{rules.terminology.deploymentRows}</Badge>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Badge fullWidth color="gray">{rules.terminology.reserveZone}</Badge>
            </Grid.Col>
          </Grid>
        </Box>

        <Box>
          <Title order={2}>Déroulé d'un tour</Title>
          <List spacing="xs" size="sm">
            {rules.turnFlow.map((item) => (
              <List.Item key={item}>{item}</List.Item>
            ))}
          </List>
        </Box>

        <Box>
          <Title order={2}>Notes tactiques</Title>
          <List spacing="xs" size="sm" withPadding>
            {rules.tacticalNotes.map((note) => (
              <List.Item key={note}>{note}</List.Item>
            ))}
          </List>
        </Box>

        <Box>
          <Title order={2}>Unités</Title>
          <Grid gutter="md">
            {pieces.map((piece) => (
              <Grid.Col key={piece.id} span={{ base: 12, sm: 6 }}>
                <PieceCard piece={piece} />
              </Grid.Col>
            ))}
          </Grid>
        </Box>
      </Stack>
    </Container>
  );
}
