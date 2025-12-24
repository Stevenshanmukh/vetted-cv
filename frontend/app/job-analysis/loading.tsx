import { MainLayout } from '@/components/layout';
import { Skeleton } from '@/components/ui';

export default function JobAnalysisLoading() {
  return (
    <MainLayout title="Job Description Analysis">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="card">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-64 w-full mb-4" />
          <div className="flex justify-end">
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

