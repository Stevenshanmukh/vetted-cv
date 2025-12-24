'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, Button, Badge, Progress } from '@/components/ui';
import { api, MatchResult, JobDescription } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { cn, getScoreColor } from '@/lib/utils';

function MatchAnalysisContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const jobId = searchParams.get('jobId');
  
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<JobDescription | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!jobId) {
        showToast('error', 'No job ID provided');
        router.push('/job-analysis');
        return;
      }

      const [jobRes, matchRes] = await Promise.all([
        api.job.get(jobId),
        api.job.match(jobId),
      ]);

      if (jobRes.success && jobRes.data) {
        setJob(jobRes.data);
      }
      if (matchRes.success && matchRes.data) {
        setMatch(matchRes.data);
      } else {
        showToast('error', matchRes.error?.message || 'Failed to calculate match');
      }

      setLoading(false);
    }

    loadData();
  }, [jobId, router, showToast]);

  const handleProceedToStrategy = () => {
    if (jobId) {
      router.push(`/resume-strategy?jobId=${jobId}`);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Match Analysis">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="card animate-pulse">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!job || !match) {
    return (
      <MainLayout title="Match Analysis">
        <div className="max-w-4xl mx-auto text-center py-12">
          <span className="material-symbols-outlined text-6xl text-text-muted mb-4">error</span>
          <h2 className="text-xl font-semibold mb-2">Unable to load match analysis</h2>
          <p className="text-text-secondary dark:text-text-secondary-dark mb-4">
            Please go back and analyze a job description first.
          </p>
          <Link href="/job-analysis">
            <Button>Analyze Job Description</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Match Analysis">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Job Header */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-text-primary dark:text-text-primary-dark">
                {job.title}
              </h2>
              <p className="text-text-secondary dark:text-text-secondary-dark">{job.company}</p>
            </div>
            <div className="text-right">
              <div className={cn('text-4xl font-bold', getScoreColor(match.matchPercent))}>
                {match.matchPercent}%
              </div>
              <span className="text-sm text-text-muted">Match Score</span>
            </div>
          </div>
          <Progress value={match.matchPercent} className="mt-4" colorByScore />
        </Card>

        {/* Match Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Direct Matches */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Direct Matches</CardTitle>
              <Badge variant="success">{match.directMatches.length}</Badge>
            </CardHeader>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {match.directMatches.map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded bg-success/5">
                  <span className="material-symbols-outlined text-success text-lg">check_circle</span>
                  <div>
                    <p className="text-sm font-medium text-text-primary dark:text-text-primary-dark">
                      {item.keyword}
                    </p>
                    {item.evidence && (
                      <p className="text-xs text-text-muted">{item.evidence}</p>
                    )}
                  </div>
                </div>
              ))}
              {match.directMatches.length === 0 && (
                <p className="text-sm text-text-muted text-center py-4">No direct matches found</p>
              )}
            </div>
          </Card>

          {/* Partial Matches */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Partial Matches</CardTitle>
              <Badge variant="warning">{match.partialMatches.length}</Badge>
            </CardHeader>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {match.partialMatches.map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded bg-warning/5">
                  <span className="material-symbols-outlined text-warning text-lg">sync_alt</span>
                  <div>
                    <p className="text-sm font-medium text-text-primary dark:text-text-primary-dark">
                      {item.keyword}
                    </p>
                    {item.evidence && (
                      <p className="text-xs text-text-muted">{item.evidence}</p>
                    )}
                  </div>
                </div>
              ))}
              {match.partialMatches.length === 0 && (
                <p className="text-sm text-text-muted text-center py-4">No partial matches found</p>
              )}
            </div>
          </Card>

          {/* Gaps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Skill Gaps</CardTitle>
              <Badge variant="error">{match.gaps.length}</Badge>
            </CardHeader>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {match.gaps.map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded bg-error/5">
                  <span className="material-symbols-outlined text-error text-lg">remove_circle</span>
                  <div>
                    <p className="text-sm font-medium text-text-primary dark:text-text-primary-dark">
                      {item.keyword}
                    </p>
                    {item.suggestion && (
                      <p className="text-xs text-text-muted">{item.suggestion}</p>
                    )}
                  </div>
                </div>
              ))}
              {match.gaps.length === 0 && (
                <p className="text-sm text-text-muted text-center py-4">No gaps identified!</p>
              )}
            </div>
          </Card>
        </div>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <span className="material-symbols-outlined text-primary">lightbulb</span>
          </CardHeader>
          <ul className="space-y-3">
            {match.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary mt-0.5">arrow_right</span>
                <span className="text-text-secondary dark:text-text-secondary-dark">{rec}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Link href="/job-analysis">
            <Button variant="secondary" icon="arrow_back">
              Analyze Another Job
            </Button>
          </Link>
          <Button onClick={handleProceedToStrategy} icon="strategy" size="lg">
            Choose Resume Strategy
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}

export default function MatchAnalysisPage() {
  return (
    <Suspense fallback={
      <MainLayout title="Match Analysis">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="card animate-pulse">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </MainLayout>
    }>
      <MatchAnalysisContent />
    </Suspense>
  );
}

