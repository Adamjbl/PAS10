import { Server } from 'socket.io';
import { authenticateSocket, AuthSocket } from './auth.socket';
import { setupRoomHandlers } from './handlers/room.handler';

/**
 * Configuration et initialisation de Socket.io
 */
export const setupSocketIO = (io: Server) => {
  // Middleware d'authentification
  io.use(authenticateSocket);

  // Gestion des connexions
  io.on('connection', (socket: AuthSocket) => {
    console.log(`✅ Socket connecté: ${socket.id} (User: ${socket.user?.username || 'Unknown'})`);

    // Setup des handlers
    setupRoomHandlers(io, socket);

    // Déconnexion
    socket.on('disconnect', (reason) => {
      console.log(`❌ Socket déconnecté: ${socket.id} (${reason})`);
    });

    // Gestion des erreurs
    socket.on('error', (error) => {
      console.error(`🔴 Erreur socket ${socket.id}:`, error);
    });
  });

  console.log('🎮 Socket.io handlers configurés');
};
