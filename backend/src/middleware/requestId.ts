import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

/**
 * Generate request ID for tracking
 */
export function requestId(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Generate or use existing request ID
  const id = req.headers['x-request-id'] as string || randomBytes(8).toString('hex');
  
  // Set in request and response headers
  req.headers['x-request-id'] = id;
  res.setHeader('X-Request-ID', id);
  
  next();
}

