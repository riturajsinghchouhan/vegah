import { Server } from 'socket.io';
import env from './env.js';
import logger from '../utils/logger.js';
import jwt from 'jsonwebtoken';

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.SOCKET_CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.debug(`Client connected to Socket.IO: ${socket.id} (User: ${socket.user.id})`);
    
    // Join personal room based on user ID
    socket.join(`user_${socket.user.id}`);
    
    if (socket.user.role === 'ADMIN' || socket.user.role === 'SUPER_ADMIN') {
      socket.join('admin_room');
    }

    socket.on('disconnect', () => {
      logger.debug(`Client disconnected: ${socket.id}`);
    });
  });

  logger.info('Socket.IO initialized');
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO is not initialized!');
  }
  return io;
};
