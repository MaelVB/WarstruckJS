'use client';

import { useState, useEffect } from 'react';
import { Container, Stack, Title, Group, Button, Text, Alert } from '@mantine/core';
import { GameBoard } from '../components/GameBoard';
import { PlayerInfo } from '../components/PlayerInfo';
import { GameState, Position, BoardPiece, PlayerId } from '../../lib/gameTypes';

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

export default function GamePage() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<BoardPiece | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Créer un nouveau jeu pour démonstration
  const createDemoGame = () => {
    // Créer un plateau vide
    const emptyBoard: (BoardPiece | null)[][] = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null));

    // Créer un deck de démonstration (20 pièces)
    const createDemoDeck = () => {
      const deck = [
        'general' as const,
        'colonel' as const,
        'colonel' as const,
        ...Array(8).fill('infantryman' as const),
        ...Array(6).fill('scout' as const),
        ...Array(3).fill('infantryman' as const),
      ];
      return deck.map((pieceType, i) => ({
        id: `demo-${Math.random()}-${i}`,
        pieceType,
        owner: 'player1' as const,
      }));
    };

    const demoGame: GameState = {
      id: 'demo-game',
      phase: 'setup',
      board: emptyBoard,
      players: {
        player1: {
          id: 'player1',
          role: 'defender',
          deck: createDemoDeck(),
          reinforcements: [],
          actionPoints: 0,
          generalAdvanced: false,
        },
        player2: {
          id: 'player2',
          role: 'attacker',
          deck: createDemoDeck().map(p => ({ ...p, owner: 'player2' as const })),
          reinforcements: [],
          actionPoints: 0,
          generalAdvanced: false,
        },
      },
      currentPlayer: 'player1',
      turnNumber: 0,
      actionsThisTurn: 0,
    };

    setGameState(demoGame);
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

    // Ajouter quelques pièces de renfort pour la démo
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
      // Déplacer la pièce (logique simplifiée pour la démo)
      const updatedGame = { ...gameState };
      const updatedCurrentPlayer = updatedGame.players[updatedGame.currentPlayer];
      
      // Effacer l'ancienne position
      if (selectedPosition) {
        updatedGame.board[selectedPosition.row][selectedPosition.col] = null;
      }

      // Nouvelle position
      selectedPiece.position = position;
      updatedGame.board[position.row][position.col] = selectedPiece;

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
      
      // Pour la démo, montrer des déplacements possibles basiques (cases adjacentes)
      const possibleMoves: Position[] = [];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const newRow = position.row + dr;
          const newCol = position.col + dc;
          if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            const targetPiece = gameState.board[newRow][newCol];
            // Peut se déplacer sur une case vide ou une pièce ennemie
            if (!targetPiece || targetPiece.owner !== gameState.currentPlayer) {
              possibleMoves.push({ row: newRow, col: newCol });
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

        {gameState.phase === 'setup' && (
          <Group justify="center">
            <Button onClick={setupDemoGenerals} size="lg" color="green">
              Configurer la partie de démo
            </Button>
          </Group>
        )}

        {gameState.phase === 'playing' && (
          <>
            <Group align="flex-start" gap="lg" justify="center">
              {/* Info Joueur Actuel */}
              <div style={{ flex: 1, maxWidth: 400 }}>
                <PlayerInfo
                  player={gameState.players[gameState.currentPlayer]}
                  playerId={gameState.currentPlayer}
                  isCurrentPlayer={true}
                />
              </div>

              {/* Plateau */}
              <div style={{ flex: 2 }}>
                <GameBoard
                  board={gameState.board}
                  selectedPosition={selectedPosition || undefined}
                  validMoves={validMoves}
                  onCellClick={handleCellClick}
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
                  Cliquez sur une case verte pour déplacer la pièce
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
