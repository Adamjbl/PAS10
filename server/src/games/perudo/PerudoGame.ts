import { BaseGame } from '../core/BaseGame';
import { GameMove, GameResult, GameSettings } from '../core/GameInterface';

/**
 * Implémentation simplifiée du jeu Perudo
 * Pour tester l'architecture de jeu
 */
export class PerudoGame extends BaseGame {
  private currentBid: { quantity: number; dieValue: number } | null = null;
  private playerDice: Map<string, number[]> = new Map();
  private totalDiceCount = 0;
  private roundNumber = 0;

  constructor(roomCode: string) {
    const settings: GameSettings = {
      minPlayers: 2,
      maxPlayers: 6,
      dicePerPlayer: 5,
      turnTimeLimit: 60
    };
    super(roomCode, 'perudo', settings);
  }

  protected async onStart(): Promise<void> {
    console.log('🎲 Démarrage du jeu Perudo');

    // Initialiser les dés de chaque joueur
    for (const player of this._state.players) {
      const dice = this.rollDice(this._settings.dicePerPlayer || 5);
      this.playerDice.set(player.userId, dice);
      this.totalDiceCount += dice.length;
    }

    // Définir le premier joueur
    this.setCurrentTurn(this._state.players[0].userId);

    // Commencer le premier round
    this.startNewRound();
  }

  private rollDice(count: number): number[] {
    const dice: number[] = [];
    for (let i = 0; i < count; i++) {
      dice.push(Math.floor(Math.random() * 6) + 1);
    }
    return dice;
  }

  private startNewRound(): void {
    this.roundNumber++;
    this.currentBid = null;

    // Lancer les dés pour tous les joueurs actifs
    for (const player of this._state.players) {
      if (player.status === 'active' as any) {
        const dice = this.playerDice.get(player.userId);
        if (dice) {
          const newDice = this.rollDice(dice.length);
          this.playerDice.set(player.userId, newDice);
        }
      }
    }

    this.emit('round_started', {
      roundNumber: this.roundNumber,
      currentTurn: this._state.currentTurn
    });
  }

  validateMove(move: GameMove): boolean {
    console.log('🎲 [PerudoGame] validateMove:', {
      movePlayerId: move.playerId,
      currentTurn: this._state.currentTurn,
      isCorrectPlayer: move.playerId === this._state.currentTurn,
      moveType: move.type,
      moveData: move.data
    });

    // Vérifier que c'est le tour du joueur
    if (move.playerId !== this._state.currentTurn) {
      console.log('❌ [PerudoGame] Ce n\'est pas le tour de ce joueur!');
      return false;
    }

    let isValid = false;
    switch (move.type) {
      case 'bid':
        isValid = this.validateBid(move.data);
        break;
      case 'challenge':
        isValid = this.currentBid !== null;
        break;
      case 'exact':
        isValid = this.currentBid !== null;
        break;
      default:
        isValid = false;
    }

    console.log('🎲 [PerudoGame] Move validation result:', isValid);
    return isValid;
  }

  private validateBid(bid: { quantity: number; dieValue: number }): boolean {
    // Vérifier que la valeur du dé est valide (1-6, où 1 = Paco/joker)
    if (bid.dieValue < 1 || bid.dieValue > 6) {
      return false;
    }

    // Vérifier que la quantité est positive
    if (bid.quantity < 1) {
      return false;
    }

    // Si pas d'enchère précédente, toute enchère valide est acceptée
    if (!this.currentBid) {
      return true;
    }

    // Sinon, l'enchère doit être supérieure à la précédente
    // Soit plus de dés, soit même quantité mais valeur supérieure
    if (bid.quantity > this.currentBid.quantity) {
      return true;
    }

    if (bid.quantity === this.currentBid.quantity &&
        bid.dieValue > this.currentBid.dieValue) {
      return true;
    }

    return false;
  }

  protected async onProcessMove(move: GameMove): Promise<boolean> {
    switch (move.type) {
      case 'bid':
        return this.processBid(move);
      case 'challenge':
        return this.processChallenge(move);
      case 'exact':
        return this.processExact(move);
      default:
        return false;
    }
  }

  private processBid(move: GameMove): boolean {
    const bid = move.data as { quantity: number; dieValue: number };

    console.log('🎲 [PerudoGame] processBid:', {
      playerId: move.playerId,
      bid,
      previousTurn: this._state.currentTurn
    });

    this.currentBid = bid;

    // Passer au joueur suivant
    const nextPlayer = this.getNextPlayer();
    if (nextPlayer) {
      this.setCurrentTurn(nextPlayer); // Utiliser setCurrentTurn pour émettre turn_changed
    }

    console.log('🎲 [PerudoGame] Après bid, nouveau tour:', {
      nextPlayer: this._state.currentTurn
    });

    this.emit('bid_made', {
      playerId: move.playerId,
      bid,
      nextPlayer: this._state.currentTurn
    });

    return true;
  }

