import { Crown, User, Heart, Skull } from "lucide-react";
import { motion } from "motion/react";

interface GamePlayer {
  id: string;
  name: string;
  isHost: boolean;
  isAlive: boolean;
  wiresRemaining: number;
}

interface PlayersListProps {
  players: GamePlayer[];
  currentTurnPlayerId?: string;
}

export function PlayersList({ players, currentTurnPlayerId }: PlayersListProps) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-4 space-y-3">
      <h3 className="text-white flex items-center gap-2">
        <User className="w-5 h-5 text-purple-400" />
        Joueurs
      </h3>
      
      <div className="space-y-2">
        {players.map((player) => (
          <motion.div
            key={player.id}
            className={`
              ${currentTurnPlayerId === player.id ? "bg-purple-600/30 border-purple-500" : "bg-slate-700/50 border-slate-600"}
              ${!player.isAlive ? "opacity-50" : ""}
              border rounded-lg p-3 transition-all duration-300
            `}
            animate={currentTurnPlayerId === player.id ? {
              boxShadow: ["0 0 0 0 rgba(168, 85, 247, 0.4)", "0 0 0 8px rgba(168, 85, 247, 0)", "0 0 0 0 rgba(168, 85, 247, 0)"]
            } : {}}
            transition={{ repeat: currentTurnPlayerId === player.id ? Infinity : 0, duration: 2 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-white
                  ${player.isAlive 
                    ? "bg-gradient-to-br from-purple-500 to-blue-500" 
                    : "bg-gradient-to-br from-slate-600 to-slate-700"
                  }
                `}>
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white">{player.name}</span>
                    {player.isHost && <Crown className="w-4 h-4 text-yellow-500" />}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    {player.isAlive ? (
                      <>
                        <Heart className="w-3 h-3" />
                        {player.wiresRemaining} câbles
                      </>
                    ) : (
                      <>
                        <Skull className="w-3 h-3" />
                        Éliminé
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {currentTurnPlayerId === player.id && player.isAlive && (
                <div className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30">
                  À jouer
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
