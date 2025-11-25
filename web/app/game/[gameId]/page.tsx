'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Stack, Title, Group, Button, Text, Alert, Grid, LoadingOverlay } from '@mantine/core';
import { GameBoard } from '../../components/GameBoard';
import { PlayerInfo } from '../../components/PlayerInfo';
import { DeckSelection } from '../../components/DeckSelection';
import { SetupReinforcements } from '../../components/SetupReinforcements';
import { ReserveZone } from '../../components/ReserveZone';
import { GameState, Position, BoardPiece, PlayerId, PieceId } from '../../../lib/gameTypes';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Calculer les points d'action basés sur les Hauts Gradés sur le terrain actif
function calculateActionPoints(game: GameState, playerId: PlayerId): number {
  let actionPoints = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 7; col++) {
      const piece = game.board[row][col];
      if (piece && piece.owner === playerId) {
        if (piece.pieceType === 'general') {
          actionPoints += 2;
        } else if (piece.pieceType === 'colonel') {
          actionPoints += 1;
        }
      }
    }
  }

  return actionPoints;
}

function initializeAbilities(pieceType: PieceId): { [abilityName: string]: number } {
  switch (pieceType) {
    case 'general':
      return { 'Parachutage': 2, 'En avant !': 3 };
    case 'colonel':
      return { 'Repli stratégique': 1 };
    case 'infantryman':
      return { 'Rage': 3 };
    case 'scout':
      return { 'Adrénaline': 3 };
    default:
      return {};
  }
}

