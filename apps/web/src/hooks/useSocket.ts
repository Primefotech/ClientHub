'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getToken } from '@/lib/auth';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function useSocket(projectId?: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    if (!socket || !socket.connected) {
      socket = io(WS_URL, {
        auth: { token },
        transports: ['websocket'],
      });
    }
    socketRef.current = socket;

    if (projectId) {
      socket.emit('join-project', projectId);
    }

    return () => {
      if (projectId && socket) {
        socket.emit('leave-project', projectId);
      }
    };
  }, [projectId]);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => { socketRef.current?.off(event, handler); };
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { on, emit, socket: socketRef.current };
}
