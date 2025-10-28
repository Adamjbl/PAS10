import { BaseGame } from '../core/BaseGame';
import { GameMove, GameStatus, PlayerStatus, GameResult } from '../core/GameInterface';

interface CodenamesCard {
  word: string;
  type: 'red' | 'blue' | 'neutral' | 'assassin';
  revealed: boolean;
  position: number;
}

export class CodenamesGame extends BaseGame {
  private words: string[] = [
    'CHAT', 'CHIEN', 'MAISON', 'ARBRE', 'VOITURE', 'LIVRE', 'TABLE', 'CHAISE',
    'SOLEIL', 'LUNE', 'ÉTOILE', 'MER', 'MONTAGNE', 'RIVIÈRE', 'FORÊT', 'JARDIN',
    'FLEUR', 'OISEAU', 'POISSON', 'PAIN', 'VIN', 'FROMAGE', 'CAFÉ', 'THÉ',
    'MUSIQUE', 'FILM', 'THÉÂTRE', 'PEINTURE', 'DANSE', 'SPORT', 'JEU', 'CARTE',
    'TÉLÉPHONE', 'ORDINATEUR', 'INTERNET', 'ROBOT', 'AVION', 'TRAIN', 'BATEAU', 'VÉLO',
    'ÉCOLE', 'UNIVERSITÉ', 'BIBLIOTHÈQUE', 'MUSÉE', 'HÔPITAL', 'RESTAURANT', 'HÔTEL', 'MAGASIN',
    'ARGENT', 'BANQUE', 'TRAVAIL', 'VACANCES', 'VOYAGE', 'PLAGE', 'NEIGE', 'PLUIE',
    'VENT', 'FEU', 'EAU', 'TERRE', 'AIR', 'TEMPS', 'ESPACE', 'UNIVERS',
    'AMOUR', 'AMITIÉ', 'FAMILLE', 'ENFANT', 'PARENT', 'FRÈRE', 'SOEUR', 'AMI',
    'GUERRE', 'PAIX', 'LIBERTÉ', 'JUSTICE', 'VÉRITÉ', 'MENSONGE', 'SECRET', 'MYSTÈRE',
    'COULEUR', 'ROUGE', 'BLEU', 'VERT', 'JAUNE', 'NOIR', 'BLANC', 'GRIS',
    'MAIN', 'PIED', 'TÊTE', 'COEUR', 'OEIL', 'OREILLE', 'BOUCHE', 'NEZ',
    'MÉDECIN', 'PROFESSEUR', 'POLICIER', 'POMPIER', 'CHEF', 'ARTISTE', 'ÉCRIVAIN', 'ACTEUR',
    'CHÂTEAU', 'TOUR', 'PONT', 'ROUTE', 'VILLE', 'VILLAGE', 'PAYS', 'MONDE',
    'HISTOIRE', 'SCIENCE', 'MATHÉMATIQUES', 'LANGUE', 'GÉOGRAPHIE', 'PHYSIQUE', 'CHIMIE', 'BIOLOGIE',
    'ANIMAL', 'PLANTE', 'INSECTE', 'PAPILLON', 'ABEILLE', 'FOURMI', 'ARAIGNÉE', 'MOUCHE'
  ];

  constructor(roomCode: string) {
    super(roomCode, 'codenames', {
      minPlayers: 4,
      maxPlayers: 12,
      timeLimit: 1800, // 30 minutes
      turnTimeLimit: 180 // 3 minutes par tour
    });
  }

  protected async onStart(): Promise<void> {
    // Assigner les équipes
    this.assignTeams();

    // Créer le plateau
    this.createBoard();

    // Déterminer le premier joueur (espion-maître de l'équipe qui commence)
    const startingTeam = this._state.gameData.currentTeam;
    const spymaster = startingTeam === 'red'
      ? this._state.gameData.redSpymaster
      : this._state.gameData.blueSpymaster;

    this._state.currentTurn = spymaster;

    this.emit('game_started', {
      board: this.getPublicBoard(),
      teams: this.getTeams()
    });
  }

