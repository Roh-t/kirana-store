import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = ['MONGO_URI'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`[FATAL ERROR] Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGO_URI,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_for_development_mode'
};