import mongoose, { Schema, Document, Model } from 'mongoose';

export type PresenceStatus = 'available' | 'busy' | 'dnd' | 'away' | 'offline';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  displayName: string;
  title: string;
  department: string;
  avatarUrl?: string;
  initials: string;
  avatarColor: string;
  status: PresenceStatus;
  customStatusMessage?: string;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    displayName: { type: String, required: true, trim: true },
    title: { type: String, default: 'Software Engineer' },
    department: { type: String, default: 'Engineering' },
    avatarUrl: { type: String },
    initials: { type: String, required: true, maxlength: 3 },
    avatarColor: { type: String, default: '#5B5FC7' },
    status: {
      type: String,
      enum: ['available', 'busy', 'dnd', 'away', 'offline'],
      default: 'available',
      index: true,
    },
    customStatusMessage: { type: String, maxlength: 140 },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
