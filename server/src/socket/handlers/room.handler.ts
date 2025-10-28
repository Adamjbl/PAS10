import { Server, Socket } from 'socket.io';
import Room from '../../models/Room';
import { AuthSocket } from '../auth.socket';

/**
 * Handler des événements de room
 */
export const setupRoomHandlers = (io: Server, socket: AuthSocket) => {
  /**
   * Rejoindre un salon
   */
  socket.on('room:join', async (roomCode: string) => {
    try {
      if (!socket.userId) {
        socket.emit('room:error', { message: 'Utilisateur non authentifié' });
        return;
      }

      // Trouver le salon
      const room = await Room.findOne({ code: roomCode.toUpperCase() })
        .populate('host', 'username email')
        .populate('players.userId', 'username email');

      if (!room) {
        socket.emit('room:error', { message: 'Salon non trouvé' });
        return;
      }

      // Vérifier si le salon est plein
      const connectedPlayers = room.players.filter(p => p.status === 'connected');
      if (connectedPlayers.length >= room.maxPlayers && !room.players.some(p => p.userId.toString() === socket.userId)) {
        socket.emit('room:error', { message: 'Salon complet' });
        return;
      }

      // Vérifier si le joueur est déjà dans le salon
      const existingPlayer = room.players.find(p => p.userId.toString() === socket.userId);

      if (existingPlayer) {
        // Reconnexion - mettre à jour le socketId et le statut
        existingPlayer.socketId = socket.id;
        existingPlayer.status = 'connected';
        existingPlayer.disconnectedAt = undefined;
      } else {
        // Nouveau joueur
        room.players.push({
          userId: socket.userId as any,
          socketId: socket.id,
          status: 'connected',
          joinedAt: new Date()
        });
      }

      await room.save();
      await room.populate('players.userId', 'username email');

      // Rejoindre la room Socket.io
      socket.join(roomCode.toUpperCase());

      // Notifier le joueur
      socket.emit('room:joined', {
        room: {
          _id: room._id,
          code: room.code,
          host: room.host,
          players: room.players,
          gameType: room.gameType,
          status: room.status,
          maxPlayers: room.maxPlayers,
          isPrivate: room.isPrivate,
          createdAt: room.createdAt
        }
      });

      // Notifier tous les autres joueurs du salon
      socket.to(roomCode.toUpperCase()).emit('room:player_joined', {
        player: {
          userId: socket.userId,
          username: socket.user.username,
          socketId: socket.id
        }
      });

      console.log(`✅ ${socket.user.username} a rejoint le salon ${roomCode}`);
    } catch (error) {
      console.error('Erreur room:join:', error);
      socket.emit('room:error', { message: 'Échec de la connexion au salon' });
    }
  });

  /**
   * Quitter un salon
   */
  socket.on('room:leave', async (roomCode: string) => {
    try {
      if (!socket.userId) {
        return;
      }

      const room = await Room.findOne({ code: roomCode.toUpperCase() });

      if (!room) {
        return;
      }

      // Retirer le joueur
      room.players = room.players.filter(p => p.userId.toString() !== socket.userId);
      await room.save();

      // Quitter la room Socket.io
      socket.leave(roomCode.toUpperCase());

      // Notifier les autres joueurs
      socket.to(roomCode.toUpperCase()).emit('room:player_left', {
        userId: socket.userId,
        username: socket.user.username
      });

      // Si le salon est vide, le supprimer
      if (room.players.length === 0) {
        await Room.deleteOne({ _id: room._id });
        console.log(`🗑️  Salon ${roomCode} supprimé (vide)`);
      }

      console.log(`👋 ${socket.user.username} a quitté le salon ${roomCode}`);
    } catch (error) {
      console.error('Erreur room:leave:', error);
    }
  });

  /**
   * Déconnexion
   */
  socket.on('disconnect', async () => {
    try {
      if (!socket.userId) {
        return;
      }

      // Trouver tous les salons où le joueur est présent
      const rooms = await Room.find({
        'players.userId': socket.userId,
        'players.socketId': socket.id
      });

      for (const room of rooms) {
        const player = room.players.find(p => p.socketId === socket.id);

        if (player) {
          player.status = 'disconnected';
          player.disconnectedAt = new Date();
          await room.save();

          // Notifier les autres joueurs
          socket.to(room.code).emit('room:player_disconnected', {
            userId: socket.userId,
            username: socket.user.username
          });

          console.log(`🔌 ${socket.user.username} déconnecté du salon ${room.code}`);
        }

        // Supprimer automatiquement après 60 secondes si toujours déconnecté
        setTimeout(async () => {
          const updatedRoom = await Room.findById(room._id);
          if (!updatedRoom) return;

          const stillDisconnected = updatedRoom.players.find(
            p => p.userId.toString() === socket.userId && p.status === 'disconnected'
          );

          if (stillDisconnected) {
            updatedRoom.players = updatedRoom.players.filter(
              p => p.userId.toString() !== socket.userId
            );
            await updatedRoom.save();

            // Notifier les autres joueurs
            socket.to(updatedRoom.code).emit('room:player_removed', {
              userId: socket.userId,
              username: socket.user.username
            });

            // Si le salon est vide, le supprimer
            if (updatedRoom.players.length === 0) {
              await Room.deleteOne({ _id: updatedRoom._id });
              console.log(`🗑️  Salon ${updatedRoom.code} supprimé (vide)`);
            }

            console.log(`❌ ${socket.user.username} retiré du salon ${updatedRoom.code} (timeout)`);
          }
        }, 60000); // 60 secondes
      }
    } catch (error) {
      console.error('Erreur disconnect:', error);
    }
  });

  /**
   * Envoyer un message dans le salon
   */
  socket.on('room:message', async (data: { roomCode: string; message: string }) => {
    try {
      if (!socket.userId) {
        return;
      }

      const { roomCode, message } = data;

      // Vérifier que le joueur est dans le salon
      const room = await Room.findOne({
        code: roomCode.toUpperCase(),
        'players.userId': socket.userId
      });

      if (!room) {
        socket.emit('room:error', { message: 'Vous n\'êtes pas dans ce salon' });
        return;
      }

      // Diffuser le message à tous les joueurs du salon
      io.to(roomCode.toUpperCase()).emit('room:message', {
        userId: socket.userId,
        username: socket.user.username,
        message,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Erreur room:message:', error);
    }
  });
};
