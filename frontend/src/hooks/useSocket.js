import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export function useSocket(onTracking) {
  const [connected, setConnected] = useState(false);
  const cb = useRef(onTracking);
  const socketRef = useRef(null);

  cb.current = onTracking;

  useEffect(() => {
    if (socketRef.current) return; // Prevent duplicate connections

    const socket = io('/', { 
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    // Tracking and trip updates
    socket.on('tracking:update', (payload) => cb.current?.(payload));
    socket.on('trip:update', (payload) => cb.current?.({ trip: payload }));
    socket.on('notification:new', (payload) => cb.current?.({ notification: payload }));
    
    // Emergency alerts
    socket.on('emergency:alert', (payload) => cb.current?.({ emergency: payload }));

    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('connect_error');
        socketRef.current.off('tracking:update');
        socketRef.current.off('trip:update');
        socketRef.current.off('notification:new');
        socketRef.current.off('emergency:alert');
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  return connected;
}