  private assignTeams(): void {
    const players = this._state.players.filter(p => p.status === PlayerStatus.ACTIVE);

    if (players.length < 4) {
      throw new Error('Codenames nécessite au moins 4 joueurs');
    }

    // Mélanger les joueurs
    const shuffled = [...players].sort(() => Math.random() - 0.5);

    // Diviser en deux équipes
    const half = Math.ceil(shuffled.length / 2);
    const redTeam = shuffled.slice(0, half);
    const blueTeam = shuffled.slice(half);

    // Assigner les espions-maîtres
    const redSpymaster = redTeam[0].userId;
    const blueSpymaster = blueTeam[0].userId;

    // Stocker dans gameData
    this._state.gameData.redSpymaster = redSpymaster;
    this._state.gameData.blueSpymaster = blueSpymaster;
    this._state.gameData.redScore = 0;
    this._state.gameData.blueScore = 0;

    // Assigner les équipes dans les données des joueurs
    redTeam.forEach(p => {
      const player = this._state.players.find(pl => pl.userId === p.userId);
      if (player) {
        player.data = {
          team: 'red',
          role: p.userId === redSpymaster ? 'spymaster' : 'agent'
        };
      }
    });

    blueTeam.forEach(p => {
      const player = this._state.players.find(pl => pl.userId === p.userId);
      if (player) {
        player.data = {
          team: 'blue',
          role: p.userId === blueSpymaster ? 'spymaster' : 'agent'
        };
      }
    });
  }

  private createBoard(): void {
    const selectedWords = this.selectRandomWords(25);
    const cards: CodenamesCard[] = [];

    // Déterminer l'équipe qui commence
    const startingTeam = Math.random() < 0.5 ? 'red' : 'blue';
    this._state.gameData.currentTeam = startingTeam;

    // Distribution des cartes
    const types: ('red' | 'blue' | 'neutral' | 'assassin')[] = [];

    for (let i = 0; i < 9; i++) types.push(startingTeam);
    const otherTeam = startingTeam === 'red' ? 'blue' : 'red';
    for (let i = 0; i < 8; i++) types.push(otherTeam);
    for (let i = 0; i < 7; i++) types.push('neutral');
    types.push('assassin');

    // Mélanger
    const shuffledTypes = types.sort(() => Math.random() - 0.5);

    for (let i = 0; i < 25; i++) {
      cards.push({
        word: selectedWords[i],
        type: shuffledTypes[i],
        revealed: false,
        position: i
      });
    }

    this._state.gameData.board = cards;
  }

