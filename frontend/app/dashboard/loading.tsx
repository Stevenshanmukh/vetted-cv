import { MainLayout } from '@/components/layout';
import { Skeleton } from '@/components/ui';

export default function DashboardLoading() {
  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-12 w-24 mb-3" />
            <Skeleton className="h-2 w-full mb-3" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="card">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-12 w-24 mb-3" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
          <div className="card">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>

        <div className="card">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

