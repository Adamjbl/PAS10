import { Dice } from './Dice';
import { motion } from 'motion/react';
import { User } from 'lucide-react';

interface PlayerProps {
  name: string;
  diceCount: number;
  diceValues?: number[];
  isActive: boolean;
  isCurrentPlayer: boolean;
  showDice: boolean;
  isEliminated: boolean;
}

export function Player({ 
  name, 
  diceCount, 
  diceValues = [], 
  isActive, 
  isCurrentPlayer,
  showDice,
  isEliminated 
}: PlayerProps) {
  return (
    <motion.div
      className={`relative p-4 rounded-xl border-2 transition-all ${
        isEliminated 
          ? 'bg-gray-800/50 border-gray-700 opacity-50' 
          : isCurrentPlayer 
            ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-500 shadow-lg shadow-green-500/20' 
            : 'bg-gray-800/60 border-gray-700'
      }`}
      animate={isActive && !isEliminated ? {
        scale: [1, 1.02, 1],
        borderColor: ['#10b981', '#34d399', '#10b981'],
      } : {}}
      transition={{
        duration: 2,
        repeat: isActive && !isEliminated ? Infinity : 0,
      }}
    >
      {isCurrentPlayer && !isEliminated && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
          À jouer
        </div>
      )}
      
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-full ${isEliminated ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
          <User className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className={isEliminated ? 'text-gray-500' : 'text-white'}>{name}</h3>
          <p className="text-sm text-gray-400">{diceCount} {diceCount > 1 ? 'dés' : 'dé'}</p>
        </div>
      </div>

      {!isEliminated && (
        <div className="flex gap-2 flex-wrap">
          {showDice && diceValues.length > 0 ? (
            diceValues.map((value, index) => (
              <Dice key={index} value={value} size="sm" />
            ))
          ) : (
            Array.from({ length: diceCount }).map((_, index) => (
              <Dice key={index} value={1} size="sm" isHidden />
            ))
          )}
        </div>
      )}
    </motion.div>
  );
}
