import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Emitter } from '@socket.io/redis-emitter';
import env from './env.js';
import logger from '../utils/logger.js';
import jwt from 'jsonwebtoken';
import redisClient from './redis.js';

let io = null;
let emitter = null;

// Initialize the emitter lazily if only emitting is needed (e.g., in API process)
export const getIO = () => {
  if (io) return io; // Return the full Server if running in the Socket process
  
  // If running in the API process, we need the Redis Emitter
  if (!emitter) {
    if (!redisClient) {
      logger.warn('Socket.IO Emitter not initialized because Redis is disabled/unavailable.');
      return null;
    }
    emitter = new Emitter(redisClient);
    logger.info('Socket.IO Redis Emitter initialized');
  }
  return emitter;
};

// Initialize the full Socket.IO server (only called by the standalone Socket process)
export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.SOCKET_CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  if (redisClient) {
    // Create a duplicate redis connection for subscribing (adapter requirement)
    const subClient = redisClient.duplicate();
    io.adapter(createAdapter(redisClient, subClient));
    logger.info('Socket.IO Redis Adapter attached');
  } else {
    logger.warn('Socket.IO running without Redis adapter! Cross-process broadcasting will not work.');
  }

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

  logger.info('Socket.IO server initialized');
  return io;
};
