import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import mongoose from 'mongoose';
import { OrderService } from './modules/orders/order.service.js';

let server;

const startServer = async () => {
  await connectDatabase();

  const sendOrderReminders = async () => {
    try {
      const remindedCount = await OrderService.sendUnattendedOrderReminders();
      if (remindedCount > 0) {
        console.log(`[ORDERS] Sent ${remindedCount} unattended order reminder(s).`);
      }
    } catch (err) {
      console.error('[ORDERS] Failed to send unattended order reminders:', err.message);
    }
  };

  await sendOrderReminders();
  const reminderInterval = setInterval(sendOrderReminders, 5 * 60 * 1000);

  server = app.listen(env.port, () => {
    console.log(`====================================================`);
    console.log(`  🚀 KiranaFlow Monolith Engine Running`);
    console.log(`  📡 Mode: ${env.nodeEnv}`);
    console.log(`  🔗 API:  http://localhost:${env.port}/api/v1/health`);
    console.log(`====================================================`);
  });

  server.on('close', () => clearInterval(reminderInterval));
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