import { motion } from 'framer-motion';
import { Crown, Target } from 'lucide-react';

type WireType = 'safe' | 'bomb' | 'defuse';

interface Wire {
  playerId: string;
  wireIndex: number;
  revealed: boolean;
  type?: WireType;
}

interface PlayerCardCircleProps {
  player: {
    id: string;
    name: string;
    isHost: boolean;
    isAlive: boolean;
    wiresRemaining: number;
    wires: Wire[];
  };
  position: { x: number; y: number };
  rotation: number;
  isCurrentTurn: boolean;
  isCurrentPlayer: boolean;
  onCardClick: (wireIndex: number) => void;
  canInteract: boolean;
}

export function PlayerCardCircle({
  player,
  position,
  isCurrentTurn,
  isCurrentPlayer,
  onCardClick,
  canInteract
}: PlayerCardCircleProps) {
  const getCardColor = (wire: Wire) => {
    if (!wire.revealed) {
      return 'from-slate-700 to-slate-800';
    }
    switch (wire.type) {
      case 'defuse':
        return 'from-blue-600 to-blue-800';
      case 'bomb':
        return 'from-red-600 to-red-800';
      case 'safe':
        return 'from-green-600 to-green-800';
      default:
        return 'from-slate-700 to-slate-800';
    }
  };

  const getCardIcon = (wire: Wire) => {
    if (!wire.revealed) return '?';
    switch (wire.type) {
      case 'defuse':
        return '✓';
      case 'bomb':
        return '💣';
      case 'safe':
        return '✓';
      default:
        return '?';
    }
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)'
      }}
      className="flex flex-col items-center gap-2"
    >
      {/* Player Name */}
      <div className="bg-slate-800/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-700">
        <div className="text-white text-xs whitespace-nowrap flex items-center gap-1">
          {player.name}
          {player.isHost && <Crown className="w-3 h-3 text-yellow-500" />}
        </div>
      </div>

      {/* Player Avatar & Info */}
      <div className="relative">
        <motion.div
          animate={isCurrentTurn ? {
            boxShadow: [
              '0 0 0 0 rgba(168, 85, 247, 0.7)',
              '0 0 0 12px rgba(168, 85, 247, 0)',
              '0 0 0 0 rgba(168, 85, 247, 0)'
            ]
          } : {}}
          transition={{ repeat: isCurrentTurn ? Infinity : 0, duration: 2 }}
          className={`
            relative w-12 h-12 rounded-full flex items-center justify-center text-white text-sm
            ${player.isAlive
              ? 'bg-gradient-to-br from-purple-500 to-blue-500'
              : 'bg-gradient-to-br from-slate-600 to-slate-700 opacity-50'
            }
            ${isCurrentTurn ? 'ring-3 ring-purple-500' : ''}
            ${isCurrentPlayer ? 'ring-3 ring-yellow-500' : ''}
            border-2 border-slate-800
          `}
        >
          {player.name.charAt(0).toUpperCase()}

          {isCurrentTurn && player.isAlive && (
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap border border-slate-800 flex items-center gap-0.5">
              <Target className="w-2.5 h-2.5" />
              Tour
            </div>
          )}
        </motion.div>
      </div>

      {/* Cards in horizontal layout */}
      <div className="flex gap-1.5">
        {player.wires.map((wire, index) => {
          return (
            <motion.div
              key={`${wire.playerId}-${wire.wireIndex}`}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={canInteract && !wire.revealed ? {
                y: -8,
                scale: 1.05
              } : {}}
              onClick={() => canInteract && !wire.revealed && onCardClick(wire.wireIndex)}
              className={`
                ${canInteract && !wire.revealed ? 'cursor-pointer' : ''}
                transition-all duration-200
              `}
            >
              <div
                className={`
                  bg-gradient-to-br ${getCardColor(wire)}
                  w-11 h-14 rounded-md flex items-center justify-center text-sm
                  border-2 ${wire.revealed ? (
                    wire.type === 'bomb' ? 'border-red-400' :
                    wire.type === 'defuse' ? 'border-blue-400' :
                    'border-green-400'
                  ) : 'border-slate-600'}
                  shadow-lg
                  ${canInteract && !wire.revealed && isCurrentTurn ? 'shadow-purple-500/50 ring-2 ring-purple-500/50' : ''}
                `}
              >
                <span className={`${wire.revealed ? 'text-white' : 'text-slate-500'}`}>
                  {getCardIcon(wire)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
