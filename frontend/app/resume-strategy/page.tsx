'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { api, JobDescription, ResumeStrategy } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';

interface StrategyOption {
  id: ResumeStrategy;
  name: string;
  description: string;
  useCase: string;
  icon: string;
  emphasis: string[];
}

const strategies: StrategyOption[] = [
  {
    id: 'max_ats',
    name: 'Max ATS',
    description: 'Maximize keyword matching for applicant tracking systems',
    useCase: 'When applying to large companies with automated screening',
    icon: 'robot',
    emphasis: ['Exact JD keywords', 'Skills section first', 'Standard formatting'],
  },
  {
    id: 'recruiter_readability',
    name: 'Recruiter Readability',
    description: 'Optimized for human recruiters with clear, scannable format',
    useCase: 'When you know a human will review your resume first',
    icon: 'person_search',
    emphasis: ['Strong summary', 'Clean bullet points', 'Quantified achievements'],
  },
  {
    id: 'career_switch',
    name: 'Career Switch',
    description: 'Emphasizes transferable skills and relevant projects',
    useCase: 'When transitioning to a new industry or role',
    icon: 'swap_horiz',
    emphasis: ['Transferable skills', 'Relevant projects', 'Adaptability'],
  },
  {
    id: 'promotion_internal',
    name: 'Promotion / Internal',
    description: 'Highlights growth trajectory and leadership',
    useCase: 'When applying for an internal promotion',
    icon: 'trending_up',
    emphasis: ['Achievements', 'Growth story', 'Leadership examples'],
  },
  {
    id: 'stretch_role',
    name: 'Stretch Role',
    description: 'Emphasizes ambition and potential over exact experience',
    useCase: 'When applying for a role above your current level',
    icon: 'rocket_launch',
    emphasis: ['Projects', 'Leadership', 'Impact at scale'],
  },
];

function ResumeStrategyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const jobId = searchParams.get('jobId');
  
  const [job, setJob] = useState<JobDescription | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<ResumeStrategy | null>(null);
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function loadJob() {
      if (!jobId) {
        showToast('error', 'No job ID provided');
        router.push('/job-analysis');
        return;
      }

      const result = await api.job.get(jobId);
      if (result.success && result.data) {
        setJob(result.data);
      }
      setLoading(false);
    }

    loadJob();
  }, [jobId, router, showToast]);

  const handleGenerate = async () => {
    if (!jobId || !selectedStrategy) return;

    setGenerating(true);
    const result = await api.resume.generate({
      jobDescriptionId: jobId,
      strategy: selectedStrategy,
      saveToLibrary,
    });
    setGenerating(false);

    if (result.success && result.data) {
      showToast('success', `Resume generated${saveToLibrary ? ' and saved to library' : ''}!`);
      router.push(`/resume-generator?resumeId=${result.data.id}`);
    } else {
      showToast('error', result.error?.message || 'Failed to generate resume');
    }
  };

  if (loading) {
    return (
      <MainLayout title="Choose Resume Strategy">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Choose Resume Strategy">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Job Context */}
        {job && (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Generating resume for</p>
                <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">
                  {job.title} at {job.company}
                </h2>
              </div>
              <Link href={`/match-analysis?jobId=${jobId}`}>
                <Button variant="ghost" size="sm" icon="arrow_back">
                  Back to Match
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Strategy Selection */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-4">
            Select a Resume Strategy
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategies.map((strategy) => (
              <Card
                key={strategy.id}
                hoverable
                className={cn(
                  'cursor-pointer transition-all',
                  selectedStrategy === strategy.id
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
                onClick={() => setSelectedStrategy(strategy.id)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center',
                      selectedStrategy === strategy.id
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-text-secondary dark:text-text-secondary-dark'
                    )}
                  >
                    <span className="material-symbols-outlined">{strategy.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-text-primary dark:text-text-primary-dark">
                      {strategy.name}
                    </h4>
                    <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-2">
                      {strategy.description}
                    </p>
                    <p className="text-xs text-text-muted mb-3">
                      <strong>Best for:</strong> {strategy.useCase}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {strategy.emphasis.map((item, i) => (
                        <Badge key={i} variant="default" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {selectedStrategy === strategy.id && (
                    <span className="material-symbols-outlined text-primary">check_circle</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Options and Generate Button */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={saveToLibrary}
              onChange={(e) => setSaveToLibrary(e.target.checked)}
              className="w-5 h-5 rounded border-border-light dark:border-border-dark text-primary focus:ring-primary"
            />
            <div>
              <span className="text-sm font-medium text-text-primary dark:text-text-primary-dark group-hover:text-primary">
                Save to Library
              </span>
              <p className="text-xs text-text-muted">
                Keep this resume in your library for future use
              </p>
            </div>
          </label>
          <Button
            onClick={handleGenerate}
            disabled={!selectedStrategy}
            loading={generating}
            icon="auto_awesome"
            size="lg"
          >
            Generate Resume
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}

export default function ResumeStrategyPage() {
  return (
    <Suspense fallback={
      <MainLayout title="Choose Resume Strategy">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </MainLayout>
    }>
      <ResumeStrategyContent />
    </Suspense>
  );
}

