'use client';

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, Button, Badge, Input, DatePicker, ResumeSelector } from '@/components/ui';
import { api, Application, ApplicationInput, ApplicationStatus, Resume } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { cn, getStatusColor, formatDate } from '@/lib/utils';

const statusOptions: ApplicationStatus[] = ['applied', 'interview', 'offer', 'rejected', 'withdrawn'];

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export default function ApplicationsPage() {
  const { showToast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumesLoading, setResumesLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all');
  
  // Form state with validation errors
  const [formData, setFormData] = useState<ApplicationInput>({
    company: '',
    jobTitle: '',
    location: '',
    appliedDate: getTodayDate(),
    resumeId: '',
    status: 'applied',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadApplications();
    loadResumes();
  }, []);

  useEffect(() => {
    loadApplications();
  }, [filter]);

  async function loadApplications() {
    setLoading(true);
    try {
      // When filter is 'all', pass undefined to get all applications
      const status = filter === 'all' ? undefined : filter;
      const result = await api.applications.getAll(status);
      if (result.success && result.data) {
        // Handle both array and object responses
        let data: Application[] = [];
        if (Array.isArray(result.data)) {
          data = result.data;
        } else if (result.data && typeof result.data === 'object' && 'data' in (result.data as any)) {
          const nestedData = (result.data as any).data;
          data = Array.isArray(nestedData) ? nestedData : [];
        }
        
        console.log(`Loaded ${data.length} applications for filter: ${filter}`, data);
        setApplications(data);
      } else {
        console.error('Failed to load applications:', result.error);
        showToast('error', result.error?.message || 'Failed to load applications');
        setApplications([]);
      }
    } catch (error: any) {
      console.error('Error loading applications:', error);
      showToast('error', 'Failed to load applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadResumes() {
    setResumesLoading(true);
    const result = await api.resume.getHistory();
    if (result.success && result.data) {
      setResumes(result.data);
    }
    setResumesLoading(false);
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.company.trim()) {
      errors.company = 'Company is required';
    } else if (formData.company.length > 100) {
      errors.company = 'Company must be less than 100 characters';
    }

    if (!formData.jobTitle.trim()) {
      errors.jobTitle = 'Job title is required';
    } else if (formData.jobTitle.length > 100) {
      errors.jobTitle = 'Job title must be less than 100 characters';
    }

    if (!formData.appliedDate) {
      errors.appliedDate = 'Applied date is required';
    }

    if (!formData.resumeId) {
      errors.resumeId = 'Please select a resume';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    const result = await api.applications.create(formData);
    setSubmitting(false);

    if (result.success) {
      showToast('success', 'Application added successfully!');
      setShowForm(false);
      setFormData({
        company: '',
        jobTitle: '',
        location: '',
        appliedDate: getTodayDate(),
        resumeId: '',
        status: 'applied',
        notes: '',
      });
      setFormErrors({});
      loadApplications();
    } else {
      showToast('error', result.error?.message || 'Failed to add application');
    }
  };

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    const result = await api.applications.update(id, { status });
    if (result.success) {
      showToast('success', 'Status updated!');
      loadApplications();
    } else {
      showToast('error', 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    const result = await api.applications.delete(id);
    if (result.success) {
      showToast('success', 'Application deleted');
      loadApplications();
    } else {
      showToast('error', 'Failed to delete application');
    }
  };

  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'applied').length,
    interview: applications.filter(a => a.status === 'interview').length,
    offer: applications.filter(a => a.status === 'offer').length,
  };

  // Check if form can be submitted (resumes exist)
  const canSubmit = resumes.length > 0 && !submitting;

  return (
    <MainLayout title="Application Tracker">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <div className="text-3xl font-bold text-text-primary dark:text-text-primary-dark">{stats.total}</div>
            <div className="text-sm text-text-muted">Total</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-info">{stats.applied}</div>
            <div className="text-sm text-text-muted">Applied</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-warning">{stats.interview}</div>
            <div className="text-sm text-text-muted">Interview</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-success">{stats.offer}</div>
            <div className="text-sm text-text-muted">Offers</div>
          </Card>
        </div>

        {/* Actions & Filters */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            {statusOptions.map((status) => (
              <Button
                key={status}
                variant={filter === status ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
          <Button icon="add" onClick={() => setShowForm(!showForm)}>
            Add Application
          </Button>
        </div>

        {/* Add Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Application</CardTitle>
              <Button variant="ghost" size="sm" icon="close" onClick={() => setShowForm(false)} />
            </CardHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company */}
                <Input
                  label="Company"
                  value={formData.company}
                  onChange={(e) => {
                    setFormData({ ...formData, company: e.target.value });
                    if (formErrors.company) setFormErrors({ ...formErrors, company: '' });
                  }}
                  error={formErrors.company}
                  required
                  maxLength={100}
                />
                
                {/* Job Title */}
                <Input
                  label="Job Title"
                  value={formData.jobTitle}
                  onChange={(e) => {
                    setFormData({ ...formData, jobTitle: e.target.value });
                    if (formErrors.jobTitle) setFormErrors({ ...formErrors, jobTitle: '' });
                  }}
                  error={formErrors.jobTitle}
                  required
                  maxLength={100}
                />
                
                {/* Location */}
                <Input
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Remote, San Francisco, CA"
                />
                
                {/* Date Applied */}
                <DatePicker
                  label="Date Applied"
                  value={formData.appliedDate}
                  onChange={(date) => {
                    setFormData({ ...formData, appliedDate: date });
                    if (formErrors.appliedDate) setFormErrors({ ...formErrors, appliedDate: '' });
                  }}
                  error={formErrors.appliedDate}
                  required
                />
              </div>

              {/* Resume Selector - Full width */}
              <ResumeSelector
                label="Resume Used"
                resumes={resumes}
                value={formData.resumeId}
                onChange={(resumeId) => {
                  setFormData({ ...formData, resumeId });
                  if (formErrors.resumeId) setFormErrors({ ...formErrors, resumeId: '' });
                }}
                error={formErrors.resumeId}
                loading={resumesLoading}
                required
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  loading={submitting}
                  disabled={!canSubmit}
                >
                  Add Application
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
            <span className="text-text-muted text-sm">{applications.length} total</span>
          </CardHeader>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-text-muted mb-4">inbox</span>
              <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-2">
                No applications yet
              </h3>
              <p className="text-text-secondary dark:text-text-secondary-dark mb-4">
                Start tracking your job applications to stay organized.
              </p>
              <Button icon="add" onClick={() => setShowForm(true)}>
                Add Your First Application
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border-light dark:divide-border-dark">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="py-4 flex items-center justify-between flex-wrap gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-medium text-text-primary dark:text-text-primary-dark truncate">
                        {app.jobTitle}
                      </h4>
                      <Badge className={getStatusColor(app.status)}>
                        {app.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-text-secondary dark:text-text-secondary-dark flex-wrap">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">business</span>
                        {app.company}
                      </span>
                      {app.location && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-base">location_on</span>
                          {app.location}
                        </span>
                      )}
                      {app.appliedDate && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-base">calendar_today</span>
                          {formatDate(app.appliedDate)}
                        </span>
                      )}
                      {app.resume && (
                        <span className="flex items-center gap-1 text-primary">
                          <span className="material-symbols-outlined text-base">description</span>
                          {app.resume.title}
                          <span className="text-xs text-text-muted">v{app.resume.version}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                      className={cn(
                        'text-sm rounded-lg px-3 py-1.5 border-0 cursor-pointer',
                        getStatusColor(app.status)
                      )}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon="delete"
                      onClick={() => handleDelete(app.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
