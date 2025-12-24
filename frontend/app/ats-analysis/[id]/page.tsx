'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, Button, Badge, Progress } from '@/components/ui';
import { api, Resume, ResumeScore } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { cn, getScoreColor, getScoreLabel } from '@/lib/utils';

export default function ATSAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { showToast } = useToast();
  const [resume, setResume] = useState<Resume | null>(null);
  const [score, setScore] = useState<ResumeScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [rescoring, setRescoring] = useState(false);

  useEffect(() => {
    async function loadData() {
      const result = await api.resume.get(id);
      if (result.success && result.data) {
        setResume(result.data);
        if (result.data.scores && result.data.scores.length > 0) {
          setScore(result.data.scores[0]);
        }
      } else {
        showToast('error', 'Resume not found');
      }
      setLoading(false);
    }

    loadData();
  }, [id, showToast]);

  const handleRescan = async () => {
    setRescoring(true);
    const result = await api.resume.score(id);
    setRescoring(false);

    if (result.success && result.data) {
      setScore(result.data);
      showToast('success', 'Resume re-scored successfully!');
    } else {
      showToast('error', result.error?.message || 'Failed to rescore');
    }
  };

  if (loading) {
    return (
      <MainLayout title="ATS & Confidence Score">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card animate-pulse h-64" />
            <div className="card animate-pulse h-64" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!resume || !score) {
    return (
      <MainLayout title="ATS & Confidence Score">
        <div className="max-w-4xl mx-auto text-center py-12">
          <span className="material-symbols-outlined text-6xl text-text-muted mb-4">error</span>
          <h2 className="text-xl font-semibold mb-2">Score not available</h2>
          <p className="text-text-secondary dark:text-text-secondary-dark mb-4">
            This resume hasn&apos;t been scored yet.
          </p>
          <Link href={`/resume-generator?resumeId=${id}`}>
            <Button>Go to Resume</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="ATS & Confidence Score">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">
              {resume.title}
            </h1>
            <p className="text-text-secondary dark:text-text-secondary-dark">
              Detailed scoring analysis
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" icon="refresh" loading={rescoring} onClick={handleRescan}>
              Re-Scan
            </Button>
            <Link href={`/resume-generator?resumeId=${id}`}>
              <Button variant="ghost" icon="edit">
                Edit Resume
              </Button>
            </Link>
          </div>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ATS Score */}
          <Card>
            <CardHeader>
              <CardTitle>ATS Score</CardTitle>
              <span className="material-symbols-outlined text-primary">smart_toy</span>
            </CardHeader>
            <div className="text-center py-4">
              <div className={cn('text-6xl font-bold', getScoreColor(score.atsScore))}>
                {score.atsScore}
              </div>
              <div className={cn('text-lg font-medium mt-2', getScoreColor(score.atsScore))}>
                {getScoreLabel(score.atsScore)}
              </div>
              <p className="text-sm text-text-muted mt-2">
                How well your resume will pass through ATS filters
              </p>
            </div>
            <div className="space-y-4 pt-4 border-t border-border-light dark:border-border-dark">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Keyword Coverage</span>
                  <span className="font-medium">{score.breakdown.ats.keywordCoverage}%</span>
                </div>
                <Progress value={score.breakdown.ats.keywordCoverage} size="sm" colorByScore />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Format Compliance</span>
                  <span className="font-medium">{score.breakdown.ats.formatScore}%</span>
                </div>
                <Progress value={score.breakdown.ats.formatScore} size="sm" colorByScore />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Section Structure</span>
                  <span className="font-medium">{score.breakdown.ats.sectionScore}%</span>
                </div>
                <Progress value={score.breakdown.ats.sectionScore} size="sm" colorByScore />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Length Optimization</span>
                  <span className="font-medium">{score.breakdown.ats.lengthScore}%</span>
                </div>
                <Progress value={score.breakdown.ats.lengthScore} size="sm" colorByScore />
              </div>
            </div>
          </Card>

          {/* Recruiter Score */}
          <Card>
            <CardHeader>
              <CardTitle>Recruiter Confidence</CardTitle>
              <span className="material-symbols-outlined text-primary">person_search</span>
            </CardHeader>
            <div className="text-center py-4">
              <div className={cn('text-6xl font-bold', getScoreColor(score.recruiterScore))}>
                {score.recruiterScore}
              </div>
              <div className={cn('text-lg font-medium mt-2', getScoreColor(score.recruiterScore))}>
                {getScoreLabel(score.recruiterScore)}
              </div>
              <p className="text-sm text-text-muted mt-2">
                How likely a recruiter will be impressed
              </p>
            </div>
            <div className="space-y-4 pt-4 border-t border-border-light dark:border-border-dark">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Quantified Metrics</span>
                  <span className="font-medium">{score.breakdown.recruiter.metricsScore}%</span>
                </div>
                <Progress value={score.breakdown.recruiter.metricsScore} size="sm" colorByScore />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Action Verbs</span>
                  <span className="font-medium">{score.breakdown.recruiter.actionVerbScore}%</span>
                </div>
                <Progress value={score.breakdown.recruiter.actionVerbScore} size="sm" colorByScore />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Readability</span>
                  <span className="font-medium">{score.breakdown.recruiter.readabilityScore}%</span>
                </div>
                <Progress value={score.breakdown.recruiter.readabilityScore} size="sm" colorByScore />
              </div>
            </div>
          </Card>
        </div>

        {/* Missing Keywords */}
        {score.missingKeywords.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Missing Keywords</CardTitle>
              <Badge variant="warning">{score.missingKeywords.length} to add</Badge>
            </CardHeader>
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-4">
              Consider adding these keywords to improve your ATS score:
            </p>
            <div className="flex flex-wrap gap-2">
              {score.missingKeywords.map((kw, i) => (
                <Badge key={i} variant="error" className="text-sm">
                  {kw}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Optimization Recommendations</CardTitle>
            <span className="material-symbols-outlined text-primary">lightbulb</span>
          </CardHeader>
          <div className="space-y-3">
            {score.recommendations.map((rec, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">{i + 1}</span>
                </div>
                <p className="text-text-secondary dark:text-text-secondary-dark">{rec}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Estimated Rank */}
        <Card>
          <CardHeader>
            <CardTitle>Estimated Applicant Rank</CardTitle>
          </CardHeader>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">
                Top {Math.max(5, Math.min(50, 100 - Math.round((score.atsScore + score.recruiterScore) / 2)))}%
              </div>
              <p className="text-sm text-text-muted mt-1">
                Among applicants with similar scores
              </p>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-success">check_circle</span>
                <span className="text-sm">Passes most ATS filters</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-success">check_circle</span>
                <span className="text-sm">Professional formatting detected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'material-symbols-outlined',
                  score.atsScore >= 70 ? 'text-success' : 'text-warning'
                )}>
                  {score.atsScore >= 70 ? 'check_circle' : 'warning'}
                </span>
                <span className="text-sm">
                  {score.atsScore >= 70 ? 'Good keyword density' : 'Could improve keyword density'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Link href="/resume-history">
            <Button variant="secondary" icon="history">
              Resume History
            </Button>
          </Link>
          <Link href="/applications">
            <Button icon="assignment">
              Track This Application
            </Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}

