import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomsAPI } from '../../services/api';
import { useRoomStore } from '../../stores/roomStore';
import toast from 'react-hot-toast';

interface CreateRoomModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateRoomModal({ onClose, onSuccess }: CreateRoomModalProps) {
  const navigate = useNavigate();
  const [gameType, setGameType] = useState<'perudo' | 'codenames' | 'quiz' | 'timebomb'>('perudo');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setCurrentRoom } = useRoomStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await roomsAPI.createRoom(gameType, maxPlayers, isPrivate);
      setCurrentRoom(response.room);
      toast.success(`Salon créé! Code: ${response.room.code}`);
      onSuccess();
      navigate(`/room/${response.room.code}`);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erreur lors de la création du salon';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Créer un salon</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type de jeu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de jeu
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setGameType('perudo')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  gameType === 'perudo'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-1">🎲</div>
                <div className="text-sm font-medium">Perudo</div>
              </button>

              <button
                type="button"
                onClick={() => setGameType('codenames')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  gameType === 'codenames'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-1">🕵️</div>
                <div className="text-sm font-medium">Codenames</div>
              </button>

              <button
                type="button"
                onClick={() => setGameType('timebomb')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  gameType === 'timebomb'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-1">💣</div>
                <div className="text-sm font-medium">TimeBomb</div>
              </button>

              <button
                type="button"
                onClick={() => setGameType('quiz')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  gameType === 'quiz'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-1">🧠</div>
                <div className="text-sm font-medium">Quiz</div>
              </button>
            </div>
          </div>

          {/* Nombre de joueurs */}
          <div>
            <label htmlFor="maxPlayers" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre maximum de joueurs: {maxPlayers}
            </label>
            <input
              type="range"
              id="maxPlayers"
              min="2"
              max="12"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>2</span>
              <span>12</span>
            </div>
          </div>

          {/* Salon privé */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isPrivate" className="ml-2 text-sm text-gray-700">
              Salon privé (non visible dans la liste publique)
            </label>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
