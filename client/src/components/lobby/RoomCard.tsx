import { useNavigate } from 'react-router-dom';
import { Room } from '../../stores/roomStore';

interface RoomCardProps {
  room: Room;
}

const gameTypeLabels = {
  perudo: '🎲 Perudo',
  codenames: '🕵️ Codenames',
  quiz: '🧠 Quiz'
};

const gameTypeColors = {
  perudo: 'bg-red-100 text-red-800',
  codenames: 'bg-blue-100 text-blue-800',
  quiz: 'bg-purple-100 text-purple-800'
};

export default function RoomCard({ room }: RoomCardProps) {
  const navigate = useNavigate();

  const handleJoin = () => {
    navigate(`/room/${room.code}`);
  };

  const playerCount = room.playerCount || room.players?.filter(p => p.status === 'connected').length || 0;
  const isFull = playerCount >= room.maxPlayers;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      {/* En-tête */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-xl font-bold text-gray-800">{room.code}</h3>
          <p className="text-sm text-gray-600">
            Hôte: {room.host?.username || 'Inconnu'}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${gameTypeColors[room.gameType]}`}>
          {gameTypeLabels[room.gameType]}
        </span>
      </div>

      {/* Informations */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Joueurs:</span>
          <span className={`font-medium ${isFull ? 'text-red-600' : 'text-green-600'}`}>
            {playerCount} / {room.maxPlayers}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Statut:</span>
          <span className="font-medium text-blue-600">
            {room.status === 'waiting' ? 'En attente' :
             room.status === 'in_game' ? 'En jeu' : 'Terminé'}
          </span>
        </div>
      </div>

      {/* Bouton rejoindre */}
      <button
        onClick={handleJoin}
        disabled={isFull || room.status !== 'waiting'}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          isFull || room.status !== 'waiting'
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-primary-600 text-white hover:bg-primary-700'
        }`}
      >
        {isFull ? 'Salon complet' :
         room.status !== 'waiting' ? 'Partie en cours' :
         'Rejoindre'}
      </button>
    </div>
  );
}
