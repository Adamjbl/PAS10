import { Router, Request, Response } from 'express';
import Room from '../models/Room';
import { generateRoomCode, validateRoomCode } from '../utils/roomCode';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/rooms
 * Créer un nouveau salon
 */
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentification requise',
        message: 'Utilisateur non authentifié'
      });
      return;
    }

    const { gameType, maxPlayers, isPrivate } = req.body;

    // Validation
    if (!gameType) {
      res.status(400).json({
        error: 'Erreur de validation',
        message: 'Le type de jeu est requis'
      });
      return;
    }

    const validGameTypes = ['perudo', 'codenames', 'quiz'];
    if (!validGameTypes.includes(gameType)) {
      res.status(400).json({
        error: 'Erreur de validation',
        message: 'Type de jeu invalide'
      });
      return;
    }

    // Générer un code unique
    const code = await generateRoomCode();

    // Créer le salon
    const room = await Room.create({
      code,
      host: req.user._id,
      players: [{
        userId: req.user._id,
        socketId: null,
        status: 'connected',
        joinedAt: new Date()
      }],
      gameType,
      status: 'waiting',
      maxPlayers: maxPlayers || 8,
      isPrivate: isPrivate || false,
      settings: {}
    });

    // Peupler les données du host
    await room.populate('host', 'username email');

    res.status(201).json({
      message: 'Salon créé avec succès',
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
  } catch (error) {
    console.error('Erreur création salon:', error);
    res.status(500).json({
      error: 'Échec de création du salon',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * GET /api/rooms
 * Obtenir la liste des salons publics
 */
router.get('/', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const rooms = await Room.find({
      status: 'waiting',
      isPrivate: { $ne: true }
    })
      .populate('host', 'username email')
      .populate('players.userId', 'username')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      rooms: rooms.map(room => ({
        _id: room._id,
        code: room.code,
        host: room.host,
        playerCount: room.players.filter(p => p.status === 'connected').length,
        maxPlayers: room.maxPlayers,
        gameType: room.gameType,
        status: room.status,
        createdAt: room.createdAt
      }))
    });
  } catch (error) {
    console.error('Erreur récupération salons:', error);
    res.status(500).json({
      error: 'Échec de récupération des salons',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * GET /api/rooms/:code
 * Obtenir les informations d'un salon spécifique
 */
router.get('/:code', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    // Valider le format du code
    if (!validateRoomCode(code.toUpperCase())) {
      res.status(400).json({
        error: 'Code invalide',
        message: 'Le code doit être 4 caractères alphanumériques'
      });
      return;
    }

    const room = await Room.findOne({ code: code.toUpperCase() })
      .populate('host', 'username email stats')
      .populate('players.userId', 'username email');

    if (!room) {
      res.status(404).json({
        error: 'Salon non trouvé',
        message: 'Aucun salon avec ce code'
      });
      return;
    }

    res.json({
      room: {
        _id: room._id,
        code: room.code,
        host: room.host,
        players: room.players,
        gameType: room.gameType,
        status: room.status,
        maxPlayers: room.maxPlayers,
        isPrivate: room.isPrivate,
        settings: room.settings,
        createdAt: room.createdAt
      }
    });
  } catch (error) {
    console.error('Erreur récupération salon:', error);
    res.status(500).json({
      error: 'Échec de récupération du salon',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * DELETE /api/rooms/:code
 * Supprimer un salon (host uniquement)
 */
router.delete('/:code', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentification requise',
        message: 'Utilisateur non authentifié'
      });
      return;
    }

    const { code } = req.params;

    const room = await Room.findOne({ code: code.toUpperCase() });

    if (!room) {
      res.status(404).json({
        error: 'Salon non trouvé',
        message: 'Aucun salon avec ce code'
      });
      return;
    }

    // Vérifier que l'utilisateur est le host
    if (room.host.toString() !== req.user._id) {
      res.status(403).json({
        error: 'Accès refusé',
        message: 'Seul l\'hôte peut supprimer le salon'
      });
      return;
    }

    await Room.deleteOne({ _id: room._id });

    res.json({
      message: 'Salon supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression salon:', error);
    res.status(500).json({
      error: 'Échec de suppression du salon',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

export default router;
