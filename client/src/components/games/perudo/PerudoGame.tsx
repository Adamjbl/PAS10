import { useState, useEffect } from 'react';
import { useGame } from '../../../hooks/useGame';
import { useAuthStore } from '../../../stores/authStore';
import { socketService } from '../../../services/socket';
import toast from 'react-hot-toast';
import { Player } from './Player';
import { BidPanel } from './BidPanel';
import { Dice } from './Dice';
import { Button } from '../../ui/button';
import { motion } from 'framer-motion';
import { Dices as DiceIcon, RotateCcw } from 'lucide-react';
import { ChallengeResultModal } from './ChallengeResultModal';

interface PerudoGameProps {
  gameState: any;
  isMyTurn: boolean;
}

interface ChallengeResultData {
  allDice: { playerId: string; playerName: string; dice: number[] }[];
  bidQuantity: number;
  bidValue: number;
  actualCount: number;
  loserName: string;
  success: boolean;
}

export default function PerudoGame({ gameState, isMyTurn }: PerudoGameProps) {
  const { user } = useAuthStore();
  const { makeBid, challenge, callExact } = useGame(gameState.roomCode);
  const [challengeResult, setChallengeResult] = useState<ChallengeResultData | null>(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);

  const currentBid = gameState.currentBid;
  const totalDice = gameState.totalDiceCount || 0;
  const myPlayerId = user?._id;
  const myDice = gameState.myDice || [];

  // Écouter les résultats de challenge
  useEffect(() => {
    const handleChallengeResolved = (data: any) => {
      console.log('🎲 Challenge resolved:', data);
      setChallengeResult({
        allDice: data.allDice,
        bidQuantity: data.bidQuantity,
        bidValue: data.bidValue,
        actualCount: data.actualCount,
        loserName: data.loserName,
        success: data.success
      });
      setShowChallengeModal(true);
    };

    const handleExactResolved = (data: any) => {
      console.log('🎯 Exact resolved:', data);
      setChallengeResult({
        allDice: data.allDice,
        bidQuantity: data.bidQuantity,
        bidValue: data.bidValue,
        actualCount: data.actualCount,
        loserName: data.loserName,
        success: data.success
      });
      setShowChallengeModal(true);
    };

    socketService.on('challenge_resolved', handleChallengeResolved);
    socketService.on('exact_resolved', handleExactResolved);

    return () => {
      socketService.off('challenge_resolved', handleChallengeResolved);
      socketService.off('exact_resolved', handleExactResolved);
    };
  }, []);

  // Calculer la quantité minimale pour une enchère valide
  const getMinQuantity = () => {
    if (!currentBid) return 1;
    return currentBid.quantity;
  };

  const getMinDieValue = (quantity: number) => {
    if (!currentBid) return 1;
    if (quantity > currentBid.quantity) return 1;
    if (quantity === currentBid.quantity) return currentBid.dieValue + 1;
    return 1;
  };

  const handleBid = (quantity: number, dieValue: number) => {
    console.log('🎲 [PerudoGame] handleBid:', {
      myPlayerId,
      currentTurn: gameState.currentTurn,
      isMyTurn,
      bid: { quantity, dieValue },
      currentBid,
      myDice: gameState.myDice
    });

    if (!isMyTurn) {
      toast.error('Ce n\'est pas votre tour!');
      return;
    }

    // Validation côté client
    if (currentBid) {
      if (quantity < currentBid.quantity) {
        toast.error('La quantité doit être égale ou supérieure à l\'enchère précédente');
        return;
      }
      if (quantity === currentBid.quantity && dieValue <= currentBid.dieValue) {
        toast.error('La valeur du dé doit être supérieure pour la même quantité');
        return;
      }
    }

    makeBid(quantity, dieValue);
  };

  const handleChallenge = () => {
    if (!isMyTurn) {
      toast.error('Ce n\'est pas votre tour!');
      return;
    }

    if (!gameState.currentBid) {
      toast.error('Aucune enchère à défier!');
      return;
    }

    challenge();
  };

  const handleExact = () => {
    if (!isMyTurn) {
      toast.error('Ce n\'est pas votre tour!');
      return;
    }

    if (!gameState.currentBid) {
      toast.error('Aucune enchère pour appeler exact!');
      return;
    }

    callExact();
  };

  // Préparer les données des joueurs pour le composant Player
  const players = gameState.players.map((p: any) => {
    const isCurrentPlayer = p.userId === gameState.currentTurn;
    const isMe = p.userId === myPlayerId;
    const diceCount = gameState.playerDiceCount?.[p.userId] || 0;

    return {
      id: p.userId,
      name: isMe ? `${p.username} (Vous)` : p.username,
      diceCount,
      diceValues: isMe ? myDice : [],
      isActive: isCurrentPlayer,
      isCurrentPlayer,
      showDice: isMe,
      isEliminated: p.status !== 'active'
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-white flex items-center gap-3">
              <DiceIcon className="w-8 h-8 text-amber-500" />
              Perudo
            </h1>
            <p className="text-gray-400">Jeu de dés de bluff - Les 1 sont des jokers!</p>
          </div>
          {gameState.roundNumber && (
            <div className="text-gray-400">
              Round {gameState.roundNumber}
            </div>
          )}
        </motion.div>
      </div>

      {/* Main Game Area */}
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        {/* Players Grid */}
        <div className="col-span-12 lg:col-span-9">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {players.map((player: any) => (
              <Player
                key={player.id}
                name={player.name}
                diceCount={player.diceCount}
                diceValues={player.diceValues}
                isActive={player.isActive}
                isCurrentPlayer={player.isCurrentPlayer}
                showDice={player.showDice}
                isEliminated={player.isEliminated}
              />
            ))}
          </div>

          {/* Current Bid Display */}
          {currentBid && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 border-2 border-purple-500 rounded-xl p-6 mb-6"
            >
              <h3 className="text-white mb-2">Pari actuel</h3>
              <div className="flex items-center gap-4">
                <div className="text-white">
                  <span className="text-purple-400">
                    {players.find((p: any) => p.id === currentBid.playerId)?.name || 'Joueur'}
                  </span>{' '}
                  parie qu'il y a au moins
                </div>
                <div className="bg-purple-700 px-4 py-2 rounded-lg text-white flex items-center gap-2">
                  <span>{currentBid.quantity}</span>
                  <span>×</span>
                  <DiceIcon className="w-5 h-5" />
                  <span>{currentBid.dieValue}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Control Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BidPanel
              onBid={handleBid}
              minQuantity={getMinQuantity()}
              currentBidFace={currentBid?.dieValue || null}
              disabled={!isMyTurn || gameState.status !== 'in_progress'}
              totalDice={totalDice}
            />

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border-2 border-gray-700 shadow-xl">
              <h3 className="text-white mb-4">Actions</h3>
              <div className="space-y-2">
                <Button
                  onClick={handleChallenge}
                  disabled={!currentBid || !isMyTurn || gameState.status !== 'in_progress'}
                  className="w-full bg-red-600 hover:bg-red-700"
                  size="lg"
                >
                  Dudo! (Je doute)
                </Button>
                <Button
                  onClick={handleExact}
                  disabled={!currentBid || !isMyTurn || gameState.status !== 'in_progress'}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  size="lg"
                >
                  Calza! (Exactement)
                </Button>
                <p className="text-xs text-gray-400 mt-2">
                  <strong>Dudo:</strong> Contester le pari précédent<br />
                  <strong>Calza:</strong> Affirmer que le pari est exact
                </p>
              </div>
            </div>
          </div>

          {/* Message d'attente */}
          {!isMyTurn && gameState.status === 'in_progress' && (
            <div className="mt-6 text-center p-4 bg-gray-800/60 border border-gray-700 rounded-lg">
              <p className="text-gray-400">
                En attente du tour de{' '}
                <span className="font-bold text-white">
                  {players.find((p: any) => p.id === gameState.currentTurn)?.name || '...'}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Sidebar - Règles */}
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4">
            <h4 className="text-white mb-2">Règles rapides</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Chaque joueur commence avec 5 dés</li>
              <li>• Les 1 sont des jokers (comptent comme n'importe quelle face)</li>
              <li>• À votre tour, pariez sur le nombre total de faces de dés</li>
              <li>• Le pari doit être supérieur au précédent (plus de dés ou une face plus haute)</li>
              <li>• Dites "Dudo" si vous pensez que le pari est faux</li>
              <li>• Le perdant du challenge perd un dé</li>
              <li>• Le dernier joueur avec des dés gagne!</li>
            </ul>
          </div>

          {/* Total de dés en jeu */}
          <div className="mt-4 text-center p-3 bg-gray-800/60 border border-gray-700 rounded-lg">
            <p className="text-gray-400">
              Total de dés en jeu: <span className="font-bold text-xl text-white">{totalDice}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Challenge Result Modal */}
      {challengeResult && (
        <ChallengeResultModal
          isOpen={showChallengeModal}
          onClose={() => setShowChallengeModal(false)}
          allDice={challengeResult.allDice}
          targetValue={challengeResult.bidValue}
          targetQuantity={challengeResult.bidQuantity}
          actualCount={challengeResult.actualCount}
          loserName={challengeResult.loserName}
          wasCorrect={challengeResult.success}
        />
      )}
    </div>
  );
}
