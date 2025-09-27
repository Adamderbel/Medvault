import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import authRoutes from './routes/auth';
import patientRoutes from './routes/patient';
import doctorRoutes from './routes/doctor';
import notificationRoutes from './routes/notifications';
import resetRoutes from './routes/reset';

// Import database
import { database } from './database';

// Import utilities
import { createErrorResponse } from './utils/helpers';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reset', resetRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to MedVault API',
    version: '1.0.0',
    description: 'Privacy-focused healthcare dApp backend',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      patient: '/api/patient',
      doctor: '/api/doctor',
      notifications: '/api/notifications'
    },
    documentation: 'See /docs for API documentation'
  });
});

// API documentation endpoint
app.get('/docs', (req, res) => {
  res.json({
    title: 'MedVault API Documentation',
    version: '1.0.0',
    description: 'Privacy-focused healthcare dApp API',
    baseUrl: `${req.protocol}://${req.get('host')}`,
    endpoints: {
      authentication: {
        'POST /api/auth/challenge': 'Generate authentication challenge',
        'POST /api/auth/patient/signup': 'Patient registration',
        'POST /api/auth/patient/login': 'Patient login',
        'POST /api/auth/doctor/login': 'Doctor login',
        'POST /api/auth/create-wallet': 'Create new wallet (development)',
        'GET /api/auth/verify': 'Verify JWT token'
      },
      patient: {
        'GET /api/patient/profile': 'Get patient profile',
        'POST /api/patient/upload-record': 'Upload medical record',
        'GET /api/patient/medical-record': 'Get medical record',
        'GET /api/patient/doctors': 'Get all doctors with connection status',
        'GET /api/patient/notifications': 'Get doctor requests',
        'POST /api/patient/notifications/:id/respond': 'Approve/deny doctor request',
        'POST /api/patient/revoke-access/:doctorId': 'Revoke doctor access',
        'GET /api/patient/medical-fields': 'Get available medical fields',
        'POST /api/patient/generate-sample-record': 'Generate sample record'
      },
      doctor: {
        'GET /api/doctor/profile': 'Get doctor profile',
        'GET /api/doctor/patients': 'Get connected patients',
        'GET /api/doctor/all-patients': 'Get all patients for connection',
        'POST /api/doctor/request-access': 'Request patient data access',
        'GET /api/doctor/patient/:id/medical-data': 'Get approved patient data',
        'GET /api/doctor/requests': 'Get sent requests',
        'DELETE /api/doctor/requests/:id': 'Cancel pending request',
        'GET /api/doctor/contracts': 'Get active contracts'
      },
      notifications: {
        'GET /api/notifications': 'Get all notifications',
        'GET /api/notifications/:id': 'Get notification by ID',
        'GET /api/notifications/stats': 'Get notification statistics',
        'POST /api/notifications/:id/read': 'Mark notification as read',
        'GET /api/notifications/pending/count': 'Get pending notifications count'
      }
    },
    authentication: {
      type: 'JWT Bearer Token',
      header: 'Authorization: Bearer <token>',
      note: 'Most endpoints require authentication'
    },
    walletIntegration: {
      network: 'Midnight Network',
      authentication: 'Wallet signature verification',
      storage: 'Encrypted data storage on Midnight'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json(createErrorResponse(`Route ${req.method} ${req.originalUrl} not found`));
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json(createErrorResponse('Validation error', error.details));
  }
  
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json(createErrorResponse('Unauthorized'));
  }
  
  if (error.code === 'SQLITE_CONSTRAINT') {
    return res.status(409).json(createErrorResponse('Database constraint violation'));
  }

  // Default error response
  const statusCode = error.statusCode || error.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message || 'Something went wrong';

  res.status(statusCode).json(createErrorResponse(message));
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  database.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  database.close();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MedVault API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 API docs: http://localhost:${PORT}/docs`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
});

export default app;
