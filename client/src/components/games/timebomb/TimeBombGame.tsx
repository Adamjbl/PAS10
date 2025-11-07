import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { socketService } from '../../../services/socket';
import { GameBoard } from './GameBoard';
import { RoleReveal } from './RoleReveal';
import toast from 'react-hot-toast';

type Role = 'sherlock' | 'moriarty' | 'innocent';
type Team = 'blue' | 'red';
type WireType = 'safe' | 'bomb' | 'defuse';

interface Wire {
  playerId: string;
  wireIndex: number;
  revealed: boolean;
  type?: WireType;
}

interface TimeBombPlayer {
  userId: string;
  username: string;
  status: string;
  isAlive: boolean;
  wiresRemaining: number;
  wires: Wire[];
  role?: Role;
  team?: Team;
}

interface TimeBombGameData {
  players: TimeBombPlayer[];
  currentTurnIndex: number;
  currentTurnPlayerId: string;
  defuseCount: number;
  bombCount: number;
  round: number;
  gamePhase: 'role-reveal' | 'playing' | 'game-over';
  playerRole: { role: Role; team: Team } | null;
}

interface TimeBombGameState {
  id: string;
  roomCode: string;
  type: string;
  status: string;
  players: any[];
  currentTurn?: string;
  winner?: string | string[];
  gameData: TimeBombGameData;
}

interface TimeBombGameProps {
  gameState: TimeBombGameState;
  isMyTurn: boolean;
}

export default function TimeBombGame({ gameState, isMyTurn }: TimeBombGameProps) {
  const { user } = useAuthStore();
  const [hasAcknowledgedRole, setHasAcknowledgedRole] = useState(false);

  useEffect(() => {
    // Réinitialiser l'acknowledgement quand une nouvelle partie commence
    if (gameState.gameData.gamePhase === 'role-reveal') {
      setHasAcknowledgedRole(false);
    }
  }, [gameState.gameData.gamePhase]);

  const handleCutWire = (playerId: string, wireIndex: number) => {
    if (!isMyTurn) {
      toast.error("Ce n'est pas votre tour !");
      return;
    }

    socketService.emit('game:move', {
      roomCode: gameState.roomCode,
      move: {
        playerId: user!._id,
        type: 'cut_wire',
        data: { playerId, wireIndex },
        timestamp: new Date()
      }
    });
  };

  const handleAcknowledgeRole = () => {
    setHasAcknowledgedRole(true);
    socketService.emit('game:move', {
      roomCode: gameState.roomCode,
      move: {
        playerId: user!._id,
        type: 'acknowledge_role',
        data: {},
        timestamp: new Date()
      }
    });
  };

  if (!user) {
    return null;
  }

  // Phase de révélation du rôle
  if (gameState.gameData.gamePhase === 'role-reveal' && !hasAcknowledgedRole) {
    const playerRole = gameState.gameData.playerRole;
    if (playerRole) {
      return (
        <RoleReveal
          role={playerRole.role}
          team={playerRole.team}
          onAcknowledge={handleAcknowledgeRole}
        />
      );
    }
  }

  // Phase de jeu
  const winner = gameState.gameData.gamePhase === 'game-over'
    ? (gameState.gameData.players.find(p =>
        Array.isArray(gameState.winner)
          ? gameState.winner.includes(p.userId)
          : p.userId === gameState.winner
      )?.team || undefined)
    : undefined;

  return (
    <GameBoard
      players={gameState.gameData.players}
      currentPlayerId={user._id}
      currentTurnPlayerId={gameState.gameData.currentTurnPlayerId}
      defuseCount={gameState.gameData.defuseCount}
      bombCount={gameState.gameData.bombCount}
      onCutWire={handleCutWire}
      gameOver={gameState.gameData.gamePhase === 'game-over'}
      winner={winner}
      roomCode={gameState.roomCode}
    />
  );
}