export default function GameIdPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params?.gameId as string;

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPiece, setSelectedPiece] = useState<BoardPiece | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Charger la partie depuis le serveur
  useEffect(() => {
    if (!gameId) return;

    const loadGame = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/game/${gameId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Partie introuvable. Elle a peut-être été perdue suite à un redémarrage du serveur (les parties sont stockées en mémoire).');
          } else {
            throw new Error('Erreur lors du chargement de la partie');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setGameState(data);
        setError(null);
      } catch (err) {
        console.error('Error loading game:', err);
        setError('Erreur lors du chargement de la partie');
      } finally {
        setLoading(false);
      }
    };

    loadGame();
  }, [gameId]);

  // Sélectionner le deck
  const handleDeckSelection = async (playerId: PlayerId, selectedPieces: PieceId[]) => {
    if (!gameState) return;

    try {
      const response = await fetch(`${API_URL}/game/${gameId}/select-deck`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, selectedPieces }),
      });

      if (!response.ok) throw new Error('Erreur lors de la sélection du deck');

      const updatedGame = await response.json();
      setGameState(updatedGame);
      setError(null);
    } catch (err) {
      console.error('Error selecting deck:', err);
      setError('Erreur lors de la sélection du deck');
    }
  };

  // Configuration des renforts
  const handleReinforcementsSetup = async (playerId: PlayerId, pieceIds: string[]) => {
    if (!gameState) return;

    try {
      const response = await fetch(`${API_URL}/game/${gameId}/setup-reinforcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, pieceIds }),
      });

      if (!response.ok) throw new Error('Erreur lors de la configuration des renforts');

      const updatedGame = await response.json();
      setGameState(updatedGame);
      setError(null);
    } catch (err) {
      console.error('Error setting up reinforcements:', err);
      setError('Erreur lors de la configuration des renforts');
    }
  };

  // Placer le général
  const placeGeneral = async (playerId: PlayerId, position: Position) => {
    try {
      const response = await fetch(`${API_URL}/game/${gameId}/place-general`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, position }),
      });

      if (!response.ok) throw new Error('Erreur lors du placement du général');

      const updatedGame = await response.json();
      setGameState(updatedGame);
      setError(null);
    } catch (err) {
      console.error('Error placing general:', err);
      setError('Erreur lors du placement du général');
    }
  };

  // Démarrer la partie
  const startGame = async () => {
    try {
      const response = await fetch(`${API_URL}/game/${gameId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
        if (response.status === 404) {
          setError('Partie introuvable. Le serveur a peut-être été redémarré. Veuillez créer une nouvelle partie.');
        } else {
          setError(errorData.message || 'Erreur lors du démarrage de la partie');
        }
        return;
      }

      const updatedGame = await response.json();
      setGameState(updatedGame);
      setError(null);
    } catch (err: any) {
      console.error('Error starting game:', err);
      setError(err.message || 'Erreur lors du démarrage de la partie');
    }
  };

  // Exécuter une action
  const executeAction = async (playerId: PlayerId, action: any) => {
    try {
      const response = await fetch(`${API_URL}/game/${gameId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, action }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'exécution de l\'action');
      }

      const updatedGame = await response.json();
      setGameState(updatedGame);
      setError(null);
      setSelectedPiece(null);
      setSelectedPosition(null);
      setValidMoves([]);
    } catch (err: any) {
      console.error('Error executing action:', err);
      setError(err.message || 'Erreur lors de l\'exécution de l\'action');
    }
  };

  // Gestion des clics sur les cases
  const handleCellClick = (position: Position) => {
    if (!gameState || gameState.phase !== 'playing') return;

    const currentPlayer = gameState.players[gameState.currentPlayer];
    
    if (currentPlayer.actionPoints <= 0) {
      setError('Plus de points d\'action ! Vous devez terminer votre tour.');
      return;
    }

    const clickedPiece = gameState.board[position.row][position.col];

    // Si une pièce est sélectionnée et on clique sur une case valide
    if (selectedPiece && validMoves.some(m => m.row === position.row && m.col === position.col)) {
      // Vérifier si c'est un déploiement depuis la colonne des renforts (H1/H8)
      const isDeployment = selectedPosition && selectedPosition.col === 7;
      
      const action = {
        type: isDeployment ? 'deployFromReinforcements' : 'move',
        pieceId: selectedPiece.id,
        from: selectedPosition,
        to: position,
      };

      executeAction(gameState.currentPlayer, action);
      return;
    }

    // Sélectionner une pièce du joueur actuel
    if (clickedPiece && clickedPiece.owner === gameState.currentPlayer) {
      // Gestion spéciale pour la colonne des renforts (colonne H = col 7)
      if (position.col === 7) {
        // ✅ PERMETTRE la sélection de la pièce déployable (H1 pour player1, H8 pour player2)
        const isDeployablePosition = (gameState.currentPlayer === 'player1' && position.row === 7) ||
                                      (gameState.currentPlayer === 'player2' && position.row === 0);
        
        if (isDeployablePosition) {
          // La pièce en H1/H8 peut être déployée sur n'importe quelle case vide de sa ligne
          setSelectedPiece(clickedPiece);
          setSelectedPosition(position);
          setError(null);
          
          const possibleMoves: Position[] = [];
          const deploymentRow = position.row; // Même ligne (1 ou 8)
          
          // Parcourir toutes les colonnes de la ligne de déploiement (sauf H)
          for (let col = 0; col < 7; col++) {
            const targetPiece = gameState.board[deploymentRow][col];
            if (!targetPiece) {
              possibleMoves.push({ row: deploymentRow, col });
            }
          }
          
          setValidMoves(possibleMoves);
        } else {
          // ❌ Les autres pièces de renfort ne sont pas sélectionnables (pas de message d'erreur)
          setSelectedPiece(null);
          setSelectedPosition(null);
          setValidMoves([]);
        }
        return;
      }
      
      // Pièce normale sur le plateau (pas en colonne H)
      setSelectedPiece(clickedPiece);
      setSelectedPosition(position);
      setError(null);
      
      const possibleMoves: Position[] = [];

      // Déplacements adjacents simples pour la démo
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const newRow = position.row + dr;
          const newCol = position.col + dc;
          if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 7) {
            const targetPiece = gameState.board[newRow][newCol];
            if (!targetPiece || targetPiece.owner !== gameState.currentPlayer) {
              possibleMoves.push({ row: newRow, col: newCol });
            }
          }
        }
      }
      
      setValidMoves(possibleMoves);
    } else {
      setSelectedPiece(null);
      setSelectedPosition(null);
      setValidMoves([]);
    }
  };

  // Terminer le tour
  const endTurn = async () => {
    if (!gameState) return;

    const action = {
      type: 'endTurn',
    };

    await executeAction(gameState.currentPlayer, action);
  };

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <LoadingOverlay visible={true} />
      </Container>
    );
  }

  if (error && !gameState) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" gap="lg">
          <Alert color="red" title="Erreur">
            {error}
          </Alert>
          <Group>
            <Button onClick={() => router.push('/game')}>Retour à la liste</Button>
            <Button 
              color="blue" 
              onClick={async () => {
                try {
                  const response = await fetch(`${API_URL}/game/create`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                  });
                  if (response.ok) {
                    const newGame = await response.json();
                    router.push(`/game/${newGame.id}`);
                  }
                } catch (err) {
                  console.error('Error creating game:', err);
                }
              }}
            >
              Créer une nouvelle partie
            </Button>
          </Group>
        </Stack>
      </Container>
    );
  }

  if (!gameState) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" gap="lg">
          <Title>Partie introuvable</Title>
          <Button onClick={() => router.push('/game')}>Retour</Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={1}>Warstruck - Partie {gameId.substring(0, 8)}</Title>
          <Group gap="xs">
            <Text size="sm" fw={600}>Tour {gameState.turnNumber}</Text>
            <Text size="sm" c="dimmed">Phase : {gameState.phase}</Text>
          </Group>
        </Group>

        {error && (
          <Alert color="red" title="Erreur" onClose={() => setError(null)} withCloseButton>
            {error}
          </Alert>
        )}

        {gameState.phase === 'deck-selection' && (
          <>
            <Alert color="blue" title="Phase de sélection des decks">
              Chaque joueur doit choisir 19 pièces pour composer son deck.
            </Alert>
            
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <DeckSelection
                  playerId="player1"
                  onDeckSelected={(pieces) => handleDeckSelection('player1', pieces)}
                  disabled={gameState.players.player1.deckSelected}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <DeckSelection
                  playerId="player2"
                  onDeckSelected={(pieces) => handleDeckSelection('player2', pieces)}
                  disabled={gameState.players.player2.deckSelected}
                />
              </Grid.Col>
            </Grid>
          </>
        )}

        {gameState.phase === 'setup' && (
          <>
            <Alert color="blue" title="Phase de setup">
              Configuration des renforts et placement des généraux.
            </Alert>

            {(gameState.players.player1.reinforcements.length === 0 || 
              gameState.players.player2.reinforcements.length === 0) && (
              <Grid>
                {gameState.players.player1.reinforcements.length === 0 && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <SetupReinforcements
                      gameState={gameState}
                      playerId="player1"
                      onComplete={(ids) => handleReinforcementsSetup('player1', ids)}
                    />
                  </Grid.Col>
                )}
                {gameState.players.player2.reinforcements.length === 0 && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <SetupReinforcements
                      gameState={gameState}
                      playerId="player2"
                      onComplete={(ids) => handleReinforcementsSetup('player2', ids)}
                    />
                  </Grid.Col>
                )}
              </Grid>
            )}

            {gameState.players.player1.reinforcements.length === 4 && 
             gameState.players.player2.reinforcements.length === 4 && (
              <Group justify="center">
                <Button onClick={startGame} size="lg" color="green">
                  Démarrer la partie
                </Button>
              </Group>
            )}
          </>
        )}

        {gameState.phase === 'post-turn' && (
          <>
            <Alert color="orange" title="Phase post-tour">
              Les renforts ont été déplacés. Vous pouvez maintenant ajouter une pièce de votre réserve dans la colonne des renforts (en H{gameState.currentPlayer === 'player1' ? '4' : '5'}) ou passer.
            </Alert>

            <Group align="flex-start" gap="lg" justify="center" wrap="nowrap">
              <div style={{ flex: '0 0 300px' }}>
                <PlayerInfo
                  player={gameState.players[gameState.currentPlayer]}
                  playerId={gameState.currentPlayer}
                  isCurrentPlayer={true}
                />
              </div>

              <div style={{ flex: '0 0 auto' }}>
                <GameBoard
                  board={gameState.board}
                />
              </div>

              <div style={{ flex: '0 0 300px' }}>
                <ReserveZone
                  pieces={gameState.players[gameState.currentPlayer].deck.filter(p => p.pieceType !== 'general')}
                  playerId={gameState.currentPlayer}
                  onPieceClick={async (piece) => {
                    try {
                      const response = await fetch(`${API_URL}/game/${gameId}/complete-post-turn`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          playerId: gameState.currentPlayer,
                          addReinforcement: true,
                          reservePieceId: piece.id,
                        }),
                      });

                      if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Erreur lors de l\'ajout du renfort');
                      }

                      const updatedGame = await response.json();
                      setGameState(updatedGame);
                      setError(null);
                    } catch (err: any) {
                      console.error('Error adding reinforcement:', err);
                      setError(err.message);
                    }
                  }}
                  selectedPieceId={undefined}
                />
              </div>
            </Group>

            <Group justify="center" gap="md">
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch(`${API_URL}/game/${gameId}/complete-post-turn`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        playerId: gameState.currentPlayer,
                        addReinforcement: false,
                      }),
                    });

                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(errorData.message || 'Erreur');
                    }

                    const updatedGame = await response.json();
                    setGameState(updatedGame);
                    setError(null);
                  } catch (err: any) {
                    console.error('Error skipping reinforcement:', err);
                    setError(err.message);
                  }
                }}
                size="lg"
                color="orange"
              >
                Passer sans ajouter de renfort
              </Button>
            </Group>
          </>
        )}

        {gameState.phase === 'playing' && (
          <>
            <Group align="flex-start" gap="lg" justify="center" wrap="nowrap">
              <div style={{ flex: '0 0 300px' }}>
                <PlayerInfo
                  player={gameState.players[gameState.currentPlayer]}
                  playerId={gameState.currentPlayer}
                  isCurrentPlayer={true}
                />
              </div>

              <div style={{ flex: '0 0 auto' }}>
                <GameBoard
                  board={gameState.board}
                  selectedPosition={selectedPosition || undefined}
                  validMoves={validMoves}
                  onCellClick={handleCellClick}
                />
              </div>

              <div style={{ flex: '0 0 300px' }}>
                <ReserveZone
                  pieces={gameState.players[gameState.currentPlayer].deck.filter(p => p.pieceType !== 'general')}
                  playerId={gameState.currentPlayer}
                  onPieceClick={(piece) => {
                    console.log('Reserve piece clicked:', piece);
                  }}
                  selectedPieceId={undefined}
                />
              </div>
            </Group>

            <Group justify="center" gap="md">
              <Button
                onClick={endTurn}
                size="lg"
                color={gameState.players[gameState.currentPlayer].actionPoints === 0 ? 'red' : 'orange'}
              >
                Terminer le tour
              </Button>
              <Button onClick={() => router.push('/game/history/' + gameId)} size="lg" variant="outline">
                Voir l'historique
              </Button>
            </Group>
          </>
        )}

        {gameState.phase === 'finished' && gameState.winner && (
          <Alert color="green" title="Partie terminée !">
            <Text size="lg" fw={700}>
              Le {gameState.winner === 'player1' ? 'Joueur 1' : 'Joueur 2'} a gagné !
            </Text>
            <Group mt="md">
              <Button onClick={() => router.push('/game')}>Retour</Button>
              <Button onClick={() => router.push('/game/history/' + gameId)} variant="outline">
                Voir l'historique
              </Button>
            </Group>
          </Alert>
        )}
      </Stack>
    </Container>
  );
}
