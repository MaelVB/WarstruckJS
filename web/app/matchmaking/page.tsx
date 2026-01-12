'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Container,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { DeckSelection } from '../components/DeckSelection';
import { GameBoard } from '../components/GameBoard';
import { PlayerInfo } from '../components/PlayerInfo';
import { ReserveZone } from '../components/ReserveZone';
import { SetupReinforcements } from '../components/SetupReinforcements';
import { getAttackTargets, getInfluencePositions, getMovementTargets } from '../../lib/boardZones';
import { GameSocketClient, MatchFoundData } from '../../lib/gameSocket';
import { BoardPiece, GameState, Position, ReservePiece } from '../../lib/gameTypes';

export default function MatchmakingPage() {
  const [socket] = useState(() => new GameSocketClient('http://localhost:3001'));
  const [isConnected, setIsConnected] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [inQueue, setInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [matchData, setMatchData] = useState<MatchFoundData | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<BoardPiece | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [validAttacks, setValidAttacks] = useState<Position[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pieceToAdd, setPieceToAdd] = useState<ReservePiece | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ playerName: string; message: string; timestamp: string }>>([]);
  const [chatInput, setChatInput] = useState('');

  const influencePositions = gameState && matchData
    ? getInfluencePositions(gameState.board, matchData.playerId)
    : [];

  const isPositionEqual = (left: Position, right: Position) =>
    left.row === right.row && left.col === right.col;

  const isPositionInList = (positions: Position[], target: Position) =>
    positions.some(position => isPositionEqual(position, target));

  const isMyTurn = matchData && gameState?.currentPlayer === matchData.playerId;

  useEffect(() => {
    socket.connect().then(() => {
      setIsConnected(true);
    }).catch((connectError) => {
      console.error('Failed to connect:', connectError);
      setError('Failed to connect to server');
    });

    socket.onQueueJoined((data) => {
      setInQueue(true);
      setQueuePosition(data.position);
    });

    socket.onMatchFound((data) => {
      setMatchData(data);
      setInQueue(false);
      setQueuePosition(null);
      socket.getGameState(data.gameId);
    });

    socket.onGameUpdated((state) => {
      setGameState(state as GameState);
      setError(null);
      setSelectedPiece(null);
      setSelectedPosition(null);
      setValidMoves([]);
      setValidAttacks([]);
    });

    socket.onGameStarted((state) => {
      setGameState(state as GameState);
      setError(null);
      setSelectedPiece(null);
      setSelectedPosition(null);
      setValidMoves([]);
      setValidAttacks([]);
    });

    socket.onGameState((state) => {
      setGameState(state as GameState);
      setSelectedPiece(null);
      setSelectedPosition(null);
      setValidMoves([]);
      setValidAttacks([]);
    });

    socket.onGameFinished((data) => {
      setError(`Game finished. Winner: ${data.winner}`);
    });

    socket.onPhaseChanged((data) => {
      console.log('Phase changed:', data.phase);
    });

    socket.onPlayerDisconnected((data) => {
      setError(`${data.playerName} disconnected`);
    });

    socket.onChatMessage((data) => {
      setChatMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  const handleJoinQueue = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    setError(null);
    socket.joinQueue(playerName.trim());
  };

  const handleLeaveQueue = () => {
    socket.leaveQueue();
    setInQueue(false);
    setQueuePosition(null);
  };

  const handleSelectDeck = (selectedPieces: Array<'colonel' | 'infantryman' | 'scout'>) => {
    if (!matchData) return;
    socket.selectDeck(matchData.gameId, matchData.playerId, selectedPieces);
  };

  const handleSetupReinforcements = (pieceIds: string[]) => {
    if (!matchData) return;
    socket.setupReinforcements(matchData.gameId, matchData.playerId, pieceIds);
  };

  const handleStartGame = () => {
    if (!matchData) return;
    socket.startGame(matchData.gameId);
  };

  const handleEndTurn = () => {
    if (!matchData) return;
    socket.executeAction(matchData.gameId, matchData.playerId, { type: 'endTurn' });
  };

  const handleSkipPostTurn = () => {
    if (!matchData) return;
    socket.completePostTurn(matchData.gameId, matchData.playerId, false);
  };

  const handleSendMessage = () => {
    if (!matchData || !chatInput.trim()) return;
    socket.sendMessage(matchData.gameId, chatInput.trim());
    setChatInput('');
  };

  const handleCellClick = (position: Position) => {
    if (!gameState || !matchData || gameState.phase !== 'playing') return;

    if (!isMyTurn) {
      setError('It is not your turn');
      return;
    }

    const currentPlayer = gameState.players[gameState.currentPlayer];

    if (currentPlayer.actionPoints <= 0) {
      setError('No action points left. End your turn.');
      return;
    }

    const clickedPiece = gameState.board[position.row][position.col];

    if (selectedPiece) {
      if (isPositionInList(validMoves, position)) {
        const isDeployment = selectedPosition && selectedPosition.col === 7;

        socket.executeAction(matchData.gameId, matchData.playerId, {
          type: isDeployment ? 'deployFromReinforcements' : 'move',
          pieceId: selectedPiece.id,
          from: selectedPosition,
          to: position,
        });
        return;
      }

      if (isPositionInList(validAttacks, position)) {
        const targetPiece = gameState.board[position.row][position.col];
        if (!targetPiece) return;

        socket.executeAction(matchData.gameId, matchData.playerId, {
          type: 'attack',
          pieceId: selectedPiece.id,
          targetPieceId: targetPiece.id,
        });
        return;
      }
    }

    if (clickedPiece && clickedPiece.owner === matchData.playerId) {
      if (position.col === 7) {
        const isDeployablePosition = (matchData.playerId === 'player1' && position.row === 7) ||
          (matchData.playerId === 'player2' && position.row === 0);

        if (isDeployablePosition) {
          setSelectedPiece(clickedPiece);
          setSelectedPosition(position);
          setError(null);

          const possibleMoves: Position[] = [];
          const deploymentRow = position.row;

          for (let col = 0; col < 7; col++) {
            const targetPiece = gameState.board[deploymentRow][col];
            if (!targetPiece) {
              possibleMoves.push({ row: deploymentRow, col });
            }
          }

          setValidMoves(possibleMoves);
          setValidAttacks([]);
        } else {
          setSelectedPiece(null);
          setSelectedPosition(null);
          setValidMoves([]);
          setValidAttacks([]);
        }
        return;
      }

      setSelectedPiece(clickedPiece);
      setSelectedPosition(position);
      setError(null);

      if (!isPositionInList(influencePositions, position)) {
        setError('This piece is outside allied influence');
        setValidMoves([]);
        setValidAttacks([]);
        return;
      }

      const possibleMoves = getMovementTargets(gameState.board, clickedPiece);
      const possibleAttacks = getAttackTargets(gameState.board, clickedPiece);

      setValidMoves(possibleMoves);
      setValidAttacks(possibleAttacks);
    } else {
      setSelectedPiece(null);
      setSelectedPosition(null);
      setValidMoves([]);
      setValidAttacks([]);
    }
  };


  const myPlayerId = matchData?.playerId;
  const hasPlayerId = Boolean(myPlayerId);
  const canShowDeckSelection = gameState?.phase === 'deck-selection' && hasPlayerId;
  const canShowSetup = gameState?.phase === 'setup' && hasPlayerId;
  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={1}>Warstruck - Multiplayer</Title>
          {matchData && gameState && (
            <Badge color={isMyTurn ? 'green' : 'gray'}>
              {isMyTurn ? 'Your turn' : 'Waiting'}
            </Badge>
          )}
        </Group>

        {error && (
          <Alert color="red" title="Error" onClose={() => setError(null)} withCloseButton>
            {error}
          </Alert>
        )}

        <Paper shadow="sm" p="md" withBorder>
          <Group>
            <Text fw={500}>Connection status:</Text>
            <Badge color={isConnected ? 'green' : 'red'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </Group>
        </Paper>

        {!matchData && (
          <Paper shadow="sm" p="md" withBorder>
            <Title order={3} mb="md">Lobby</Title>
            {!inQueue ? (
              <Stack gap="sm">
                <TextInput
                  label="Player name"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(event) => setPlayerName(event.currentTarget.value)}
                  disabled={!isConnected}
                />
                <Button onClick={handleJoinQueue} disabled={!isConnected || !playerName.trim()}>
                  Join queue
                </Button>
              </Stack>
            ) : (
              <Stack gap="sm">
                <Group>
                  <Loader size="sm" />
                  <Text>Searching... Position: {queuePosition}</Text>
                </Group>
                <Button onClick={handleLeaveQueue} color="red">
                  Leave queue
                </Button>
              </Stack>
            )}
          </Paper>
        )}

        {matchData && (
          <Paper shadow="sm" p="md" withBorder>
            <Title order={3} mb="md">Match found</Title>
            <Stack gap="xs">
              <Text><strong>Game ID:</strong> {matchData.gameId}</Text>
              <Text><strong>Your role:</strong> {matchData.role}</Text>
              <Text><strong>Opponent:</strong> {matchData.opponent}</Text>
              <Text><strong>Player ID:</strong> {matchData.playerId}</Text>
            </Stack>
          </Paper>
        )}

        {canShowDeckSelection && gameState && matchData && (
          <Paper shadow="sm" p="md" withBorder>
            <Stack gap="md">
              <Alert color="blue" title="Deck selection">
                Build your deck (19 pieces, general added automatically).
              </Alert>
              <DeckSelection
                playerId={matchData.playerId}
                onDeckSelected={handleSelectDeck}
                disabled={gameState.players[matchData.playerId].deckSelected}
              />
              {gameState.players[matchData.playerId].deckSelected && (
                <Alert color="yellow" title="Waiting">
                  Waiting for the opponent to validate their deck.
                </Alert>
              )}
            </Stack>
          </Paper>
        )}

        {canShowSetup && gameState && matchData && (
          <Paper shadow="sm" p="md" withBorder>
            <Stack gap="md">
              <Alert color="blue" title="Reinforcements">
                Select 4 pieces for the reinforcement column.
              </Alert>

              {gameState.players[matchData.playerId].reinforcements.length === 0 && (
                <SetupReinforcements
                  gameState={gameState}
                  playerId={matchData.playerId}
                  onComplete={handleSetupReinforcements}
                />
              )}

              {gameState.players[matchData.playerId].reinforcements.length === 4 && (
                <Alert color="yellow" title="Waiting">
                  Waiting for the opponent to finish setup.
                </Alert>
              )}

              {gameState.players.player1.reinforcements.length === 4 &&
                gameState.players.player2.reinforcements.length === 4 && (
                <Button onClick={handleStartGame} size="lg" color="green">
                  Start game
                </Button>
              )}
            </Stack>
          </Paper>
        )}

        {gameState?.phase === 'post-turn' && matchData && gameState && (
          <Paper shadow="sm" p="md" withBorder>
            <Stack gap="md">
              <Alert color="orange" title="Post turn">
                Reinforcements moved. Add a reserve piece or skip.
              </Alert>

              {isMyTurn ? (
                <Group align="flex-start" gap="lg" justify="center" wrap="nowrap">
                  <div style={{ flex: '0 0 300px' }}>
                    <PlayerInfo
                      player={gameState.players[matchData.playerId]}
                      playerId={matchData.playerId}
                      isCurrentPlayer={true}
                    />
                  </div>
                  <div style={{ flex: '0 0 auto' }}>
                    <GameBoard
                      board={gameState.board}
                      influencePositions={influencePositions}
                      currentPlayerId={matchData.playerId}
                    />
                  </div>
                  <div style={{ flex: '0 0 300px' }}>
                    <ReserveZone
                      pieces={gameState.players[matchData.playerId].deck.filter(p => p.pieceType !== 'general')}
                      playerId={matchData.playerId}
                      onPieceClick={(piece) => {
                        setPieceToAdd(piece);
                        setConfirmModalOpen(true);
                      }}
                      selectedPieceId={undefined}
                    />
                  </div>
                </Group>
              ) : (
                <Alert color="blue" title="Waiting">
                  Waiting for the opponent to complete post-turn actions.
                </Alert>
              )}

              {isMyTurn && (
                <Group justify="center" gap="md">
                  <Button onClick={handleSkipPostTurn} size="lg" color="orange">
                    Skip reinforcement
                  </Button>
                </Group>
              )}
            </Stack>
          </Paper>
        )}

        {gameState?.phase === 'playing' && matchData && gameState && (
          <Paper shadow="sm" p="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={600}>Turn {gameState.turnNumber}</Text>
                <Text size="sm" c="dimmed">Current: {gameState.currentPlayer}</Text>
              </Group>

              <Group align="flex-start" gap="lg" justify="center" wrap="nowrap">
                <div style={{ flex: '0 0 300px' }}>
                  <PlayerInfo
                    player={gameState.players[matchData.playerId]}
                    playerId={matchData.playerId}
                    isCurrentPlayer={gameState.currentPlayer === matchData.playerId}
                  />
                </div>

                <div style={{ flex: '0 0 auto' }}>
                  <GameBoard
                    board={gameState.board}
                    selectedPosition={selectedPosition || undefined}
                    validMoves={validMoves}
                    attackPositions={validAttacks}
                    influencePositions={influencePositions}
                    currentPlayerId={matchData.playerId}
                    onCellClick={handleCellClick}
                  />
                </div>

                <div style={{ flex: '0 0 300px' }}>
                  <ReserveZone
                    pieces={gameState.players[matchData.playerId].deck.filter(p => p.pieceType !== 'general')}
                    playerId={matchData.playerId}
                    onPieceClick={() => {}}
                    selectedPieceId={undefined}
                  />
                </div>
              </Group>

              <Group justify="center" gap="md">
                <Button
                  onClick={handleEndTurn}
                  size="lg"
                  color={gameState.players[matchData.playerId].actionPoints === 0 ? 'red' : 'orange'}
                  disabled={!isMyTurn}
                >
                  End turn
                </Button>
              </Group>
            </Stack>
          </Paper>
        )}

        {gameState?.phase === 'finished' && gameState.winner && (
          <Alert color="green" title="Game finished">
            Winner: {gameState.winner}
          </Alert>
        )}

        {matchData && (
          <Paper shadow="sm" p="md" withBorder>
            <Title order={4} mb="md">Chat</Title>
            <Stack gap="xs" mb="md" mah={200} style={{ overflowY: 'auto' }}>
              {chatMessages.map((msg, idx) => (
                <Text key={idx} size="sm">
                  <strong>{msg.playerName}:</strong> {msg.message}
                </Text>
              ))}
            </Stack>
            <Group>
              <TextInput
                placeholder="Type a message..."
                value={chatInput}
                onChange={(event) => setChatInput(event.currentTarget.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSendMessage()}
                style={{ flex: 1 }}
              />
              <Button onClick={handleSendMessage}>Send</Button>
            </Group>
          </Paper>
        )}
      </Stack>

      <Modal
        opened={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setPieceToAdd(null);
        }}
        title="Add reinforcement"
        centered
      >
        <Stack gap="md">
          <Text>
            Confirm adding this piece to the reinforcement column?
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmModalOpen(false);
                setPieceToAdd(null);
              }}
            >
              Cancel
            </Button>
            <Button
              color="blue"
              onClick={() => {
                if (!matchData || !pieceToAdd) return;
                socket.completePostTurn(matchData.gameId, matchData.playerId, true, pieceToAdd.id);
                setConfirmModalOpen(false);
                setPieceToAdd(null);
              }}
            >
              Confirm
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
