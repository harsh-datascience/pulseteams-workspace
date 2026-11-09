import mongoose, { Schema, Document, Model } from 'mongoose';

export type ChannelType = 'public' | 'private';

export interface IChannelFile {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedByName: string;
  uploadedAt: Date;
  url: string;
}

export interface IChannel extends Document {
  _id: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  type: ChannelType;
  allowedMemberIds: mongoose.Types.ObjectId[];
  files: IChannelFile[];
  isGeneral: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChannelFileSchema = new Schema<IChannelFile>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedByName: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    url: { type: String, required: true },
  },
  { _id: false }
);

const ChannelSchema = new Schema<IChannel>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['public', 'private'], default: 'public' },
    allowedMemberIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    files: { type: [ChannelFileSchema], default: [] },
    isGeneral: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ChannelSchema.index({ teamId: 1, name: 1 }, { unique: true });

export const Channel: Model<IChannel> =
  mongoose.models.Channel || mongoose.model<IChannel>('Channel', ChannelSchema);
