import prisma from '../prisma';
import { Application } from '@prisma/client';
import { NotFoundError } from '../middleware/errorHandler';

const DEFAULT_PROFILE_ID = 'default-user';

export interface ApplicationInput {
  jobTitle: string;
  company: string;
  location?: string;
  jobDescriptionId?: string;
  resumeId?: string;
  status?: string;
  appliedDate?: string;
  salary?: string;
  notes?: string;
  applicationUrl?: string;
}

export interface ApplicationStats {
  total: number;
  byStatus: Record<string, number>;
  recentActivity: {
    date: Date;
    application: Application;
    action: string;
  }[];
}

export class ApplicationService {
  /**
   * Get all applications
   */
  async getApplications(status?: string): Promise<Application[]> {
    const where: { profileId: string; status?: string } = {
      profileId: DEFAULT_PROFILE_ID,
    };

    if (status) {
      where.status = status;
    }

    return prisma.application.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        jobDescription: true,
        resume: true,
      },
    });
  }

  /**
   * Get application statistics
   */
  async getStats(): Promise<ApplicationStats> {
    const applications = await prisma.application.findMany({
      where: { profileId: DEFAULT_PROFILE_ID },
      orderBy: { updatedAt: 'desc' },
    });

    const byStatus: Record<string, number> = {
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
      withdrawn: 0,
    };

    for (const app of applications) {
      byStatus[app.status] = (byStatus[app.status] || 0) + 1;
    }

    const recentActivity = applications.slice(0, 5).map((app) => ({
      date: app.updatedAt,
      application: app,
      action: this.getActionText(app.status),
    }));

    return {
      total: applications.length,
      byStatus,
      recentActivity,
    };
  }

  /**
   * Create an application
   */
  async createApplication(input: ApplicationInput): Promise<Application> {
    return prisma.application.create({
      data: {
        profileId: DEFAULT_PROFILE_ID,
        jobTitle: input.jobTitle,
        company: input.company,
        location: input.location,
        jobDescriptionId: input.jobDescriptionId,
        resumeId: input.resumeId,
        status: input.status || 'applied',
        appliedDate: input.appliedDate ? new Date(input.appliedDate) : new Date(),
        salary: input.salary,
        notes: input.notes,
        applicationUrl: input.applicationUrl,
      },
      include: {
        jobDescription: true,
        resume: true,
      },
    });
  }

  /**
   * Update an application
   */
  async updateApplication(id: string, input: Partial<ApplicationInput>): Promise<Application> {
    const existing = await prisma.application.findUnique({ where: { id } });
    
    if (!existing) {
      throw new NotFoundError('Application');
    }

    // Update status-specific date fields
    const statusDates: Record<string, Date> = {};
    if (input.status) {
      switch (input.status) {
        case 'interview':
          statusDates.interviewDate = new Date();
          break;
        case 'offer':
          statusDates.offerDate = new Date();
          break;
        case 'rejected':
          statusDates.rejectionDate = new Date();
          break;
      }
    }

    return prisma.application.update({
      where: { id },
      data: {
        ...input,
        ...statusDates,
        appliedDate: input.appliedDate ? new Date(input.appliedDate) : undefined,
      },
      include: {
        jobDescription: true,
        resume: true,
      },
    });
  }

  /**
   * Delete an application
   */
  async deleteApplication(id: string): Promise<void> {
    await prisma.application.delete({ where: { id } });
  }

  private getActionText(status: string): string {
    const actions: Record<string, string> = {
      applied: 'Applied to position',
      interview: 'Moved to interview stage',
      offer: 'Received offer',
      rejected: 'Application rejected',
      withdrawn: 'Withdrew application',
    };
    return actions[status] || 'Updated application';
  }
}

export const applicationService = new ApplicationService();

