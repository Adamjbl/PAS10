import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomsAPI } from '../../services/api';
import { useRoomStore } from '../../stores/roomStore';
import toast from 'react-hot-toast';

interface JoinRoomModalProps {
  onClose: () => void;
}

export default function JoinRoomModal({ onClose }: JoinRoomModalProps) {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setCurrentRoom } = useRoomStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 4) {
      toast.error('Le code doit contenir 4 caractères');
      return;
    }

    setIsLoading(true);

    try {
      const response = await roomsAPI.getRoomByCode(code);
      setCurrentRoom(response.room);
      toast.success(`Salon trouvé! Code: ${response.room.code}`);
      onClose();
      navigate(`/room/${response.room.code}`);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Salon non trouvé';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convertir en majuscules et limiter à 4 caractères
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    setCode(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Rejoindre un salon</h2>
        <p className="text-gray-600 mb-6">
          Entrez le code à 4 caractères du salon que vous souhaitez rejoindre
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Code input */}
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Code du salon
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={handleCodeChange}
              placeholder="ABCD"
              className="w-full px-4 py-3 text-center text-2xl font-bold uppercase border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent tracking-widest"
              disabled={isLoading}
              autoFocus
              maxLength={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              {code.length}/4 caractères
            </p>
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
              disabled={isLoading || code.length !== 4}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Recherche...' : 'Rejoindre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
