import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes';
import hostelRoutes from './routes/hostel.routes';
import allocationRoutes from './routes/allocation.routes';
import prisma from './config/database';
import { globalErrorHandler } from './utils/errors';

export function createApp(): Application {
  const app = express();

  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
      },
    },
  }));

  const configuredOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      // Allow all origins for the API so frontend deployments on any domain/subdomain connect cleanly
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      message: 'Hostel Room Allocation API is running',
      health: '/api/health',
    });
  });

  app.get('/api/health', async (_req: Request, res: Response) => {
    let dbStatus = 'connected';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (e: unknown) {
      dbStatus = e instanceof Error ? `disconnected: ${e.message}` : 'disconnected';
    }

    res.status(200).json({
      status: 'ok',
      database: dbStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/hostels', hostelRoutes);
  app.use('/api', allocationRoutes);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `Route not found`,
    });
  });

  app.use(globalErrorHandler);

  return app;
}
