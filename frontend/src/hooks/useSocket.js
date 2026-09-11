import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export function useSocket(onTracking) {
  const [connected, setConnected] = useState(false);
  const cb = useRef(onTracking);
  cb.current = onTracking;

  useEffect(() => {
    const socket = io('/', { transports: ['websocket', 'polling'] });
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('tracking:update', (payload) => cb.current?.(payload));
    socket.on('trip:update', (payload) => cb.current?.({ trip: payload }));
    socket.on('notification:new', (payload) => cb.current?.({ notification: payload }));
    return () => socket.close();
  }, []);

  return connected;
}
