import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Connecter au serveur Socket.io
   */
  connect() {
    const { token } = useAuthStore.getState();

    if (!token) {
      console.error('❌ Impossible de se connecter: aucun token');
      return;
    }

    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    this.socket = io(serverUrl, {
      auth: {
        token
      },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000
    });

    this.setupEventListeners();

    console.log('🔌 Connexion Socket.io en cours...');
  }

  /**
   * Configurer les listeners d'événements
   */
  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket.io connecté:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.io déconnecté:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔴 Erreur de connexion Socket.io:', error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Échec de reconnexion après', this.maxReconnectAttempts, 'tentatives');
        this.disconnect();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnecté après', attemptNumber, 'tentatives');
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_attempt', () => {
      console.log('🔄 Tentative de reconnexion...', this.reconnectAttempts + 1);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Échec de reconnexion');
    });
  }

  /**
   * Déconnecter du serveur
   */
  disconnect() {
    if (this.socket) {
      console.log('👋 Déconnexion Socket.io');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Rejoindre un salon
   */
  joinRoom(roomCode: string) {
    if (!this.socket) {
      console.error('❌ Socket non connecté');
      return;
    }

    console.log('🚪 Rejoindre le salon:', roomCode);
    this.socket.emit('room:join', roomCode);
  }

  /**
   * Quitter un salon
   */
  leaveRoom(roomCode: string) {
    if (!this.socket) return;

    console.log('👋 Quitter le salon:', roomCode);
    this.socket.emit('room:leave', roomCode);
  }

  /**
   * Envoyer un message dans le salon
   */
  sendMessage(roomCode: string, message: string) {
    if (!this.socket) return;

    this.socket.emit('room:message', { roomCode, message });
  }

  /**
   * Écouter un événement
   */
  on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) return;

    this.socket.on(event, callback);
  }

  /**
   * Arrêter d'écouter un événement
   */
  off(event: string, callback?: (...args: any[]) => void) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  /**
   * Vérifier si le socket est connecté
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Obtenir l'ID du socket
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Instance unique (Singleton)
export const socketService = new SocketService();
