import { MainLayout } from '@/components/layout';
import { Skeleton } from '@/components/ui';

export default function ApplicationsLoading() {
  return (
    <MainLayout title="Application Tracker">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card text-center">
              <Skeleton className="h-10 w-16 mx-auto mb-2" />
              <Skeleton className="h-4 w-12 mx-auto" />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-20" />
            ))}
          </div>
          <Skeleton className="h-10 w-36" />
        </div>

        <div className="card">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
