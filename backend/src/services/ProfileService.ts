import prisma from '../prisma';
import { Profile, Skill, Experience, Project, Education, Certification, Achievement } from '@prisma/client';

export interface ProfileWithRelations extends Profile {
  personalInfo: {
    id: string;
    profileId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    location: string | null;
    linkedIn: string | null;
    website: string | null;
  } | null;
  skills: (Skill & { category: { id: string; name: string } })[];
  experiences: Experience[];
  projects: Project[];
  educations: Education[];
  certifications: Certification[];
  achievements: Achievement[];
}

export interface ProfileInput {
  personalInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    location?: string | null;
    linkedIn?: string | null;
    website?: string | null;
  };
  summary?: string;
  skills?: { categoryName: string; skills: string[] }[];
  experiences?: Omit<Experience, 'id' | 'profileId'>[];
  projects?: Omit<Project, 'id' | 'profileId'>[];
  educations?: Omit<Education, 'id' | 'profileId'>[];
  certifications?: Omit<Certification, 'id' | 'profileId'>[];
  achievements?: Omit<Achievement, 'id' | 'profileId'>[];
}

export class ProfileService {
  /**
   * Convert date string or Date to Date object
   */
  private parseDate(date: string | Date | null | undefined): Date | null {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (typeof date === 'string') {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) {
        throw new Error(`Invalid date format: ${date}`);
      }
      return parsed;
    }
    return null;
  }

  /**
   * Get profile by ID
   */
  async getProfile(profileId: string): Promise<ProfileWithRelations | null> {
    return prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        personalInfo: true,
        skills: {
          include: { category: true },
        },
        experiences: { orderBy: { order: 'asc' } },
        projects: { orderBy: { order: 'asc' } },
        educations: { orderBy: { order: 'asc' } },
        certifications: true,
        achievements: true,
      },
    });
  }

  /**
   * Save profile data
   */
  async saveProfile(profileId: string, input: ProfileInput): Promise<ProfileWithRelations> {
    // Update personal info - only if all required fields are present
    if (input.personalInfo) {
      const { firstName, lastName, email } = input.personalInfo;
      // Only update if we have all required fields
      if (firstName && lastName && email) {
        await prisma.personalInfo.upsert({
          where: { profileId },
          create: {
            profileId,
            firstName,
            lastName,
            email,
            phone: input.personalInfo.phone || null,
            location: input.personalInfo.location || null,
            linkedIn: input.personalInfo.linkedIn || null,
            website: input.personalInfo.website || null,
          },
          update: {
            firstName,
            lastName,
            email,
            phone: input.personalInfo.phone || null,
            location: input.personalInfo.location || null,
            linkedIn: input.personalInfo.linkedIn || null,
            website: input.personalInfo.website || null,
          },
        });
      }
    }

    // Update summary
    if (input.summary !== undefined) {
      await prisma.profile.update({
        where: { id: profileId },
        data: { summary: input.summary },
      });
    }

    // Update skills
    if (input.skills) {
      // Delete existing skills
      await prisma.skill.deleteMany({ where: { profileId } });

      // Create new skills with categories
      for (const skillGroup of input.skills) {
        const category = await prisma.skillCategory.upsert({
          where: { name: skillGroup.categoryName },
          create: { name: skillGroup.categoryName },
          update: {},
        });

        await prisma.skill.createMany({
          data: skillGroup.skills.map((skillName) => ({
            name: skillName,
            categoryId: category.id,
            profileId,
          })),
        });
      }
    }

    // Update experiences
    if (input.experiences) {
      await prisma.experience.deleteMany({ where: { profileId } });
      await prisma.experience.createMany({
        data: input.experiences.map((exp, index) => ({
          title: exp.title,
          company: exp.company,
          location: exp.location || null,
          startDate: this.parseDate(exp.startDate)!,
          endDate: exp.isCurrent ? null : this.parseDate(exp.endDate),
          isCurrent: exp.isCurrent || false,
          description: exp.description,
          profileId,
          order: exp.order ?? index,
        })),
      });
    }

    // Update projects
    if (input.projects) {
      await prisma.project.deleteMany({ where: { profileId } });
      await prisma.project.createMany({
        data: input.projects.map((proj, index) => ({
          ...proj,
          profileId,
          order: proj.order ?? index,
        })),
      });
    }

    // Update educations
    if (input.educations) {
      await prisma.education.deleteMany({ where: { profileId } });
      await prisma.education.createMany({
        data: input.educations.map((edu, index) => ({
          institution: edu.institution,
          degree: edu.degree,
          field: edu.field || null,
          startDate: this.parseDate(edu.startDate)!,
          endDate: this.parseDate(edu.endDate),
          gpa: edu.gpa || null,
          profileId,
          order: edu.order ?? index,
        })),
      });
    }

    // Update certifications
    if (input.certifications) {
      await prisma.certification.deleteMany({ where: { profileId } });
      await prisma.certification.createMany({
        data: input.certifications.map((cert) => ({
          name: cert.name,
          issuer: cert.issuer,
          issueDate: this.parseDate(cert.issueDate)!,
          expiryDate: this.parseDate(cert.expiryDate),
          credentialId: cert.credentialId || null,
          credentialUrl: cert.credentialUrl || null,
          profileId,
        })),
      });
    }

    // Update achievements
    if (input.achievements) {
      await prisma.achievement.deleteMany({ where: { profileId } });
      await prisma.achievement.createMany({
        data: input.achievements.map((ach) => ({
          title: ach.title,
          description: ach.description,
          date: this.parseDate(ach.date),
          profileId,
        })),
      });
    }

    // Calculate and update completeness
    const completeness = await this.calculateCompleteness(profileId);
    await prisma.profile.update({
      where: { id: profileId },
      data: { completenessPercent: completeness.percent },
    });

    const profile = await this.getProfile(profileId);
    if (!profile) {
      throw new Error('Profile not found after save');
    }
    return profile;
  }

  /**
   * Calculate profile completeness
   */
  async calculateCompleteness(profileId: string): Promise<{ percent: number; missing: string[] }> {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        personalInfo: true,
        skills: true,
        experiences: true,
        educations: true,
        projects: true,
        certifications: true,
        achievements: true,
      },
    });

    if (!profile) {
      return { percent: 0, missing: ['Profile not found'] };
    }

    const missing: string[] = [];
    let completedWeight = 0;
    let totalWeight = 0;

    const weights = {
      personalInfo: 20,
      summary: 15,
      skills: 20,
      experience: 25,
      education: 10,
      projects: 5,
      certifications: 3,
      achievements: 2,
    };

    // Check personal info
    totalWeight += weights.personalInfo;
    if (profile.personalInfo?.firstName && profile.personalInfo?.lastName && profile.personalInfo?.email) {
      completedWeight += weights.personalInfo;
    } else {
      missing.push('Personal Info');
    }

    // Check summary
    totalWeight += weights.summary;
    if (profile.summary && profile.summary.length >= 50) {
      completedWeight += weights.summary;
    } else {
      missing.push('Professional Summary');
    }

    // Check skills
    totalWeight += weights.skills;
    if (profile.skills.length > 0) {
      completedWeight += weights.skills;
    } else {
      missing.push('Skills');
    }

    // Check experience
    totalWeight += weights.experience;
    if (profile.experiences.length > 0) {
      completedWeight += weights.experience;
    } else {
      missing.push('Work Experience');
    }

    // Check education
    totalWeight += weights.education;
    if (profile.educations.length > 0) {
      completedWeight += weights.education;
    } else {
      missing.push('Education');
    }

    // Optional sections
    if (profile.projects.length > 0) {
      totalWeight += weights.projects;
      completedWeight += weights.projects;
    }

    if (profile.certifications.length > 0) {
      totalWeight += weights.certifications;
      completedWeight += weights.certifications;
    }

    if (profile.achievements.length > 0) {
      totalWeight += weights.achievements;
      completedWeight += weights.achievements;
    }

    const percent = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

    return { percent, missing };
  }
}

export const profileService = new ProfileService();
