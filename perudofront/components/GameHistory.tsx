import { ScrollArea } from './ui/scroll-area';
import { Dices as DiceIcon } from 'lucide-react';

interface HistoryEntry {
  player: string;
  action: string;
  quantity?: number;
  face?: number;
}

interface GameHistoryProps {
  history: HistoryEntry[];
}

export function GameHistory({ history }: GameHistoryProps) {
  return (
    <div className="bg-gray-800/60 rounded-xl border-2 border-gray-700 p-4 h-full">
      <h3 className="text-white mb-3">Historique</h3>
      <ScrollArea className="h-[calc(100%-3rem)]">
        <div className="space-y-2">
          {history.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucune action pour le moment</p>
          ) : (
            history.map((entry, index) => (
              <div
                key={index}
                className="bg-gray-900/50 p-2 rounded text-sm border border-gray-700"
              >
                <span className="text-blue-400">{entry.player}</span>
                <span className="text-gray-400"> {entry.action}</span>
                {entry.quantity && entry.face && (
                  <span className="text-white">
                    {' '}{entry.quantity} × <DiceIcon className="w-3 h-3 inline" /> {entry.face}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
