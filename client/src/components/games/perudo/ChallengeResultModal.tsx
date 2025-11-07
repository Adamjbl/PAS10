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

interface MatchingDie {
  playerId: string;
  diceIndex: number;
  value: number;
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
  const [shakingDiceIndex, setShakingDiceIndex] = useState<number>(-1);
  const [matchingDice, setMatchingDice] = useState<MatchingDie[]>([]);

  useEffect(() => {
    if (isOpen) {
      console.log('🎬 [ChallengeResultModal] Opening modal', {
        allDice: allDice.length,
        targetValue,
        targetQuantity
      });

      // Reset animation state
      setCountAnimation(0);
      setShowResult(false);
      setRevealedPlayers(new Set());
      setShakingDiceIndex(-1);

      // Calculer tous les dés qui correspondent
      const matches: MatchingDie[] = [];
      allDice.forEach((player) => {
        player.dice.forEach((value, diceIndex) => {
          if (value === targetValue || value === 1) {
            matches.push({
              playerId: player.playerId,
              diceIndex,
              value
            });
          }
        });
      });
      setMatchingDice(matches);

      console.log('🎯 [ChallengeResultModal] Matching dice:', matches.length);

      // Reveal dice one player at a time
      let revealCount = 0;
      const revealInterval = setInterval(() => {
        revealCount++;
        if (revealCount > allDice.length) {
          clearInterval(revealInterval);
          console.log('✅ [ChallengeResultModal] All dice revealed, starting shake animation');
          // Start counting animation after all dice are revealed
          setTimeout(() => {
            startShakeAnimation(matches);
          }, 500);
          return;
        }

        setRevealedPlayers((prev) => {
          const newSet = new Set(prev);
          if (revealCount <= allDice.length) {
            newSet.add(allDice[revealCount - 1].playerId);
          }
          return newSet;
        });
      }, 400);

      return () => {
        clearInterval(revealInterval);
      };
    }
  }, [isOpen, allDice, targetValue]);

  const startShakeAnimation = (matches: MatchingDie[]) => {
    console.log('🎯 [ChallengeResultModal] Starting shake animation for', matches.length, 'dice');

    if (matches.length === 0) {
      console.log('⚠️ [ChallengeResultModal] No matching dice, showing result immediately');
      setShowResult(true);
      return;
    }

    let currentIndex = 0;

    const shakeInterval = setInterval(() => {
      if (currentIndex >= matches.length) {
        console.log('✅ [ChallengeResultModal] Shake animation complete');
        clearInterval(shakeInterval);
        setShakingDiceIndex(-1);
        // Show result after all dice have shaken
        setTimeout(() => {
          setShowResult(true);
        }, 500);
        return;
      }

      console.log('🎲 [ChallengeResultModal] Shaking die', currentIndex + 1, 'of', matches.length);
      setShakingDiceIndex(currentIndex);
      setCountAnimation(currentIndex + 1);
      currentIndex++;
    }, 600); // Chaque dé shake pendant 600ms
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
            {allDice.map((player) => (
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

                      // Trouver l'index global de ce dé dans matchingDice
                      const globalMatchIndex = matchingDice.findIndex(
                        m => m.playerId === player.playerId && m.diceIndex === diceIndex
                      );

                      const isCurrentlyShaking = globalMatchIndex === shakingDiceIndex;
                      const hasShaken = globalMatchIndex !== -1 && globalMatchIndex < shakingDiceIndex;

                      return (
                        <motion.div
                          key={diceIndex}
                          initial={{ rotateY: 180, scale: 0 }}
                          animate={
                            isCurrentlyShaking
                              ? {
                                  rotateY: [180, 0],
                                  scale: [1, 1.3, 1.2, 1.3, 1.2],
                                  rotate: [0, -20, 20, -15, 15, -10, 10, 0],
                                  y: [0, -20, 0, -20, 0],
                                  transition: {
                                    duration: 0.8,
                                    ease: "easeInOut",
                                    times: [0, 0.2, 0.4, 0.6, 0.8, 1]
                                  }
                                }
                              : hasShaken
                              ? {
                                  rotateY: 0,
                                  scale: 1.2,
                                  rotate: 0,
                                  y: 0
                                }
                              : {
                                  rotateY: 0,
                                  scale: 1,
                                  rotate: 0,
                                  y: 0
                                }
                          }
                          transition={
                            isCurrentlyShaking
                              ? { delay: diceIndex * 0.05 }
                              : { delay: diceIndex * 0.1, duration: 0.5 }
                          }
                          className={
                            matches
                              ? hasShaken || isCurrentlyShaking
                                ? 'ring-4 ring-yellow-400 rounded-lg shadow-lg shadow-yellow-400/50'
                                : 'ring-2 ring-yellow-400/50 rounded-lg'
                              : ''
                          }
                          style={{
                            display: 'inline-block'
                          }}
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
              className="text-center mb-6 bg-gray-800/60 border-2 border-amber-500/50 rounded-xl p-6"
            >
              <p className="text-gray-400 text-xl mb-2">Nombre total de dés correspondants:</p>
              <motion.div
                key={countAnimation}
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.3 }}
                className="text-7xl font-bold text-amber-500"
              >
                {countAnimation}
              </motion.div>
              <p className="text-gray-500 text-sm mt-2">
                (incluant les jokers: 1)
              </p>
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
