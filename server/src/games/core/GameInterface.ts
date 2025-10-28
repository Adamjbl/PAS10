/**
 * Interface et types de base pour tous les jeux
 */

export enum GameStatus {
  WAITING = 'waiting',      // En attente des joueurs
  STARTING = 'starting',    // Démarrage en cours
  IN_PROGRESS = 'in_progress', // Partie en cours
  PAUSED = 'paused',       // Partie en pause
  FINISHED = 'finished'    // Partie terminée
}

export enum PlayerStatus {
  ACTIVE = 'active',       // Joueur actif dans la partie
  ELIMINATED = 'eliminated', // Joueur éliminé
  DISCONNECTED = 'disconnected', // Joueur déconnecté
  SPECTATOR = 'spectator'  // Spectateur
}

export interface GamePlayer {
  userId: string;
  username: string;
  socketId: string;
  status: PlayerStatus;
  score?: number;
  data?: any; // Données spécifiques au jeu
}

export interface GameMove {
  playerId: string;
  type: string;
  data: any;
  timestamp: Date;
}

export interface GameState {
  id: string;
  roomCode: string;
  type: 'perudo' | 'codenames' | 'quiz';
  status: GameStatus;
  players: GamePlayer[];
  currentTurn?: string; // ID du joueur dont c'est le tour
  winner?: string | string[]; // ID du/des gagnant(s)
  startedAt?: Date;
  finishedAt?: Date;
  gameData: any; // Données spécifiques au jeu
  settings: GameSettings;
}

export interface GameSettings {
  minPlayers: number;
  maxPlayers: number;
  timeLimit?: number; // En secondes
  turnTimeLimit?: number; // En secondes
  [key: string]: any; // Paramètres spécifiques au jeu
}

export interface GameResult {
  winner: string | string[];
  scores: { [playerId: string]: number };
  stats?: any;
}

export interface GameEvent {
  type: string;
  data: any;
  playerId?: string;
  timestamp: Date;
}

/**
 * Interface que tous les jeux doivent implémenter
 */
export interface IGame {
  // Propriétés
  readonly id: string;
  readonly roomCode: string;
  readonly type: string;
  readonly state: GameState;
  readonly settings: GameSettings;

  // Méthodes de cycle de vie
  initialize(players: GamePlayer[], settings?: Partial<GameSettings>): void;
  start(): Promise<void>;
  pause(): void;
  resume(): void;
  end(reason?: string): void;

  // Méthodes de jeu
  processMove(move: GameMove): Promise<boolean>;
  validateMove(move: GameMove): boolean;
  getCurrentTurn(): string | null;
  getNextPlayer(): string | null;

  // Gestion des joueurs
  addPlayer(player: GamePlayer): boolean;
  removePlayer(playerId: string): void;
  reconnectPlayer(playerId: string, socketId: string): void;

  // État et données
  getState(): GameState;
  getPublicState(playerId?: string): any; // État visible par un joueur
  getResult(): GameResult | null;
  isGameOver(): boolean;

  // Événements
  on(event: string, callback: (data: any) => void): void;
  emit(event: string, data: any): void;
  off(event: string, callback?: (data: any) => void): void;
}