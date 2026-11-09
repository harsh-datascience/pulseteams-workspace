'use client';

import { io, Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents } from '../types/socket';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socketInstance: TypedSocket | null = null;

export function getSocketClient(userId: string): TypedSocket {
  if (!socketInstance) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || '';
    socketInstance = io(socketUrl, {
      path: '/api/socket/io',
      auth: { userId },
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
    });
  }
  return socketInstance;
}
