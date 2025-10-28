import { useState, useEffect } from 'react';
import { Player } from './components/Player';
import { BidPanel } from './components/BidPanel';
import { GameHistory } from './components/GameHistory';
import { Button } from './components/ui/button';
import { Alert, AlertDescription } from './components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Dices as DiceIcon, Users, RotateCcw, Play } from 'lucide-react';
import { motion } from 'motion/react';

interface PlayerData {
  id: number;
  name: string;
  diceCount: number;
  diceValues: number[];
  isEliminated: boolean;
}

interface Bid {
  playerId: number;
  quantity: number;
  face: number;
}

interface HistoryEntry {
  player: string;
  action: string;
  quantity?: number;
  face?: number;
}

type GamePhase = 'setup' | 'rolling' | 'bidding' | 'reveal' | 'round-end';

export default function App() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('setup');
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentBid, setCurrentBid] = useState<Bid | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [message, setMessage] = useState('');
  const [showSetup, setShowSetup] = useState(true);
  const [playerCount, setPlayerCount] = useState(4);
  const [revealDice, setRevealDice] = useState(false);

  const rollDice = () => {
    return Math.floor(Math.random() * 6) + 1;
  };

  const initializePlayers = (count: number) => {
    const newPlayers: PlayerData[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      name: i === 0 ? 'Vous' : `Joueur ${i}`,
      diceCount: 5,
      diceValues: Array.from({ length: 5 }, () => rollDice()),
      isEliminated: false,
    }));
    setPlayers(newPlayers);
    setCurrentPlayerIndex(0);
    setGamePhase('bidding');
    setShowSetup(false);
    addHistory('Système', 'a lancé les dés');
  };

  const startNewRound = () => {
    setGamePhase('rolling');
    const newPlayers = players.map((p) => ({
      ...p,
      diceValues: Array.from({ length: p.diceCount }, () => rollDice()),
    }));
    setPlayers(newPlayers);
    setCurrentBid(null);
    setRevealDice(false);
    
    setTimeout(() => {
      setGamePhase('bidding');
      addHistory('Système', 'a lancé les dés pour un nouveau tour');
    }, 1000);
  };

  const addHistory = (player: string, action: string, quantity?: number, face?: number) => {
    setHistory((prev) => [...prev, { player, action, quantity, face }].slice(-20));
  };

  const handleBid = (quantity: number, face: number) => {
    const currentPlayer = players[currentPlayerIndex];
    setCurrentBid({ playerId: currentPlayerIndex, quantity, face });
    addHistory(currentPlayer.name, 'parie', quantity, face);
    setMessage(`${currentPlayer.name} parie qu'il y a au moins ${quantity} dés montrant ${face}`);
    
    // Move to next player
    let nextIndex = (currentPlayerIndex + 1) % players.length;
    while (players[nextIndex].isEliminated) {
      nextIndex = (nextIndex + 1) % players.length;
    }
    setCurrentPlayerIndex(nextIndex);
  };

  const handleDudo = () => {
    if (!currentBid) return;

    setGamePhase('reveal');
    setRevealDice(true);
    
    const bidder = players[currentBid.playerId];
    const challenger = players[currentPlayerIndex];
    
    // Count all dice matching the bid face (1s are wild)
    let totalCount = 0;
    players.forEach((p) => {
      if (!p.isEliminated) {
        p.diceValues.forEach((value) => {
          if (value === currentBid.face || value === 1) {
            totalCount++;
          }
        });
      }
    });

    addHistory(challenger.name, 'dit "Dudo!"');
    
    setTimeout(() => {
      let loser: PlayerData;
      if (totalCount >= currentBid.quantity) {
        // Bid was correct, challenger loses
        loser = challenger;
        setMessage(`Le pari était correct! Il y avait ${totalCount} dés. ${challenger.name} perd un dé!`);
      } else {
        // Bid was wrong, bidder loses
        loser = bidder;
        setMessage(`Le pari était faux! Il y avait seulement ${totalCount} dés. ${bidder.name} perd un dé!`);
      }

      const newPlayers = players.map((p) => {
        if (p.id === loser.id) {
          const newDiceCount = p.diceCount - 1;
          return {
            ...p,
            diceCount: newDiceCount,
            isEliminated: newDiceCount === 0,
          };
        }
        return p;
      });

      setPlayers(newPlayers);
      setGamePhase('round-end');

      // Check for winner
      const activePlayers = newPlayers.filter((p) => !p.isEliminated);
      if (activePlayers.length === 1) {
        setMessage(`🎉 ${activePlayers[0].name} remporte la partie!`);
      }
    }, 2000);
  };

  const handleCalza = () => {
    if (!currentBid) return;

    setGamePhase('reveal');
    setRevealDice(true);

    const currentPlayer = players[currentPlayerIndex];
    
    let totalCount = 0;
    players.forEach((p) => {
      if (!p.isEliminated) {
        p.diceValues.forEach((value) => {
          if (value === currentBid.face || value === 1) {
            totalCount++;
          }
        });
      }
    });

    addHistory(currentPlayer.name, 'dit "Calza!"');

    setTimeout(() => {
      if (totalCount === currentBid.quantity) {
        setMessage(`🎯 Exact! Il y avait précisément ${totalCount} dés. ${currentPlayer.name} gagne!`);
        // In a full implementation, player would gain a die if they lost one
      } else {
        setMessage(`❌ Raté! Il y avait ${totalCount} dés, pas ${currentBid.quantity}. ${currentPlayer.name} perd un dé!`);
        const newPlayers = players.map((p) => {
          if (p.id === currentPlayer.id) {
            const newDiceCount = p.diceCount - 1;
            return {
              ...p,
              diceCount: newDiceCount,
              isEliminated: newDiceCount === 0,
            };
          }
          return p;
        });
        setPlayers(newPlayers);
      }
      setGamePhase('round-end');
    }, 2000);
  };

  const activePlayers = players.filter((p) => !p.isEliminated);
  const gameOver = activePlayers.length === 1;

  const getMinBidQuantity = () => {
    if (!currentBid) return 1;
    return currentBid.quantity;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      {/* Setup Dialog */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <DiceIcon className="w-6 h-6 text-amber-500" />
              Bienvenue au Perudo
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Le Perudo est un jeu de dés de bluff. Les 1 sont des jokers!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="players" className="text-white">Nombre de joueurs (2-6)</Label>
              <Input
                id="players"
                type="number"
                min="2"
                max="6"
                value={playerCount}
                onChange={(e) => setPlayerCount(Math.max(2, Math.min(6, parseInt(e.target.value) || 2)))}
                className="bg-gray-700 border-gray-600 text-white mt-2"
              />
            </div>
            <Button
              onClick={() => initializePlayers(playerCount)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Commencer la partie
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSetup(true)}
              className="border-gray-600"
            >
              <Users className="w-4 h-4 mr-2" />
              Nouvelle partie
            </Button>
            {gamePhase === 'round-end' && !gameOver && (
              <Button
                onClick={startNewRound}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Nouveau tour
              </Button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Message */}
      {message && (
        <div className="max-w-7xl mx-auto mb-6">
          <Alert className="bg-blue-900/50 border-blue-700">
            <AlertDescription className="text-white">{message}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Game Area */}
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        {/* Players Grid */}
        <div className="col-span-12 lg:col-span-9">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {players.map((player, index) => (
              <Player
                key={player.id}
                name={player.name}
                diceCount={player.diceCount}
                diceValues={player.diceValues}
                isActive={index === currentPlayerIndex && gamePhase === 'bidding'}
                isCurrentPlayer={index === currentPlayerIndex}
                showDice={index === 0 || revealDice}
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
                  <span className="text-purple-400">{players[currentBid.playerId].name}</span> parie qu'il y a au moins
                </div>
                <div className="bg-purple-700 px-4 py-2 rounded-lg text-white flex items-center gap-2">
                  <span>{currentBid.quantity}</span>
                  <span>×</span>
                  <DiceIcon className="w-5 h-5" />
                  <span>{currentBid.face}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Control Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BidPanel
              onBid={handleBid}
              minQuantity={getMinBidQuantity()}
              currentBidFace={currentBid?.face || null}
              disabled={gamePhase !== 'bidding' || players[currentPlayerIndex].isEliminated}
            />

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border-2 border-gray-700 shadow-xl">
              <h3 className="text-white mb-4">Actions</h3>
              <div className="space-y-2">
                <Button
                  onClick={handleDudo}
                  disabled={!currentBid || gamePhase !== 'bidding'}
                  className="w-full bg-red-600 hover:bg-red-700"
                  size="lg"
                >
                  Dudo! (Je doute)
                </Button>
                <Button
                  onClick={handleCalza}
                  disabled={!currentBid || gamePhase !== 'bidding'}
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
        </div>

        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-3">
          <GameHistory history={history} />
        </div>
      </div>

      {/* Rules */}
      <div className="max-w-7xl mx-auto mt-8">
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
      </div>
    </div>
  );
}
