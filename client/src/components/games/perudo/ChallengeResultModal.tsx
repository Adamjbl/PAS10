import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dice } from './Dice';

interface ChallengeResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  allDice: { playerId: string; playerName: string; dice: number[] }[];
  targetValue: number;
  targetQuantity: number;
  actualCount: number;
  loserName: string;
  wasCorrect: boolean;
}

export function ChallengeResultModal({
  isOpen,
  onClose,
  allDice,
  targetValue,
  targetQuantity,
  actualCount,
  loserName,
  wasCorrect,
}: ChallengeResultModalProps) {
  const [countAnimation, setCountAnimation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [revealedPlayers, setRevealedPlayers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      // Reset animation state
      setCountAnimation(0);
      setShowResult(false);
      setRevealedPlayers(new Set());

      // Reveal dice one player at a time
      const revealInterval = setInterval(() => {
        setRevealedPlayers((prev) => {
          if (prev.size >= allDice.length) {
            clearInterval(revealInterval);
            // Start counting animation after all dice are revealed
            setTimeout(() => {
              animateCount();
            }, 500);
            return prev;
          }
          const newSet = new Set(prev);
          newSet.add(allDice[prev.size].playerId);
          return newSet;
        });
      }, 300);

      return () => {
        clearInterval(revealInterval);
      };
    }
  }, [isOpen, allDice]);

  const animateCount = () => {
    let current = 0;
    const increment = actualCount / 30; // 30 frames pour atteindre le compte final

    const interval = setInterval(() => {
      current += increment;
      if (current >= actualCount) {
        setCountAnimation(actualCount);
        clearInterval(interval);
        // Show result after counting
        setTimeout(() => {
          setShowResult(true);
        }, 500);
      } else {
        setCountAnimation(Math.floor(current));
      }
    }, 30);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={showResult ? onClose : undefined}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border-2 border-gray-700 shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-3xl font-bold text-white text-center mb-6">
            🎲 Révélation des dés
          </h2>

          {/* Target info */}
          <div className="text-center mb-6">
            <p className="text-gray-400 text-lg">
              Pari: <span className="font-bold text-white">{targetQuantity} × {targetValue}</span>
              {targetValue === 1 && <span className="text-amber-500"> (Pacos)</span>}
            </p>
          </div>

          {/* All players' dice */}
          <div className="space-y-4 mb-6">
            {allDice.map((player, index) => (
              <motion.div
                key={player.playerId}
                initial={{ x: -50, opacity: 0 }}
                animate={revealedPlayers.has(player.playerId) ? { x: 0, opacity: 1 } : {}}
                transition={{ duration: 0.3 }}
                className="bg-gray-900/50 border border-gray-700 rounded-lg p-4"
              >
                <h3 className="text-white font-bold mb-3">{player.playerName}</h3>
                <div className="flex gap-2 flex-wrap">
                  {revealedPlayers.has(player.playerId) ? (
                    player.dice.map((value, diceIndex) => {
                      const matches = value === targetValue || value === 1;
                      return (
                        <motion.div
                          key={diceIndex}
                          initial={{ rotateY: 180, scale: 0 }}
                          animate={{ rotateY: 0, scale: 1 }}
                          transition={{ delay: diceIndex * 0.1, duration: 0.5 }}
                          className={matches ? 'ring-2 ring-yellow-400 rounded-lg' : ''}
                        >
                          <Dice value={value} size="md" />
                        </motion.div>
                      );
                    })
                  ) : (
                    player.dice.map((_, diceIndex) => (
                      <Dice key={diceIndex} value={1} size="md" isHidden />
                    ))
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Count animation */}
          {revealedPlayers.size === allDice.length && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center mb-6"
            >
              <p className="text-gray-400 text-xl mb-2">Nombre de dés correspondants:</p>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-6xl font-bold text-amber-500"
              >
                {countAnimation}
              </motion.div>
            </motion.div>
          )}

          {/* Result */}
          {showResult && (
            <motion.div
              initial={{ scale: 0, rotateZ: -10 }}
              animate={{ scale: 1, rotateZ: 0 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className={`text-center p-8 rounded-2xl border-4 ${
                wasCorrect
                  ? 'bg-green-900/40 border-green-500'
                  : 'bg-red-900/40 border-red-500'
              }`}
            >
              <p className="text-2xl text-white mb-4">
                {wasCorrect ? (
                  <>
                    ✅ Le pari était <span className="font-bold text-green-400">correct</span>!
                  </>
                ) : (
                  <>
                    ❌ Le pari était <span className="font-bold text-red-400">faux</span>!
                  </>
                )}
              </p>
              <p className="text-xl text-gray-300 mb-4">
                Il y avait <span className="font-bold text-amber-400">{actualCount}</span> dés
                {actualCount !== targetQuantity && (
                  <span className="text-gray-500"> (pas {targetQuantity})</span>
                )}
              </p>
              <motion.p
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-3xl font-bold text-white"
              >
                🎯 <span className={wasCorrect ? 'text-green-400' : 'text-red-400'}>{loserName}</span> perd un dé!
              </motion.p>

              <button
                onClick={onClose}
                className="mt-6 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
              >
                Continuer
              </button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
