'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getToken } from '@/lib/auth';

// In production with Nginx, NEXT_PUBLIC_WS_URL is empty — socket.io connects
// to the same origin (yourdomain.com) which Nginx proxies to api:3001.
// In dev it points to http://localhost:3001 directly.
function getWsUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (envUrl) return envUrl;
  // Fallback to current window origin (works when Nginx proxies /socket.io/)
  if (typeof window !== 'undefined') return window.location.origin;
  return 'http://localhost:3001';
}

let socket: Socket | null = null;

export function useSocket(projectId?: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    if (!socket || !socket.connected) {
      socket = io(getWsUrl(), {
        auth: { token },
        // Use polling first then upgrade to websocket — more reliable behind proxies
        transports: ['polling', 'websocket'],
        path: '/socket.io/',
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
    return () => socketRef.current?.off(event, handler);
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { on, emit, socket: socketRef.current };
}
