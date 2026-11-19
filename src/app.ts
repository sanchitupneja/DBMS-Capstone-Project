import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes';
import hostelRoutes from './routes/hostel.routes';
import allocationRoutes from './routes/allocation.routes';
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
      // Health checks and server-to-server calls do not send an Origin header.
      if (!origin) return callback(null, true);

      if (configuredOrigins.includes(origin) || origin === 'http://localhost:3000') {
        return callback(null, true);
      }

      // Frontend and API live on different onrender.com subdomains. Allow those
      // origins automatically so a fresh Blueprint deploy works with no extra
      // setup. Set CORS_ORIGIN to a specific URL to restrict this further.
      if (process.env.NODE_ENV === 'production') {
        try {
          if (new URL(origin).hostname.endsWith('.onrender.com')) {
            return callback(null, true);
          }
        } catch {
          // Invalid Origin header - fall through to the rejection below.
        }
      }

      callback(new Error('Not allowed by CORS'));
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

  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
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
