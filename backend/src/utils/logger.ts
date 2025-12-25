/**
 * Simple structured logger
 * In production, replace with Winston, Pino, or similar
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LOG_LEVEL = process.env.LOG_LEVEL 
  ? parseInt(process.env.LOG_LEVEL) 
  : process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
  requestId?: string;
}

function formatLog(level: string, message: string, context?: Record<string, any>, requestId?: string): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    requestId,
  };
}

export const logger = {
  debug: (message: string, context?: Record<string, any>, requestId?: string) => {
    if (LOG_LEVEL <= LogLevel.DEBUG) {
      console.debug(JSON.stringify(formatLog('DEBUG', message, context, requestId)));
    }
  },

  info: (message: string, context?: Record<string, any>, requestId?: string) => {
    if (LOG_LEVEL <= LogLevel.INFO) {
      console.info(JSON.stringify(formatLog('INFO', message, context, requestId)));
    }
  },

  warn: (message: string, context?: Record<string, any>, requestId?: string) => {
    if (LOG_LEVEL <= LogLevel.WARN) {
      console.warn(JSON.stringify(formatLog('WARN', message, context, requestId)));
    }
  },

  error: (message: string, error?: Error | Record<string, any>, requestId?: string) => {
    if (LOG_LEVEL <= LogLevel.ERROR) {
      const context = error instanceof Error 
        ? { error: error.message, stack: error.stack }
        : error;
      console.error(JSON.stringify(formatLog('ERROR', message, context, requestId)));
    }
  },
};

