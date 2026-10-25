import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { routes } from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { sendError } from './views/response.view.js';

/**
 * Express Application Factory & Configuration
 */
const app: Express = express();

// Security headers — XSS protection, content-type sniffing, frameguard, etc.
app.use(helmet());

// Robust CORS configuration supporting frontend ports and preflight checks
const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Set-Cookie'],
  })
);

// Explicit preflight handler for all routes
app.options('*', cors());

// Body and Cookie Parsers (10mb limit for Cloudinary media uploads strictly under 2mb)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(env.COOKIE_SECRET));

// API v1 Routing
app.use('/api/v1', routes);

// 404 Not Found Handler
app.use((_req: Request, res: Response) => {
  sendError(res, 'Requested resource route does not exist on PujaCircle API.', 404);
});

// Global Error Handler
app.use(errorHandler);

export { app };
