import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../../hooks/useGame';
import { useAuthStore } from '../../stores/authStore';
import PerudoGame from './perudo/PerudoGame';
import CodenamesGame from './codenames/CodenamesGame';
import { socketService } from '../../services/socket';

export default function GameView() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    gameState,
    isMyTurn,
    pauseGame,
    resumeGame,
    endGame
  } = useGame(code || '');

  // Rediriger si pas de code ou pas d'utilisateur
  useEffect(() => {
    if (!code || !user) {
      navigate('/lobby');
    }
  }, [code, user, navigate]);

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement du jeu...</p>
        </div>
      </div>
    );
  }

  // Afficher le bon composant selon le type de jeu
  const renderGame = () => {
    switch (gameState.type) {
      case 'perudo':
        return <PerudoGame gameState={gameState} isMyTurn={isMyTurn} />;

      case 'codenames':
        return <CodenamesGame gameState={gameState} isMyTurn={isMyTurn} socketService={socketService} />;

      case 'quiz':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Quiz</h2>
            <p className="text-gray-600">Ce jeu sera bientôt disponible!</p>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-red-600">Type de jeu inconnu: {gameState.type}</p>
          </div>
        );
    }
  };

  const isHost = gameState.players[0]?.userId === user?._id; // Assumons que le premier joueur est l'hôte

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* En-tête du jeu */}
      <div className="bg-gray-800/60 shadow-md border-b border-gray-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Salon {code} - {gameState.type.charAt(0).toUpperCase() + gameState.type.slice(1)}
              </h1>
              <p className="text-sm text-gray-400">
                Statut: {
                  gameState.status === 'waiting' ? 'En attente' :
                  gameState.status === 'starting' ? 'Démarrage...' :
                  gameState.status === 'in_progress' ? 'En cours' :
                  gameState.status === 'paused' ? 'En pause' :
                  'Terminé'
                }
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Boutons de contrôle pour l'hôte */}
              {isHost && gameState.status === 'in_progress' && (
                <button
                  onClick={pauseGame}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  ⏸️ Pause
                </button>
              )}

              {isHost && gameState.status === 'paused' && (
                <button
                  onClick={resumeGame}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  ▶️ Reprendre
                </button>
              )}

              {isHost && (gameState.status === 'in_progress' || gameState.status === 'paused') && (
                <button
                  onClick={() => {
                    if (window.confirm('Êtes-vous sûr de vouloir terminer la partie?')) {
                      endGame('host_ended');
                    }
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  🏁 Terminer
                </button>
              )}

              <button
                onClick={() => navigate('/lobby')}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Retour au lobby
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Zone de jeu */}
      <div className="container mx-auto px-4 py-6">
        {gameState.status === 'finished' ? (
          <div className="bg-gray-800/60 border border-gray-700 rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">🏁 Partie terminée!</h2>
            {gameState.winner && (
              <div className="mb-6">
                <p className="text-xl text-gray-400 mb-2">Gagnant:</p>
                <p className="text-2xl font-bold text-green-500">
                  🏆 {gameState.players.find(p => p.userId === gameState.winner)?.username || 'Inconnu'}
                </p>
              </div>
            )}
            <button
              onClick={() => navigate('/lobby')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg"
            >
              Retourner au lobby
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Zone de jeu principale */}
            <div className="lg:col-span-3">
              {renderGame()}
            </div>

            {/* Panneau latéral - Joueurs */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800/60 border border-gray-700 rounded-lg shadow-md p-4 mb-4">
                <h3 className="font-bold text-lg text-white mb-3">Joueurs</h3>
                <div className="space-y-2">
                  {gameState.players.map((player) => (
                    <div
                      key={player.userId}
                      className={`p-3 rounded-lg border-2 ${
                        player.userId === gameState.currentTurn
                          ? 'border-green-500 bg-green-900/30'
                          : player.status === 'eliminated'
                          ? 'border-gray-700 bg-gray-900/50'
                          : 'border-gray-700 bg-gray-900/30'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            player.status === 'active' ? 'bg-green-500' :
                            player.status === 'eliminated' ? 'bg-red-500' :
                            'bg-gray-400'
                          }`}></span>
                          <span className={`font-medium ${
                            player.status === 'eliminated' ? 'text-gray-500 line-through' : 'text-white'
                          }`}>
                            {player.username}
                            {player.userId === user?._id && ' (Vous)'}
                          </span>
                        </div>
                        {player.score !== undefined && (
                          <span className="text-sm font-bold text-gray-300">{player.score}</span>
                        )}
                      </div>
                      {player.userId === gameState.currentTurn && (
                        <div className="text-xs text-green-400 mt-1">
                          ▶ C'est son tour
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Indicateur de tour */}
              {isMyTurn && gameState.status === 'in_progress' && (
                <div className="bg-green-900/40 border-2 border-green-500 rounded-lg p-4 text-center animate-pulse">
                  <p className="text-green-400 font-bold">🎲 C'est votre tour!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}