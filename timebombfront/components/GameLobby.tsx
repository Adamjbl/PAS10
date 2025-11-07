import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Users, Plus, LogIn, Crown } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface Player {
  id: string;
  name: string;
  isHost: boolean;
}

interface GameLobbyProps {
  onStartGame: () => void;
  players: Player[];
  currentPlayer: Player;
  roomCode: string;
}

export function GameLobby({ onStartGame, players, currentPlayer, roomCode }: GameLobbyProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8">
        {/* Left Panel - Game Info */}
        <div className="flex flex-col justify-center space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/20 rounded-xl backdrop-blur-sm border border-red-500/30">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-white text-5xl">TIMEBOMB</h1>
                <p className="text-purple-300">Désamorcez ou explosez</p>
              </div>
            </div>
            
            <p className="text-slate-300 text-lg">
              Un jeu de déduction et de bluff où vous devez identifier les espions ennemis avant qu'il ne soit trop tard !
            </p>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 space-y-4">
              <h3 className="text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Comment jouer
              </h3>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span><strong className="text-blue-400">Sherlock</strong> doit désamorcer la bombe en coupant 4 câbles bleus</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span><strong className="text-red-400">Moriarty</strong> essaie de faire exploser la bombe en révélant 1 câble rouge</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Les câbles verts sont sûrs et ne font rien</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Panel - Lobby */}
        <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700 p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-white text-2xl">Salon de jeu</h2>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Code du salon:</span>
              <code className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded border border-purple-500/30">
                {roomCode}
              </code>
            </div>
          </div>

          {/* Players List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Joueurs ({players.length}/8)
              </h3>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-between border border-slate-600/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white">{player.name}</span>
                  </div>
                  {player.isHost && (
                    <Crown className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {currentPlayer.isHost ? (
              <Button
                onClick={onStartGame}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                disabled={players.length < 4}
              >
                Commencer la partie
              </Button>
            ) : (
              <div className="text-center text-slate-400 p-4 bg-slate-700/30 rounded-lg">
                En attente de l'hôte...
              </div>
            )}
            
            {players.length < 4 && (
              <p className="text-sm text-slate-400 text-center">
                Minimum 4 joueurs requis
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
