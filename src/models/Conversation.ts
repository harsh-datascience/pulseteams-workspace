import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IConversation extends Document {
  _id: mongoose.Types.ObjectId;
  isGroup: boolean;
  title?: string;
  participantIds: mongoose.Types.ObjectId[];
  pinnedByUserIds: mongoose.Types.ObjectId[];
  lastMessageAt: Date;
  lastMessagePreview?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    isGroup: { type: Boolean, default: false },
    title: { type: String, trim: true },
    participantIds: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    pinnedByUserIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lastMessageAt: { type: Date, default: Date.now, index: true },
    lastMessagePreview: { type: String, default: '' },
  },
  { timestamps: true }
);

ConversationSchema.index({ participantIds: 1, lastMessageAt: -1 });

export const Conversation: Model<IConversation> =
  mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);
