import { Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import User from '../models/User';

export interface AuthSocket extends Socket {
  userId?: string;
  user?: any;
}

/**
 * Middleware d'authentification pour Socket.io
 * Vérifie le token JWT dans le handshake
 */
export const authenticateSocket = async (socket: AuthSocket, next: (err?: Error) => void) => {
  try {
    // Récupérer le token depuis le handshake
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Token d\'authentification manquant'));
    }

    // Vérifier le token
    const decoded = verifyToken(token);

    if (!decoded || typeof decoded === 'string') {
      return next(new Error('Token invalide'));
    }

    // Récupérer l'utilisateur
    const user = await User.findById(decoded._id).select('-password');

    if (!user) {
      return next(new Error('Utilisateur non trouvé'));
    }

    // Attacher l'utilisateur au socket
    socket.userId = user._id.toString();
    socket.user = user;

    next();
  } catch (error) {
    console.error('Erreur authentification socket:', error);
    next(new Error('Échec de l\'authentification'));
  }
};
