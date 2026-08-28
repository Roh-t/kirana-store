import { Router } from 'express';
import mongoose from 'mongoose';
import { ApiResponse } from '../utils/apiResponse.js';

const router = Router();

const DB_STATE_MAP = {
  0: 'DISCONNECTED',
  1: 'CONNECTED',
  2: 'CONNECTING',
  3: 'DISCONNECTING'
};

router.get('/health', (req, res) => {
  const dbState = DB_STATE_MAP[mongoose.connection.readyState] || 'UNKNOWN';

  const healthData = {
    service: 'KiranaFlow Core Engine Monolith',
    status: 'OPERATIONAL',
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      state: dbState,
      name: mongoose.connection.name || 'N/A'
    },
    memoryUsage: {
      rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
    }
  };

  return ApiResponse.success(res, {
    statusCode: 200,
    message: 'KiranaFlow API Service is operational',
    data: healthData
  });
});

export default router;