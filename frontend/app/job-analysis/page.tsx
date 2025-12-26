'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, Button, Input, Textarea, Badge } from '@/components/ui';
import { api, JobDescription } from '@/services/api';
import { useToast } from '@/context/ToastContext';

const STORAGE_KEY = 'jobAnalysisDraft';

interface JobAnalysisDraft {
  formData: {
    title: string;
    company: string;
    descriptionText: string;
  };
  analysis: JobDescription | null;
  savedAt: string;
}

export default function JobAnalysisPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    descriptionText: '',
  });
  const [analysis, setAnalysis] = useState<JobDescription | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const draft: JobAnalysisDraft = JSON.parse(saved);
        setFormData(draft.formData);
        setAnalysis(draft.analysis);
        setHasDraft(true);
      }
    } catch (e) {
      console.warn('Failed to load draft:', e);
    }
  }, []);

  // Save draft to localStorage when form data or analysis changes
  useEffect(() => {
    if (formData.title || formData.company || formData.descriptionText || analysis) {
      try {
        const draft: JobAnalysisDraft = {
          formData,
          analysis,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      } catch (e) {
        console.warn('Failed to save draft:', e);
      }
    }
  }, [formData, analysis]);

  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setFormData({ title: '', company: '', descriptionText: '' });
    setAnalysis(null);
    setHasDraft(false);
    showToast('success', 'Draft cleared');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.company || formData.descriptionText.length < 100) {
      showToast('error', 'Please fill in all fields. Job description must be at least 100 characters.');
      return;
    }

    setLoading(true);
    const result = await api.job.analyze(formData);
    setLoading(false);

    if (result.success && result.data) {
      setAnalysis(result.data);
      showToast('success', 'Job description analyzed successfully!');
    } else {
      showToast('error', result.error?.message || 'Failed to analyze job description');
    }
  };

  const handleProceedToMatch = () => {
    if (analysis) {
      // Clear draft when proceeding to next step
      localStorage.removeItem(STORAGE_KEY);
      router.push(`/match-analysis?jobId=${analysis.id}`);
    }
  };

  return (
    <MainLayout title="Job Description Analysis">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Analyze Job Description</CardTitle>
            <div className="flex items-center gap-2">
              {hasDraft && !analysis && (
                <Badge variant="info">Draft Restored</Badge>
              )}
              <span className="material-symbols-outlined text-primary">work</span>
            </div>
          </CardHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Job Title"
                placeholder="e.g., Senior Software Engineer"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <Input
                label="Company"
                placeholder="e.g., TechCorp Inc."
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                required
              />
            </div>
            
            <Textarea
              label="Job Description"
              placeholder="Paste the full job description here..."
              value={formData.descriptionText}
              onChange={(e) => setFormData({ ...formData, descriptionText: e.target.value })}
              className="min-h-[300px]"
              hint="Paste the complete job description including requirements, responsibilities, and qualifications."
            />

            <div className="flex justify-between">
              {hasDraft && (
                <Button type="button" variant="ghost" onClick={clearDraft} icon="delete">
                  Clear Draft
                </Button>
              )}
              <div className="ml-auto">
                <Button type="submit" loading={loading} icon="psychology">
                  Analyze with AI
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {/* Analysis Results */}
        {analysis && analysis.analysis && (
          <div className="space-y-6 animate-fade-in">
            {/* Skills Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Skills Analysis</CardTitle>
                <Badge variant="success">Analyzed</Badge>
              </CardHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Required Skills */}
                <div>
                  <h4 className="font-medium text-text-primary dark:text-text-primary-dark mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-error text-lg">priority_high</span>
                    Required Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.analysis.requiredSkills.map((skill, i) => (
                      <Badge key={i} variant="error">{skill}</Badge>
                    ))}
                    {analysis.analysis.requiredSkills.length === 0 && (
                      <span className="text-text-muted text-sm">No required skills identified</span>
                    )}
                  </div>
                </div>

                {/* Preferred Skills */}
                <div>
                  <h4 className="font-medium text-text-primary dark:text-text-primary-dark mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-success text-lg">thumb_up</span>
                    Preferred Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.analysis.preferredSkills.map((skill, i) => (
                      <Badge key={i} variant="success">{skill}</Badge>
                    ))}
                    {analysis.analysis.preferredSkills.length === 0 && (
                      <span className="text-text-muted text-sm">No preferred skills identified</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* ATS Keywords */}
            <Card>
              <CardHeader>
                <CardTitle>Top ATS Keywords</CardTitle>
                <span className="material-symbols-outlined text-primary">key</span>
              </CardHeader>
              
              <div className="flex flex-wrap gap-2">
                {analysis.analysis.atsKeywords.slice(0, 15).map((kw, i) => (
                  <div
                    key={i}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center gap-2"
                  >
                    <span className="text-sm font-medium text-text-primary dark:text-text-primary-dark">
                      {kw.keyword}
                    </span>
                    <span className="text-xs text-text-muted">
                      {kw.weight}x
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Responsibilities */}
            <Card>
              <CardHeader>
                <CardTitle>Key Responsibilities</CardTitle>
                <span className="material-symbols-outlined text-primary">checklist</span>
              </CardHeader>
              
              <ul className="space-y-2">
                {analysis.analysis.responsibilities.map((resp, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-lg mt-0.5">check_circle</span>
                    <span className="text-text-secondary dark:text-text-secondary-dark">{resp}</span>
                  </li>
                ))}
                {analysis.analysis.responsibilities.length === 0 && (
                  <li className="text-text-muted text-sm">No specific responsibilities identified</li>
                )}
              </ul>
            </Card>

            {/* Experience Level */}
            {analysis.analysis.experienceLevel && (
              <Card>
                <CardHeader>
                  <CardTitle>Experience Level</CardTitle>
                  <Badge variant="info">{analysis.analysis.experienceLevel}</Badge>
                </CardHeader>
                <p className="text-text-secondary dark:text-text-secondary-dark">
                  This role appears to be targeting <strong>{analysis.analysis.experienceLevel}</strong> level candidates.
                </p>
              </Card>
            )}

            {/* Action Button */}
            <div className="flex justify-end">
              <Button onClick={handleProceedToMatch} icon="compare_arrows" size="lg">
                Proceed to Match Analysis
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

