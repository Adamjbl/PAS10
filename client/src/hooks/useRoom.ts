import { useEffect, useCallback } from 'react';
import { socketService } from '../services/socket';
import { useRoomStore } from '../stores/roomStore';
import toast from 'react-hot-toast';

/**
 * Hook personnalisé pour gérer les interactions avec un salon en temps réel
 */
export const useRoom = (roomCode?: string) => {
  const { currentRoom, setCurrentRoom } = useRoomStore();

  /**
   * Rejoindre un salon
   */
  const joinRoom = useCallback((code: string) => {
    if (!socketService.isConnected()) {
      toast.error('Connexion Socket.io non établie');
      return;
    }

    socketService.joinRoom(code);
  }, []);

  /**
   * Quitter le salon actuel
   */
  const leaveRoom = useCallback(() => {
    if (currentRoom) {
      socketService.leaveRoom(currentRoom.code);
      setCurrentRoom(null);
    }
  }, [currentRoom, setCurrentRoom]);

  /**
   * Envoyer un message dans le salon
   */
  const sendMessage = useCallback((message: string) => {
    if (!currentRoom) {
      toast.error('Vous n\'êtes pas dans un salon');
      return;
    }

    socketService.sendMessage(currentRoom.code, message);
  }, [currentRoom]);

  /**
   * Setup des listeners d'événements Socket.io
   */
  useEffect(() => {
    // Événement: salon rejoint avec succès
    const handleRoomJoined = (data: { room: any }) => {
      console.log('✅ Salon rejoint:', data.room);
      setCurrentRoom(data.room);
      toast.success(`Salon ${data.room.code} rejoint!`);
    };

    // Événement: un joueur a rejoint le salon
    const handlePlayerJoined = (data: { player: any }) => {
      console.log('👤 Joueur rejoint:', data.player);
      toast.success(`${data.player.username} a rejoint le salon`);

      // Mettre à jour la liste des joueurs
      if (currentRoom) {
        const updatedRoom = { ...currentRoom };
        const existingPlayer = updatedRoom.players.find((p: any) => p.userId === data.player.userId);

        if (!existingPlayer) {
          updatedRoom.players.push({
            userId: data.player.userId,
            socketId: data.player.socketId,
            status: 'connected',
            joinedAt: new Date().toISOString()
          });
          setCurrentRoom(updatedRoom);
        }
      }
    };

    // Événement: un joueur a quitté le salon
    const handlePlayerLeft = (data: { userId: string; username: string }) => {
      console.log('👋 Joueur parti:', data.username);
      toast.info(`${data.username} a quitté le salon`);

      // Mettre à jour la liste des joueurs
      if (currentRoom) {
        const updatedRoom = { ...currentRoom };
        updatedRoom.players = updatedRoom.players.filter((p: any) => p.userId !== data.userId);
        setCurrentRoom(updatedRoom);
      }
    };

    // Événement: un joueur s'est déconnecté
    const handlePlayerDisconnected = (data: { userId: string; username: string }) => {
      console.log('🔌 Joueur déconnecté:', data.username);
      toast.warning(`${data.username} s'est déconnecté`);

      // Mettre à jour le statut du joueur
      if (currentRoom) {
        const updatedRoom = { ...currentRoom };
        const player = updatedRoom.players.find((p: any) => p.userId === data.userId);
        if (player) {
          player.status = 'disconnected';
          setCurrentRoom(updatedRoom);
        }
      }
    };

    // Événement: un joueur a été retiré (timeout)
    const handlePlayerRemoved = (data: { userId: string; username: string }) => {
      console.log('❌ Joueur retiré:', data.username);
      toast.error(`${data.username} a été retiré du salon (timeout)`);

      // Mettre à jour la liste des joueurs
      if (currentRoom) {
        const updatedRoom = { ...currentRoom };
        updatedRoom.players = updatedRoom.players.filter((p: any) => p.userId !== data.userId);
        setCurrentRoom(updatedRoom);
      }
    };

    // Événement: message reçu
    const handleMessage = (data: { userId: string; username: string; message: string; timestamp: Date }) => {
      console.log('💬 Message de', data.username, ':', data.message);
      // Les messages seront gérés par le composant WaitingRoom
    };

    // Événement: erreur
    const handleError = (data: { message: string }) => {
      console.error('🔴 Erreur salon:', data.message);
      toast.error(data.message);
    };

    // Enregistrer les listeners
    socketService.on('room:joined', handleRoomJoined);
    socketService.on('room:player_joined', handlePlayerJoined);
    socketService.on('room:player_left', handlePlayerLeft);
    socketService.on('room:player_disconnected', handlePlayerDisconnected);
    socketService.on('room:player_removed', handlePlayerRemoved);
    socketService.on('room:message', handleMessage);
    socketService.on('room:error', handleError);

    // Nettoyage
    return () => {
      socketService.off('room:joined', handleRoomJoined);
      socketService.off('room:player_joined', handlePlayerJoined);
      socketService.off('room:player_left', handlePlayerLeft);
      socketService.off('room:player_disconnected', handlePlayerDisconnected);
      socketService.off('room:player_removed', handlePlayerRemoved);
      socketService.off('room:message', handleMessage);
      socketService.off('room:error', handleError);
    };
  }, [currentRoom, setCurrentRoom]);

  /**
   * Se connecter au Socket.io au montage si pas déjà connecté
   */
  useEffect(() => {
    if (!socketService.isConnected()) {
      socketService.connect();
    }

    // Rejoindre automatiquement le salon si un code est fourni
    if (roomCode && socketService.isConnected()) {
      joinRoom(roomCode);
    }

    // Déconnexion au démontage du composant racine
    return () => {
      // On ne déconnecte pas ici car d'autres composants peuvent utiliser le socket
    };
  }, [roomCode, joinRoom]);

  return {
    currentRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
    isConnected: socketService.isConnected()
  };
};
