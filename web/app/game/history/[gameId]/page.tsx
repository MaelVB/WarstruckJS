'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Stack,
  Title,
  Group,
  Button,
  Text,
  Alert,
  Timeline,
  Card,
  Badge,
  LoadingOverlay,
  Select,
} from '@mantine/core';
import { GameBoard } from '../../../components/GameBoard';
import { GameState } from '../../../lib/gameTypes';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface GameActionRecord {
  id: string;
  timestamp: string;
  turnNumber: number;
  playerId: string;
  action: any;
  gameStateAfter: GameState;
}

export default function GameHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params?.gameId as string;

  const [history, setHistory] = useState<GameActionRecord[]>([]);
  const [selectedAction, setSelectedAction] = useState<GameActionRecord | null>(null);
  const [replayState, setReplayState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTurn, setSelectedTurn] = useState<string | null>(null);

  // Charger l'historique
  useEffect(() => {
    if (!gameId) return;

    const loadHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/game/${gameId}/history`);

        if (!response.ok) {
          throw new Error('Erreur lors du chargement de l\'historique');
        }

        const data = await response.json();
        setHistory(data);
        
        // Sélectionner automatiquement la dernière action
        if (data.length > 0) {
          const lastAction = data[data.length - 1];
          setSelectedAction(lastAction);
          setReplayState(lastAction.gameStateAfter);
        }

        setError(null);
      } catch (err) {
        console.error('Error loading history:', err);
        setError('Erreur lors du chargement de l\'historique');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [gameId]);

  // Rejouer jusqu'à une action spécifique
  const replayToAction = async (actionId: string) => {
    try {
      const response = await fetch(`${API_URL}/game/${gameId}/replay/action/${actionId}`);

      if (!response.ok) {
        throw new Error('Erreur lors du replay');
      }

      const state = await response.json();
      setReplayState(state);
      
      const action = history.find(a => a.id === actionId);
      setSelectedAction(action || null);
      
      setError(null);
    } catch (err) {
      console.error('Error replaying:', err);
      setError('Erreur lors du replay');
    }
  };

  // Rejouer jusqu'à un tour spécifique
  const replayToTurn = async (turnNumber: number) => {
    try {
      const response = await fetch(`${API_URL}/game/${gameId}/replay/turn/${turnNumber}`);

      if (!response.ok) {
        throw new Error('Erreur lors du replay');
      }

      const state = await response.json();
      setReplayState(state);
      setError(null);
    } catch (err) {
      console.error('Error replaying:', err);
      setError('Erreur lors du replay');
    }
  };

  const getActionLabel = (action: any): string => {
    switch (action.type) {
      case 'move':
        return 'Déplacement';
      case 'attack':
        return 'Attaque';
      case 'deployFromReinforcements':
        return 'Déploiement';
      case 'addToReinforcements':
        return 'Ajout aux renforts';
      case 'useAbility':
        return `Capacité: ${action.abilityName}`;
      case 'endTurn':
        return 'Fin de tour';
      default:
        return action.type;
    }
  };

  const getActionColor = (action: any): string => {
    switch (action.type) {
      case 'move':
        return 'blue';
      case 'attack':
        return 'red';
      case 'deployFromReinforcements':
        return 'green';
      case 'addToReinforcements':
        return 'cyan';
      case 'useAbility':
        return 'violet';
      case 'endTurn':
        return 'gray';
      default:
        return 'gray';
    }
  };

  // Obtenir les tours uniques
  const uniqueTurns = Array.from(new Set(history.map(a => a.turnNumber))).sort((a, b) => a - b);

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <LoadingOverlay visible={true} />
      </Container>
    );
  }

  if (error && history.length === 0) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" gap="lg">
          <Alert color="red" title="Erreur">
            {error}
          </Alert>
          <Button onClick={() => router.push(`/game/${gameId}`)}>Retour à la partie</Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={1}>Historique de la partie</Title>
          <Button onClick={() => router.push(`/game/${gameId}`)} variant="light">
            Retour à la partie
          </Button>
        </Group>

        {error && (
          <Alert color="red" title="Erreur" onClose={() => setError(null)} withCloseButton>
            {error}
          </Alert>
        )}

        {history.length === 0 ? (
          <Alert color="blue" title="Aucune action">
            Aucune action n'a encore été effectuée dans cette partie.
          </Alert>
        ) : (
          <Group align="flex-start" gap="lg" wrap="nowrap">
            {/* Timeline des actions */}
            <Card shadow="sm" padding="lg" radius="md" withBorder style={{ flex: '0 0 350px', maxHeight: '800px', overflowY: 'auto' }}>
              <Stack gap="md">
                <Group justify="space-between">
                  <Text fw={700}>Actions ({history.length})</Text>
                  <Select
                    placeholder="Filtrer par tour"
                    data={[
                      { value: 'all', label: 'Tous les tours' },
                      ...uniqueTurns.map(t => ({ value: t.toString(), label: `Tour ${t}` }))
                    ]}
                    value={selectedTurn}
                    onChange={(value) => {
                      setSelectedTurn(value);
                      if (value && value !== 'all') {
                        replayToTurn(parseInt(value, 10));
                      }
                    }}
                    clearable
                  />
                </Group>

                <Timeline active={history.length} bulletSize={24} lineWidth={2}>
                  {history.map((record, index) => (
                    <Timeline.Item
                      key={record.id}
                      bullet={<Text size="xs">{index + 1}</Text>}
                      title={
                        <Group gap="xs">
                          <Badge color={getActionColor(record.action)} size="sm">
                            {getActionLabel(record.action)}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            Tour {record.turnNumber}
                          </Text>
                        </Group>
                      }
                    >
                      <Stack gap="xs">
                        <Text size="sm">
                          {record.playerId === 'player1' ? 'Joueur 1' : 'Joueur 2'}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {new Date(record.timestamp).toLocaleTimeString('fr-FR')}
                        </Text>
                        <Button
                          size="xs"
                          variant={selectedAction?.id === record.id ? 'filled' : 'light'}
                          onClick={() => replayToAction(record.id)}
                        >
                          Voir l'état
                        </Button>
                      </Stack>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Stack>
            </Card>

            {/* État du jeu */}
            <div style={{ flex: '1 1 auto' }}>
              {replayState ? (
                <Stack gap="md">
                  <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Group justify="space-between">
                      <div>
                        <Text fw={700} size="lg">
                          État du jeu - Tour {replayState.turnNumber}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Joueur actuel: {replayState.currentPlayer === 'player1' ? 'Joueur 1' : 'Joueur 2'}
                        </Text>
                        {selectedAction && (
                          <Text size="sm" c="dimmed">
                            Action: {getActionLabel(selectedAction.action)} par{' '}
                            {selectedAction.playerId === 'player1' ? 'Joueur 1' : 'Joueur 2'}
                          </Text>
                        )}
                      </div>
                      {replayState.winner && (
                        <Badge color="green" size="lg">
                          Gagnant: {replayState.winner === 'player1' ? 'Joueur 1' : 'Joueur 2'}
                        </Badge>
                      )}
                    </Group>
                  </Card>

                  <GameBoard
                    board={replayState.board}
                    onCellClick={() => {}}
                  />

                  <Group gap="md" justify="center">
                    <Card shadow="sm" padding="md" radius="md" withBorder>
                      <Stack gap="xs">
                        <Text fw={700} size="sm">Joueur 1</Text>
                        <Text size="xs">Points d'action: {replayState.players.player1.actionPoints}</Text>
                        <Text size="xs">Réserve: {replayState.players.player1.deck.length} pièces</Text>
                        <Text size="xs">Renforts: {replayState.players.player1.reinforcements.length} pièces</Text>
                      </Stack>
                    </Card>
                    <Card shadow="sm" padding="md" radius="md" withBorder>
                      <Stack gap="xs">
                        <Text fw={700} size="sm">Joueur 2</Text>
                        <Text size="xs">Points d'action: {replayState.players.player2.actionPoints}</Text>
                        <Text size="xs">Réserve: {replayState.players.player2.deck.length} pièces</Text>
                        <Text size="xs">Renforts: {replayState.players.player2.reinforcements.length} pièces</Text>
                      </Stack>
                    </Card>
                  </Group>
                </Stack>
              ) : (
                <Alert color="blue" title="Sélectionnez une action">
                  Cliquez sur une action dans la timeline pour voir l'état du jeu à ce moment.
                </Alert>
              )}
            </div>
          </Group>
        )}
      </Stack>
    </Container>
  );
}
