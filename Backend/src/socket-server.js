import http from 'http';
import express from 'express';
import env from './config/env.js';
import connectDB from './config/db.js';
import { initSocket } from './config/socket.js';
import logger from './utils/logger.js';

const startSocketServer = async () => {
  try {
    logger.info('Starting standalone Socket.IO server...');
    
    // 1. Connect to Database (required for user authentication if we query DB, though JWT is mostly stateless)
    await connectDB();

    // 2. Create dummy HTTP Server for Socket to attach to
    const app = express();
    // Add health check for the socket server
    app.get('/health', (req, res) => res.status(200).send('Socket server is running'));
    
    const server = http.createServer(app);

    // 3. Initialize Socket.IO
    initSocket(server);

    // 4. Start listening on a dedicated socket port
    // It's standard practice to run socket on a different port than the main API
    // If running via NGINX/ALB, route /socket.io/ to this port.
    const PORT = env.SOCKET_PORT || 5001; 
    
    server.listen(PORT, () => {
      logger.info(`Socket.IO Server running in ${env.NODE_ENV} mode on port ${PORT}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error(`Unhandled Rejection in Socket Server: ${err.message}`);
      server.close(() => process.exit(1));
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error(`Uncaught Exception in Socket Server: ${err.message}`);
      server.close(() => process.exit(1));
    });

  } catch (error) {
    logger.error(`Failed to start Socket server: ${error.message}`);
    process.exit(1);
  }
};

startSocketServer();
