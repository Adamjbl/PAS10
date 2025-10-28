import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  IGame,
  GameState,
  GameStatus,
  GamePlayer,
  PlayerStatus,
  GameMove,
  GameSettings,
  GameResult,
  GameEvent
} from './GameInterface';

/**
 * Classe abstraite de base pour tous les jeux
 */
export abstract class BaseGame extends EventEmitter implements IGame {
  protected _id: string;
  protected _roomCode: string;
  protected _type: string;
  protected _state: GameState;
  protected _settings: GameSettings;
  protected _eventLog: GameEvent[] = [];
  protected _moveHistory: GameMove[] = [];

  constructor(roomCode: string, type: string, settings: GameSettings) {
    super();
    this._id = uuidv4();
    this._roomCode = roomCode;
    this._type = type;
    this._settings = settings;
    this._state = {
      id: this._id,
      roomCode: this._roomCode,
      type: type as any,
      status: GameStatus.WAITING,
      players: [],
      gameData: {},
      settings: this._settings
    };
  }

  // Getters
  get id(): string { return this._id; }
  get roomCode(): string { return this._roomCode; }
  get type(): string { return this._type; }
  get state(): GameState { return this._state; }
  get settings(): GameSettings { return this._settings; }

  // Méthodes de cycle de vie
  initialize(players: GamePlayer[], settings?: Partial<GameSettings>): void {
    if (this._state.status !== GameStatus.WAITING) {
      throw new Error('Le jeu a déjà été initialisé');
    }

    // Appliquer les paramètres personnalisés
    if (settings) {
      this._settings = { ...this._settings, ...settings };
      this._state.settings = this._settings;
    }

    // Valider le nombre de joueurs
    if (players.length < this._settings.minPlayers) {
      throw new Error(`Minimum ${this._settings.minPlayers} joueurs requis`);
    }
    if (players.length > this._settings.maxPlayers) {
      throw new Error(`Maximum ${this._settings.maxPlayers} joueurs autorisés`);
    }

    // Initialiser les joueurs
    this._state.players = players.map(p => ({
      ...p,
      status: PlayerStatus.ACTIVE,
      score: 0
    }));

    this.logEvent('game_initialized', { players: players.length });
    this.emit('initialized', this.getPublicState());
  }

  async start(): Promise<void> {
    if (this._state.status !== GameStatus.WAITING) {
      throw new Error('Le jeu ne peut être démarré que depuis l\'état WAITING');
    }

    this._state.status = GameStatus.STARTING;
    this._state.startedAt = new Date();

    // Initialisation spécifique au jeu
    await this.onStart();

    this._state.status = GameStatus.IN_PROGRESS;
    this.logEvent('game_started', {});
    this.emit('started', this.getPublicState());
  }

  pause(): void {
    if (this._state.status !== GameStatus.IN_PROGRESS) {
      throw new Error('Seul un jeu en cours peut être mis en pause');
    }

    this._state.status = GameStatus.PAUSED;
    this.logEvent('game_paused', {});
    this.emit('paused', this.getPublicState());
  }

  resume(): void {
    if (this._state.status !== GameStatus.PAUSED) {
      throw new Error('Seul un jeu en pause peut être repris');
    }

    this._state.status = GameStatus.IN_PROGRESS;
    this.logEvent('game_resumed', {});
    this.emit('resumed', this.getPublicState());
  }

  end(reason: string = 'normal'): void {
    if (this._state.status === GameStatus.FINISHED) {
      return;
    }

    this._state.status = GameStatus.FINISHED;
    this._state.finishedAt = new Date();

    const result = this.calculateResult();
    if (result) {
      this._state.winner = result.winner;
    }

    this.logEvent('game_ended', { reason, result });
    this.emit('ended', { reason, result, state: this.getPublicState() });
  }

  // Méthodes de jeu
  async processMove(move: GameMove): Promise<boolean> {
    // Vérifier que le jeu est en cours
    if (this._state.status !== GameStatus.IN_PROGRESS) {
      return false;
    }

    // Vérifier que c'est le tour du joueur
    if (this._state.currentTurn && this._state.currentTurn !== move.playerId) {
      return false;
    }

    // Valider le mouvement
    if (!this.validateMove(move)) {
      return false;
    }

    // Traiter le mouvement (implémenté par chaque jeu)
    const success = await this.onProcessMove(move);

    if (success) {
      this._moveHistory.push(move);
      this.logEvent('move_processed', { move });
      this.emit('move', { move, state: this.getPublicState() });

      // Vérifier si la partie est terminée
      if (this.isGameOver()) {
        this.end('game_over');
      }
    }

    return success;
  }

