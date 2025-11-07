import { useState } from 'react';
import { PlayerCardCircle } from './PlayerCardCircle';
import { ChatPanel } from './ChatPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { Bomb, Trophy, MessageCircle, X } from 'lucide-react';

type WireType = 'safe' | 'bomb' | 'defuse';

interface Wire {
  playerId: string;
  wireIndex: number;
  revealed: boolean;
  type?: WireType;
}

interface GamePlayer {
  userId: string;
  username: string;
  status: string;
  isAlive: boolean;
  wiresRemaining: number;
  wires: Wire[];
}

interface GameBoardProps {
  players: GamePlayer[];
  currentPlayerId: string;
  currentTurnPlayerId: string;
  defuseCount: number;
  bombCount: number;
  onCutWire: (playerId: string, wireIndex: number) => void;
  gameOver?: boolean;
  winner?: 'blue' | 'red';
  roomCode: string;
}

export function GameBoard({
  players,
  currentPlayerId,
  currentTurnPlayerId,
  defuseCount,
  bombCount,
  onCutWire,
  gameOver,
  winner,
  roomCode
}: GameBoardProps) {
  const [chatOpen, setChatOpen] = useState(false);

  // Calculate positions for players in a circle
  const getPlayerPosition = (index: number, total: number) => {
    // Adjust starting angle to put first player at bottom
    const angle = (index / total) * 2 * Math.PI + Math.PI / 2; // Start from bottom
    const radiusX = 32; // Horizontal radius
    const radiusY = 28; // Vertical radius (ellipse for better fit)
    const centerX = 50;
    const centerY = 50;

    return {
      x: centerX + radiusX * Math.cos(angle),
      y: centerY + radiusY * Math.sin(angle),
      rotation: (angle * 180 / Math.PI) + 90
    };
  };

  return (
    <div className="h-[calc(100vh-200px)] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-xl p-4 overflow-hidden">
      <div className="max-w-[1800px] mx-auto h-full flex flex-col gap-4">
        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-4 shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/20 rounded-xl backdrop-blur-sm border border-red-500/30">
                <Bomb className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-white text-2xl">TIMEBOMB</h1>
                <p className="text-slate-400 text-sm">
                  {gameOver
                    ? (winner === 'blue' ? 'Bombe désamorcée !' : 'La bombe a explosé !')
                    : `Salon ${roomCode}`
                  }
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg px-4 py-2">
                <div className="text-blue-400 text-xs">Désamorçages</div>
                <div className="text-white text-2xl">{defuseCount}/4</div>
              </div>
              <div className="bg-red-600/20 border border-red-500/30 rounded-lg px-4 py-2">
                <div className="text-red-400 text-xs">Bombes</div>
                <div className="text-white text-2xl">{bombCount}/1</div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Over Modal */}
        {gameOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <div className={`
              bg-gradient-to-br ${winner === 'blue' ? 'from-blue-600 to-blue-800' : 'from-red-600 to-red-800'}
              rounded-2xl border-2 ${winner === 'blue' ? 'border-blue-400' : 'border-red-400'}
              p-8 space-y-6 text-center max-w-md shadow-2xl
            `}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <Trophy className="w-20 h-20 text-white mx-auto" />
              </motion.div>
              <div className="space-y-2">
                <h2 className="text-white text-4xl">
                  {winner === 'blue' ? 'Victoire !' : 'Défaite !'}
                </h2>
                <p className="text-white/90 text-xl">
                  {winner === 'blue'
                    ? "L'équipe de Sherlock a désamorcé la bombe !"
                    : "L'équipe de Moriarty a fait exploser la bombe !"
                  }
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Game Area */}
        <div className="flex-1 relative overflow-hidden min-h-0">
          {/* Circle Game Area */}
          <div className="absolute inset-0 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700 p-8">
            {/* Center decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-full border-4 border-slate-700/50 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
              <Bomb className="w-16 h-16 text-purple-400/70" />
              <div className="text-slate-400 text-sm">TIMEBOMB</div>
            </div>

            {/* Players in circle */}
            {players.map((player, index) => {
              const position = getPlayerPosition(index, players.length);
              const isHost = index === 0; // Assumons que le premier joueur est l'hôte
              return (
                <PlayerCardCircle
                  key={player.userId}
                  player={{
                    id: player.userId,
                    name: player.username,
                    isHost,
                    isAlive: player.isAlive,
                    wiresRemaining: player.wiresRemaining,
                    wires: player.wires
                  }}
                  position={position}
                  rotation={position.rotation}
                  isCurrentTurn={currentTurnPlayerId === player.userId}
                  isCurrentPlayer={currentPlayerId === player.userId}
                  onCardClick={(wireIndex) => onCutWire(player.userId, wireIndex)}
                  canInteract={currentTurnPlayerId === currentPlayerId && player.userId === currentPlayerId && !gameOver}
                />
              );
            })}

            {/* Circle border decoration */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.15 }}>
              <ellipse
                cx="50%"
                cy="50%"
                rx="32%"
                ry="28%"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="10 5"
                className="text-purple-500"
              />
            </svg>
          </div>

          {/* Chat Toggle Button */}
          {!chatOpen && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => setChatOpen(true)}
              className="absolute bottom-6 right-6 w-14 h-14 bg-purple-600 hover:bg-purple-700 rounded-full shadow-lg flex items-center justify-center z-10 border-2 border-purple-400"
            >
              <MessageCircle className="w-6 h-6 text-white" />
            </motion.button>
          )}

          {/* Chat Panel Overlay */}
          <AnimatePresence>
            {chatOpen && (
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute right-0 top-0 bottom-0 w-80 z-20"
              >
                <div className="h-full relative">
                  <button
                    onClick={() => setChatOpen(false)}
                    className="absolute -left-12 top-4 w-10 h-10 bg-slate-800/90 hover:bg-slate-700 text-white rounded-full shadow-lg z-10 border border-slate-600 flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <ChatPanel roomCode={roomCode} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
