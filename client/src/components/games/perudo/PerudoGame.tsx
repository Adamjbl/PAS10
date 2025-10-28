import { useState, useEffect } from 'react';
import { useGame } from '../../../hooks/useGame';
import { useAuthStore } from '../../../stores/authStore';
import toast from 'react-hot-toast';

interface PerudoGameProps {
  gameState: any;
  isMyTurn: boolean;
}

export default function PerudoGame({ gameState, isMyTurn }: PerudoGameProps) {
  const { user } = useAuthStore();
  const { makeBid, challenge, callExact } = useGame(gameState.roomCode);

  const currentBid = gameState.currentBid;
  const totalDice = gameState.totalDiceCount || 0;

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

  const [bidQuantity, setBidQuantity] = useState(getMinQuantity());
  const [bidDieValue, setBidDieValue] = useState(2);

  // Mettre à jour les valeurs minimales quand l'enchère change
  useEffect(() => {
    const minQty = getMinQuantity();
    const minDie = getMinDieValue(bidQuantity);

    if (bidQuantity < minQty) {
      setBidQuantity(minQty);
    }
    if (bidDieValue < minDie) {
      setBidDieValue(Math.max(minDie, 2));
    }
  }, [currentBid]);

  const handleBid = () => {
    console.log('🎲 [PerudoGame] handleBid:', {
      myPlayerId,
      currentTurn: gameState.currentTurn,
      isMyTurn,
      bid: { quantity: bidQuantity, dieValue: bidDieValue },
      currentBid,
      myDice: gameState.myDice
    });

    if (!isMyTurn) {
      toast.error('Ce n\'est pas votre tour!');
      return;
    }

    // Validation côté client
    if (currentBid) {
      if (bidQuantity < currentBid.quantity) {
        toast.error('La quantité doit être égale ou supérieure à l\'enchère précédente');
        return;
      }
      if (bidQuantity === currentBid.quantity && bidDieValue <= currentBid.dieValue) {
        toast.error('La valeur du dé doit être supérieure pour la même quantité');
        return;
      }
    }

    makeBid(bidQuantity, bidDieValue);
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

  const myPlayerId = user?._id;
  const myDice = gameState.myDice || [];

  // Fonction pour afficher un dé
  const renderDie = (value: number, index: number) => {
    const diceEmoji = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return (
      <div
        key={index}
        className="w-14 h-14 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center text-3xl shadow-md"
      >
        {diceEmoji[value - 1] || '🎲'}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Zone principale du jeu */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">🎲 Perudo</h2>
          {gameState.roundNumber && (
            <span className="text-lg text-gray-600">Round {gameState.roundNumber}</span>
          )}
        </div>

        {/* Enchère actuelle */}
        {gameState.currentBid && (
          <div className="bg-blue-100 border-2 border-blue-400 rounded-lg p-4 mb-6">
            <p className="text-center text-lg">
              <span className="font-bold">Enchère actuelle:</span>{' '}
              <span className="text-2xl font-bold text-blue-800">
                {gameState.currentBid.quantity} × 🎲{gameState.currentBid.dieValue}
              </span>
            </p>
          </div>
        )}

        {/* Mes dés */}
        {myDice.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Vos dés:</h3>
            <div className="flex gap-2 justify-center flex-wrap">
              {myDice.map((die: number, index: number) => renderDie(die, index))}
            </div>
          </div>
        )}

        {/* Nombre de dés par joueur */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Dés restants:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(gameState.playerDiceCount || {}).map(([playerId, count]) => {
              const player = gameState.players.find((p: any) => p.userId === playerId);
              if (!player) return null;

              return (
                <div
                  key={playerId}
                  className={`p-3 rounded-lg border-2 ${
                    player.status === 'active'
                      ? 'bg-white border-gray-200'
                      : 'bg-gray-100 border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${
                      player.status !== 'active' ? 'text-gray-400' : ''
                    }`}>
                      {player.username}
                      {playerId === myPlayerId && ' (Vous)'}
                    </span>
                    <span className="font-bold text-lg">{count as number} 🎲</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total de dés en jeu */}
        <div className="text-center mb-6 p-3 bg-gray-100 rounded-lg">
          <p className="text-gray-600">
            Total de dés en jeu: <span className="font-bold text-xl">{gameState.totalDiceCount || 0}</span>
          </p>
        </div>

        {/* Actions */}
        {isMyTurn && gameState.status === 'in_progress' && (
          <div className="space-y-4">
            {/* Faire une enchère */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">Faire une enchère:</h4>
              <div className="flex gap-3 items-center justify-center flex-wrap">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Quantité</label>
                  <input
                    type="number"
                    min={getMinQuantity()}
                    max={totalDice}
                    value={bidQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || getMinQuantity();
                      const minQty = getMinQuantity();
                      setBidQuantity(Math.max(minQty, Math.min(totalDice, val)));
                    }}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center text-lg font-bold"
                  />
                  <p className="text-xs text-gray-500 mt-1">Min: {getMinQuantity()}</p>
                </div>
                <span className="text-2xl mt-6">×</span>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Valeur du dé</label>
                  <select
                    value={bidDieValue}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      const minDie = getMinDieValue(bidQuantity);
                      if (val >= minDie) {
                        setBidDieValue(val);
                      }
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-lg font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6].map(val => {
                      const minDie = getMinDieValue(bidQuantity);
                      const isDisabled = val < minDie;
                      return (
                        <option key={val} value={val} disabled={isDisabled}>
                          {val === 1 ? '1 (Paco)' : val} {isDisabled ? '✗' : ''}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {bidQuantity === currentBid?.quantity ? `Min: ${getMinDieValue(bidQuantity)}` : 'Toutes valeurs'}
                  </p>
                </div>
                <button
                  onClick={handleBid}
                  className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Enchérir
                </button>
              </div>
            </div>

            {/* Actions spéciales */}
            {gameState.currentBid && (
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleChallenge}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-lg"
                >
                  🚫 Défier (Dudo)
                </button>
                <button
                  onClick={handleExact}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg"
                >
                  🎯 Exact (Calza)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Message d'attente */}
        {!isMyTurn && gameState.status === 'in_progress' && (
          <div className="text-center p-4 bg-gray-100 rounded-lg">
            <p className="text-gray-600">
              En attente du tour de{' '}
              <span className="font-bold">
                {gameState.players.find((p: any) => p.userId === gameState.currentTurn)?.username || '...'}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Règles rapides */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-bold mb-2">📖 Règles rapides</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Les Pacos (1) sont des jokers qui comptent pour n'importe quelle valeur</li>
          <li>• Chaque enchère doit être supérieure à la précédente</li>
          <li>• Défier (Dudo): Vous pensez que l'enchère est trop haute</li>
          <li>• Exact (Calza): Vous pensez que l'enchère est exacte</li>
          <li>• Le perdant d'un défi ou d'un exact perd un dé</li>
          <li>• Le dernier joueur avec des dés gagne!</li>
        </ul>
      </div>
    </div>
  );
}