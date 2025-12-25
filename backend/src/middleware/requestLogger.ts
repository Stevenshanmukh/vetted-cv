import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Performance metrics
const requestMetrics = {
  total: 0,
  byMethod: {} as Record<string, number>,
  byStatus: {} as Record<number, number>,
  avgDuration: 0,
  durations: [] as number[],
};

/**
 * Middleware to log all HTTP requests with structured logging
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] as string;

  // Log request start
  logger.debug(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  }, requestId);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    // Update metrics
    requestMetrics.total++;
    requestMetrics.byMethod[req.method] = (requestMetrics.byMethod[req.method] || 0) + 1;
    requestMetrics.byStatus[statusCode] = (requestMetrics.byStatus[statusCode] || 0) + 1;
    requestMetrics.durations.push(duration);
    
    // Keep only last 1000 durations for average calculation
    if (requestMetrics.durations.length > 1000) {
      requestMetrics.durations.shift();
    }
    requestMetrics.avgDuration = 
      requestMetrics.durations.reduce((a, b) => a + b, 0) / requestMetrics.durations.length;

    // Log request completion
    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    logger[logLevel](`${req.method} ${req.path} ${statusCode}`, {
      method: req.method,
      path: req.path,
      statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length'),
    }, requestId);
  });

  next();
}

/**
 * Get request metrics
 */
export function getRequestMetrics() {
  return {
    ...requestMetrics,
    avgDuration: Math.round(requestMetrics.avgDuration),
  };
}

/**
 * Reset metrics (useful for testing)
 */
export function resetMetrics(): void {
  requestMetrics.total = 0;
  requestMetrics.byMethod = {};
  requestMetrics.byStatus = {};
  requestMetrics.avgDuration = 0;
  requestMetrics.durations = [];
}
