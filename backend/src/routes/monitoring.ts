import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { getRequestMetrics } from '../middleware/requestLogger';
import { getCacheStats } from '../middleware/cache';
import { openAIService } from '../services/OpenAIService';

const router = Router();

/**
 * GET /api/monitoring/metrics
 * Get application metrics (protected)
 */
router.get('/metrics', requireAuth, (_req: Request, res: Response) => {
  const requestMetrics = getRequestMetrics();
  const aiStats = openAIService.getStats();

  const cacheStats = getCacheStats();
  
  res.json({
    success: true,
    data: {
      requests: requestMetrics,
      ai: aiStats,
      cache: {
        size: cacheStats.size,
        entries: cacheStats.entries.length,
      },
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024), // MB
      },
      uptime: Math.round(process.uptime()), // seconds
    },
    meta: { timestamp: new Date().toISOString() },
  });
});

/**
 * GET /api/monitoring/health
 * Detailed health check (public)
 */
router.get('/health', (_req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  const isHealthy = memoryUsage.heapUsed < 500 * 1024 * 1024; // Less than 500MB

  res.json({
    success: true,
    data: {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
      },
      ai: {
        enabled: !!process.env.OPENAI_API_KEY,
        ...openAIService.getStats(),
      },
    },
    meta: { timestamp: new Date().toISOString() },
  });
});

export default router;

