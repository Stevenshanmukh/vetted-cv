import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 * Limits: 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

/**
 * Strict rate limiter for auth endpoints
 * Limits: 5 requests per 15 minutes per IP (production)
 * Limits: 50 requests per 1 minute per IP (development - more lenient for testing)
 */
export const authLimiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 1 * 60 * 1000, // 15 min (prod) or 1 min (dev)
  max: process.env.NODE_ENV === 'production' ? 5 : 200, // More lenient in development
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: process.env.NODE_ENV === 'production'
        ? 'Too many authentication attempts, please try again in 15 minutes.'
        : 'Too many authentication attempts, please try again in 1 minute.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Strict rate limiter for AI endpoints (cost control)
 * Limits: 20 requests per hour per IP
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Limit each IP to 100 AI requests per hour
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many AI requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

