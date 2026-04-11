'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * useSocket replacement for Supabase Realtime
 * 
 * Instead of a persistent Socket.io connection, we use Supabase Channels:
 * - Broadcast: for ephemeral events like 'typing'
 * - Presence: for tracking who is online in a project
 * - Postgres Changes: for live updates to comments, leads, etc.
 */
export function useSocket(projectId?: string) {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user || !projectId) return;

    // Create a project-specific channel
    const channel = supabase.channel(`project:${projectId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: user.id },
      },
    });

    // Subscribe to presence (tracking online users)
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('[Realtime] Presence sync:', state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('[Realtime] User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('[Realtime] User left:', key, leftPresences);
      });

    // Handle generic broadcast events (typing indicators, etc.)
    // We keep the API similar to the old useSocket for compatibility
    channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      // In a real app, you'd trigger a local handler here
      console.log('[Realtime] Typing:', payload);
    });

    // Subscribe to the channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: user.id,
          name: user.name,
          online_at: new Date().toISOString(),
        });
      }
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [user, projectId]);

  // Generic handler registration (Postgres changes would be handle separately or here)
  const on = useCallback((event: string, handler: (payload: any) => void) => {
    if (!channelRef.current) return () => {};
    
    // Simple wrapper for broadcast events
    const sub = channelRef.current.on('broadcast', { event }, ({ payload }) => handler(payload));
    
    // For Postgres changes, the caller should ideally use supabase.channel directly
    // but we can add a shim if needed for 'new-comment', etc.
    if (event === 'new-comment') {
       supabase
        .channel(`db-comments-${projectId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'Comment' 
        }, payload => handler(payload.new))
        .subscribe();
    }

    return () => {
      // Cleanup for broadcast is handled by unsubscribe in useEffect
    };
  }, [projectId]);

  const emit = useCallback((event: string, payload?: any) => {
    if (!channelRef.current) return;
    
    channelRef.current.send({
      type: 'broadcast',
      event,
      payload,
    });
  }, []);

  return { on, emit, socket: channelRef.current };
}
