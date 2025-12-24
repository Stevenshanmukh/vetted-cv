import { MainLayout } from '@/components/layout';
import { Skeleton } from '@/components/ui';

export default function ProfileLoading() {
  return (
    <MainLayout title="Profile Builder">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="card">
          <div className="flex justify-between mb-4">
            <div>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-10 w-16" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="card p-2">
              <div className="space-y-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="card">
              <Skeleton className="h-8 w-40 mb-6" />
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

