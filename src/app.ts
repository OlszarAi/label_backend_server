import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/config';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { requestLogger, apiLogger } from './middleware/requestLogger';
import { authRoutes } from './routes/auth.routes';
import { healthRoutes } from './routes/health.routes';
import { projectRoutes } from './routes/project.routes';
import simplifiedAssetRoutes from './routes/simplified-asset.routes';
import { labelManagementRoutes } from './routes/label-management.routes';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Middleware setup
app.use(compression());
app.use(morgan('combined'));

// CORS configuration for separate frontend/backend deployment
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://label-frontend-wheat.vercel.app',
    process.env.FRONTEND_URL || 'http://localhost:3000',
    /^https:\/\/.*\.vercel\.app$/,
    /^https:\/\/label-frontend.*\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Access-Control-Allow-Origin', 'Access-Control-Allow-Credentials'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Handle preflight requests
app.options('*', cors());

// General middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom request logging
app.use(requestLogger);

// Health check (before other routes)
app.use('/health', healthRoutes);

// Basic route for root
app.get('/', (req, res) => {
  res.json({ 
    message: 'Label Backend Server', 
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      projects: '/api/projects',
      assets: '/api/assets',
      labelManagement: '/api/label-management'
    }
  });
});

// API routes with detailed logging
app.use('/api', apiLogger);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/assets', simplifiedAssetRoutes);
app.use('/api/label-management', labelManagementRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export { app };
