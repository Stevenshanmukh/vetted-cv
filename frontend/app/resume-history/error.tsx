'use client';

import { useEffect } from 'react';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui';

export default function ResumeHistoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Resume history error:', error);
  }, [error]);

  return (
    <MainLayout title="Resume History">
      <div className="max-w-md mx-auto text-center py-12">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-error text-3xl">error</span>
        </div>
        <h1 className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-2">
          Failed to load resume history
        </h1>
        <p className="text-text-secondary dark:text-text-secondary-dark mb-6">
          There was a problem loading your resumes. Please try again.
        </p>
        <Button onClick={reset}>Try Again</Button>
      </div>
    </MainLayout>
  );
}

