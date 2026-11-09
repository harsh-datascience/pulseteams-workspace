import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttachment {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  url: string;
}

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  channelId?: mongoose.Types.ObjectId | null;
  conversationId?: mongoose.Types.ObjectId | null;
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  senderInitials: string;
  senderAvatarColor: string;
  subject?: string;
  content: string;
  attachments: IAttachment[];
  parentMessageId?: mongoose.Types.ObjectId | null;
  replyCount: number;
  lastReplyAt?: Date;
  reactions: Map<string, string[]>; // Map of emoji -> array of userId strings
  isEdited: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    mimeType: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>(
  {
    channelId: { type: Schema.Types.ObjectId, ref: 'Channel', default: null, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', default: null, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    senderName: { type: String, required: true },
    senderInitials: { type: String, required: true },
    senderAvatarColor: { type: String, default: '#5B5FC7' },
    subject: { type: String, trim: true },
    content: { type: String, required: true },
    attachments: { type: [AttachmentSchema], default: [] },
    parentMessageId: { type: Schema.Types.ObjectId, ref: 'Message', default: null, index: true },
    replyCount: { type: Number, default: 0 },
    lastReplyAt: { type: Date },
    reactions: {
      type: Map,
      of: [String],
      default: {},
    },
    isEdited: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MessageSchema.index({ channelId: 1, parentMessageId: 1, createdAt: 1 });
MessageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
