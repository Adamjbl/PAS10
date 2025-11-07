import { useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/socket';
import { useRoomStore } from '../stores/roomStore';
import toast from 'react-hot-toast';

/**
 * Hook personnalisé pour gérer les interactions avec un salon en temps réel
 */
export const useRoom = (roomCode?: string) => {
  const { currentRoom, setCurrentRoom } = useRoomStore();
  const hasJoinedRoom = useRef(false);
  const lastJoinedRoom = useRef<string | null>(null);
  const listenersSetup = useRef(false);

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
   * IMPORTANT: Ne pas mettre de dépendances qui changent, sinon les listeners
   * sont recréés et peuvent manquer des événements
   * CRITIQUE: Les listeners doivent être en place AVANT de rejoindre un salon
   */
  useEffect(() => {
    console.log('🎧 [useRoom] Setting up socket listeners', { listenersSetup: listenersSetup.current });

    // Ne setup les listeners qu'une seule fois
    if (listenersSetup.current) {
      console.log('⏭️  [useRoom] Listeners already setup, skipping');
      return;
    }

    console.log('✅ [useRoom] Setting up listeners for the first time');
    listenersSetup.current = true;

    // Événement: salon rejoint avec succès
    const handleRoomJoined = (data: { room: any }) => {
      console.log('✅ [useRoom] room:joined event received:', data.room);
      setCurrentRoom(data.room);
      toast.success(`Salon ${data.room.code} rejoint!`);
    };

    // Événement: un joueur a rejoint le salon
    const handlePlayerJoined = (data: { player: any }) => {
      console.log('👤 Joueur rejoint:', data.player);
      toast.success(`${data.player.username} a rejoint le salon`);

      // Mettre à jour la liste des joueurs
      setCurrentRoom((prev: any) => {
        console.log('🔍 [handlePlayerJoined] prev state:', prev);

        if (!prev) {
          console.warn('⚠️ [handlePlayerJoined] prev is null/undefined');
          return prev;
        }

        if (!prev.players) {
          console.error('❌ [handlePlayerJoined] prev.players is undefined!', prev);
          return prev;
        }

        // Vérifier si le joueur existe déjà
        const existingPlayer = prev.players.find((p: any) => p.userId === data.player.userId);

        if (existingPlayer) {
          console.log('⏭️  [handlePlayerJoined] Player already exists, skipping');
          return prev;
        }

        // Créer un NOUVEAU joueur avec TOUTES les propriétés
        const newPlayer = {
          userId: data.player.userId,
          username: data.player.username,  // IMPORTANT: Copier le username!
          email: data.player.email,
          socketId: data.player.socketId,
          status: 'connected' as const,
          joinedAt: new Date() as any
        };

        // Créer un nouvel array de joueurs
        const newPlayers = [...prev.players, newPlayer];

        // Créer un nouvel objet room avec COPIE EXPLICITE de toutes les propriétés
        const newRoom = {
          _id: prev._id,
          code: prev.code,
          host: prev.host,
          players: newPlayers,
          gameType: prev.gameType,
          status: prev.status,
          maxPlayers: prev.maxPlayers,
          isPrivate: prev.isPrivate,
          settings: prev.settings,
          createdAt: prev.createdAt,
          playerCount: prev.playerCount
        };

        console.log('✅ [handlePlayerJoined] newRoom:', newRoom);
        return newRoom;
      });
    };

    // Événement: un joueur a quitté le salon
    const handlePlayerLeft = (data: { userId: string; username: string }) => {
      console.log('👋 Joueur parti:', data.username);
      toast(`${data.username} a quitté le salon`, { icon: '👋' });

      // Mettre à jour la liste des joueurs
      setCurrentRoom((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.filter((p: any) => p.userId !== data.userId)
        };
      });
    };

    // Événement: un joueur s'est déconnecté
    const handlePlayerDisconnected = (data: { userId: string; username: string }) => {
      console.log('🔌 Joueur déconnecté:', data.username);
      toast(`${data.username} s'est déconnecté`, { icon: '⚠️' });

      // Mettre à jour le statut du joueur
      setCurrentRoom((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map((p: any) =>
            p.userId === data.userId
              ? { ...p, status: 'disconnected' }
              : p
          )
        };
      });
    };

    // Événement: un joueur a été retiré (timeout)
    const handlePlayerRemoved = (data: { userId: string; username: string }) => {
      console.log('❌ Joueur retiré:', data.username);
      toast.error(`${data.username} a été retiré du salon (timeout)`);

      // Mettre à jour la liste des joueurs
      setCurrentRoom((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.filter((p: any) => p.userId !== data.userId)
        };
      });
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

    // NE PAS NETTOYER les listeners - ils doivent rester actifs toute la session
    // Sinon on manque des événements à cause de React.StrictMode
    console.log('✅ [useRoom] Listeners setup complete, they will stay active');
  }, [setCurrentRoom]);

  /**
   * Se connecter au Socket.io au montage si pas déjà connecté
   */
  useEffect(() => {
    if (!socketService.isConnected()) {
      socketService.connect();
    }
  }, []);

  /**
   * Rejoindre automatiquement le salon si un code est fourni
   */
  useEffect(() => {
    console.log('🔍 [useRoom] useEffect triggered', {
      roomCode,
      lastJoinedRoom: lastJoinedRoom.current,
      isConnected: socketService.isConnected(),
      hasJoined: hasJoinedRoom.current
    });

    // Ne pas rejoindre si pas de code ou si on a déjà rejoint ce salon
    if (!roomCode) {
      console.log('⏭️  [useRoom] No roomCode, skipping');
      return;
    }

    if (lastJoinedRoom.current === roomCode) {
      console.log('⏭️  [useRoom] Already joined this room, skipping');
      return;
    }

    // Attendre que le socket soit connecté
    const checkAndJoin = () => {
      console.log('🔍 [useRoom] checkAndJoin called', {
        isConnected: socketService.isConnected(),
        lastJoinedRoom: lastJoinedRoom.current,
        roomCode
      });

      if (socketService.isConnected() && lastJoinedRoom.current !== roomCode) {
        console.log('✅ [useRoom] Conditions met, joining room');
        lastJoinedRoom.current = roomCode;
        hasJoinedRoom.current = true;
        console.log('🚪 Auto-joining room:', roomCode);
        joinRoom(roomCode);
      } else {
        console.log('❌ [useRoom] Conditions not met, not joining');
      }
    };

    // Si déjà connecté, rejoindre immédiatement
    if (socketService.isConnected()) {
      console.log('📡 [useRoom] Socket already connected, checking to join');
      checkAndJoin();
    } else {
      console.log('⏳ [useRoom] Socket not connected, waiting for connection');
      // Sinon, attendre la connexion
      const onConnect = () => {
        console.log('📡 [useRoom] Socket connected event received');
        checkAndJoin();
      };
      socketService.on('connect', onConnect);

      return () => {
        console.log('🧹 [useRoom] Cleanup: removing connect listener');
        socketService.off('connect', onConnect);
      };
    }
  }, [roomCode, joinRoom]);

  return {
    currentRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
    isConnected: socketService.isConnected()
  };
};
