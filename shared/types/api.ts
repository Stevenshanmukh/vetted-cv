/**
 * Standard API Response Contract
 * ALL endpoints must use this envelope format
 */

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'INTERNAL_ERROR'
  | 'BAD_REQUEST';

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, string[]>;
}

export interface ApiMeta {
  timestamp: string;
  requestId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

/**
 * Helper function to create a success response
 */
export function successResponse<T>(data: T, meta?: Partial<ApiMeta>): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

/**
 * Helper function to create an error response
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  details?: Record<string, string[]>
): ApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
}

