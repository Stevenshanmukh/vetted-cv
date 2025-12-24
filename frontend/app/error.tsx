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

  useEffect(() => {
    console.error('Root error:', error);
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
          {error.message?.includes('network') || error.message?.includes('fetch')
            ? 'Connection error detected. Please check your internet connection.'
            : 'An unexpected error occurred. Please try again or contact support if the problem persists.'}
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

