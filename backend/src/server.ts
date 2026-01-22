import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { requestId } from './middleware/requestId';
import { requireAuth } from './middleware/authMiddleware';
import { securityHeaders, customSecurityHeaders } from './middleware/securityHeaders';
import { apiLimiter, authLimiter, aiLimiter } from './middleware/rateLimiter';
import { sanitizeInput } from './middleware/inputSanitizer';
import { cacheMiddleware } from './middleware/cache';
import { openAIService } from './services/OpenAIService';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import jobRoutes from './routes/job';
import resumeRoutes from './routes/resume';
import applicationRoutes from './routes/applications';
import monitoringRoutes from './routes/monitoring';
import backupRoutes from './routes/backup';
import notificationRoutes from './routes/notifications';
import aiSettingsRoutes from './routes/aiSettings';

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// SECURITY MIDDLEWARE (Applied First)
// ============================================

// Security headers (Helmet)
app.use(securityHeaders());
app.use(customSecurityHeaders);

// Compression middleware (gzip)
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
}));

// Request size limits
app.use(express.json({
  limit: process.env.MAX_REQUEST_SIZE || '10mb',
  verify: (req: any, res, buf) => {
    // Reject requests that are too large
    if (buf.length > 10 * 1024 * 1024) { // 10MB
      throw new Error('Request entity too large');
    }
  },
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Input sanitization (XSS prevention)
app.use(sanitizeInput);

// Request ID tracking
app.use(requestId);

// Request logging
app.use(requestLogger);

// ============================================
// RATE LIMITING
// ============================================

// General API rate limiting
app.use('/api', apiLimiter);

// API Documentation (Swagger)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Vetted CV API Documentation',
}));

// Health check (public, no rate limit)
app.get('/api/health', (_req, res) => {
  const aiStats = openAIService.getStats();
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      ai: {
        enabled: !!process.env.OPENAI_API_KEY,
        totalTokensUsed: aiStats.totalTokensUsed,
        totalCost: `$${aiStats.totalCost}`,
        cacheSize: aiStats.cacheSize,
      },
    },
  });
});

// ============================================
// ROUTES
// ============================================

// Auth routes (public, with strict rate limiting)
app.use('/api/auth', authLimiter, authRoutes);

// AI-powered endpoints (with cost-control rate limiting)
app.use('/api/ai', aiSettingsRoutes); // New settings routes
app.use('/api/job/analyze', aiLimiter);
app.use('/api/resume/generate', aiLimiter);
app.use('/api/resume/score', aiLimiter);
app.use('/api/job/match', aiLimiter);

// Monitoring routes
app.use('/api/monitoring', monitoringRoutes);

// Protected API Routes (require authentication)
// Note: Profile has no cache since it changes frequently during editing
app.use('/api/profile', requireAuth, profileRoutes); // No cache (user edits frequently)
app.use('/api/job', requireAuth, cacheMiddleware(2 * 60 * 1000), jobRoutes); // 2 min cache
app.use('/api/resume', requireAuth, resumeRoutes); // No cache (dynamic content)
app.use('/api/applications', requireAuth, cacheMiddleware(1 * 60 * 1000), applicationRoutes); // 1 min cache
app.use('/api/notifications', notificationRoutes);
app.use('/api/backup', requireAuth, backupRoutes);

// ============================================
// ERROR HANDLING (Must be last)
// ============================================

app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Server running on http://localhost:${PORT}`);
  console.log(`[${new Date().toISOString()}] API available at http://localhost:${PORT}/api`);
  console.log(`[${new Date().toISOString()}] Security: Rate limiting, headers, sanitization enabled`);
});

export default app;
