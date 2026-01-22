'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { ProfileCompleteness } from '@/components/profile/ProfileCompleteness';
import { OnboardingAISetup } from '@/components/onboarding/OnboardingAISetup';
import { api, Profile, ApplicationStats } from '@/services/api';
import { cn, getStatusColor, getRelativeTime } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [completenessData, setCompletenessData] = useState<{ percent: number; missing: string[] } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [profileRes, statsRes, completenessRes] = await Promise.all([
          api.profile.get(),
          api.applications.getStats(),
          api.profile.getCompleteness(),
        ]);

        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
        }
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }
        if (completenessRes.success && completenessRes.data) {
          setCompletenessData(completenessRes.data);
        }
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <MainLayout title="Dashboard">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const firstName = profile?.personalInfo?.firstName || user?.name?.split(' ')[0] || 'there';

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">
              Welcome back, {firstName}!
            </h1>
            <p className="text-text-secondary dark:text-text-secondary-dark">
              Here&apos;s an overview of your resume intelligence
            </p>
          </div>
          <Link href="/job-analysis">
            <Button icon="add">New Resume</Button>
          </Link>
        </div>

        {/* AI Onboarding Banner */}
        <OnboardingAISetup />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Completeness */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Completeness</CardTitle>
              <span className="material-symbols-outlined text-primary">person</span>
            </CardHeader>
            <div className="space-y-4">
              <ProfileCompleteness
                percent={completenessData?.percent || profile?.completenessPercent || 0}
                missing={completenessData?.missing || []}
              />

              <Link
                href="/profile"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1 w-full justify-end"
              >
                Complete your profile
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </Card>

          {/* Applications Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Applications</CardTitle>
              <span className="material-symbols-outlined text-primary">assignment</span>
            </CardHeader>
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <span className="text-4xl font-bold text-text-primary dark:text-text-primary-dark">
                  {stats?.total || 0}
                </span>
                <span className="text-sm text-text-muted">Total</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {stats?.byStatus && Object.entries(stats.byStatus).map(([status, count]) => (
                  count > 0 && (
                    <Badge key={status} className={getStatusColor(status)}>
                      {count} {status}
                    </Badge>
                  )
                ))}
              </div>
              <Link
                href="/applications"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                View all applications
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <span className="material-symbols-outlined text-primary">bolt</span>
            </CardHeader>
            <div className="space-y-2">
              <Link href="/job-analysis" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <span className="material-symbols-outlined text-primary">work</span>
                  <span className="text-sm font-medium">Analyze Job Description</span>
                </div>
              </Link>
              <Link href="/profile" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <span className="material-symbols-outlined text-primary">edit</span>
                  <span className="text-sm font-medium">Edit Profile</span>
                </div>
              </Link>
              <Link href="/resumes" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <span className="material-symbols-outlined text-primary">description</span>
                  <span className="text-sm font-medium">View Resume Library</span>
                </div>
              </Link>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <Link href="/applications">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', getStatusColor(activity.application.status))}>
                    <span className="material-symbols-outlined text-lg">
                      {activity.application.status === 'interview' ? 'event' :
                        activity.application.status === 'offer' ? 'celebration' :
                          activity.application.status === 'rejected' ? 'close' : 'send'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-text-primary dark:text-text-primary-dark">
                      {activity.action}
                    </p>
                    <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
                      {activity.application.jobTitle} at {activity.application.company}
                    </p>
                  </div>
                  <span className="text-sm text-text-muted">
                    {getRelativeTime(activity.date)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-text-muted mb-2">inbox</span>
              <p className="text-text-secondary dark:text-text-secondary-dark">
                No recent activity. Start by analyzing a job description!
              </p>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
