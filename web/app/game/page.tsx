'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Stack, Title, Group, Button, Text, Alert, Grid, Card, Badge } from '@mantine/core';
import { GameBoard } from '../components/GameBoard';
import { PlayerInfo } from '../components/PlayerInfo';
import { DeckSelection } from '../components/DeckSelection';
import { SetupReinforcements } from '../components/SetupReinforcements';
import { ReserveZone } from '../components/ReserveZone';
import { GameState, Position, BoardPiece, PlayerId, PieceId } from '../../lib/gameTypes';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface GameMetadata {
  id: string;
  createdAt: string;
  updatedAt: string;
  phase: string;
  currentPlayer: string;
  turnNumber: number;
  winner?: string;
  player1Id: string;
  player2Id: string;
}

// Calculer les points d'action basés sur les Hauts Gradés sur le terrain actif
// Le terrain actif exclut la colonne H (colonne de renfort)
function calculateActionPoints(game: GameState, playerId: PlayerId): number {
  let actionPoints = 0; // Pas de point de base, uniquement ceux des Hauts Gradés

  // Parcourir uniquement les colonnes A-G (0-6), la colonne H (7) est exclue
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 7; col++) { // col < 7 pour exclure la colonne H
      const piece = game.board[row][col];
      if (piece && piece.owner === playerId) {
        if (piece.pieceType === 'general') {
          actionPoints += 2; // Un général octroie 2 pts d'action
        } else if (piece.pieceType === 'colonel') {
          actionPoints += 1; // Un colonel octroie 1 pt d'action
        }
      }
    }
  }

  return actionPoints;
}

// Initialiser les capacités d'une pièce avec leurs charges
function initializeAbilities(pieceType: PieceId): { [abilityName: string]: number } {
  switch (pieceType) {
    case 'general':
      return {
        'Parachutage': 2,
        'En avant !': 3,
      };
    case 'colonel':
      return {
        'Repli stratégique': 1,
      };
    case 'infantryman':
      return {
        'Rage': 3,
      };
    case 'scout':
      return {
        'Adrénaline': 3,
      };
    default:
      return {};
  }
}

