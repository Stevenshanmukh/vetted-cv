'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, Button, Badge, Progress } from '@/components/ui';
import { api, Resume } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { cn, formatDate, getScoreColor } from '@/lib/utils';

export default function ResumeHistoryPage() {
  const { showToast } = useToast();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResumes();
  }, []);

  async function loadResumes() {
    const result = await api.resume.getHistory();
    if (result.success && result.data) {
      setResumes(result.data);
    }
    setLoading(false);
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    const result = await api.resume.delete(id);
    if (result.success) {
      showToast('success', 'Resume deleted');
      loadResumes();
    } else {
      showToast('error', 'Failed to delete resume');
    }
  };

  const handleDownload = (id: string) => {
    const url = api.resume.getDownloadUrl(id);
    window.open(url, '_blank');
  };

  return (
    <MainLayout title="Resume History">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">
              Resume History
            </h1>
            <p className="text-text-secondary dark:text-text-secondary-dark">
              View and manage all your generated resumes
            </p>
          </div>
          <Link href="/job-analysis">
            <Button icon="add">New Resume</Button>
          </Link>
        </div>

        {/* Resume List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse h-48" />
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <Card className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-text-muted mb-4">description</span>
            <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-2">
              No resumes yet
            </h3>
            <p className="text-text-secondary dark:text-text-secondary-dark mb-4">
              Generate your first resume by analyzing a job description.
            </p>
            <Link href="/job-analysis">
              <Button icon="add">Analyze Job Description</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((resume) => {
              const latestScore = resume.scores && resume.scores.length > 0 ? resume.scores[0] : null;
              
              return (
                <Card key={resume.id} hoverable>
                  <div className="space-y-4">
                    {/* Header */}
                    <div>
                      <h3 className="font-semibold text-text-primary dark:text-text-primary-dark line-clamp-2">
                        {resume.title}
                      </h3>
                      <p className="text-sm text-text-muted mt-1">
                        {formatDate(resume.createdAt)}
                      </p>
                    </div>

                    {/* Strategy Badge */}
                    <Badge variant="primary">
                      {resume.strategy.replace('_', ' ')}
                    </Badge>

                    {/* Scores */}
                    {latestScore ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-text-muted mb-1">ATS Score</div>
                          <div className={cn('text-2xl font-bold', getScoreColor(latestScore.atsScore))}>
                            {latestScore.atsScore}
                          </div>
                          <Progress value={latestScore.atsScore} size="sm" colorByScore />
                        </div>
                        <div>
                          <div className="text-xs text-text-muted mb-1">Recruiter</div>
                          <div className={cn('text-2xl font-bold', getScoreColor(latestScore.recruiterScore))}>
                            {latestScore.recruiterScore}
                          </div>
                          <Progress value={latestScore.recruiterScore} size="sm" colorByScore />
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-text-muted">
                        Not scored yet
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-border-light dark:border-border-dark">
                      <Link href={`/resume-generator?resumeId=${resume.id}`} className="flex-1">
                        <Button variant="secondary" size="sm" className="w-full" icon="visibility">
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="download"
                        onClick={() => handleDownload(resume.id)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="delete"
                        onClick={() => handleDelete(resume.id)}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

