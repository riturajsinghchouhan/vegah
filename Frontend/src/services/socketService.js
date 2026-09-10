import { io } from 'socket.io-client';

let socket = null;

export const initSocket = () => {
  if (socket && socket.connected) {
    return socket;
  }

  const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
  
  // Default to localhost:5000 if VITE_API_URL is relative or empty
  let serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  if (serverUrl.startsWith('/')) {
    serverUrl = 'http://localhost:5000';
  }
  // Strip trailing /api if present
  serverUrl = serverUrl.replace(/\/api$/, '');

  socket = io(serverUrl, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('⚡ Socket connected to server:', socket.id);
  });

  socket.on('connect_error', (error) => {
    console.warn('Socket connection warning/error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
