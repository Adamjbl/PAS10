import { Server } from 'socket.io';
import { AuthSocket } from '../auth.socket';
import { gameManager } from '../../games/core/GameManager';
import Room from '../../models/Room';

/**
 * Handler des événements de jeu
 */
export const setupGameHandlers = (io: Server, socket: AuthSocket) => {
  /**
   * Créer et démarrer un jeu
   */
  socket.on('game:create', async (data: { roomCode: string }) => {
    try {
      const { roomCode } = data;
      console.log(`🎮 Création du jeu pour le salon ${roomCode} par ${socket.user.username}`);

      // Vérifier que le joueur est l'hôte du salon
      const room = await Room.findOne({ code: roomCode.toUpperCase() })
        .populate('host', 'username');

      if (!room) {
        socket.emit('game:error', { message: 'Salon non trouvé' });
        return;
      }

      if (room.host._id.toString() !== socket.userId) {
        socket.emit('game:error', { message: 'Seul l\'hôte peut démarrer la partie' });
        return;
      }

      // Vérifier qu'il n'y a pas déjà un jeu en cours
      if (gameManager.hasGame(roomCode.toUpperCase())) {
        socket.emit('game:error', { message: 'Une partie est déjà en cours' });
        return;
      }

      // Créer le jeu
      const game = await gameManager.createGame(
        roomCode.toUpperCase(),
        room.gameType
      );

      // Notifier tous les joueurs du salon
      io.to(roomCode.toUpperCase()).emit('game:created', {
        state: game.getPublicState()
      });

      // Démarrer automatiquement le jeu
      await gameManager.startGame(roomCode.toUpperCase());

    } catch (error: any) {
      console.error('Erreur lors de la création du jeu:', error);
      socket.emit('game:error', {
        message: error.message || 'Erreur lors de la création du jeu'
      });
    }
  });

  /**
   * Traiter un mouvement de jeu
   */
  socket.on('game:move', async (data: {
    roomCode: string;
    move: {
      type: string;
      data: any;
    }
  }) => {
    try {
      const { roomCode, move } = data;

      // Vérifier que le jeu existe
      const game = gameManager.getGame(roomCode.toUpperCase());
      if (!game) {
        socket.emit('game:error', { message: 'Aucune partie en cours' });
        return;
      }

      // Créer l'objet de mouvement complet
      const gameMove = {
        playerId: socket.userId!,
        type: move.type,
        data: move.data,
        timestamp: new Date()
      };

      // Traiter le mouvement
      const success = await gameManager.processMove(
        roomCode.toUpperCase(),
        socket.userId!,
        gameMove
      );

      if (!success) {
        socket.emit('game:move_rejected', {
          reason: 'Mouvement invalide'
        });
      }

    } catch (error: any) {
      console.error('Erreur lors du traitement du mouvement:', error);
      socket.emit('game:error', {
        message: error.message || 'Erreur lors du traitement du mouvement'
      });
    }
  });

  /**
   * Mettre le jeu en pause
   */
  socket.on('game:pause', async (data: { roomCode: string }) => {
    try {
      const { roomCode } = data;

      // Vérifier que le joueur est l'hôte
      const room = await Room.findOne({ code: roomCode.toUpperCase() });
      if (!room || room.host.toString() !== socket.userId) {
        socket.emit('game:error', { message: 'Seul l\'hôte peut mettre en pause' });
        return;
      }

      gameManager.pauseGame(roomCode.toUpperCase());

    } catch (error: any) {
      console.error('Erreur lors de la mise en pause:', error);
      socket.emit('game:error', {
        message: error.message || 'Erreur lors de la mise en pause'
      });
    }
  });

  /**
   * Reprendre le jeu
   */
  socket.on('game:resume', async (data: { roomCode: string }) => {
    try {
      const { roomCode } = data;

      // Vérifier que le joueur est l'hôte
      const room = await Room.findOne({ code: roomCode.toUpperCase() });
      if (!room || room.host.toString() !== socket.userId) {
        socket.emit('game:error', { message: 'Seul l\'hôte peut reprendre la partie' });
        return;
      }

      gameManager.resumeGame(roomCode.toUpperCase());

    } catch (error: any) {
      console.error('Erreur lors de la reprise:', error);
      socket.emit('game:error', {
        message: error.message || 'Erreur lors de la reprise'
      });
    }
  });

  /**
   * Terminer le jeu
   */
  socket.on('game:end', async (data: {
    roomCode: string;
    reason?: string;
  }) => {
    try {
      const { roomCode, reason = 'host_ended' } = data;

      // Vérifier que le joueur est l'hôte
      const room = await Room.findOne({ code: roomCode.toUpperCase() });
      if (!room || room.host.toString() !== socket.userId) {
        socket.emit('game:error', { message: 'Seul l\'hôte peut terminer la partie' });
        return;
      }

      await gameManager.endGame(roomCode.toUpperCase(), reason);

    } catch (error: any) {
      console.error('Erreur lors de la fin du jeu:', error);
      socket.emit('game:error', {
        message: error.message || 'Erreur lors de la fin du jeu'
      });
    }
  });

  /**
   * Obtenir l'état actuel du jeu
   */
  socket.on('game:get_state', (data: { roomCode: string }) => {
    try {
      const { roomCode } = data;

      const state = gameManager.getGameState(
        roomCode.toUpperCase(),
        socket.userId
      );

      if (state) {
        socket.emit('game:state', { state });
      } else {
        socket.emit('game:error', { message: 'Aucune partie en cours' });
      }

    } catch (error: any) {
      console.error('Erreur lors de la récupération de l\'état:', error);
      socket.emit('game:error', {
        message: error.message || 'Erreur lors de la récupération de l\'état'
      });
    }
  });

  /**
   * Envoyer un message dans le chat du jeu
   */
  socket.on('game:chat', (data: {
    roomCode: string;
    message: string;
  }) => {
    const { roomCode, message } = data;

    // Vérifier que le jeu existe
    if (!gameManager.hasGame(roomCode.toUpperCase())) {
      return;
    }

    // Émettre le message à tous les joueurs
    io.to(roomCode.toUpperCase()).emit('game:chat_message', {
      playerId: socket.userId,
      username: socket.user.username,
      message,
      timestamp: new Date()
    });

    console.log(`💬 [Jeu ${roomCode}] ${socket.user.username}: ${message}`);
  });

  /**
   * Gérer la déconnexion d'un joueur
   */
  socket.on('disconnect', () => {
    // Trouver tous les jeux où le joueur est présent
    const stats = gameManager.getStats();
    console.log(`🎮 Joueur déconnecté. Stats: ${stats.activeGames} jeux actifs`);

    // TODO: Implémenter la recherche du jeu actuel du joueur
    // et appeler gameManager.handlePlayerDisconnect
  });

  /**
   * Gérer les actions spécifiques à chaque type de jeu
   */

  // Perudo
  socket.on('perudo:bid', async (data: {
    roomCode: string;
    bid: {
      quantity: number;
      dieValue: number;
    }
  }) => {
    try {
      const { roomCode, bid } = data;

      const gameMove = {
        playerId: socket.userId!,
        type: 'bid',
        data: bid,
        timestamp: new Date()
      };

      await gameManager.processMove(
        roomCode.toUpperCase(),
        socket.userId!,
        gameMove
      );

    } catch (error: any) {
      socket.emit('game:error', {
        message: error.message || 'Erreur lors de l\'enchère'
      });
    }
  });

  socket.on('perudo:challenge', async (data: { roomCode: string }) => {
    try {
      const { roomCode } = data;

      const gameMove = {
        playerId: socket.userId!,
        type: 'challenge',
        data: {},
        timestamp: new Date()
      };

      await gameManager.processMove(
        roomCode.toUpperCase(),
        socket.userId!,
        gameMove
      );

    } catch (error: any) {
      socket.emit('game:error', {
        message: error.message || 'Erreur lors du défi'
      });
    }
  });

  socket.on('perudo:exact', async (data: { roomCode: string }) => {
    try {
      const { roomCode } = data;

      const gameMove = {
        playerId: socket.userId!,
        type: 'exact',
        data: {},
        timestamp: new Date()
      };

      await gameManager.processMove(
        roomCode.toUpperCase(),
        socket.userId!,
        gameMove
      );

    } catch (error: any) {
      socket.emit('game:error', {
        message: error.message || 'Erreur lors de l\'exact'
      });
    }
  });

  // Codenames
  socket.on('codenames:give_clue', async (data: {
    roomCode: string;
    clue: {
      word: string;
      number: number;
    }
  }) => {
    try {
      const { roomCode, clue } = data;

      const gameMove = {
        playerId: socket.userId!,
        type: 'give_clue',
        data: clue,
        timestamp: new Date()
      };

      await gameManager.processMove(
        roomCode.toUpperCase(),
        socket.userId!,
        gameMove
      );

    } catch (error: any) {
      socket.emit('game:error', {
        message: error.message || 'Erreur lors de l\'indice'
      });
    }
  });

  socket.on('codenames:guess_word', async (data: {
    roomCode: string;
    position: number;
  }) => {
    try {
      const { roomCode, position } = data;

      const gameMove = {
        playerId: socket.userId!,
        type: 'guess_word',
        data: { position },
        timestamp: new Date()
      };

      await gameManager.processMove(
        roomCode.toUpperCase(),
        socket.userId!,
        gameMove
      );

    } catch (error: any) {
      socket.emit('game:error', {
        message: error.message || 'Erreur lors de la devinette'
      });
    }
  });

  socket.on('codenames:end_turn', async (data: { roomCode: string }) => {
    try {
      const { roomCode } = data;

      const gameMove = {
        playerId: socket.userId!,
        type: 'end_turn',
        data: {},
        timestamp: new Date()
      };

      await gameManager.processMove(
        roomCode.toUpperCase(),
        socket.userId!,
        gameMove
      );

    } catch (error: any) {
      socket.emit('game:error', {
        message: error.message || 'Erreur lors de la fin du tour'
      });
    }
  });

  // Quiz
  // TODO: Implémenter les événements Quiz
};