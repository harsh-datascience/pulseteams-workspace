import { PresenceStatus } from '../models/User';
import { IAttachment } from '../models/Message';

export interface SerializedMessage {
  _id: string;
  tempId?: string;
  channelId?: string | null;
  conversationId?: string | null;
  senderId: string;
  senderName: string;
  senderInitials: string;
  senderAvatarColor: string;
  subject?: string;
  content: string;
  attachments: IAttachment[];
  parentMessageId?: string | null;
  replyCount: number;
  lastReplyAt?: string;
  reactions: Record<string, string[]>;
  isEdited: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessagePayload {
  tempId: string;
  channelId?: string | null;
  conversationId?: string | null;
  senderId: string;
  senderName: string;
  senderInitials: string;
  senderAvatarColor: string;
  subject?: string;
  content: string;
  attachments?: IAttachment[];
  parentMessageId?: string | null;
}

export interface ToggleReactionPayload {
  messageId: string;
  channelId?: string | null;
  conversationId?: string | null;
  emoji: string;
  userId: string;
}

export interface TypingEventPayload {
  roomId: string; // channelId or conversationId
  parentMessageId?: string | null;
  userId: string;
  displayName: string;
}

export interface PresenceUpdatePayload {
  userId: string;
  status: PresenceStatus;
  customStatusMessage?: string;
  lastSeen: string;
}

export interface CallParticipantState {
  userId: string;
  displayName: string;
  initials: string;
  avatarColor: string;
  isMicMuted: boolean;
  isCamOn: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
}

export interface ServerToClientEvents {
  'message:new': (message: SerializedMessage) => void;
  'message:ack': (payload: { tempId: string; savedMessage: SerializedMessage }) => void;
  'message:reaction:updated': (payload: {
    messageId: string;
    reactions: Record<string, string[]>;
  }) => void;
  'typing:update': (payload: {
    roomId: string;
    parentMessageId?: string | null;
    typingUsers: Array<{ userId: string; displayName: string }>;
  }) => void;
  'presence:changed': (payload: PresenceUpdatePayload) => void;
  'call:participant:updated': (payload: {
    roomId: string;
    participants: CallParticipantState[];
  }) => void;
}

export interface ClientToServerEvents {
  'room:join': (payload: { roomId: string; userId: string }) => void;
  'room:leave': (payload: { roomId: string; userId: string }) => void;
  'message:send': (
    payload: SendMessagePayload,
    callback?: (ack: { ok: boolean; message?: SerializedMessage; error?: string }) => void
  ) => void;
  'message:reaction:toggle': (payload: ToggleReactionPayload) => void;
  'typing:start': (payload: TypingEventPayload) => void;
  'typing:stop': (payload: TypingEventPayload) => void;
  'presence:set': (payload: {
    userId: string;
    status: PresenceStatus;
    customStatusMessage?: string;
  }) => void;
  'call:join': (payload: { roomId: string; participant: CallParticipantState }) => void;
  'call:state:change': (payload: { roomId: string; participant: CallParticipantState }) => void;
  'call:leave': (payload: { roomId: string; userId: string }) => void;
}
