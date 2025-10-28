import { motion } from 'motion/react';

interface DiceProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  isRolling?: boolean;
  isHidden?: boolean;
}

export function Dice({ value, size = 'md', isRolling = false, isHidden = false }: DiceProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const renderDots = () => {
    const dotClass = `${dotSizes[size]} bg-white rounded-full`;
    
    const patterns: { [key: number]: JSX.Element } = {
      1: (
        <div className="flex items-center justify-center w-full h-full">
          <div className={dotClass} />
        </div>
      ),
      2: (
        <div className="flex justify-between items-center w-full h-full p-1.5">
          <div className={dotClass} />
          <div className={dotClass} />
        </div>
      ),
      3: (
        <div className="flex justify-between items-center w-full h-full p-1.5">
          <div className={dotClass} />
          <div className={`${dotClass} mx-auto`} />
          <div className={dotClass} />
        </div>
      ),
      4: (
        <div className="grid grid-cols-2 gap-1 w-full h-full p-1.5">
          <div className={dotClass} />
          <div className={dotClass} />
          <div className={dotClass} />
          <div className={dotClass} />
        </div>
      ),
      5: (
        <div className="relative w-full h-full p-1.5">
          <div className="grid grid-cols-2 gap-1 w-full h-full">
            <div className={dotClass} />
            <div className={dotClass} />
            <div className={`${dotClass} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`} />
            <div className={dotClass} />
            <div className={dotClass} />
          </div>
        </div>
      ),
      6: (
        <div className="grid grid-cols-2 gap-1 w-full h-full p-1.5">
          <div className="flex flex-col justify-between">
            <div className={dotClass} />
            <div className={dotClass} />
            <div className={dotClass} />
          </div>
          <div className="flex flex-col justify-between">
            <div className={dotClass} />
            <div className={dotClass} />
            <div className={dotClass} />
          </div>
        </div>
      ),
    };

    return patterns[value] || patterns[1];
  };

  if (isHidden) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-700 rounded-lg flex items-center justify-center border-2 border-gray-600`}>
        <div className="text-gray-500">?</div>
      </div>
    );
  }

  return (
    <motion.div
      className={`${sizeClasses[size]} rounded-lg flex items-center justify-center shadow-lg ${
        value === 1 ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-red-600 to-red-700'
      } border-2 ${value === 1 ? 'border-amber-400' : 'border-red-500'}`}
      animate={isRolling ? {
        rotateX: [0, 360, 720],
        rotateY: [0, 360, 720],
        scale: [1, 1.1, 1],
      } : {}}
      transition={{
        duration: 0.6,
        ease: "easeInOut"
      }}
    >
      {renderDots()}
    </motion.div>
  );
}
