import mongoose, { Schema, Document, Model } from 'mongoose';

export type TeamMemberRole = 'owner' | 'admin' | 'member' | 'guest';

export interface ITeamMember {
  userId: mongoose.Types.ObjectId;
  role: TeamMemberRole;
  joinedAt: Date;
}

export interface ITeam extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  initials: string;
  accentColor: string;
  members: ITeamMember[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'admin', 'member', 'guest'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    initials: { type: String, required: true, maxlength: 3 },
    accentColor: { type: String, default: '#5B5FC7' },
    members: { type: [TeamMemberSchema], default: [] },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

TeamSchema.index({ 'members.userId': 1 });

export const Team: Model<ITeam> =
  mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);
