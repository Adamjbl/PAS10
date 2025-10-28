import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private joinedRooms: Set<string> = new Set(); // Track les salons déjà joints
  private pendingJoins: Set<string> = new Set(); // Track les joins en cours
  private pendingListeners: Array<{ event: string; callback: (...args: any[]) => void }> = []; // Listeners en attente

  /**
   * Connecter au serveur Socket.io
   */
  connect() {
    console.log('🔌 [SocketService] connect() called', {
      hasSocket: !!this.socket,
      isConnected: this.socket?.connected
    });

    // IMPORTANT: Ne JAMAIS déconnecter un socket existant!
    // Cela détruit tous les listeners enregistrés!
    if (this.socket) {
      if (this.socket.connected) {
        console.log('✅ [SocketService] Socket.io déjà connecté, skipping');
        return;
      } else {
        console.log('🔌 [SocketService] Socket exists but not connected, reconnecting...');
        this.socket.connect();
        return;
      }
    }

    const { token } = useAuthStore.getState();

    if (!token) {
      console.error('❌ [SocketService] Impossible de se connecter: aucun token');
      return;
    }

    console.log('🔑 [SocketService] Token found, length:', token.length);

    const serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
    console.log('🌐 [SocketService] Server URL:', serverUrl);

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

    console.log('🔌 [SocketService] Connexion Socket.io en cours...');
  }

  /**
   * Configurer les listeners d'événements
   */
  private setupEventListeners() {
    if (!this.socket) return;

    // Enregistrer tous les listeners en attente
    console.log('🔧 [SocketService] Registering', this.pendingListeners.length, 'pending listeners');
    for (const { event, callback } of this.pendingListeners) {
      console.log('✅ [SocketService] Registering pending listener for:', event);
      this.socket.on(event, callback);
    }
    // Vider la queue
    this.pendingListeners = [];

    this.socket.on('connect', () => {
      console.log('✅ Socket.io connecté:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    // Écouter les événements de salon pour mettre à jour le tracking
    this.socket.on('room:joined', (data: { room: any }) => {
      const roomCode = data.room?.code?.toUpperCase();
      if (roomCode) {
        console.log('✅ [SocketService] Salon joint confirmé:', roomCode);
        this.joinedRooms.add(roomCode);
        this.pendingJoins.delete(roomCode);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.io déconnecté:', reason);
      // Nettoyer le tracking des salons lors de la déconnexion
      this.joinedRooms.clear();
      this.pendingJoins.clear();
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
    const normalizedCode = roomCode.toUpperCase();

    console.log('🚪 [SocketService] joinRoom() called', {
      roomCode: normalizedCode,
      hasSocket: !!this.socket,
      isConnected: this.socket?.connected,
      socketId: this.socket?.id,
      alreadyJoined: this.joinedRooms.has(normalizedCode),
      joinPending: this.pendingJoins.has(normalizedCode)
    });

    if (!this.socket) {
      console.error('❌ [SocketService] Socket non connecté');
      return;
    }

    // Vérifier si on a déjà joint ce salon
    if (this.joinedRooms.has(normalizedCode)) {
      console.log('⏭️  [SocketService] Salon déjà joint, skipping');
      return;
    }

    // Vérifier si un join est déjà en cours pour ce salon
    if (this.pendingJoins.has(normalizedCode)) {
      console.log('⏳ [SocketService] Join déjà en cours pour ce salon, skipping');
      return;
    }

    // Marquer le join comme en cours
    this.pendingJoins.add(normalizedCode);

    console.log('📤 [SocketService] Émission de room:join avec code:', normalizedCode);
    this.socket.emit('room:join', normalizedCode);
    console.log('✅ [SocketService] room:join émis');
  }

  /**
   * Quitter un salon
   */
  leaveRoom(roomCode: string) {
    const normalizedCode = roomCode.toUpperCase();

    console.log('👋 [SocketService] leaveRoom() called', { roomCode: normalizedCode });
    if (!this.socket) {
      console.error('❌ [SocketService] Socket non connecté');
      return;
    }

    // Nettoyer le tracking
    this.joinedRooms.delete(normalizedCode);
    this.pendingJoins.delete(normalizedCode);

    console.log('📤 [SocketService] Émission de room:leave avec code:', normalizedCode);
    this.socket.emit('room:leave', normalizedCode);
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
    console.log('👂 [SocketService] Registering listener for event:', event);
    if (!this.socket) {
      console.warn('⚠️  [SocketService] Socket not initialized yet, adding to pending queue');
      // Ajouter à la queue des listeners en attente
      this.pendingListeners.push({ event, callback });
      return;
    }

    console.log('✅ [SocketService] Socket ready, registering listener immediately for:', event);
    this.socket.on(event, callback);
  }

  /**
   * Arrêter d'écouter un événement
   */
  off(event: string, callback?: (...args: any[]) => void) {
    console.log('🔇 [SocketService] Removing listener for event:', event);
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

  /**
   * Obtenir l'ID de l'utilisateur
   */
  getUserId(): string | undefined {
    const { user } = useAuthStore.getState();
    return user?._id;
  }

  /**
   * Émettre un événement
   */
  emit(event: string, data: any): void {
    if (!this.socket) return;
    this.socket.emit(event, data);
  }
}

// Instance unique (Singleton)
export const socketService = new SocketService();
