'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, Button, Badge, Input } from '@/components/ui';
import { api, Application, ApplicationInput, ApplicationStatus } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { cn, getStatusColor, formatDate } from '@/lib/utils';

const statusOptions: ApplicationStatus[] = ['applied', 'interview', 'offer', 'rejected', 'withdrawn'];

export default function ApplicationsPage() {
  const { showToast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all');
  const [formData, setFormData] = useState<ApplicationInput>({
    jobTitle: '',
    company: '',
    location: '',
    status: 'applied',
    notes: '',
    applicationUrl: '',
  });

  useEffect(() => {
    loadApplications();
  }, [filter]);

  async function loadApplications() {
    const status = filter === 'all' ? undefined : filter;
    const result = await api.applications.getAll(status);
    if (result.success && result.data) {
      setApplications(result.data);
    }
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await api.applications.create(formData);
    if (result.success) {
      showToast('success', 'Application added successfully!');
      setShowForm(false);
      setFormData({
        jobTitle: '',
        company: '',
        location: '',
        status: 'applied',
        notes: '',
        applicationUrl: '',
      });
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
                <Input
                  label="Job Title"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  required
                />
                <Input
                  label="Company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  required
                />
                <Input
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
                <Input
                  label="Application URL"
                  type="url"
                  value={formData.applicationUrl}
                  onChange={(e) => setFormData({ ...formData, applicationUrl: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Application</Button>
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
                    <div className="flex items-center gap-4 text-sm text-text-secondary dark:text-text-secondary-dark">
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

