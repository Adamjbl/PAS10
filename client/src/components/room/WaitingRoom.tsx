import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRoom } from '../../hooks/useRoom';
import { useAuthStore } from '../../stores/authStore';
import { socketService } from '../../services/socket';

const gameTypeLabels = {
  perudo: '🎲 Perudo',
  codenames: '🕵️ Codenames',
  timebomb: '💣 TimeBomb',
  quiz: '🧠 Quiz'
};

export default function WaitingRoom() {
  console.log('🎨 [WaitingRoom] Component rendering');

  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentRoom, leaveRoom, sendMessage, isConnected } = useRoom(code);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  console.log('🎨 [WaitingRoom] State:', {
    code,
    hasCurrentRoom: !!currentRoom,
    isConnected,
    userId: user?._id,
    username: user?.username
  });

  // Ajouter un listener pour les messages
  useEffect(() => {
    console.log('💬 [WaitingRoom] Setting up message listener');

    const handleMessage = (data: any) => {
      console.log('💬 [WaitingRoom] Message received:', data);
      setMessages(prev => [...prev, data]);
    };

    socketService.on('room:message', handleMessage);

    return () => {
      console.log('💬 [WaitingRoom] Cleaning up message listener');
      socketService.off('room:message', handleMessage);
    };
  }, []);

  // Écouter les événements de jeu pour naviguer automatiquement
  useEffect(() => {
    console.log('🎮 [WaitingRoom] Setting up game listeners');

    const handleGameCreated = (data: any) => {
      console.log('🎮 [WaitingRoom] Game created, navigating to game page', data);
      navigate(`/game/${code}`);
    };

    const handleGameStarted = (data: any) => {
      console.log('🎮 [WaitingRoom] Game started, navigating to game page', data);
      navigate(`/game/${code}`);
    };

    socketService.on('game:created', handleGameCreated);
    socketService.on('game:started', handleGameStarted);

    return () => {
      console.log('🎮 [WaitingRoom] Cleaning up game listeners');
      socketService.off('game:created', handleGameCreated);
      socketService.off('game:started', handleGameStarted);
    };
  }, [code, navigate]);

  const handleLeave = () => {
    console.log('👋 [WaitingRoom] handleLeave called');
    leaveRoom();
    navigate('/lobby');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('💬 [WaitingRoom] handleSendMessage called', { message });
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
    }
  };

  const handleStartGame = () => {
    console.log('🎮 [WaitingRoom] handleStartGame called', { code });
    // Démarrer le jeu via Socket.io
    // La navigation se fera automatiquement quand on recevra game:created ou game:started
    socketService.emit('game:create', { roomCode: code });
  };

  if (!currentRoom) {
    console.log('⏳ [WaitingRoom] Waiting for room data...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement du salon...</p>
        </div>
      </div>
    );
  }

  // Vérification défensive des données
  if (!currentRoom.players || !Array.isArray(currentRoom.players)) {
    console.error('❌ [WaitingRoom] Invalid room data - players is not an array:', currentRoom);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">Erreur: Données du salon invalides</p>
          <button
            onClick={() => navigate('/lobby')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Retour au lobby
          </button>
        </div>
      </div>
    );
  }

  console.log('🏠 [WaitingRoom] Room data available', {
    code: currentRoom.code,
    host: currentRoom.host,
    playersCount: currentRoom.players.length
  });

  // currentRoom.host peut être soit un objet avec _id, soit directement un ID string
  const hostId = typeof currentRoom.host === 'string'
    ? currentRoom.host
    : currentRoom.host?._id;
  const isHost = user?._id === hostId;
  const playerCount = currentRoom.players.filter((p: any) => p.status === 'connected').length;

  console.log('👤 [WaitingRoom] Computed values:', {
    hostId,
    isHost,
    playerCount
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="bg-gray-800/60 border border-gray-700 rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Salon {currentRoom.code}
              </h1>
              <p className="text-gray-400">
                {gameTypeLabels[currentRoom.gameType]} • {playerCount}/{currentRoom.maxPlayers} joueurs
              </p>
              {!isConnected && (
                <p className="text-red-500 text-sm mt-2">
                  ⚠️ Connexion perdue... Reconnexion en cours...
                </p>
              )}
            </div>
            <button
              onClick={handleLeave}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Quitter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Liste des joueurs */}
          <div className="md:col-span-2">
            <div className="bg-gray-800/60 border border-gray-700 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Joueurs ({playerCount}/{currentRoom.maxPlayers})
              </h2>

              <div className="space-y-3">
                {currentRoom.players.map((player: any, index: number) => {
                  const playerUser = player.userId;
                  const playerUserId = typeof playerUser === 'string' ? playerUser : playerUser._id;
                  const isCurrentHost = playerUserId === hostId;
                  const isDisconnected = player.status === 'disconnected';

                  return (
                    <div
                      key={player._id || `${playerUserId}-${index}`}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                        isDisconnected
                          ? 'bg-gray-900/50 border-gray-700'
                          : 'bg-blue-900/30 border-blue-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          isDisconnected ? 'bg-gray-600' : 'bg-green-500'
                        }`}></div>
                        <div>
                          <p className={`font-medium ${isDisconnected ? 'text-gray-500' : 'text-white'}`}>
                            {(typeof playerUser === 'string' ? playerUser : playerUser.username) || 'Joueur'}
                            {isCurrentHost && ' 👑'}
                          </p>
                          {isDisconnected && (
                            <p className="text-xs text-gray-500">Déconnecté...</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bouton démarrer (host uniquement) */}
              {isHost && (
                <button
                  onClick={handleStartGame}
                  disabled={playerCount < 2}
                  className="w-full mt-6 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
                >
                  {playerCount < 2 ? 'En attente de joueurs...' : 'Démarrer la partie'}
                </button>
              )}

              {!isHost && (
                <div className="mt-6 text-center text-gray-400">
                  En attente que l'hôte démarre la partie...
                </div>
              )}
            </div>
          </div>

          {/* Chat */}
          <div className="md:col-span-1">
            <div className="bg-gray-800/60 border border-gray-700 rounded-lg shadow-md p-6 h-[500px] flex flex-col">
              <h2 className="text-xl font-bold text-white mb-4">Chat</h2>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-center">Aucun message</p>
                ) : (
                  messages.map((msg, index) => (
                    <div key={index} className="bg-gray-900/50 rounded-lg p-3">
                      <p className="text-sm font-medium text-white">{msg.username}</p>
                      <p className="text-gray-400">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tapez un message..."
                  className="flex-1 px-4 py-2 bg-gray-900/50 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder-gray-500"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || !isConnected}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Envoyer
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
