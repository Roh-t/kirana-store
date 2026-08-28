import { logger } from '../config/logger.js';

export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    logger.info(`[HTTP] ${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      statusCode,
      durationMs: duration,
      ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Unknown'
    });
  });

  next();
};