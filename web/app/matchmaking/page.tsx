'use client';

import { useState, useEffect } from 'react';
import { Container, Title, Button, TextInput, Stack, Paper, Text, Group, Badge, Loader } from '@mantine/core';
import { GameSocketClient, MatchFoundData, GameState } from '@/lib/gameSocket';

export default function MatchmakingPage() {
  const [socket] = useState(() => new GameSocketClient('http://localhost:3001'));
  const [isConnected, setIsConnected] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [inQueue, setInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [matchData, setMatchData] = useState<MatchFoundData | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ playerName: string; message: string; timestamp: string }>>([]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    // Connect to server
    socket.connect().then(() => {
      setIsConnected(true);
    }).catch((error) => {
      console.error('Failed to connect:', error);
    });

    // Setup event listeners
    socket.onQueueJoined((data) => {
      console.log('Joined queue at position:', data.position);
      setInQueue(true);
      setQueuePosition(data.position);
    });

    socket.onMatchFound((data) => {
      console.log('Match found:', data);
      setMatchData(data);
      setInQueue(false);
      setQueuePosition(null);
    });

    socket.onGameUpdated((state) => {
      console.log('Game updated:', state);
      setGameState(state);
    });

    socket.onGameStarted((state) => {
      console.log('Game started:', state);
      setGameState(state);
    });

    socket.onGameFinished((data) => {
      console.log('Game finished. Winner:', data.winner);
      alert(`Game finished! Winner: ${data.winner}`);
    });

    socket.onPhaseChanged((data) => {
      console.log('Phase changed:', data.phase);
    });

    socket.onPlayerDisconnected((data) => {
      console.log('Player disconnected:', data);
      alert(`${data.playerName} has disconnected`);
    });

    socket.onChatMessage((data) => {
      console.log('Chat message:', data);
      setChatMessages((prev) => [...prev, data]);
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [socket]);

  const handleJoinQueue = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    socket.joinQueue(playerName);
  };

  const handleLeaveQueue = () => {
    socket.leaveQueue();
    setInQueue(false);
    setQueuePosition(null);
  };

  const handleSelectDeck = () => {
    if (!matchData) return;
    
    // Example deck: 10 infantrymen, 5 scouts, 4 colonels
    const selectedPieces = [
      ...Array(10).fill('infantryman'),
      ...Array(5).fill('scout'),
      ...Array(4).fill('colonel'),
    ];
    
    socket.selectDeck(matchData.gameId, matchData.playerId, selectedPieces);
  };

  const handleSetupReinforcements = () => {
    if (!matchData || !gameState) return;
    
    // Get first 4 pieces from deck
    const player = gameState.players[matchData.playerId];
    const pieceIds = player.deck.slice(0, 4).map((p: any) => p.id);
    
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

  const handleSendMessage = () => {
    if (!matchData || !chatInput.trim()) return;
    socket.sendMessage(matchData.gameId, chatInput);
    setChatInput('');
  };

  return (
    <Container size="md" py="xl">
      <Title order={1} mb="xl">Warstruck - 1vs1 Matchmaking</Title>

      <Stack gap="md">
        {/* Connection Status */}
        <Paper shadow="sm" p="md" withBorder>
          <Group>
            <Text fw={500}>Connection Status:</Text>
            <Badge color={isConnected ? 'green' : 'red'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </Group>
        </Paper>

        {/* Matchmaking */}
        {!matchData && (
          <Paper shadow="sm" p="md" withBorder>
            <Title order={3} mb="md">Find a Match</Title>
            
            {!inQueue ? (
              <Stack gap="sm">
                <TextInput
                  label="Your Name"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.currentTarget.value)}
                  disabled={!isConnected}
                />
                <Button onClick={handleJoinQueue} disabled={!isConnected || !playerName.trim()}>
                  Join Queue
                </Button>
              </Stack>
            ) : (
              <Stack gap="sm">
                <Group>
                  <Loader size="sm" />
                  <Text>Searching for opponent... Position: {queuePosition}</Text>
                </Group>
                <Button onClick={handleLeaveQueue} color="red">
                  Leave Queue
                </Button>
              </Stack>
            )}
          </Paper>
        )}

        {/* Match Found */}
        {matchData && (
          <Paper shadow="sm" p="md" withBorder>
            <Title order={3} mb="md">Match Found!</Title>
            <Stack gap="xs">
              <Text><strong>Game ID:</strong> {matchData.gameId}</Text>
              <Text><strong>Your Role:</strong> {matchData.role}</Text>
              <Text><strong>Opponent:</strong> {matchData.opponent}</Text>
              <Text><strong>Player ID:</strong> {matchData.playerId}</Text>
            </Stack>
          </Paper>
        )}

        {/* Game State */}
        {gameState && (
          <Paper shadow="sm" p="md" withBorder>
            <Title order={3} mb="md">Game State</Title>
            <Stack gap="xs">
              <Text><strong>Phase:</strong> {gameState.phase}</Text>
              <Text><strong>Turn:</strong> {gameState.turnNumber}</Text>
              <Text><strong>Current Player:</strong> {gameState.currentPlayer}</Text>
              
              {gameState.phase === 'deck-selection' && (
                <Button onClick={handleSelectDeck}>Select Deck (Auto)</Button>
              )}
              
              {gameState.phase === 'setup' && (
                <>
                  <Button onClick={handleSetupReinforcements}>Setup Reinforcements (Auto)</Button>
                  <Button onClick={handleStartGame} color="green">Start Game</Button>
                </>
              )}
              
              {gameState.phase === 'playing' && matchData && (
                <>
                  <Text>
                    <strong>Action Points:</strong> {gameState.players[matchData.playerId].actionPoints}
                  </Text>
                  <Button onClick={handleEndTurn}>End Turn</Button>
                </>
              )}
              
              {gameState.phase === 'finished' && (
                <Text size="xl" fw={700} c="green">
                  Winner: {gameState.winner}
                </Text>
              )}
            </Stack>
          </Paper>
        )}

        {/* Chat */}
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
                onChange={(e) => setChatInput(e.currentTarget.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                style={{ flex: 1 }}
              />
              <Button onClick={handleSendMessage}>Send</Button>
            </Group>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
