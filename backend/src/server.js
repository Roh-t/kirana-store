import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import mongoose from 'mongoose';

let server;

const startServer = async () => {
  await connectDatabase();

  server = app.listen(env.port, () => {
    console.log(`====================================================`);
    console.log(`  🚀 KiranaFlow Monolith Engine Running`);
    console.log(`  📡 Mode: ${env.nodeEnv}`);
    console.log(`  🔗 API:  http://localhost:${env.port}/api/v1/health`);
    console.log(`====================================================`);
  });
};

const handleShutdown = (signal) => {
  console.log(`\n[SERVER] ${signal} signal received. Shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      console.log('[SERVER] HTTP server closed.');
      try {
        await mongoose.connection.close(false);
        console.log('[DATABASE] Mongoose connection closed.');
        process.exit(0);
      } catch (err) {
        console.error(`[DATABASE ERROR] Teardown error: ${err.message}`);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL ERROR] Unhandled Promise Rejection:', reason);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

startServer();