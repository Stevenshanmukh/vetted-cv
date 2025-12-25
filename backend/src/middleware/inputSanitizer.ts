import { Request, Response, NextFunction } from 'express';

/**
 * Basic XSS prevention - sanitize strings
 */
function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') {
    return String(input);
  }

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Recursively sanitize object values
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Fields that should NOT be sanitized (contain technical content)
 */
const UNSANITIZED_FIELDS = [
  'password',
  'latexContent',
  'descriptionText',
  'description',
  'notes',
  'summary',
  'content',
  'body',
];

/**
 * Check if a field should be sanitized
 */
function shouldSanitize(fieldName: string): boolean {
  const lowerName = fieldName.toLowerCase();
  return !UNSANITIZED_FIELDS.some((field) => lowerName.includes(field));
}

/**
 * Input sanitization middleware
 * Prevents XSS attacks by sanitizing request body
 * Skips technical fields (LaTeX, descriptions, etc.)
 */
export function sanitizeInput(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Only sanitize if body exists and is an object
  if (req.body && typeof req.body === 'object') {
    const sanitizedBody: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(req.body)) {
      if (shouldSanitize(key)) {
        sanitizedBody[key] = sanitizeObject(value);
      } else {
        // Keep technical fields as-is
        sanitizedBody[key] = value;
      }
    }
    
    req.body = sanitizedBody;
  }

  // Sanitize query parameters (always safe to sanitize)
  if (req.query && typeof req.query === 'object') {
    const sanitizedQuery: Record<string, any> = {};
    for (const [key, value] of Object.entries(req.query)) {
      sanitizedQuery[key] = typeof value === 'string' ? sanitizeString(value) : value;
    }
    req.query = sanitizedQuery;
  }

  next();
}

