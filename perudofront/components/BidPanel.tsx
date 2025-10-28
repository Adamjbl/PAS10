import { Button } from './ui/button';
import { useState } from 'react';
import { Dices as DiceIcon } from 'lucide-react';

interface BidPanelProps {
  onBid: (quantity: number, face: number) => void;
  minQuantity: number;
  currentBidFace: number | null;
  disabled: boolean;
}

export function BidPanel({ onBid, minQuantity, currentBidFace, disabled }: BidPanelProps) {
  const [quantity, setQuantity] = useState(minQuantity);
  const [face, setFace] = useState(currentBidFace || 2);

  const handleBid = () => {
    onBid(quantity, face);
  };

  const canBid = () => {
    if (currentBidFace === null) return true;
    
    if (quantity > minQuantity) return true;
    if (quantity === minQuantity && face > currentBidFace) return true;
    
    return false;
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border-2 border-gray-700 shadow-xl">
      <h3 className="text-white mb-4">Faire un pari</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Quantité</label>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setQuantity(Math.max(minQuantity, quantity - 1))}
              disabled={disabled || quantity <= minQuantity}
            >
              -
            </Button>
            <div className="flex-1 text-center bg-gray-700 py-2 rounded text-white">
              {quantity}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setQuantity(quantity + 1)}
              disabled={disabled}
            >
              +
            </Button>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-2 block">Face du dé</label>
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3, 4, 5, 6].map((f) => (
              <Button
                key={f}
                size="sm"
                variant={face === f ? 'default' : 'outline'}
                onClick={() => setFace(f)}
                disabled={disabled}
                className={face === f ? (f === 1 ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700') : ''}
              >
                <DiceIcon className="w-4 h-4 mr-1" />
                {f}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Button
        className="w-full bg-green-600 hover:bg-green-700"
        onClick={handleBid}
        disabled={disabled || !canBid()}
      >
        Parier
      </Button>

      {currentBidFace !== null && (
        <p className="text-xs text-gray-400 mt-2 text-center">
          Pari minimum: {minQuantity} × {currentBidFace + 1} ou plus de dés
        </p>
      )}
    </div>
  );
}