  private selectRandomWords(count: number): string[] {
    const shuffled = [...this.words].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private getPublicBoard(playerId?: string): CodenamesCard[] {
    const board = this._state.gameData.board || [];
    const isSpymaster = playerId === this._state.gameData.redSpymaster ||
                       playerId === this._state.gameData.blueSpymaster;

    return board.map((card: CodenamesCard) => ({
      ...card,
      type: card.revealed || isSpymaster ? card.type : ('hidden' as any)
    }));
  }

  private getTeams() {
    const redTeam = this._state.players
      .filter(p => p.data?.team === 'red')
      .map(p => ({
        userId: p.userId,
        username: p.username,
        role: p.data?.role
      }));

    const blueTeam = this._state.players
      .filter(p => p.data?.team === 'blue')
      .map(p => ({
        userId: p.userId,
        username: p.username,
        role: p.data?.role
      }));

    return { red: redTeam, blue: blueTeam };
  }

  protected async onProcessMove(move: GameMove): Promise<boolean> {
    switch (move.type) {
      case 'give_clue':
        return this.processClue(move);
      case 'guess_word':
        return this.processGuess(move);
      case 'end_turn':
        return this.processEndTurn(move);
      default:
        return false;
    }
  }

  private processClue(move: GameMove): boolean {
    const { word, number } = move.data as { word: string; number: number };
    const currentTeam = this._state.gameData.currentTeam;
    const currentSpymaster = currentTeam === 'red'
      ? this._state.gameData.redSpymaster
      : this._state.gameData.blueSpymaster;

    if (move.playerId !== currentSpymaster) return false;
    if (!word || !number || number < 0 || number > 9) return false;

    this._state.gameData.currentClue = {
      word: word.toUpperCase(),
      number,
      guessesRemaining: number + 1
    };

    this.emit('clue_given', {
      team: currentTeam,
      clue: this._state.gameData.currentClue
    });

    return true;
  }

  private processGuess(move: GameMove): boolean {
    const { position } = move.data as { position: number };
    const player = this._state.players.find(p => p.userId === move.playerId);

    if (!player || player.data?.team !== this._state.gameData.currentTeam) return false;
    if (!this._state.gameData.currentClue || this._state.gameData.currentClue.guessesRemaining <= 0) return false;

    const card = this._state.gameData.board[position];
    if (!card || card.revealed) return false;

    card.revealed = true;
    this._state.gameData.currentClue.guessesRemaining--;

    if (card.type === 'red') this._state.gameData.redScore++;
    else if (card.type === 'blue') this._state.gameData.blueScore++;

    this.emit('card_revealed', {
      position,
      card,
      guesser: move.playerId,
      team: this._state.gameData.currentTeam
    });

    // Vérifier les conditions de fin
    if (card.type === 'assassin') {
      this._state.gameData.winner = this._state.gameData.currentTeam === 'red' ? 'blue' : 'red';
      this._state.status = GameStatus.FINISHED;
      this._state.winner = this._state.gameData.winner;
      this.emit('game_ended', { winner: this._state.gameData.winner });
      return true;
    }

    const redCards = this._state.gameData.currentTeam === 'red' ? 9 : 8;
    const blueCards = this._state.gameData.currentTeam === 'blue' ? 9 : 8;

    if (this._state.gameData.redScore >= redCards) {
      this._state.gameData.winner = 'red';
      this._state.status = GameStatus.FINISHED;
      this._state.winner = 'red';
      this.emit('game_ended', { winner: 'red' });
      return true;
    }

    if (this._state.gameData.blueScore >= blueCards) {
      this._state.gameData.winner = 'blue';
      this._state.status = GameStatus.FINISHED;
      this._state.winner = 'blue';
      this.emit('game_ended', { winner: 'blue' });
      return true;
    }

    if (card.type !== this._state.gameData.currentTeam) {
      this.switchTurn();
    }

    return true;
  }

  private processEndTurn(move: GameMove): boolean {
    const player = this._state.players.find(p => p.userId === move.playerId);
    if (!player || player.data?.team !== this._state.gameData.currentTeam) return false;

    this.switchTurn();
    return true;
  }

  private switchTurn(): void {
    this._state.gameData.currentTeam = this._state.gameData.currentTeam === 'red' ? 'blue' : 'red';
    this._state.gameData.currentClue = undefined;

    const nextSpymaster = this._state.gameData.currentTeam === 'red'
      ? this._state.gameData.redSpymaster
      : this._state.gameData.blueSpymaster;

    this._state.currentTurn = nextSpymaster;

    this.emit('turn_changed', {
      team: this._state.gameData.currentTeam,
      spymaster: nextSpymaster
    });
  }

  validateMove(move: GameMove): boolean {
    if (this._state.status !== GameStatus.IN_PROGRESS) return false;

    const player = this._state.players.find(p => p.userId === move.playerId);
    if (!player || player.status !== PlayerStatus.ACTIVE) return false;

    return true;
  }

  isGameOver(): boolean {
    return this._state.status === GameStatus.FINISHED;
  }

  protected calculateResult(): GameResult | null {
    if (this._state.status !== GameStatus.FINISHED) return null;

    return {
      winner: this._state.gameData.winner,
      scores: {
        red: this._state.gameData.redScore,
        blue: this._state.gameData.blueScore
      }
    };
  }

  getPublicState(playerId?: string): any {
    return {
      ...super.getPublicState(playerId),
      board: this.getPublicBoard(playerId),
      teams: this.getTeams(),
      currentTeam: this._state.gameData.currentTeam,
      redScore: this._state.gameData.redScore,
      blueScore: this._state.gameData.blueScore,
      currentClue: this._state.gameData.currentClue,
      isSpymaster: playerId === this._state.gameData.redSpymaster || playerId === this._state.gameData.blueSpymaster,
      playerTeam: this._state.players.find(p => p.userId === playerId)?.data?.team,
      playerRole: this._state.players.find(p => p.userId === playerId)?.data?.role
    };
  }
}