  private processChallenge(move: GameMove): boolean {
    if (!this.currentBid) return false;

    // Compter les dés correspondants
    const actualCount = this.countDice(this.currentBid.dieValue);

    // Déterminer le perdant
    let loserId: string;
    if (actualCount < this.currentBid.quantity) {
      // Le défi réussit - le joueur précédent perd un dé
      const players = this._state.players.filter(p => p.status === 'active' as any);
      const challengerIndex = players.findIndex(p => p.userId === move.playerId);
      const previousIndex = (challengerIndex - 1 + players.length) % players.length;
      loserId = players[previousIndex].userId;
    } else {
      // Le défi échoue - le challenger perd un dé
      loserId = move.playerId;
    }

    // Préparer les données de tous les dés pour l'animation
    const allDice = this._state.players
      .filter(p => p.status === 'active' as any)
      .map(player => ({
        playerId: player.userId,
        playerName: player.username,
        dice: this.playerDice.get(player.userId) || []
      }));

    const loserPlayer = this._state.players.find(p => p.userId === loserId);

    // Retirer un dé au perdant
    this.removeDieFromPlayer(loserId);

    // Vérifier si le joueur est éliminé
    const loserDice = this.playerDice.get(loserId);
    if (!loserDice || loserDice.length === 0) {
      this.eliminatePlayer(loserId);
    }

    this.emit('challenge_resolved', {
      challenger: move.playerId,
      bidQuantity: this.currentBid.quantity,
      bidValue: this.currentBid.dieValue,
      actualCount,
      loser: loserId,
      loserName: loserPlayer?.username || 'Unknown',
      success: actualCount < this.currentBid.quantity,
      allDice
    });

    // Commencer un nouveau round
    this.setCurrentTurn(loserId);
    this.startNewRound();

    return true;
  }

  private processExact(move: GameMove): boolean {
    if (!this.currentBid) return false;

    // Compter les dés correspondants
    const actualCount = this.countDice(this.currentBid.dieValue);
    const isExact = actualCount === this.currentBid.quantity;

    // Préparer les données de tous les dés pour l'animation
    const allDice = this._state.players
      .filter(p => p.status === 'active' as any)
      .map(player => ({
        playerId: player.userId,
        playerName: player.username,
        dice: this.playerDice.get(player.userId) || []
      }));

    let loserId: string;
    let loserName: string;

    if (isExact) {
      // Réussi - tous les autres joueurs perdent un dé
      // On considère le premier joueur affecté comme "perdant" pour l'affichage
      const otherPlayers = this._state.players.filter(
        p => p.status === 'active' as any && p.userId !== move.playerId
      );
      loserId = otherPlayers[0]?.userId || move.playerId;
      loserName = 'Tous les autres joueurs';

      for (const player of this._state.players) {
        if (player.status === 'active' as any && player.userId !== move.playerId) {
          this.removeDieFromPlayer(player.userId);
          const dice = this.playerDice.get(player.userId);
          if (!dice || dice.length === 0) {
            this.eliminatePlayer(player.userId);
          }
        }
      }
    } else {
      // Échoué - le joueur perd un dé
      loserId = move.playerId;
      const loserPlayer = this._state.players.find(p => p.userId === loserId);
      loserName = loserPlayer?.username || 'Unknown';

      this.removeDieFromPlayer(move.playerId);
      const dice = this.playerDice.get(move.playerId);
      if (!dice || dice.length === 0) {
        this.eliminatePlayer(move.playerId);
      }
    }

    this.emit('exact_resolved', {
      player: move.playerId,
      bidQuantity: this.currentBid.quantity,
      bidValue: this.currentBid.dieValue,
      actualCount,
      success: isExact,
      loser: loserId,
      loserName,
      allDice
    });

    // Commencer un nouveau round
    this.setCurrentTurn(move.playerId);
    this.startNewRound();

    return true;
  }

  private countDice(value: number): number {
    let count = 0;

    for (const [playerId, dice] of this.playerDice.entries()) {
      const player = this._state.players.find(p => p.userId === playerId);
      if (player && player.status === 'active' as any) {
        for (const die of dice) {
          // Les Pacos (1) sont des jokers
          if (die === value || die === 1) {
            count++;
          }
        }
      }
    }

    return count;
  }

  private removeDieFromPlayer(playerId: string): void {
    const dice = this.playerDice.get(playerId);
    if (dice && dice.length > 0) {
      dice.pop();
      this.totalDiceCount--;
    }
  }

  isGameOver(): boolean {
    // Le jeu est terminé quand il reste 1 joueur ou moins
    const activePlayers = this._state.players.filter(p => p.status === 'active' as any);
    return activePlayers.length <= 1;
  }

  protected calculateResult(): GameResult | null {
    const activePlayers = this._state.players.filter(p => p.status === 'active' as any);

    if (activePlayers.length === 1) {
      // Un seul gagnant
      return {
        winner: activePlayers[0].userId,
        scores: this._state.players.reduce((acc, p) => {
          acc[p.userId] = p.score || 0;
          return acc;
        }, {} as { [key: string]: number })
      };
    }

    return null;
  }

  getPublicState(playerId?: string): any {
    const baseState = super.getPublicState(playerId);

    // Ajouter les informations spécifiques à Perudo
    const perudoState = {
      ...baseState,
      roundNumber: this.roundNumber,
      currentBid: this.currentBid,
      totalDiceCount: this.totalDiceCount,
      playerDiceCount: {} as { [key: string]: number }
    };

    // Nombre de dés de chaque joueur (visible par tous)
    for (const [playerId, dice] of this.playerDice.entries()) {
      perudoState.playerDiceCount[playerId] = dice.length;
    }

    // Si un playerId est fourni, ajouter ses propres dés
    if (playerId) {
      const myDice = this.playerDice.get(playerId);
      if (myDice) {
        perudoState.myDice = myDice;
      }
    }

    return perudoState;
  }
}