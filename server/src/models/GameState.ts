import mongoose, { Schema, Document } from 'mongoose';

export interface IGameState extends Document {
  roomId: mongoose.Types.ObjectId;
  gameType: 'perudo' | 'codenames' | 'quiz';
  state: any; // Flexible state object for different game types
  currentTurn: mongoose.Types.ObjectId;
  turnOrder: mongoose.Types.ObjectId[];
  round: number;
  history: {
    action: string;
    playerId: mongoose.Types.ObjectId;
    timestamp: Date;
    data: any;
  }[];
  winner?: mongoose.Types.ObjectId;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GameStateSchema = new Schema<IGameState>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room ID is required'],
      unique: true
    },
    gameType: {
      type: String,
      enum: ['perudo', 'codenames', 'quiz'],
      required: [true, 'Game type is required']
    },
    state: {
      type: Schema.Types.Mixed,
      required: [true, 'Game state is required']
      // Example for Perudo:
      // {
      //   players: [
      //     { userId: ObjectId, diceCount: 5, dice: [1,2,3,4,5] },
      //     { userId: ObjectId, diceCount: 5, dice: [2,2,3,5,6] }
      //   ],
      //   currentBid: { quantity: 3, face: 4, playerId: ObjectId },
      //   eliminated: [ObjectId]
      // }
      //
      // Example for Codenames:
      // {
      //   grid: [
      //     { word: 'CAT', team: 'red', revealed: false },
      //     { word: 'DOG', team: 'blue', revealed: true },
      //     ...
      //   ],
      //   redTeam: [ObjectId, ObjectId],
      //   blueTeam: [ObjectId, ObjectId],
      //   redSpymaster: ObjectId,
      //   blueSpymaster: ObjectId,
      //   currentClue: { word: 'animal', number: 2 },
      //   redScore: 0,
      //   blueScore: 0
      // }
    },
    currentTurn: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Current turn player is required']
    },
    turnOrder: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    round: {
      type: Number,
      default: 1,
      min: 1
    },
    history: [
      {
        action: {
          type: String,
          required: true
        },
        playerId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        timestamp: {
          type: Date,
          default: Date.now
        },
        data: {
          type: Schema.Types.Mixed
        }
      }
    ],
    winner: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    endedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
GameStateSchema.index({ roomId: 1 });
GameStateSchema.index({ gameType: 1 });
GameStateSchema.index({ currentTurn: 1 });

// Method to add an action to history
GameStateSchema.methods.addToHistory = function (
  action: string,
  playerId: mongoose.Types.ObjectId,
  data: any
) {
  this.history.push({
    action,
    playerId,
    timestamp: new Date(),
    data
  });
};

// Method to advance to next player's turn
GameStateSchema.methods.nextTurn = function () {
  const currentIndex = this.turnOrder.findIndex(
    (id: mongoose.Types.ObjectId) => id.toString() === this.currentTurn.toString()
  );
  const nextIndex = (currentIndex + 1) % this.turnOrder.length;
  this.currentTurn = this.turnOrder[nextIndex];
};

// Virtual to check if game is finished
GameStateSchema.virtual('isFinished').get(function () {
  return !!this.winner || !!this.endedAt;
});

// Ensure virtuals are included when converting to JSON
GameStateSchema.set('toJSON', { virtuals: true });
GameStateSchema.set('toObject', { virtuals: true });

export default mongoose.model<IGameState>('GameState', GameStateSchema);
