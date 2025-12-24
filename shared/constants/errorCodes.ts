import { ErrorCode } from '../types/api';

/**
 * Error code definitions with default messages
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: 'Validation failed. Please check your input.',
  NOT_FOUND: 'The requested resource was not found.',
  ALREADY_EXISTS: 'A resource with this identifier already exists.',
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again.',
  BAD_REQUEST: 'The request could not be processed.',
};

/**
 * HTTP status codes for each error type
 */
export const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  ALREADY_EXISTS: 409,
  INTERNAL_ERROR: 500,
  BAD_REQUEST: 400,
};

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, string[]>;

  constructor(code: ErrorCode, message?: string, details?: Record<string, string[]>) {
    super(message || ERROR_MESSAGES[code]);
    this.code = code;
    this.statusCode = ERROR_STATUS_CODES[code];
    this.details = details;
    this.name = 'ApiError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: Record<string, string[]>) {
    super('VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

