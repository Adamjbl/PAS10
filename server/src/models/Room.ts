import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
  code: string;
  host: mongoose.Types.ObjectId;
  players: {
    userId: mongoose.Types.ObjectId;
    socketId: string | null;
    status: 'connected' | 'disconnected';
    joinedAt: Date;
    disconnectedAt?: Date;
  }[];
  gameType: 'perudo' | 'codenames' | 'quiz';
  status: 'waiting' | 'in_game' | 'finished';
  maxPlayers: number;
  isPrivate: boolean;
  settings: {
    allowSpectators: boolean;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    code: {
      type: String,
      required: [true, 'Room code is required'],
      unique: true,
      uppercase: true,
      length: [4, 'Room code must be 4 characters'],
      match: [/^[A-Z0-9]{4}$/, 'Room code must be 4 alphanumeric characters']
    },
    host: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Host is required']
    },
    players: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        socketId: {
          type: String,
          default: null
        },
        status: {
          type: String,
          enum: ['connected', 'disconnected'],
          default: 'connected'
        },
        joinedAt: {
          type: Date,
          default: Date.now
        },
        disconnectedAt: {
          type: Date
        }
      }
    ],
    gameType: {
      type: String,
      enum: ['perudo', 'codenames', 'quiz'],
      required: [true, 'Game type is required']
    },
    status: {
      type: String,
      enum: ['waiting', 'in_game', 'finished'],
      default: 'waiting'
    },
    maxPlayers: {
      type: Number,
      required: [true, 'Max players is required'],
      min: [2, 'Room must allow at least 2 players'],
      max: [10, 'Room cannot have more than 10 players']
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    settings: {
      type: Schema.Types.Mixed,
      default: {
        allowSpectators: false
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
RoomSchema.index({ code: 1 });
RoomSchema.index({ host: 1 });
RoomSchema.index({ status: 1 });
RoomSchema.index({ gameType: 1, isPrivate: 1 });

// Virtual for current player count
RoomSchema.virtual('playerCount').get(function () {
  return this.players.filter(p => p.status === 'connected').length;
});

// Virtual for available slots
RoomSchema.virtual('availableSlots').get(function () {
  const connectedCount = this.players.filter(p => p.status === 'connected').length;
  return this.maxPlayers - connectedCount;
});

// Virtual to check if room is full
RoomSchema.virtual('isFull').get(function () {
  const connectedCount = this.players.filter(p => p.status === 'connected').length;
  return connectedCount >= this.maxPlayers;
});

// Ensure virtuals are included when converting to JSON
RoomSchema.set('toJSON', { virtuals: true });
RoomSchema.set('toObject', { virtuals: true });

// Remove disconnected players after 60 seconds (handled by application logic)
RoomSchema.methods.removeDisconnectedPlayers = function () {
  const now = new Date();
  this.players = this.players.filter((player: any) => {
    if (player.status === 'disconnected' && player.disconnectedAt) {
      const timeDiff = now.getTime() - player.disconnectedAt.getTime();
      return timeDiff < 60000; // Keep for 60 seconds
    }
    return true;
  });
};

export default mongoose.model<IRoom>('Room', RoomSchema);
