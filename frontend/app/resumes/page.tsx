'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, Button, Badge, Progress } from '@/components/ui';
import { api, Resume } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { cn, formatDate, getScoreColor, getScoreLabel } from '@/lib/utils';

export default function ResumeLibraryPage() {
  const { showToast } = useToast();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadResumes();
  }, []);

  async function loadResumes() {
    // Only show resumes that have been saved to library
    const result = await api.resume.getLibrary();
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

  const handleRemoveFromLibrary = async (id: string) => {
    const result = await api.resume.removeFromLibrary(id);
    if (result.success) {
      showToast('success', 'Resume removed from library');
      loadResumes();
    } else {
      showToast('error', 'Failed to remove from library');
    }
  };

  // Group resumes by company
  const resumesByCompany = resumes.reduce((acc, resume) => {
    const company = resume.jobDescription?.company || 'Other';
    if (!acc[company]) acc[company] = [];
    acc[company].push(resume);
    return acc;
  }, {} as Record<string, Resume[]>);

  return (
    <MainLayout title="Resume Library">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">
              Resume Library
            </h1>
            <p className="text-text-secondary dark:text-text-secondary-dark">
              {resumes.length} saved resume{resumes.length !== 1 ? 's' : ''} in your library
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex border border-border-light dark:border-border-dark rounded-lg overflow-hidden">
              <button
                onClick={() => setView('grid')}
                className={cn(
                  'px-3 py-2',
                  view === 'grid'
                    ? 'bg-primary text-white'
                    : 'bg-surface-light dark:bg-surface-dark text-text-secondary'
                )}
              >
                <span className="material-symbols-outlined text-lg">grid_view</span>
              </button>
              <button
                onClick={() => setView('list')}
                className={cn(
                  'px-3 py-2',
                  view === 'list'
                    ? 'bg-primary text-white'
                    : 'bg-surface-light dark:bg-surface-dark text-text-secondary'
                )}
              >
                <span className="material-symbols-outlined text-lg">view_list</span>
              </button>
            </div>
            <Link href="/job-analysis">
              <Button icon="add">Create New</Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card animate-pulse h-48" />
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <Card className="text-center py-16">
            <span className="material-symbols-outlined text-7xl text-text-muted mb-4">folder_open</span>
            <h3 className="text-xl font-semibold text-text-primary dark:text-text-primary-dark mb-2">
              Your resume library is empty
            </h3>
            <p className="text-text-secondary dark:text-text-secondary-dark mb-6 max-w-md mx-auto">
              Resumes you save to your library will appear here. Create a new resume and check &quot;Save to Library&quot; to keep it for future use.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/resume-history">
                <Button variant="secondary" icon="history">View Recent Resumes</Button>
              </Link>
              <Link href="/job-analysis">
                <Button icon="add" size="lg">Create New Resume</Button>
              </Link>
            </div>
          </Card>
        ) : view === 'grid' ? (
          // Grid View
          <div className="space-y-8">
            {Object.entries(resumesByCompany).map(([company, companyResumes]) => (
              <div key={company}>
                <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined">business</span>
                  {company}
                  <Badge variant="default">{companyResumes.length}</Badge>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {companyResumes.map((resume) => {
                    const latestScore = resume.scores?.[0];
                    return (
                      <Card key={resume.id} hoverable>
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-text-primary dark:text-text-primary-dark truncate">
                                {resume.jobDescription?.title || resume.title}
                              </h4>
                              <p className="text-sm text-text-muted">{formatDate(resume.createdAt)}</p>
                            </div>
                            <Badge variant="primary" className="text-xs">
                              {resume.strategy.replace('_', ' ')}
                            </Badge>
                          </div>

                          {latestScore && (
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <div className="flex justify-between text-xs mb-1">
                                  <span>ATS</span>
                                  <span className={getScoreColor(latestScore.atsScore)}>
                                    {latestScore.atsScore}%
                                  </span>
                                </div>
                                <Progress value={latestScore.atsScore} size="sm" colorByScore />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between text-xs mb-1">
                                  <span>Recruiter</span>
                                  <span className={getScoreColor(latestScore.recruiterScore)}>
                                    {latestScore.recruiterScore}%
                                  </span>
                                </div>
                                <Progress value={latestScore.recruiterScore} size="sm" colorByScore />
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Link href={`/resume-generator?resumeId=${resume.id}`} className="flex-1">
                              <Button variant="secondary" size="sm" className="w-full">
                                View
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon="bookmark_remove"
                              onClick={() => handleRemoveFromLibrary(resume.id)}
                              title="Remove from library"
                            />
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
              </div>
            ))}
          </div>
        ) : (
          // List View
          <Card>
            <div className="divide-y divide-border-light dark:divide-border-dark">
              {resumes.map((resume) => {
                const latestScore = resume.scores?.[0];
                return (
                  <div key={resume.id} className="py-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">description</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-text-primary dark:text-text-primary-dark">
                        {resume.title}
                      </h4>
                      <div className="flex items-center gap-3 text-sm text-text-muted">
                        <span>{formatDate(resume.createdAt)}</span>
                        <Badge variant="primary" className="text-xs">
                          {resume.strategy.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    {latestScore && (
                      <div className="flex gap-6">
                        <div className="text-center">
                          <div className={cn('text-xl font-bold', getScoreColor(latestScore.atsScore))}>
                            {latestScore.atsScore}
                          </div>
                          <div className="text-xs text-text-muted">ATS</div>
                        </div>
                        <div className="text-center">
                          <div className={cn('text-xl font-bold', getScoreColor(latestScore.recruiterScore))}>
                            {latestScore.recruiterScore}
                          </div>
                          <div className="text-xs text-text-muted">Recruiter</div>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Link href={`/resume-generator?resumeId=${resume.id}`}>
                        <Button variant="secondary" size="sm" icon="visibility">
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
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

