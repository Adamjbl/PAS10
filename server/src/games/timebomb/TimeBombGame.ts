import { BaseGame } from '../core/BaseGame';
import {
  GameMove,
  GameSettings,
  GameResult,
  GamePlayer
} from '../core/GameInterface';

type Role = 'sherlock' | 'moriarty' | 'innocent';
type Team = 'blue' | 'red';
type WireType = 'safe' | 'bomb' | 'defuse';

interface Wire {
  playerId: string;
  wireIndex: number;
  revealed: boolean;
  type: WireType;
}

interface TimeBombPlayer extends GamePlayer {
  role: Role;
  team: Team;
  wires: Wire[];
  isAlive: boolean;
  wiresRemaining: number;
}

interface TimeBombGameData {
  players: TimeBombPlayer[];
  currentTurnIndex: number;
  defuseCount: number;
  bombCount: number;
  round: number;
  gamePhase: 'role-reveal' | 'playing' | 'game-over';
}

export class TimeBombGame extends BaseGame {
  private gameData: TimeBombGameData;

  constructor(roomCode: string) {
    const settings: GameSettings = {
      minPlayers: 4,
      maxPlayers: 8,
      timeLimit: 0, // Pas de limite de temps
      turnTimeLimit: 60 // 60 secondes par tour
    };

    super(roomCode, 'timebomb', settings);

    this.gameData = {
      players: [],
      currentTurnIndex: 0,
      defuseCount: 0,
      bombCount: 0,
      round: 1,
      gamePhase: 'role-reveal'
    };

    this._state.gameData = this.gameData;
  }

  protected async onStart(): Promise<void> {
    // Assigner les rôles aux joueurs
    this.assignRoles();

    // Distribuer les câbles
    this.distributeWires();

    // Définir le premier joueur
    this.gameData.currentTurnIndex = 0;
    this.setCurrentTurn(this.gameData.players[0].userId);

    // Phase de révélation des rôles
    this.gameData.gamePhase = 'role-reveal';
    this._state.gameData = this.gameData;
  }

  private assignRoles(): void {
    const playerCount = this._state.players.length;
    const roles: Array<{ role: Role; team: Team }> = [];

    // Distribution des rôles selon le nombre de joueurs
    if (playerCount <= 5) {
      roles.push({ role: 'sherlock', team: 'blue' });
      roles.push({ role: 'moriarty', team: 'red' });
      const blueInnocents = Math.floor((playerCount - 2) / 2);
      const redInnocents = playerCount - 2 - blueInnocents;
      for (let i = 0; i < blueInnocents; i++) roles.push({ role: 'innocent', team: 'blue' });
      for (let i = 0; i < redInnocents; i++) roles.push({ role: 'innocent', team: 'red' });
    } else {
      roles.push({ role: 'sherlock', team: 'blue' });
      roles.push({ role: 'moriarty', team: 'red' });
      const blueInnocents = Math.floor((playerCount - 2) * 0.6);
      const redInnocents = playerCount - 2 - blueInnocents;
      for (let i = 0; i < blueInnocents; i++) roles.push({ role: 'innocent', team: 'blue' });
      for (let i = 0; i < redInnocents; i++) roles.push({ role: 'innocent', team: 'red' });
    }

    // Mélanger les rôles
    const shuffledRoles = this.shuffle(roles);

    // Créer les joueurs Time Bomb avec leurs rôles
    this.gameData.players = this._state.players.map((player, index) => ({
      ...player,
      role: shuffledRoles[index].role,
      team: shuffledRoles[index].team,
      wires: [],
      isAlive: true,
      wiresRemaining: 4
    }));
  }

  private distributeWires(): void {
    const wiresPerPlayer = 4;

    this.gameData.players.forEach((player) => {
      const wires: Wire[] = [];
      const wireTypes: WireType[] = [];

      // Distribution des câbles selon l'équipe et le rôle
      if (player.team === 'blue') {
        // Équipe bleue : 1 câble de désamorçage + 3 câbles sûrs
        wireTypes.push('defuse');
        for (let i = 0; i < wiresPerPlayer - 1; i++) wireTypes.push('safe');
      } else {
        // Équipe rouge
        if (player.role === 'moriarty') {
          // Moriarty : 1 bombe + 3 câbles sûrs
          wireTypes.push('bomb');
          for (let i = 0; i < wiresPerPlayer - 1; i++) wireTypes.push('safe');
        } else {
          // Innocents rouges : 4 câbles sûrs
          for (let i = 0; i < wiresPerPlayer; i++) wireTypes.push('safe');
        }
      }

      // Mélanger les types de câbles
      const shuffledWireTypes = this.shuffle(wireTypes);

      // Créer les câbles
      for (let i = 0; i < wiresPerPlayer; i++) {
        wires.push({
          playerId: player.userId,
          wireIndex: i,
          revealed: false,
          type: shuffledWireTypes[i]
        });
      }

      player.wires = wires;
    });
  }

  validateMove(move: GameMove): boolean {
    if (move.type === 'acknowledge_role') {
      return this.gameData.gamePhase === 'role-reveal';
    }

    if (this.gameData.gamePhase !== 'playing') {
      return false;
    }

    if (move.type === 'cut_wire') {
      const { playerId, wireIndex } = move.data;

      // Vérifier que c'est le tour du joueur qui coupe
      const currentPlayer = this.gameData.players[this.gameData.currentTurnIndex];
      if (!currentPlayer || currentPlayer.userId !== move.playerId) {
        return false;
      }

      // Vérifier que le joueur coupe son propre câble
      if (playerId !== move.playerId) {
        return false;
      }

      // Vérifier que le câble existe et n'est pas déjà révélé
      const player = this.gameData.players.find(p => p.userId === playerId);
      if (!player) return false;

      const wire = player.wires.find(w => w.wireIndex === wireIndex);
      if (!wire || wire.revealed) return false;

      return true;
    }

    return false;
  }

