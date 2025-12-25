import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// Custom error class for API errors
export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, string[]>;
  public readonly context?: Record<string, any>;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: Record<string, string[]>,
    context?: Record<string, any>
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.context = context;
    this.name = 'ApiError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, context?: Record<string, any>) {
    super('NOT_FOUND', `${resource} not found`, 404, undefined, context);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: Record<string, string[]>) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Access denied') {
    super('FORBIDDEN', message, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * User-friendly error messages
 */
const USER_FRIENDLY_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: 'Please check your input and try again',
  NOT_FOUND: 'The requested resource was not found',
  UNAUTHORIZED: 'Please log in to continue',
  FORBIDDEN: 'You do not have permission to perform this action',
  INTERNAL_ERROR: 'Something went wrong. Please try again later',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment and try again',
  NETWORK_ERROR: 'Network error. Please check your connection',
};

/**
 * Get user-friendly error message
 */
function getUserFriendlyMessage(code: string, defaultMessage: string): string {
  return USER_FRIENDLY_MESSAGES[code] || defaultMessage;
}

/**
 * Format Zod validation errors for users
 */
function formatZodErrors(zodError: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  
  zodError.errors.forEach((error) => {
    const path = error.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    
    // User-friendly validation messages
    let message = error.message;
    if (error.code === 'too_small') {
      message = `Must be at least ${error.minimum} characters`;
    } else if (error.code === 'too_big') {
      message = `Must be at most ${error.maximum} characters`;
    } else if (error.code === 'invalid_type') {
      message = `Invalid ${error.path[error.path.length - 1]}`;
    } else if (error.code === 'invalid_string') {
      if (error.validation === 'email') {
        message = 'Please enter a valid email address';
      }
    }
    
    formatted[path].push(message);
  });
  
  return formatted;
}

/**
 * Structured error logging
 */
function logError(
  err: Error,
  req: Request,
  context?: Record<string, any>
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    error: {
      name: err.name,
      message: err.message,
      code: err instanceof ApiError ? err.code : 'UNKNOWN',
      statusCode: err instanceof ApiError ? err.statusCode : 500,
    },
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
    context: err instanceof ApiError ? err.context : context,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  };

  // Log to console (in production, send to logging service)
  if (logEntry.error.statusCode >= 500) {
    console.error('[ERROR]', JSON.stringify(logEntry, null, 2));
  } else {
    console.warn('[WARN]', JSON.stringify(logEntry, null, 2));
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  logError(err, req);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = formatZodErrors(err);
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: getUserFriendlyMessage('VALIDATION_ERROR', 'Validation failed'),
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || undefined,
      },
    });
    return;
  }

  // Handle custom API errors
  if (err instanceof ApiError) {
    const userMessage = getUserFriendlyMessage(err.code, err.message);
    
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: userMessage,
        details: err.details,
        // Include original message in development
        ...(process.env.NODE_ENV === 'development' && { originalMessage: err.message }),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || undefined,
      },
    });
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    
    if (prismaError.code === 'P2002') {
      // Unique constraint violation
      res.status(409).json({
        success: false,
        error: {
          code: 'ALREADY_EXISTS',
          message: 'This record already exists',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }
    
    if (prismaError.code === 'P2025') {
      // Record not found
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Record not found',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }
  }

  // Handle unknown errors
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: getUserFriendlyMessage('INTERNAL_ERROR', 'An unexpected error occurred'),
      ...(isDevelopment && { 
        originalMessage: err.message,
        stack: err.stack,
      }),
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || undefined,
    },
  });
}