  getCurrentTurn(): string | null {
    return this._state.currentTurn || null;
  }

  getNextPlayer(): string | null {
    const activePlayers = this._state.players.filter(p => p.status === PlayerStatus.ACTIVE);
    if (activePlayers.length === 0) return null;

    if (!this._state.currentTurn) {
      return activePlayers[0].userId;
    }

    const currentIndex = activePlayers.findIndex(p => p.userId === this._state.currentTurn);
    const nextIndex = (currentIndex + 1) % activePlayers.length;
    return activePlayers[nextIndex].userId;
  }

  // Gestion des joueurs
  addPlayer(player: GamePlayer): boolean {
    if (this._state.status !== GameStatus.WAITING) {
      return false;
    }

    if (this._state.players.length >= this._settings.maxPlayers) {
      return false;
    }

    if (this._state.players.some(p => p.userId === player.userId)) {
      return false;
    }

    this._state.players.push({
      ...player,
      status: PlayerStatus.ACTIVE,
      score: 0
    });

    this.logEvent('player_added', { playerId: player.userId });
    this.emit('player_added', { player, state: this.getPublicState() });
    return true;
  }

  removePlayer(playerId: string): void {
    const playerIndex = this._state.players.findIndex(p => p.userId === playerId);
    if (playerIndex === -1) return;

    if (this._state.status === GameStatus.WAITING) {
      // Si le jeu n'a pas commencé, retirer complètement le joueur
      this._state.players.splice(playerIndex, 1);
    } else {
      // Si le jeu est en cours, marquer comme déconnecté
      this._state.players[playerIndex].status = PlayerStatus.DISCONNECTED;
    }

    this.logEvent('player_removed', { playerId });
    this.emit('player_removed', { playerId, state: this.getPublicState() });

    // Vérifier si le jeu doit se terminer
    const activePlayers = this._state.players.filter(p => p.status === PlayerStatus.ACTIVE);
    if (activePlayers.length < 2 && this._state.status === GameStatus.IN_PROGRESS) {
      this.end('not_enough_players');
    }
  }

  reconnectPlayer(playerId: string, socketId: string): void {
    const player = this._state.players.find(p => p.userId === playerId);
    if (!player) return;

    player.socketId = socketId;
    if (player.status === PlayerStatus.DISCONNECTED) {
      player.status = PlayerStatus.ACTIVE;
    }

    this.logEvent('player_reconnected', { playerId });
    this.emit('player_reconnected', { playerId, state: this.getPublicState() });
  }

  // État et données
  getState(): GameState {
    return { ...this._state };
  }

  getPublicState(_playerId?: string): any {
    // Par défaut, retourner l'état complet
    // Les jeux spécifiques peuvent surcharger pour cacher des informations
    return {
      id: this._id,
      roomCode: this._roomCode,
      type: this._type,
      status: this._state.status,
      players: this._state.players.map(p => ({
        userId: p.userId,
        username: p.username,
        status: p.status,
        score: p.score
      })),
      currentTurn: this._state.currentTurn,
      winner: this._state.winner,
      startedAt: this._state.startedAt,
      settings: {
        minPlayers: this._settings.minPlayers,
        maxPlayers: this._settings.maxPlayers,
        timeLimit: this._settings.timeLimit
      }
    };
  }

  getResult(): GameResult | null {
    if (this._state.status !== GameStatus.FINISHED) {
      return null;
    }
    return this.calculateResult();
  }

  // Méthodes utilitaires
  protected logEvent(type: string, data: any): void {
    this._eventLog.push({
      type,
      data,
      timestamp: new Date()
    });
  }

  protected setCurrentTurn(playerId: string): void {
    this._state.currentTurn = playerId;
    this.emit('turn_changed', { playerId, state: this.getPublicState() });
  }

  protected updatePlayerScore(playerId: string, score: number): void {
    const player = this._state.players.find(p => p.userId === playerId);
    if (player) {
      player.score = score;
    }
  }

  protected eliminatePlayer(playerId: string): void {
    const player = this._state.players.find(p => p.userId === playerId);
    if (player) {
      player.status = PlayerStatus.ELIMINATED;
      this.emit('player_eliminated', { playerId, state: this.getPublicState() });
    }
  }

  // Méthodes abstraites à implémenter par chaque jeu
  abstract validateMove(move: GameMove): boolean;
  abstract isGameOver(): boolean;
  protected abstract onStart(): Promise<void>;
  protected abstract onProcessMove(move: GameMove): Promise<boolean>;
  protected abstract calculateResult(): GameResult | null;
}