  protected async onProcessMove(move: GameMove): Promise<boolean> {
    if (move.type === 'cut_wire') {
      return this.processCutWire(move);
    }

    if (move.type === 'acknowledge_role') {
      this.gameData.gamePhase = 'playing';
      this._state.gameData = this.gameData;
      this.emit('phase_changed', { phase: 'playing', state: this.getPublicState() });
      return true;
    }

    return false;
  }

  private processCutWire(move: GameMove): boolean {
    const { playerId, wireIndex } = move.data;

    const player = this.gameData.players.find(p => p.userId === playerId);
    if (!player) return false;

    const wire = player.wires.find(w => w.wireIndex === wireIndex);
    if (!wire) return false;

    // Révéler le câble
    wire.revealed = true;
    player.wiresRemaining = player.wires.filter(w => !w.revealed).length;
    player.isAlive = player.wiresRemaining > 0;

    // Vérifier le type de câble coupé
    if (wire.type === 'defuse') {
      this.gameData.defuseCount++;

      if (this.gameData.defuseCount >= 4) {
        // Victoire de l'équipe bleue
        this._state.winner = this.gameData.players
          .filter(p => p.team === 'blue')
          .map(p => p.userId);
        this.gameData.gamePhase = 'game-over';
        this.emit('game_won', {
          team: 'blue',
          reason: 'defused',
          state: this.getPublicState()
        });
      } else {
        this.emit('defuse_cut', {
          count: this.gameData.defuseCount,
          state: this.getPublicState()
        });
      }
    } else if (wire.type === 'bomb') {
      this.gameData.bombCount++;

      // Victoire de l'équipe rouge
      this._state.winner = this.gameData.players
        .filter(p => p.team === 'red')
        .map(p => p.userId);
      this.gameData.gamePhase = 'game-over';
      this.emit('game_won', {
        team: 'red',
        reason: 'exploded',
        state: this.getPublicState()
      });
    } else {
      this.emit('safe_cut', { state: this.getPublicState() });
    }

    // Passer au joueur suivant
    this.nextTurn();

    this._state.gameData = this.gameData;
    return true;
  }

  private nextTurn(): void {
    if (this.gameData.gamePhase === 'game-over') return;

    let attempts = 0;
    const maxAttempts = this.gameData.players.length;

    do {
      this.gameData.currentTurnIndex =
        (this.gameData.currentTurnIndex + 1) % this.gameData.players.length;
      attempts++;
    } while (
      !this.gameData.players[this.gameData.currentTurnIndex].isAlive &&
      attempts < maxAttempts
    );

    const nextPlayer = this.gameData.players[this.gameData.currentTurnIndex];
    if (nextPlayer) {
      this.setCurrentTurn(nextPlayer.userId);
    }
  }

  isGameOver(): boolean {
    return this.gameData.gamePhase === 'game-over' ||
           this.gameData.defuseCount >= 4 ||
           this.gameData.bombCount >= 1;
  }

  protected calculateResult(): GameResult | null {
    if (!this.isGameOver()) {
      return null;
    }

    const scores: { [playerId: string]: number } = {};
    const winners = Array.isArray(this._state.winner)
      ? this._state.winner
      : [this._state.winner || ''];

    this.gameData.players.forEach(player => {
      scores[player.userId] = winners.includes(player.userId) ? 1 : 0;
    });

    return {
      winner: this._state.winner || [],
      scores,
      stats: {
        defuseCount: this.gameData.defuseCount,
        bombCount: this.gameData.bombCount,
        rounds: this.gameData.round
      }
    };
  }

  getPublicState(playerId?: string): any {
    const baseState = super.getPublicState(playerId);

    // Si un playerId est fourni, renvoyer les informations spécifiques à ce joueur
    if (playerId) {
      const player = this.gameData.players.find(p => p.userId === playerId);

      return {
        ...baseState,
        gameData: {
          players: this.gameData.players.map(p => ({
            userId: p.userId,
            username: p.username,
            status: p.status,
            isAlive: p.isAlive,
            wiresRemaining: p.wiresRemaining,
            wires: p.userId === playerId
              ? p.wires // Le joueur voit tous ses câbles
              : p.wires.map(w => ({ // Les autres joueurs voient seulement les câbles révélés
                  ...w,
                  type: w.revealed ? w.type : undefined
                })),
            role: p.userId === playerId ? p.role : undefined, // Seulement son propre rôle
            team: p.userId === playerId ? p.team : undefined  // Seulement sa propre équipe
          })),
          currentTurnIndex: this.gameData.currentTurnIndex,
          currentTurnPlayerId: this.gameData.players[this.gameData.currentTurnIndex]?.userId,
          defuseCount: this.gameData.defuseCount,
          bombCount: this.gameData.bombCount,
          round: this.gameData.round,
          gamePhase: this.gameData.gamePhase,
          playerRole: player ? { role: player.role, team: player.team } : null
        }
      };
    }

    // État complet pour l'observateur ou le serveur
    return {
      ...baseState,
      gameData: {
        players: this.gameData.players,
        currentTurnIndex: this.gameData.currentTurnIndex,
        currentTurnPlayerId: this.gameData.players[this.gameData.currentTurnIndex]?.userId,
        defuseCount: this.gameData.defuseCount,
        bombCount: this.gameData.bombCount,
        round: this.gameData.round,
        gamePhase: this.gameData.gamePhase
      }
    };
  }

  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
