import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDatabase = async () => {
  try {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    };

    const conn = await mongoose.connect(env.mongoUri, options);
    console.log(`[DATABASE] MongoDB Connected: ${conn.connection.host} (DB: ${conn.connection.name})`);
  } catch (error) {
    console.error(`[DATABASE ERROR] Connection failed: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[DATABASE WARNING] MongoDB connection lost. Reconnecting...');
});

mongoose.connection.on('error', (err) => {
  console.error(`[DATABASE ERROR] Unexpected error: ${err.message}`);
});