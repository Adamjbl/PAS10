import { BaseGame } from './BaseGame';
import { GamePlayer, GameMove } from './GameInterface';
import { Server } from 'socket.io';
import Room from '../../models/Room';
import { PerudoGame } from '../perudo/PerudoGame';
import { CodenamesGame } from '../codenames/CodenamesGame';

/**
 * Gestionnaire central des jeux
 * Singleton qui gère toutes les instances de jeux actifs
 */
export class GameManager {
  private static instance: GameManager;
  private games: Map<string, BaseGame> = new Map(); // roomCode -> Game
  private io: Server | null = null;

  private constructor() {}

  /**
   * Obtenir l'instance unique du GameManager
   */
  static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  /**
   * Initialiser le GameManager avec le serveur Socket.io
   */
  initialize(io: Server): void {
    this.io = io;
    console.log('🎮 GameManager initialisé');
  }

  /**
   * Créer une nouvelle instance de jeu
   */
  async createGame(
    roomCode: string,
    gameType: 'perudo' | 'codenames' | 'quiz'
  ): Promise<BaseGame> {
    // Vérifier qu'il n'y a pas déjà un jeu pour cette room
    if (this.games.has(roomCode)) {
      throw new Error(`Un jeu existe déjà pour le salon ${roomCode}`);
    }

    // Récupérer les informations du salon depuis la DB
    const room = await Room.findOne({ code: roomCode })
      .populate('players.userId', 'username')
      .populate('host', 'username');

    if (!room) {
      throw new Error(`Salon ${roomCode} non trouvé`);
    }

    // Créer le jeu selon le type
    let game: BaseGame;

    switch (gameType) {
      case 'perudo':
        game = new PerudoGame(roomCode);
        break;

      case 'codenames':
        game = new CodenamesGame(roomCode);
        break;

      case 'quiz':
        // À implémenter
        throw new Error('Quiz non encore implémenté');

      default:
        throw new Error(`Type de jeu inconnu: ${gameType}`);
    }

    // Préparer les joueurs
    const players: GamePlayer[] = room.players
      .filter((p: any) => p.status === 'connected')
      .map((p: any) => ({
        userId: p.userId._id.toString(),
        username: p.userId.username,
        socketId: p.socketId,
        status: 'active' as any,
        score: 0
      }));

    // Initialiser le jeu
    game.initialize(players);

    // Configurer les écouteurs d'événements
    this.setupGameListeners(game, roomCode);

    // Stocker le jeu
    this.games.set(roomCode, game);

    // Mettre à jour le statut du salon
    room.status = 'in_game';
    await room.save();

    console.log(`🎯 Jeu ${gameType} créé pour le salon ${roomCode}`);

    return game;
  }

  /**
   * Démarrer un jeu
   */
  async startGame(roomCode: string): Promise<void> {
    const game = this.games.get(roomCode);
    if (!game) {
      throw new Error(`Aucun jeu trouvé pour le salon ${roomCode}`);
    }

    await game.start();

    // Envoyer l'état personnalisé à chaque joueur (avec leurs dés)
    if (this.io) {
      this.sendPersonalizedState(roomCode, game);
      // Envoyer aussi l'événement game:started
      this.io.to(roomCode).emit('game:started', {
        state: game.getPublicState()
      });
    }

    console.log(`🚀 Jeu démarré pour le salon ${roomCode}`);
  }

  /**
   * Traiter un mouvement de joueur
   */
  async processMove(
    roomCode: string,
    playerId: string,
    move: GameMove
  ): Promise<boolean> {
    const game = this.games.get(roomCode);
    if (!game) {
      throw new Error(`Aucun jeu trouvé pour le salon ${roomCode}`);
    }

    const success = await game.processMove(move);

    if (success && this.io) {
      // Notifier tous les joueurs du nouveau état
      this.io.to(roomCode).emit('game:move', {
        playerId,
        move,
        state: game.getPublicState()
      });

      // Si c'est un jeu au tour par tour, notifier le prochain joueur
      const nextPlayer = game.getNextPlayer();
      if (nextPlayer) {
        this.io.to(roomCode).emit('game:turn', {
          playerId: nextPlayer,
          state: game.getPublicState()
        });
      }
    }

    return success;
  }

  /**
   * Mettre un jeu en pause
   */
  pauseGame(roomCode: string): void {
    const game = this.games.get(roomCode);
    if (!game) {
      throw new Error(`Aucun jeu trouvé pour le salon ${roomCode}`);
    }

    game.pause();

    if (this.io) {
      this.io.to(roomCode).emit('game:paused', {
        state: game.getPublicState()
      });
    }

    console.log(`⏸️ Jeu mis en pause pour le salon ${roomCode}`);
  }

  /**
   * Reprendre un jeu
   */
  resumeGame(roomCode: string): void {
    const game = this.games.get(roomCode);
    if (!game) {
      throw new Error(`Aucun jeu trouvé pour le salon ${roomCode}`);
    }

    game.resume();

    if (this.io) {
      this.io.to(roomCode).emit('game:resumed', {
        state: game.getPublicState()
      });
    }

    console.log(`▶️ Jeu repris pour le salon ${roomCode}`);
  }

