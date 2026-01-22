'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';
import { useErrorRetry } from '@/hooks/useErrorRetry';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { isRetrying, retryCount, handleRetry, handleRefresh } = useErrorRetry(reset);

  // Safely extract error message, handling Event objects and other non-Error types
  const getErrorMessage = (err: any): string => {
    // Check if it's an Event object
    if (err && typeof err === 'object' && err.type && err.target) {
      return 'An unexpected event error occurred. Please try again.';
    }
    
    // Check if it's an Error instance
    if (err instanceof Error) {
      return err.message || 'An unexpected error occurred';
    }
    
    // Check if it has a message property
    if (err?.message && typeof err.message === 'string') {
      return err.message;
    }
    
    // Check if it's a string
    if (typeof err === 'string') {
      return err;
    }
    
    // Fallback
    return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  };

  const errorMessage = getErrorMessage(error);
  const isNetworkError = errorMessage.toLowerCase().includes('network') || 
                         errorMessage.toLowerCase().includes('fetch') ||
                         errorMessage.toLowerCase().includes('connection');

  useEffect(() => {
    console.error('Root error:', error);
    // Log error details for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Error type:', typeof error);
      console.error('Error value:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-error text-3xl">error</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-2">
          Something went wrong
        </h1>
        <p className="text-text-secondary dark:text-text-secondary-dark mb-6">
          {isNetworkError
            ? 'Connection error detected. Please check your internet connection.'
            : errorMessage}
        </p>
        {retryCount > 0 && (
          <p className="text-sm text-text-muted mb-4">
            Retry attempt {retryCount}
          </p>
        )}
        <div className="flex gap-3 justify-center flex-wrap">
          <Button 
            onClick={handleRetry} 
            variant="primary"
            loading={isRetrying}
            disabled={isRetrying}
          >
            {isRetrying ? 'Retrying...' : 'Try Again'}
          </Button>
          <Button onClick={handleRefresh} variant="secondary">
            Refresh Page
          </Button>
          <Button onClick={() => window.location.href = '/dashboard'} variant="ghost">
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

