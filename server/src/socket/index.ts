import { Server } from 'socket.io';
import { authenticateSocket, AuthSocket } from './auth.socket';
import { setupRoomHandlers } from './handlers/room.handler';
import { setupGameHandlers } from './handlers/game.handler';
import { gameManager } from '../games/core/GameManager';

/**
 * Configuration et initialisation de Socket.io
 */
export const setupSocketIO = (io: Server) => {
  // Initialiser le GameManager avec le serveur Socket.io
  gameManager.initialize(io);

  // Middleware d'authentification
  io.use(authenticateSocket);

  // Gestion des connexions
  io.on('connection', (socket: AuthSocket) => {
    console.log(`✅ Socket connecté: ${socket.id} (User: ${socket.user?.username || 'Unknown'})`);

    // Setup des handlers
    setupRoomHandlers(io, socket);
    setupGameHandlers(io, socket);

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
