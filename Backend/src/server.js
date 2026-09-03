import http from 'http';
import app from './app.js';
import env from './config/env.js';
import connectDB from './config/db.js';
import { initSocket } from './config/socket.js';
import { initWorkers } from './jobs/index.js';
import logger from './utils/logger.js';

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Create HTTP Server
    const server = http.createServer(app);

    // 3. Initialize Socket.IO
    initSocket(server);

    // 4. Initialize Background Workers
    initWorkers();

    // 5. Start listening
    const PORT = env.PORT || 5000;
    server.listen(PORT, () => {
      logger.info(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error(`Unhandled Rejection: ${err.message}`);
      // Close server & exit process
      server.close(() => process.exit(1));
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error(`Uncaught Exception: ${err.message}`);
      // Close server & exit process
      server.close(() => process.exit(1));
    });

  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
