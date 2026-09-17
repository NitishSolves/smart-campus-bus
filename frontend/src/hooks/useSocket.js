import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getBackendOrigin, getToken } from '../api';

export function useSocket(onTracking) {
  const [connected, setConnected] = useState(false);
  const cb = useRef(onTracking);
  const socketRef = useRef(null);

  cb.current = onTracking;

  useEffect(() => {
    const token = getToken();
    if (!token) return undefined;
    if (socketRef.current) return undefined; // Prevent duplicate connections

    const socket = io(getBackendOrigin() || '/', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (err) => {
      console.warn('[socket] connection error:', err.message);
      setConnected(false);
    });

    // Tracking and trip updates
    socket.on('tracking:update', (payload) => cb.current?.(payload));
    socket.on('trip:update', (payload) => cb.current?.({ trip: payload }));
    socket.on('notification:new', (payload) => cb.current?.({ notification: payload }));
    socket.on('emergency:alert', (payload) => cb.current?.({ emergency: payload }));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('tracking:update');
      socket.off('trip:update');
      socket.off('notification:new');
      socket.off('emergency:alert');
      socket.close();
      socketRef.current = null;
    };
  }, []);

  return connected;
}
