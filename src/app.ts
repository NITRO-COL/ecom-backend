import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';

import { env, allowedOrigins } from './config/env';
import { globalLimiter } from './middleware/rateLimit';
import { notFound, errorHandler } from './middleware/error';
import routes from './routes';

export function createApp(): Application {
  const app = express();

  app.set('trust proxy', 1);

  // Security headers — allow cross-origin image loading for the storefronts.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS — only our known frontends, with credentials.
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        // eslint-disable-next-line no-console
        console.warn(`⚠️ Blocked by CORS: ${origin}`);
        return cb(new Error(`Not allowed by CORS: ${origin}`));
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(mongoSanitize());
  app.use(compression());

  if (!env.isProd) app.use(morgan('dev'));

  // Static uploads (product & banner images)
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  app.use(globalLimiter);

  // Health Check Endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      time: Date.now(),
    });
  });

  // API
  app.use('/api', routes);

  app.get('/', (_req, res) =>
    res.json({ success: true, service: 'Sanwariya Brand House API', docs: '/api/health' })
  );

  // 404 + central error handler (must be last)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
