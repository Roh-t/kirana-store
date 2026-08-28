import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.nodeEnv === 'development' ? 5000 : 1000, // High limit in dev mode for live queue polling
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
    error: {
      code: 'RATE_LIMIT_EXCEEDED'
    }
  }
});