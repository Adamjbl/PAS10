import { useEffect, useState, useCallback, useRef } from 'react';
import { socketService } from '../services/socket';
import toast from 'react-hot-toast';

export interface GameState {
  id: string;
  roomCode: string;
  type: string;
  status: 'waiting' | 'starting' | 'in_progress' | 'paused' | 'finished';
  players: GamePlayer[];
  currentTurn?: string;
  winner?: string | string[];
  startedAt?: Date;
  settings: any;
  roundNumber?: number;
  currentBid?: { quantity: number; dieValue: number };
  totalDiceCount?: number;
  playerDiceCount?: { [key: string]: number };
  myDice?: number[];
}

export interface GamePlayer {
  userId: string;
  username: string;
  status: 'active' | 'eliminated' | 'disconnected' | 'spectator';
  score?: number;
}

/**
 * Hook personnalisé pour gérer les interactions avec un jeu
 */
export const useGame = (roomCode: string) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const listenersSetup = useRef(false); // Éviter les multiples setups de listeners

  // Créer et démarrer un jeu
  const startGame = useCallback(async () => {
    if (!roomCode) return;

    setIsLoading(true);
    socketService.emit('game:create', { roomCode });
  }, [roomCode]);

  // Envoyer un mouvement
  const sendMove = useCallback(async (type: string, data: any) => {
    if (!roomCode || !gameState) return;

    socketService.emit('game:move', {
      roomCode,
      move: { type, data }
    });
  }, [roomCode, gameState]);

  // Actions spécifiques Perudo
  const makeBid = useCallback((quantity: number, dieValue: number) => {
    sendMove('bid', { quantity, dieValue });
  }, [sendMove]);

  const challenge = useCallback(() => {
    sendMove('challenge', {});
  }, [sendMove]);

  const callExact = useCallback(() => {
    sendMove('exact', {});
  }, [sendMove]);

  // Pause/Resume
  const pauseGame = useCallback(() => {
    if (!roomCode) return;
    socketService.emit('game:pause', { roomCode });
  }, [roomCode]);

  const resumeGame = useCallback(() => {
    if (!roomCode) return;
    socketService.emit('game:resume', { roomCode });
  }, [roomCode]);

  // Terminer le jeu
  const endGame = useCallback((reason?: string) => {
    if (!roomCode) return;
    socketService.emit('game:end', { roomCode, reason });
  }, [roomCode]);

  // Envoyer un message dans le chat du jeu
  const sendChatMessage = useCallback((message: string) => {
    if (!roomCode) return;
    socketService.emit('game:chat', { roomCode, message });
  }, [roomCode]);

  // Récupérer l'état du jeu
  const fetchGameState = useCallback(() => {
    if (!roomCode) return;
    socketService.emit('game:get_state', { roomCode });
  }, [roomCode]);

  // Effet pour écouter les événements du jeu
  useEffect(() => {
    console.log('🎧 [useGame] Setting up game listeners', {
      roomCode,
      listenersSetup: listenersSetup.current
    });

    // Ne setup les listeners qu'une seule fois
    if (listenersSetup.current) {
      console.log('⏭️  [useGame] Listeners already setup, skipping');
      return;
    }

    if (!roomCode) {
      console.log('⏭️  [useGame] No roomCode, skipping');
      return;
    }

    console.log('✅ [useGame] Setting up listeners for the first time');
    listenersSetup.current = true;

    // Événements généraux du jeu
    const handleGameCreated = (data: { state: GameState }) => {
      setGameState(data.state);
      setIsLoading(false);
      toast.success('Partie créée!');
    };

    const handleGameStarted = (data: { state: GameState }) => {
      setGameState(data.state);
      toast.success('La partie commence!');
    };

    const handleGameUpdate = (data: { state: GameState }) => {
      setGameState(data.state);
    };

    const handleGameMove = (data: { playerId: string; move: any; state: GameState }) => {
      setGameState(data.state);
    };

    const handleTurnChanged = (data: { playerId: string; state: GameState }) => {
      setGameState(data.state);
      // Vérifier si c'est notre tour
      const userId = socketService.getUserId();
      if (userId && data.playerId === userId) {
        setIsMyTurn(true);
        toast('C\'est votre tour!', { icon: '🎲' });
      } else {
        setIsMyTurn(false);
      }
    };

    const handleGamePaused = (data: { state: GameState }) => {
      setGameState(data.state);
      toast('Partie mise en pause');
    };

    const handleGameResumed = (data: { state: GameState }) => {
      setGameState(data.state);
      toast('Partie reprise');
    };

    const handleGameEnded = (data: { reason: string; result: any; state: GameState }) => {
      setGameState(data.state);
      setIsLoading(false);

      if (data.result) {
        const winner = data.state.players.find(p => p.userId === data.result.winner);
        if (winner) {
          toast.success(`🏆 ${winner.username} a gagné!`);
        }
      }
    };

    const handleGameError = (data: { message: string }) => {
      setIsLoading(false);
      toast.error(data.message);
    };

    const handleMoveRejected = (data: { reason: string }) => {
      toast.error(data.reason);
    };

    const handlePlayerEliminated = (data: { playerId: string; state: GameState }) => {
      setGameState(data.state);
      const player = data.state.players.find(p => p.userId === data.playerId);
      if (player) {
        toast(`${player.username} est éliminé!`, { icon: '❌' });
      }
    };

    const handleGameState = (data: { state: GameState }) => {
      setGameState(data.state);
      // Vérifier si c'est notre tour
      const userId = socketService.getUserId();
      if (userId && data.state.currentTurn === userId) {
        setIsMyTurn(true);
      }
    };

    // Événements spécifiques Perudo
    const handleRoundStarted = (data: { roundNumber: number; currentTurn: string }) => {
      toast(`Round ${data.roundNumber} commence!`);
    };

    const handleBidMade = (data: { playerId: string; bid: any; nextPlayer: string }) => {
      const player = gameState?.players.find(p => p.userId === data.playerId);
      if (player) {
        toast(`${player.username} enchérit: ${data.bid.quantity} × 🎲${data.bid.dieValue}`);
      }
    };

    const handleChallengeResolved = (data: {
      challenger: string;
      bidQuantity: number;
      actualCount: number;
      loser: string;
      success: boolean;
    }) => {
      const message = data.success
        ? `Défi réussi! Il y avait ${data.actualCount} dés (enchère: ${data.bidQuantity})`
        : `Défi échoué! Il y avait ${data.actualCount} dés (enchère: ${data.bidQuantity})`;
      toast(message, { icon: data.success ? '✅' : '❌' });
    };

    const handleExactResolved = (data: {
      player: string;
      bidQuantity: number;
      actualCount: number;
      success: boolean;
    }) => {
      const message = data.success
        ? `Exact réussi! Il y avait exactement ${data.actualCount} dés!`
        : `Exact échoué! Il y avait ${data.actualCount} dés (enchère: ${data.bidQuantity})`;
      toast(message, { icon: data.success ? '🎯' : '❌' });
    };

    // Chat du jeu
    const handleChatMessage = (_data: {
      playerId: string;
      username: string;
      message: string;
      timestamp: Date;
    }) => {
      // Le composant de chat gèrera l'affichage
    };

    // Enregistrer les listeners
    socketService.on('game:created', handleGameCreated);
    socketService.on('game:started', handleGameStarted);
    socketService.on('game:update', handleGameUpdate);
    socketService.on('game:move', handleGameMove);
    socketService.on('game:turn_changed', handleTurnChanged);
    socketService.on('game:paused', handleGamePaused);
    socketService.on('game:resumed', handleGameResumed);
    socketService.on('game:ended', handleGameEnded);
    socketService.on('game:error', handleGameError);
    socketService.on('game:move_rejected', handleMoveRejected);
    socketService.on('game:player_eliminated', handlePlayerEliminated);
    socketService.on('game:state', handleGameState);

    // Événements Perudo
    socketService.on('round_started', handleRoundStarted);
    socketService.on('bid_made', handleBidMade);
    socketService.on('challenge_resolved', handleChallengeResolved);
    socketService.on('exact_resolved', handleExactResolved);

    // Chat
    socketService.on('game:chat_message', handleChatMessage);

    // Récupérer l'état initial si disponible
    fetchGameState();

    // NE PAS NETTOYER les listeners - ils doivent rester actifs toute la session
    // Sinon on manque des événements à cause de React.StrictMode
    console.log('✅ [useGame] Listeners setup complete, they will stay active');
  }, [roomCode, fetchGameState]); // Pas de gameState dans les dépendances!

  return {
    gameState,
    isMyTurn,
    isLoading,
    startGame,
    sendMove,
    makeBid,
    challenge,
    callExact,
    pauseGame,
    resumeGame,
    endGame,
    sendChatMessage
  };
};