export default function GamePage() {
  const router = useRouter();
  const [games, setGames] = useState<GameMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger la liste des parties
  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/game/list`);
      
      if (!response.ok) throw new Error('Erreur lors du chargement des parties');

      const data = await response.json();
      setGames(data);
      setError(null);
    } catch (err) {
      console.error('Error loading games:', err);
      setError('Erreur lors du chargement des parties');
    } finally {
      setLoading(false);
    }
  };

  // Créer une nouvelle partie
  const createNewGame = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/game/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) throw new Error('Erreur lors de la création de la partie');

      const newGame = await response.json();
      router.push(`/game/${newGame.id}`);
    } catch (err) {
      console.error('Error creating game:', err);
      setError('Erreur lors de la création de la partie');
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'deck-selection': return 'Sélection des decks';
      case 'setup': return 'Configuration';
      case 'playing': return 'En cours';
      case 'finished': return 'Terminée';
      default: return phase;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'deck-selection': return 'blue';
      case 'setup': return 'cyan';
      case 'playing': return 'green';
      case 'finished': return 'gray';
      default: return 'gray';
    }
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={1}>Warstruck - Parties</Title>
          <Button onClick={createNewGame} size="lg" color="blue">
            Nouvelle partie
          </Button>
        </Group>

        {error && (
          <Alert color="red" title="Erreur" onClose={() => setError(null)} withCloseButton>
            {error}
          </Alert>
        )}

        {loading ? (
          <Text>Chargement...</Text>
        ) : games.length === 0 ? (
          <Alert color="blue" title="Aucune partie">
            Aucune partie en cours. Créez une nouvelle partie pour commencer !
          </Alert>
        ) : (
          <Grid>
            {games.map((game) => (
              <Grid.Col key={game.id} span={{ base: 12, md: 6, lg: 4 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Text fw={700} size="sm" c="dimmed">
                        {game.id.substring(0, 8)}...
                      </Text>
                      <Badge color={getPhaseColor(game.phase)}>
                        {getPhaseLabel(game.phase)}
                      </Badge>
                    </Group>

                    <Stack gap="xs">
                      <Text size="sm">
                        <strong>Tour:</strong> {game.turnNumber}
                      </Text>
                      <Text size="sm">
                        <strong>Joueur actuel:</strong> {game.currentPlayer === 'player1' ? 'Joueur 1' : 'Joueur 2'}
                      </Text>
                      {game.winner && (
                        <Text size="sm" c="green" fw={700}>
                          Gagnant: {game.winner === 'player1' ? 'Joueur 1' : 'Joueur 2'}
                        </Text>
                      )}
                      <Text size="xs" c="dimmed">
                        Créée: {new Date(game.createdAt).toLocaleString('fr-FR')}
                      </Text>
                      <Text size="xs" c="dimmed">
                        Mise à jour: {new Date(game.updatedAt).toLocaleString('fr-FR')}
                      </Text>
                    </Stack>

                    <Group gap="xs">
                      <Button
                        onClick={() => router.push(`/game/${game.id}`)}
                        size="sm"
                        fullWidth
                      >
                        {game.phase === 'finished' ? 'Voir' : 'Rejoindre'}
                      </Button>
                      {game.phase === 'playing' || game.phase === 'finished' ? (
                        <Button
                          onClick={() => router.push(`/game/history/${game.id}`)}
                          size="sm"
                          variant="outline"
                          fullWidth
                        >
                          Historique
                        </Button>
                      ) : null}
                    </Group>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        )}

        <Group justify="center">
          <Button onClick={loadGames} variant="light">
            Rafraîchir
          </Button>
          <Button onClick={createDemoGameLegacy} variant="outline">
            Mode démo (ancien)
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}

// Ancienne fonction de démo pour référence
function createDemoGameLegacy() {
  // Rediriger vers l'ancienne page de démo si besoin
  console.log('Mode démo legacy - à implémenter si nécessaire');
}

// Conserver les anciennes fonctions pour référence (non utilisées dans la nouvelle interface)
function GamePageLegacy() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<BoardPiece | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedReservePieceId, setSelectedReservePieceId] = useState<string | null>(null);

  // Avancer automatiquement les renforts après un déploiement
  const advanceReinforcements = (game: GameState, playerId: PlayerId) => {
    const col = 7; // Colonne H
    
    if (playerId === 'player1') {
      // Joueur 1: déplacer les pièces EN DIRECTION de H1
      // Parcourir de H2 vers H4 (de bas en haut) pour éviter les conflits
      // H2 (row 6) → H1 (row 7)
      // H3 (row 5) → H2 (row 6)
      // H4 (row 4) → H3 (row 5)
      for (let row = 6; row >= 4; row--) {
        const piece = game.board[row][col];
        if (piece && piece.owner === playerId) {
          // Déplacer la pièce d'une case vers le bas (vers H1)
          game.board[row][col] = null;
          const newRow = row + 1;
          piece.position = { row: newRow, col };
          game.board[newRow][col] = piece;
        }
      }
    } else {
      // Joueur 2: déplacer les pièces EN DIRECTION de H8
      // Parcourir de H7 vers H5 (de haut en bas) pour éviter les conflits
      // H7 (row 1) → H8 (row 0)
      // H6 (row 2) → H7 (row 1)
      // H5 (row 3) → H6 (row 2)
      for (let row = 1; row <= 3; row++) {
        const piece = game.board[row][col];
        if (piece && piece.owner === playerId) {
          // Déplacer la pièce d'une case vers le haut (vers H8)
          game.board[row][col] = null;
          const newRow = row - 1;
          piece.position = { row: newRow, col };
          game.board[newRow][col] = piece;
        }
      }
    }
  };

  // Ajouter une pièce de la réserve aux renforts
  const addReserveToReinforcements = (game: GameState, playerId: PlayerId, pieceId: string) => {
    const player = game.players[playerId];
    const reservePiece = player.deck.find(p => p.id === pieceId);
    
    if (!reservePiece) {
      setError('Pièce introuvable dans la réserve');
      return false;
    }

    const col = 7;
    const entryRow = playerId === 'player1' ? 4 : 3; // H4 pour joueur 1, H5 pour joueur 2
    
    // Vérifier que la case d'entrée est libre
    if (game.board[entryRow][col]) {
      setError(`La case H${playerId === 'player1' ? '4' : '5'} n'est pas libre`);
      return false;
    }

    // Retirer de la réserve
    player.deck = player.deck.filter(p => p.id !== pieceId);

    // Placer sur le plateau
    const newPiece: BoardPiece = {
      id: reservePiece.id,
      pieceType: reservePiece.pieceType,
      owner: playerId,
      position: { row: entryRow, col },
      faceUp: true,
      usedAbilities: initializeAbilities(reservePiece.pieceType),
    };

    game.board[entryRow][col] = newPiece;
    return true;
  };

  // Créer un nouveau jeu pour démonstration
  const createDemoGame = () => {
    // Créer un plateau vide
    const emptyBoard: (BoardPiece | null)[][] = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null));

    const demoGame: GameState = {
      id: 'demo-game',
      phase: 'deck-selection',
      board: emptyBoard,
      players: {
        player1: {
          id: 'player1',
          role: 'defender',
          deck: [],
          reinforcements: [],
          actionPoints: 0,
          generalAdvanced: false,
          deckSelected: false,
          hasDeployedThisTurn: false,
        },
        player2: {
          id: 'player2',
          role: 'attacker',
          deck: [],
          reinforcements: [],
          actionPoints: 0,
          generalAdvanced: false,
          deckSelected: false,
          hasDeployedThisTurn: false,
        },
      },
      currentPlayer: 'player1',
      turnNumber: 0,
      actionsThisTurn: 0,
    };

    setGameState(demoGame);
    setError(null);
  };

  // Gérer la sélection du deck
  const handleDeckSelection = (playerId: PlayerId, selectedPieces: PieceId[]) => {
    if (!gameState) return;

    const updatedGame = { ...gameState };
    const player = updatedGame.players[playerId];

    // Créer le deck avec le général ajouté automatiquement
    const deckWithGeneral: PieceId[] = ['general', ...selectedPieces];
    
    player.deck = deckWithGeneral.map((pieceType, i) => ({
      id: `${playerId}-${pieceType}-${i}-${Math.random()}`,
      pieceType,
      owner: playerId,
    }));
    player.deckSelected = true;

    // Si les deux joueurs ont sélectionné leur deck, passer à la phase de setup
    if (updatedGame.players.player1.deckSelected && updatedGame.players.player2.deckSelected) {
      updatedGame.phase = 'setup';
    }

    setGameState(updatedGame);
    setError(null);
  };

  // Gérer la sélection des renforts
  const handleReinforcementsSetup = (playerId: PlayerId, selectedPieceIds: string[]) => {
    if (!gameState) return;

    const updatedGame = { ...gameState };
    const player = updatedGame.players[playerId];

    // Retirer les pièces du deck et les ajouter aux renforts
    const selectedPieces = selectedPieceIds.map((id, index) => {
      const piece = player.deck.find(p => p.id === id);
      if (!piece) return null;
      
      return {
        id: piece.id,
        pieceType: piece.pieceType,
        owner: playerId,
        faceUp: index === 0, // Seule la première pièce est face visible
        queuePosition: index,
      };
    }).filter(p => p !== null);

    player.deck = player.deck.filter(p => !selectedPieceIds.includes(p.id));
    player.reinforcements = selectedPieces as any[];

    setGameState(updatedGame);
    setError(null);
  };

  // Placer automatiquement les généraux pour la démo
  const setupDemoGenerals = () => {
    if (!gameState) return;

    const updatedGame = { ...gameState };
    
    // Placer le général du joueur 1 (défenseur) en D1 (row 7, col 3)
    const general1: BoardPiece = {
      id: 'general-1',
      pieceType: 'general',
      owner: 'player1',
      position: { row: 7, col: 3 }, // Ligne 1, colonne D
      faceUp: true,
      usedAbilities: {
        'Parachutage': 2,
        'En avant !': 3,
      },
    };
    updatedGame.board[7][3] = general1;

    // Placer le général du joueur 2 (attaquant) en D7 (row 1, col 3)
    // L'attaquant commence une ligne plus avancée
    const general2: BoardPiece = {
      id: 'general-2',
      pieceType: 'general',
      owner: 'player2',
      position: { row: 1, col: 3 }, // Ligne 7, colonne D
      faceUp: true,
      usedAbilities: {
        'Parachutage': 2,
        'En avant !': 3,
      },
    };
    updatedGame.board[1][3] = general2;

    // Placer les renforts du joueur 1 dans la colonne H (lignes 4-1, rows 4-7)
    // Les pièces avancent de H4 vers H1 (index 0 = H4, index 3 = H1)
    updatedGame.players.player1.reinforcements.forEach((reinf, index) => {
      const row = 4 + index; // H4=row 4, H3=row 5, H2=row 6, H1=row 7
      const col = 7; // Colonne H
      const reinforcementPiece: BoardPiece = {
        id: reinf.id,
        pieceType: reinf.pieceType,
        owner: 'player1',
        position: { row, col },
        faceUp: true, // Tous les renforts sont visibles pour leur propriétaire
        usedAbilities: initializeAbilities(reinf.pieceType),
      };
      updatedGame.board[row][col] = reinforcementPiece;
    });

    // Placer les renforts du joueur 2 dans la colonne H (lignes 5-8, rows 3-0)
    // Les pièces avancent de H5 vers H8 (index 0 = H5, index 3 = H8)
    updatedGame.players.player2.reinforcements.forEach((reinf, index) => {
      const row = 3 - index; // H5=row 3, H6=row 2, H7=row 1, H8=row 0
      const col = 7; // Colonne H
      const reinforcementPiece: BoardPiece = {
        id: reinf.id,
        pieceType: reinf.pieceType,
        owner: 'player2',
        position: { row, col },
        faceUp: true, // Tous les renforts sont visibles pour leur propriétaire
        usedAbilities: initializeAbilities(reinf.pieceType),
      };
      updatedGame.board[row][col] = reinforcementPiece;
    });

    // Vérifier que les renforts sont configurés (ils devraient l'être via le setup)
    // Sinon, utiliser les valeurs par défaut pour la démo
    if (updatedGame.players.player1.reinforcements.length === 0) {
      updatedGame.players.player1.reinforcements = [
        {
          id: 'reinf-1-1',
          pieceType: 'colonel',
          owner: 'player1',
          faceUp: true,
          queuePosition: 0,
        },
        {
          id: 'reinf-1-2',
          pieceType: 'infantryman',
          owner: 'player1',
          faceUp: false,
          queuePosition: 1,
        },
        {
          id: 'reinf-1-3',
          pieceType: 'scout',
          owner: 'player1',
          faceUp: false,
          queuePosition: 2,
        },
        {
          id: 'reinf-1-4',
          pieceType: 'infantryman',
          owner: 'player1',
          faceUp: false,
          queuePosition: 3,
        },
      ];
    }

    if (updatedGame.players.player2.reinforcements.length === 0) {
      updatedGame.players.player2.reinforcements = [
        {
          id: 'reinf-2-1',
          pieceType: 'colonel',
          owner: 'player2',
          faceUp: true,
          queuePosition: 0,
        },
        {
          id: 'reinf-2-2',
          pieceType: 'scout',
          owner: 'player2',
          faceUp: false,
          queuePosition: 1,
        },
        {
          id: 'reinf-2-3',
          pieceType: 'infantryman',
          owner: 'player2',
          faceUp: false,
          queuePosition: 2,
        },
        {
          id: 'reinf-2-4',
          pieceType: 'infantryman',
          owner: 'player2',
          faceUp: false,
          queuePosition: 3,
        },
      ];
    }

    // Passer en phase de jeu
    updatedGame.phase = 'playing';
    updatedGame.turnNumber = 1;
    
    // Calculer les points d'action basés sur les Hauts Gradés sur le terrain
    updatedGame.players.player1.actionPoints = calculateActionPoints(updatedGame, 'player1');
    updatedGame.players.player2.actionPoints = calculateActionPoints(updatedGame, 'player2');

    setGameState(updatedGame);
    setError(null);
  };

  const handleCellClick = (position: Position) => {
    if (!gameState || gameState.phase !== 'playing') return;

    const currentPlayer = gameState.players[gameState.currentPlayer];
    
    // Si le joueur n'a plus de points d'action, empêcher toute action
    if (currentPlayer.actionPoints <= 0) {
      setError('Plus de points d\'action ! Vous devez terminer votre tour.');
      return;
    }

    const clickedPiece = gameState.board[position.row][position.col];

    // Si une pièce est sélectionnée et on clique sur une case valide
    if (selectedPiece && validMoves.some(m => m.row === position.row && m.col === position.col)) {
      const updatedGame = { ...gameState };
      const updatedCurrentPlayer = updatedGame.players[updatedGame.currentPlayer];
      
      // Vérifier si c'est un déploiement depuis la colonne de renforts
      const isDeployment = selectedPosition?.col === 7 && position.col !== 7 && 
        ((gameState.currentPlayer === 'player1' && selectedPosition?.row === 7 && position.row === 7) ||
         (gameState.currentPlayer === 'player2' && selectedPosition?.row === 0 && position.row === 0));

      // Vérifier la limitation de déploiement (1 par tour)
      if (isDeployment && updatedCurrentPlayer.hasDeployedThisTurn) {
        setError('Vous ne pouvez déployer qu\'une seule unité par tour');
        return;
      }

      // Effacer l'ancienne position
      if (selectedPosition) {
        updatedGame.board[selectedPosition.row][selectedPosition.col] = null;
      }

      // Nouvelle position
      selectedPiece.position = position;
      updatedGame.board[position.row][position.col] = selectedPiece;

      // Si c'est un déploiement, avancer automatiquement les renforts et marquer le déploiement
      if (isDeployment) {
        advanceReinforcements(updatedGame, gameState.currentPlayer);
        updatedCurrentPlayer.hasDeployedThisTurn = true;
      }

      // Consommer un point d'action
      updatedCurrentPlayer.actionPoints--;

      setGameState(updatedGame);
      setSelectedPiece(null);
      setSelectedPosition(null);
      setValidMoves([]);
      setError(null);
      return;
    }

    // Sélectionner une pièce du joueur actuel
    if (clickedPiece && clickedPiece.owner === gameState.currentPlayer) {
      setSelectedPiece(clickedPiece);
      setSelectedPosition(position);
      setError(null);
      
      const possibleMoves: Position[] = [];

      // Si la pièce est dans la colonne de renforts et prête à être déployée
      if (position.col === 7) {
        const canDeploy = (gameState.currentPlayer === 'player1' && position.row === 7) || 
                         (gameState.currentPlayer === 'player2' && position.row === 0);
        
        if (canDeploy) {
          // Vérifier si le joueur a déjà déployé ce tour
          if (currentPlayer.hasDeployedThisTurn) {
            setError('Vous avez déjà déployé une unité ce tour');
            setSelectedPiece(null);
            setSelectedPosition(null);
            return;
          }
          
          // Peut être déployée n'importe où sur sa ligne de déploiement
          const deploymentRow = position.row;
          for (let col = 0; col < 7; col++) { // Colonnes A-G uniquement
            const targetPiece = gameState.board[deploymentRow][col];
            if (!targetPiece || targetPiece.owner !== gameState.currentPlayer) {
              possibleMoves.push({ row: deploymentRow, col });
            }
          }
        }
      } else {
        // Déplacements normaux (cases adjacentes)
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const newRow = position.row + dr;
            const newCol = position.col + dc;
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 7) { // Pas de mouvement vers la colonne H
              const targetPiece = gameState.board[newRow][newCol];
              // Peut se déplacer sur une case vide ou une pièce ennemie
              if (!targetPiece || targetPiece.owner !== gameState.currentPlayer) {
                possibleMoves.push({ row: newRow, col: newCol });
              }
            }
          }
        }
      }
      
      setValidMoves(possibleMoves);
    } else {
      // Désélectionner
      setSelectedPiece(null);
      setSelectedPosition(null);
      setValidMoves([]);
    }
  };

  const endTurn = () => {
    if (!gameState) return;

    const updatedGame = { ...gameState };
    
    // Réinitialiser le flag de déploiement du joueur qui vient de finir son tour
    updatedGame.players[updatedGame.currentPlayer].hasDeployedThisTurn = false;
    
    // Changer de joueur
    updatedGame.currentPlayer = updatedGame.currentPlayer === 'player1' ? 'player2' : 'player1';
    updatedGame.turnNumber++;
    updatedGame.actionsThisTurn = 0;

    // Recalculer les points d'action basés sur les Hauts Gradés sur le terrain
    updatedGame.players[updatedGame.currentPlayer].actionPoints = 
      calculateActionPoints(updatedGame, updatedGame.currentPlayer);

    setGameState(updatedGame);
    setSelectedPiece(null);
    setSelectedPosition(null);
    setValidMoves([]);
  };

  useEffect(() => {
    createDemoGame();
  }, []);

  if (!gameState) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" gap="lg">
          <Title>Chargement...</Title>
          <Button onClick={createDemoGame} size="lg">
            Créer une partie de démonstration
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={1}>Warstruck - Partie en cours</Title>
          <Group gap="xs">
            <Text size="sm" fw={600}>
              Tour {gameState.turnNumber}
            </Text>
            <Text size="sm" c="dimmed">
              Phase : {gameState.phase === 'setup' ? 'Configuration' : gameState.phase === 'playing' ? 'En jeu' : 'Terminée'}
            </Text>
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
              Chaque joueur doit choisir 19 pièces pour composer son deck. Le Général sera ajouté automatiquement.
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

            {gameState.players.player1.deckSelected && gameState.players.player2.deckSelected && (
              <Alert color="green" title="Prêt à commencer !">
                Les deux joueurs ont sélectionné leur deck. La phase de setup va commencer.
              </Alert>
            )}
          </>
        )}

        {gameState.phase === 'setup' && (
          <>
            <Alert color="blue" title="Phase de setup">
              Chaque joueur doit sélectionner 4 pièces de sa réserve pour sa colonne de renforts.
            </Alert>

            {/* Si les deux joueurs n'ont pas encore configuré leurs renforts */}
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

            {/* Si les deux joueurs ont configuré leurs renforts */}
            {gameState.players.player1.reinforcements.length === 4 && 
             gameState.players.player2.reinforcements.length === 4 && (
              <Group justify="center">
                <Button onClick={setupDemoGenerals} size="lg" color="green">
                  Démarrer la partie
                </Button>
              </Group>
            )}
          </>
        )}

        {gameState.phase === 'playing' && (
          <>
            <Group align="flex-start" gap="lg" justify="center" wrap="nowrap">
              {/* Info Joueur Actuel - Gauche */}
              <div style={{ flex: '0 0 300px' }}>
                <PlayerInfo
                  player={gameState.players[gameState.currentPlayer]}
                  playerId={gameState.currentPlayer}
                  isCurrentPlayer={true}
                />
              </div>

              {/* Plateau - Centre */}
              <div style={{ flex: '0 0 auto' }}>
                <GameBoard
                  board={gameState.board}
                  selectedPosition={selectedPosition || undefined}
                  validMoves={validMoves}
                  onCellClick={handleCellClick}
                />
              </div>

              {/* Zone de réserve - Droite */}
              <div style={{ flex: '0 0 300px' }}>
                <ReserveZone
                  pieces={gameState.players[gameState.currentPlayer].deck.filter(p => p.pieceType !== 'general')}
                  playerId={gameState.currentPlayer}
                  onPieceClick={(piece) => {
                    // Vérifier si la case d'entrée des renforts est libre
                    const entryRow = gameState.currentPlayer === 'player1' ? 4 : 3;
                    if (!gameState.board[entryRow][7]) {
                      const updatedGame = { ...gameState };
                      const success = addReserveToReinforcements(updatedGame, gameState.currentPlayer, piece.id);
                      if (success) {
                        // Consommer un point d'action
                        updatedGame.players[gameState.currentPlayer].actionPoints--;
                        setGameState(updatedGame);
                        setError(null);
                      }
                    } else {
                      setError(`La case H${gameState.currentPlayer === 'player1' ? '4' : '5'} doit être libre pour ajouter un renfort`);
                    }
                  }}
                  selectedPieceId={selectedReservePieceId}
                />
              </div>
            </Group>

            {/* Actions */}
            <Group justify="center" gap="md">
              <Button
                onClick={endTurn}
                size="lg"
                color={gameState.players[gameState.currentPlayer].actionPoints === 0 ? 'red' : 'orange'}
                variant={gameState.players[gameState.currentPlayer].actionPoints === 0 ? 'filled' : 'light'}
              >
                Terminer le tour {gameState.players[gameState.currentPlayer].actionPoints === 0 && '(obligatoire)'}
              </Button>
              <Button onClick={createDemoGame} size="lg" variant="outline">
                Nouvelle partie
              </Button>
            </Group>

            {selectedPiece && (
              <Alert color="blue" title="Pièce sélectionnée">
                <Text>
                  {selectedPiece.pieceType === 'general' ? 'Général' : 
                   selectedPiece.pieceType === 'colonel' ? 'Colonel' :
                   selectedPiece.pieceType === 'infantryman' ? 'Fantassin' : 'Éclaireur'}
                  {' '}du joueur {selectedPiece.owner === 'player1' ? '1' : '2'}
                </Text>
                <Text size="sm" c="dimmed">
                  {selectedPosition?.col === 7 && 
                   ((gameState.currentPlayer === 'player1' && selectedPosition?.row === 7) ||
                    (gameState.currentPlayer === 'player2' && selectedPosition?.row === 0))
                    ? 'Cette pièce peut être déployée sur n\'importe quelle case de sa ligne'
                    : 'Cliquez sur une case verte pour déplacer la pièce'
                  }
                </Text>
              </Alert>
            )}

            {!selectedPiece && (
              <Alert color="violet" title="Colonne des renforts">
                <Text size="sm">
                  • Cliquez sur une pièce de la <strong>réserve</strong> pour l'ajouter en {gameState.currentPlayer === 'player1' ? 'H4' : 'H5'} (1 PA)
                </Text>
                <Text size="sm">
                  • Une pièce en {gameState.currentPlayer === 'player1' ? 'H1' : 'H8'} peut être <strong>déployée</strong> sur toute sa ligne (1 PA, <strong>1 fois par tour</strong>)
                  {gameState.players[gameState.currentPlayer].hasDeployedThisTurn && ' ✓ Déjà effectué'}
                </Text>
                <Text size="sm">
                  • Les renforts <strong>avancent automatiquement</strong> après un déploiement
                </Text>
              </Alert>
            )}
          </>
        )}

        {gameState.phase === 'finished' && gameState.winner && (
          <Alert color="green" title="Partie terminée !">
            <Text size="lg" fw={700}>
              Le {gameState.winner === 'player1' ? 'Joueur 1' : 'Joueur 2'} a gagné !
            </Text>
            <Button onClick={createDemoGame} mt="md" size="lg">
              Nouvelle partie
            </Button>
          </Alert>
        )}
      </Stack>
    </Container>
  );
}
