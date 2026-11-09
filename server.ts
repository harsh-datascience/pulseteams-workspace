import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { connectToDatabase } from './src/lib/db';
import { Message } from './src/models/Message';
import { User } from './src/models/User';
import { Conversation } from './src/models/Conversation';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  CallParticipantState,
  SerializedMessage,
} from './src/types/socket';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Active typing indicators per room: roomId -> Map<userId, { displayName, timer }>
const activeTypers = new Map<
  string,
  Map<string, { displayName: string; parentMessageId?: string | null; expiresAt: number }>
>();

// Active call participants per room: roomId -> Map<userId, CallParticipantState>
const activeCalls = new Map<string, Map<string, CallParticipantState>>();

app.prepare().then(async () => {
  try {
    await connectToDatabase();
    console.log('[DB] Connected to MongoDB');
  } catch (err) {
    console.warn('[DB] MongoDB offline — operating with in-memory fallback store:', err);
  }

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url || '', true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    path: '/api/socket/io',
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    const connectedUserId = (socket.handshake.auth?.userId as string) || 'user-1';

    socket.on('room:join', ({ roomId }) => {
      socket.join(roomId);
    });

    socket.on('room:leave', ({ roomId }) => {
      socket.leave(roomId);
    });

    socket.on('message:send', async (payload, callback) => {
      try {
        const roomId = payload.channelId || payload.conversationId || 'global';
        const nowIso = new Date().toISOString();

        let savedSerialized: SerializedMessage = {
          _id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          tempId: payload.tempId,
          channelId: payload.channelId || null,
          conversationId: payload.conversationId || null,
          senderId: payload.senderId,
          senderName: payload.senderName,
          senderInitials: payload.senderInitials,
          senderAvatarColor: payload.senderAvatarColor,
          subject: payload.subject,
          content: payload.content,
          attachments: payload.attachments || [],
          parentMessageId: payload.parentMessageId || null,
          replyCount: 0,
          reactions: {},
          isEdited: false,
          isPinned: false,
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        try {
          const doc = await Message.create({
            channelId: payload.channelId || null,
            conversationId: payload.conversationId || null,
            senderId: payload.senderId,
            senderName: payload.senderName,
            senderInitials: payload.senderInitials,
            senderAvatarColor: payload.senderAvatarColor,
            subject: payload.subject,
            content: payload.content,
            attachments: payload.attachments || [],
            parentMessageId: payload.parentMessageId || null,
          });

          if (payload.parentMessageId) {
            await Message.findByIdAndUpdate(payload.parentMessageId, {
              $inc: { replyCount: 1 },
              $set: { lastReplyAt: new Date() },
            });
          }

          if (payload.conversationId) {
            await Conversation.findByIdAndUpdate(payload.conversationId, {
              $set: {
                lastMessageAt: new Date(),
                lastMessagePreview: payload.content.slice(0, 100),
              },
            });
          }

          savedSerialized = {
            ...savedSerialized,
            _id: doc._id.toString(),
            createdAt: doc.createdAt.toISOString(),
            updatedAt: doc.updatedAt.toISOString(),
          };
        } catch {
          // Fallback to serialized in-memory representation if MongoDB isn't running
        }

        io.to(roomId).emit('message:new', savedSerialized);
        socket.emit('message:ack', { tempId: payload.tempId, savedMessage: savedSerialized });
        if (callback) callback({ ok: true, message: savedSerialized });
      } catch (err) {
        if (callback) callback({ ok: false, error: (err as Error).message });
      }
    });

    socket.on('message:reaction:toggle', async ({ messageId, channelId, conversationId, emoji, userId }) => {
      const roomId = channelId || conversationId || 'global';
      try {
        const msg = await Message.findById(messageId);
        if (msg) {
          const currentUsers = msg.reactions.get(emoji) || [];
          const nextUsers = currentUsers.includes(userId)
            ? currentUsers.filter((id) => id !== userId)
            : [...currentUsers, userId];
          if (nextUsers.length === 0) {
            msg.reactions.delete(emoji);
          } else {
            msg.reactions.set(emoji, nextUsers);
          }
          await msg.save();
          const reactionsObj: Record<string, string[]> = {};
          msg.reactions.forEach((val, key) => {
            reactionsObj[key] = val;
          });
          io.to(roomId).emit('message:reaction:updated', {
            messageId,
            reactions: reactionsObj,
          });
        }
      } catch {
        // Handled optimistically by client when DB is detached
      }
    });

    socket.on('typing:start', ({ roomId, parentMessageId, userId, displayName }) => {
      if (!activeTypers.has(roomId)) {
        activeTypers.set(roomId, new Map());
      }
      const roomTypers = activeTypers.get(roomId)!;
      roomTypers.set(userId, {
        displayName,
        parentMessageId: parentMessageId || null,
        expiresAt: Date.now() + 3500,
      });

      const typingUsers = Array.from(roomTypers.entries()).map(([uid, info]) => ({
        userId: uid,
        displayName: info.displayName,
      }));
      io.to(roomId).emit('typing:update', { roomId, parentMessageId, typingUsers });
    });

    socket.on('typing:stop', ({ roomId, parentMessageId, userId }) => {
      const roomTypers = activeTypers.get(roomId);
      if (roomTypers) {
        roomTypers.delete(userId);
        const typingUsers = Array.from(roomTypers.entries()).map(([uid, info]) => ({
          userId: uid,
          displayName: info.displayName,
        }));
        io.to(roomId).emit('typing:update', { roomId, parentMessageId, typingUsers });
      }
    });

    socket.on('presence:set', async ({ userId, status, customStatusMessage }) => {
      const lastSeen = new Date().toISOString();
      try {
        await User.findByIdAndUpdate(userId, {
          $set: { status, customStatusMessage, lastSeen: new Date() },
        });
      } catch {
        // Ignore if DB offline
      }
      io.emit('presence:changed', { userId, status, customStatusMessage, lastSeen });
    });

    socket.on('call:join', ({ roomId, participant }) => {
      if (!activeCalls.has(roomId)) {
        activeCalls.set(roomId, new Map());
      }
      activeCalls.get(roomId)!.set(participant.userId, participant);
      io.to(roomId).emit('call:participant:updated', {
        roomId,
        participants: Array.from(activeCalls.get(roomId)!.values()),
      });
    });

    socket.on('call:state:change', ({ roomId, participant }) => {
      if (activeCalls.has(roomId)) {
        activeCalls.get(roomId)!.set(participant.userId, participant);
        io.to(roomId).emit('call:participant:updated', {
          roomId,
          participants: Array.from(activeCalls.get(roomId)!.values()),
        });
      }
    });

    socket.on('call:leave', ({ roomId, userId }) => {
      if (activeCalls.has(roomId)) {
        activeCalls.get(roomId)!.delete(userId);
        io.to(roomId).emit('call:participant:updated', {
          roomId,
          participants: Array.from(activeCalls.get(roomId)!.values()),
        });
      }
    });

    socket.on('disconnect', () => {
      const lastSeen = new Date().toISOString();
      io.emit('presence:changed', {
        userId: connectedUserId,
        status: 'offline',
        lastSeen,
      });
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
