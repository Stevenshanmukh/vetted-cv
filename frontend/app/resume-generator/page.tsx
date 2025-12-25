'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, Button, Badge, Progress } from '@/components/ui';
import { api, Resume, ResumeScore } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { cn, getScoreColor, getScoreLabel } from '@/lib/utils';

// Helper to normalize score data (handle JSON strings)
function normalizeScore(score: ResumeScore): ResumeScore {
  if (!score) return score;
  
  // If breakdown is a string, parse it
  if (typeof score.breakdown === 'string') {
    try {
      score.breakdown = JSON.parse(score.breakdown);
    } catch (e) {
      console.error('Failed to parse breakdown:', e);
      score.breakdown = {
        ats: { keywordCoverage: 0, formatScore: 0, sectionScore: 0, lengthScore: 0 },
        recruiter: { metricsScore: 0, actionVerbScore: 0, readabilityScore: 0 },
      };
    }
  }
  
  // If missingKeywords is a string, parse it
  if (typeof score.missingKeywords === 'string') {
    try {
      score.missingKeywords = JSON.parse(score.missingKeywords);
    } catch (e) {
      console.error('Failed to parse missingKeywords:', e);
      score.missingKeywords = [];
    }
  }
  
  // If recommendations is a string, parse it
  if (typeof score.recommendations === 'string') {
    try {
      score.recommendations = JSON.parse(score.recommendations);
    } catch (e) {
      console.error('Failed to parse recommendations:', e);
      score.recommendations = [];
    }
  }
  
  return score;
}

function ResumeGeneratorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const resumeId = searchParams.get('resumeId');
  
  const [resume, setResume] = useState<Resume | null>(null);
  const [score, setScore] = useState<ResumeScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);

  useEffect(() => {
    async function loadResume() {
      if (!resumeId) {
        showToast('error', 'No resume ID provided');
        router.push('/dashboard');
        return;
      }

      const result = await api.resume.get(resumeId);
      if (result.success && result.data) {
        setResume(result.data);
        // Check if already has a score
        if (result.data.scores && result.data.scores.length > 0) {
          setScore(normalizeScore(result.data.scores[0]));
        }
      } else {
        showToast('error', 'Resume not found');
        router.push('/dashboard');
      }
      setLoading(false);
    }

    loadResume();
  }, [resumeId, router, showToast]);

  const handleScore = async () => {
    if (!resumeId) return;

    setScoring(true);
    const result = await api.resume.score(resumeId);
    setScoring(false);

    if (result.success && result.data) {
      setScore(normalizeScore(result.data));
      showToast('success', 'Resume scored successfully!');
    } else {
      showToast('error', result.error?.message || 'Failed to score resume');
    }
  };

  const handleDownload = () => {
    if (!resumeId) return;
    const url = api.resume.getDownloadUrl(resumeId);
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <MainLayout title="Resume Generator">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card animate-pulse h-[600px]"></div>
            <div className="card animate-pulse h-[600px]"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!resume) {
    return (
      <MainLayout title="Resume Generator">
        <div className="max-w-4xl mx-auto text-center py-12">
          <span className="material-symbols-outlined text-6xl text-text-muted mb-4">error</span>
          <h2 className="text-xl font-semibold mb-2">Resume not found</h2>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Resume Generator">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">
              {resume.title}
            </h1>
            <p className="text-text-secondary dark:text-text-secondary-dark">
              Strategy: <Badge variant="primary">{resume.strategy.replace('_', ' ')}</Badge>
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" icon="download" onClick={handleDownload}>
              Download LaTeX
            </Button>
            {!score && (
              <Button icon="analytics" loading={scoring} onClick={handleScore}>
                Score Resume
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LaTeX Content */}
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle>LaTeX Content</CardTitle>
              <Badge variant="info">Read Only</Badge>
            </CardHeader>
            <div className="flex-1 overflow-auto">
              <pre className="text-xs font-mono p-4 bg-gray-50 dark:bg-gray-900 rounded-lg whitespace-pre-wrap">
                {resume.latexContent}
              </pre>
            </div>
          </Card>

          {/* Score Results or Placeholder */}
          <div className="space-y-6">
            {score ? (
              <>
                {/* Score Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resume Score</CardTitle>
                    <Badge variant="success">Analyzed</Badge>
                  </CardHeader>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className={cn('text-5xl font-bold', getScoreColor(score.atsScore))}>
                        {score.atsScore}
                      </div>
                      <div className="text-sm text-text-muted mt-1">ATS Score</div>
                      <div className={cn('text-sm font-medium', getScoreColor(score.atsScore))}>
                        {getScoreLabel(score.atsScore)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={cn('text-5xl font-bold', getScoreColor(score.recruiterScore))}>
                        {score.recruiterScore}
                      </div>
                      <div className="text-sm text-text-muted mt-1">Recruiter Score</div>
                      <div className={cn('text-sm font-medium', getScoreColor(score.recruiterScore))}>
                        {getScoreLabel(score.recruiterScore)}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* ATS Breakdown */}
                {score.breakdown && score.breakdown.ats && (
                  <Card>
                    <CardHeader>
                      <CardTitle>ATS Breakdown</CardTitle>
                    </CardHeader>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Keyword Coverage</span>
                          <span className="font-medium">{score.breakdown.ats.keywordCoverage || 0}%</span>
                        </div>
                        <Progress value={score.breakdown.ats.keywordCoverage || 0} size="sm" colorByScore />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Format Score</span>
                          <span className="font-medium">{score.breakdown.ats.formatScore || 0}%</span>
                        </div>
                        <Progress value={score.breakdown.ats.formatScore || 0} size="sm" colorByScore />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Section Score</span>
                          <span className="font-medium">{score.breakdown.ats.sectionScore || 0}%</span>
                        </div>
                        <Progress value={score.breakdown.ats.sectionScore || 0} size="sm" colorByScore />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Length Score</span>
                          <span className="font-medium">{score.breakdown.ats.lengthScore || 0}%</span>
                        </div>
                        <Progress value={score.breakdown.ats.lengthScore || 0} size="sm" colorByScore />
                      </div>
                    </div>
                  </Card>
                )}

                {/* Missing Keywords */}
                {score.missingKeywords && Array.isArray(score.missingKeywords) && score.missingKeywords.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Missing Keywords</CardTitle>
                      <Badge variant="warning">{score.missingKeywords.length}</Badge>
                    </CardHeader>
                    <div className="flex flex-wrap gap-2">
                      {score.missingKeywords.map((kw, i) => (
                        <Badge key={i} variant="error">{kw}</Badge>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Recommendations */}
                {score.recommendations && Array.isArray(score.recommendations) && score.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Recommendations</CardTitle>
                    </CardHeader>
                    <ul className="space-y-2">
                      {score.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="material-symbols-outlined text-primary text-lg">lightbulb</span>
                          <span className="text-text-secondary dark:text-text-secondary-dark">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </>
            ) : (
              <Card className="h-full flex flex-col items-center justify-center py-12">
                <span className="material-symbols-outlined text-6xl text-text-muted mb-4">analytics</span>
                <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-2">
                  Ready to Score
                </h3>
                <p className="text-text-secondary dark:text-text-secondary-dark text-center mb-6 max-w-sm">
                  Click &quot;Score Resume&quot; to analyze your resume against ATS and recruiter standards.
                </p>
                <Button icon="analytics" loading={scoring} onClick={handleScore}>
                  Score Resume
                </Button>
              </Card>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Link href="/resume-history">
            <Button variant="secondary" icon="history">
              View History
            </Button>
          </Link>
          <Link href="/applications">
            <Button icon="assignment">
              Track Application
            </Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}

export default function ResumeGeneratorPage() {
  return (
    <Suspense fallback={
      <MainLayout title="Resume Generator">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card animate-pulse h-[600px]"></div>
            <div className="card animate-pulse h-[600px]"></div>
          </div>
        </div>
      </MainLayout>
    }>
      <ResumeGeneratorContent />
    </Suspense>
  );
}

