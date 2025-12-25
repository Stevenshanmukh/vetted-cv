import prisma from '../prisma';
import { Application } from '@prisma/client';
import { NotFoundError } from '../middleware/errorHandler';

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
   * Get all applications for a user
   */
  async getApplications(profileId: string, status?: string): Promise<Application[]> {
    const where: { profileId: string; status?: string } = {
      profileId,
    };

    // Only add status filter if it's provided and not empty
    if (status && status.trim() !== '') {
      where.status = status;
    }

    const applications = await prisma.application.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        jobDescription: true,
        resume: true,
      },
    });

    // Log for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 getApplications - profileId: ${profileId}, status: ${status || 'all'}, found: ${applications.length}`);
    }

    return applications;
  }

  /**
   * Get application statistics for a user
   */
  async getStats(profileId: string): Promise<ApplicationStats> {
    const applications = await prisma.application.findMany({
      where: { profileId },
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
  async createApplication(profileId: string, input: ApplicationInput): Promise<Application> {
    return prisma.application.create({
      data: {
        profileId,
        jobTitle: input.jobTitle,
        company: input.company,
        location: input.location,
        jobDescriptionId: input.jobDescriptionId,
        resumeId: input.resumeId,
        status: input.status || 'applied',
        appliedDate: input.appliedDate ? new Date(input.appliedDate) : new Date(),
        salary: input.salary,
        notes: input.notes,
      },
      include: {
        jobDescription: true,
        resume: true,
      },
    });
  }

  /**
   * Update an application (with ownership check)
   */
  async updateApplication(id: string, profileId: string, input: Partial<ApplicationInput>): Promise<Application> {
    const existing = await prisma.application.findUnique({ where: { id } });
    
    if (!existing || existing.profileId !== profileId) {
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
   * Delete an application (with ownership check)
   */
  async deleteApplication(id: string, profileId: string): Promise<void> {
    const existing = await prisma.application.findUnique({ where: { id } });
    
    if (!existing || existing.profileId !== profileId) {
      throw new NotFoundError('Application');
    }

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
