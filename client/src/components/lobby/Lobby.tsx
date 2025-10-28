import { useState, useEffect } from 'react';
import { useRoomStore } from '../../stores/roomStore';
import { roomsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import CreateRoomModal from './CreateRoomModal';
import JoinRoomModal from './JoinRoomModal';
import RoomCard from './RoomCard';

export default function Lobby() {
  const { rooms, setRooms, setLoading, isLoading } = useRoomStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Charger la liste des salons
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await roomsAPI.getRooms();
      setRooms(data.rooms);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des salons');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    // Rafraîchir la liste toutes les 10 secondes
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            🎮 Lobby
          </h1>
          <p className="text-lg text-gray-400">
            Rejoignez un salon ou créez-en un nouveau
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md"
          >
            ➕ Créer un salon
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-md"
          >
            🔍 Rejoindre avec un code
          </button>
          <button
            onClick={fetchRooms}
            disabled={isLoading}
            className="bg-gray-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors shadow-md disabled:opacity-50"
          >
            🔄 Actualiser
          </button>
        </div>

        {/* Liste des salons */}
        <div className="bg-gray-800/60 border border-gray-700 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Salons disponibles</h2>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
              <p className="mt-4 text-gray-400">Chargement...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">
                Aucun salon disponible pour le moment
              </p>
              <p className="text-gray-500 mt-2">
                Créez-en un pour commencer à jouer !
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <RoomCard key={room._id} room={room} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchRooms();
          }}
        />
      )}

      {showJoinModal && (
        <JoinRoomModal
          onClose={() => setShowJoinModal(false)}
        />
      )}
    </div>
  );
}
