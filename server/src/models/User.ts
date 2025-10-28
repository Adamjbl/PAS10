import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  friends: mongoose.Types.ObjectId[];
  friendRequests: {
    from: mongoose.Types.ObjectId;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Date;
  }[];
  stats: {
    gamesPlayed: number;
    gamesWon: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username must be less than 20 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false // Don't return password by default
    },
    friends: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    friendRequests: [
      {
        from: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'rejected'],
          default: 'pending'
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    stats: {
      gamesPlayed: {
        type: Number,
        default: 0,
        min: 0
      },
      gamesWon: {
        type: Number,
        default: 0,
        min: 0
      }
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt automatically
  }
);

// Index for faster queries
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });

// Virtual for win rate
UserSchema.virtual('winRate').get(function () {
  if (this.stats.gamesPlayed === 0) return 0;
  return (this.stats.gamesWon / this.stats.gamesPlayed) * 100;
});

// Ensure virtuals are included when converting to JSON
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

export default mongoose.model<IUser>('User', UserSchema);
