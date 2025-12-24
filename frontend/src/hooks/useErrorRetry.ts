import { useState } from 'react';

export function useErrorRetry(reset: () => void) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    try {
      // Wait a bit before retrying to allow network to recover
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try the reset function first
      reset();
      
      // If reset doesn't work after a delay, fallback to page refresh
      setTimeout(() => {
        if (retryCount >= 2) {
          window.location.reload();
        }
      }, 2000);
    } catch (err) {
      console.error('Retry failed:', err);
      // Fallback to page refresh if reset fails
      window.location.reload();
    } finally {
      setTimeout(() => setIsRetrying(false), 3000);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return {
    isRetrying,
    retryCount,
    handleRetry,
    handleRefresh,
  };
}

