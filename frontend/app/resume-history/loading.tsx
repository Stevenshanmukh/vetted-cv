import { MainLayout } from '@/components/layout';
import { Skeleton } from '@/components/ui';

export default function ResumeHistoryLoading() {
  return (
    <MainLayout title="Resume History">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-6 w-20 mb-4" />
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Skeleton className="h-8 w-12 mb-1" />
                  <Skeleton className="h-2 w-full" />
                </div>
                <div>
                  <Skeleton className="h-8 w-12 mb-1" />
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