  /**
   * Terminer un jeu
   */
  async endGame(roomCode: string, reason: string = 'normal'): Promise<void> {
    const game = this.games.get(roomCode);
    if (!game) {
      throw new Error(`Aucun jeu trouvé pour le salon ${roomCode}`);
    }

    game.end(reason);
    const result = game.getResult();

    // Mettre à jour le salon
    const room = await Room.findOne({ code: roomCode });
    if (room) {
      room.status = 'waiting';
      await room.save();
    }

    // Notifier les joueurs
    if (this.io) {
      this.io.to(roomCode).emit('game:ended', {
        reason,
        result,
        state: game.getPublicState()
      });
    }

    // Nettoyer après un délai
    setTimeout(() => {
      this.cleanupGame(roomCode);
    }, 5000);

    console.log(`🏁 Jeu terminé pour le salon ${roomCode} (${reason})`);
  }

  /**
   * Gérer la déconnexion d'un joueur
   */
  handlePlayerDisconnect(roomCode: string, playerId: string): void {
    const game = this.games.get(roomCode);
    if (!game) return;

    game.removePlayer(playerId);

    if (this.io) {
      this.io.to(roomCode).emit('game:player_disconnected', {
        playerId,
        state: game.getPublicState()
      });
    }
  }

  /**
   * Gérer la reconnexion d'un joueur
   */
  handlePlayerReconnect(
    roomCode: string,
    playerId: string,
    socketId: string
  ): void {
    const game = this.games.get(roomCode);
    if (!game) return;

    game.reconnectPlayer(playerId, socketId);

    if (this.io) {
      this.io.to(roomCode).emit('game:player_reconnected', {
        playerId,
        state: game.getPublicState()
      });
    }
  }

  /**
   * Obtenir l'état d'un jeu
   */
  getGameState(roomCode: string, playerId?: string): any {
    const game = this.games.get(roomCode);
    if (!game) return null;

    return game.getPublicState(playerId);
  }

  /**
   * Obtenir un jeu
   */
  getGame(roomCode: string): BaseGame | undefined {
    return this.games.get(roomCode);
  }

  /**
   * Vérifier si un jeu existe
   */
  hasGame(roomCode: string): boolean {
    return this.games.has(roomCode);
  }

  /**
   * Configurer les écouteurs d'événements pour un jeu
   */
  private setupGameListeners(game: BaseGame, roomCode: string): void {
    // Écouter les événements du jeu et les transmettre via Socket.io
    game.on('move', () => {
      if (this.io) {
        // Envoyer un état personnalisé à chaque joueur avec ses dés
        this.sendPersonalizedState(roomCode, game);
      }
    });

    game.on('turn_changed', (data) => {
      if (this.io) {
        console.log('🎯 [GameManager] turn_changed event, sending to room:', roomCode, 'playerId:', data.playerId);
        // Envoyer un état personnalisé à chaque joueur
        this.sendPersonalizedState(roomCode, game);
        // Envoyer aussi l'événement turn_changed pour la notification
        this.io.to(roomCode).emit('game:turn_changed', data);
      }
    });

    game.on('player_eliminated', (data) => {
      if (this.io) {
        this.io.to(roomCode).emit('game:player_eliminated', data);
      }
    });

    game.on('ended', async (data) => {
      // Sauvegarder les statistiques
      await this.saveGameStats(roomCode, data.result);

      if (this.io) {
        this.io.to(roomCode).emit('game:ended', data);
      }
    });
  }

  /**
   * Envoyer un état personnalisé à chaque joueur (avec ses dés privés)
   */
  private sendPersonalizedState(roomCode: string, game: BaseGame): void {
    if (!this.io) return;

    // Obtenir tous les sockets dans cette room
    const room = this.io.sockets.adapter.rooms.get(roomCode);
    if (!room) return;

    // Pour chaque socket dans la room, envoyer un état personnalisé
    room.forEach((socketId) => {
      const socket = this.io!.sockets.sockets.get(socketId) as any;
      if (socket && socket.userId) {
        const personalState = game.getPublicState(socket.userId);
        socket.emit('game:update', { state: personalState });
      }
    });
  }

  /**
   * Sauvegarder les statistiques du jeu
   */
  private async saveGameStats(roomCode: string, result: any): Promise<void> {
    if (!result) return;

    try {
      // TODO: Implémenter la sauvegarde des stats dans la DB
      // - Mettre à jour les scores des joueurs
      // - Enregistrer l'historique de la partie
      // - Mettre à jour les statistiques globales

      console.log(`📊 Statistiques sauvegardées pour le salon ${roomCode}`);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des stats:', error);
    }
  }

  /**
   * Nettoyer un jeu terminé
   */
  private cleanupGame(roomCode: string): void {
    const game = this.games.get(roomCode);
    if (game) {
      // Nettoyer les écouteurs
      game.removeAllListeners();

      // Supprimer de la map
      this.games.delete(roomCode);

      console.log(`🧹 Jeu nettoyé pour le salon ${roomCode}`);
    }
  }

  /**
   * Obtenir les statistiques actuelles
   */
  getStats(): {
    activeGames: number;
    gamesByType: { [key: string]: number };
    totalPlayers: number;
  } {
    const stats = {
      activeGames: this.games.size,
      gamesByType: {} as { [key: string]: number },
      totalPlayers: 0
    };

    for (const game of this.games.values()) {
      const type = game.type;
      stats.gamesByType[type] = (stats.gamesByType[type] || 0) + 1;
      stats.totalPlayers += game.state.players.length;
    }

    return stats;
  }
}

// Exporter l'instance unique
export const gameManager = GameManager.getInstance();