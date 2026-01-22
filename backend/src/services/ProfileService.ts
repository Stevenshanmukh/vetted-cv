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
      const trimmed = date.trim();
      if (!trimmed) return null;
      const parsed = new Date(trimmed);
      if (isNaN(parsed.getTime())) {
        throw new Error(`Invalid date format: ${trimmed}`);
      }
      return parsed;
    }
    return null;
  }

  /**
   * Get profile by ID
   */
  async getProfile(profileId: string): Promise<ProfileWithRelations | null> {
    const profile = await prisma.profile.findUnique({
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

    if (profile) {
      console.log(`📖 [ProfileService] Retrieved profile ${profileId}:`, {
        personalInfo: profile.personalInfo ? 'yes' : 'no',
        summary: profile.summary?.length || 0,
        skills: profile.skills.length,
        experiences: profile.experiences.length,
        projects: profile.projects.length,
        educations: profile.educations.length,
        certifications: profile.certifications.length,
        achievements: profile.achievements.length,
      });
    } else {
      console.log(`❌ [ProfileService] Profile ${profileId} not found`);
    }

    return profile;
  }

  /**
   * Save profile data
   */
  async saveProfile(profileId: string, input: ProfileInput): Promise<ProfileWithRelations> {
    // Update personal info - only if all required fields are present
    if (input.personalInfo) {
      const { firstName, lastName, email } = input.personalInfo;
      console.log(`👤 [ProfileService] Updating personalInfo for profile ${profileId}:`, { firstName, lastName, email });

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
        console.log(`✅ [ProfileService] Updated personalInfo for profile ${profileId}`);
      } else {
        console.log(`⚠️ [ProfileService] Skipping personalInfo update - missing required fields`);
      }
    }

    // Update summary
    if (input.summary !== undefined) {
      console.log(`📝 [ProfileService] Updating summary for profile ${profileId}:`, input.summary?.length || 0, 'chars');
      await prisma.profile.update({
        where: { id: profileId },
        data: { summary: input.summary || null },
      });
    }

    // Update skills
    if (input.skills !== undefined) {
      console.log(`🧠 [ProfileService] Updating skills for profile ${profileId}:`, input.skills.length, 'categories');

      // Delete existing skills
      await prisma.skill.deleteMany({ where: { profileId } });

      if (input.skills.length > 0) {
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
        console.log(`✅ [ProfileService] Created skills for profile ${profileId}`);
      } else {
        console.log(`🧠 [ProfileService] Cleared all skills for profile ${profileId}`);
      }
    }

    // Update experiences
    if (input.experiences !== undefined) {
      console.log(`💼 [ProfileService] Updating experiences for profile ${profileId}:`, input.experiences.length, 'items');
      await prisma.experience.deleteMany({ where: { profileId } });

      if (input.experiences.length > 0) {
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
        console.log(`✅ [ProfileService] Created ${input.experiences.length} experiences for profile ${profileId}`);
      } else {
        console.log(`💼 [ProfileService] Cleared all experiences for profile ${profileId}`);
      }
    }

    // Update projects
    if (input.projects !== undefined) {
      console.log(`💻 [ProfileService] Updating projects for profile ${profileId}:`, input.projects.length, 'items');
      await prisma.project.deleteMany({ where: { profileId } });

      if (input.projects.length > 0) {
        await prisma.project.createMany({
          data: input.projects.map((proj, index) => ({
            name: proj.name,
            description: proj.description,
            url: proj.url || null,
            technologies: proj.technologies || null,
            profileId,
            order: proj.order ?? index,
          })),
        });
        console.log(`✅ [ProfileService] Created ${input.projects.length} projects for profile ${profileId}`);
      } else {
        console.log(`💻 [ProfileService] Cleared all projects for profile ${profileId}`);
      }
    }

    // Update educations
    if (input.educations !== undefined) {
      console.log(`🎓 [ProfileService] Updating educations for profile ${profileId}:`, input.educations.length, 'items');
      await prisma.education.deleteMany({ where: { profileId } });

      if (input.educations.length > 0) {
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
        console.log(`✅ [ProfileService] Created ${input.educations.length} educations for profile ${profileId}`);
      } else {
        console.log(`🎓 [ProfileService] Cleared all educations for profile ${profileId}`);
      }
    }

    // Update certifications
    if (input.certifications !== undefined) {
      console.log(`📋 [ProfileService] Updating certifications for profile ${profileId}:`, input.certifications.length, 'items');
      console.log('📋 [ProfileService] Certification data:', JSON.stringify(input.certifications, null, 2));

      await prisma.certification.deleteMany({ where: { profileId } });
      console.log(`📋 [ProfileService] Deleted existing certifications for profile ${profileId}`);

      if (input.certifications.length > 0) {
        const certData = input.certifications.map((cert) => {
          const issueDate = this.parseDate(cert.issueDate);
          if (!issueDate) {
            console.error(`❌ [ProfileService] Invalid issue date for certification: ${cert.name}, date: ${cert.issueDate}`);
            throw new Error(`Invalid issue date for certification: ${cert.name}`);
          }
          const parsedCert = {
            name: cert.name,
            issuer: cert.issuer,
            issueDate: issueDate,
            expiryDate: this.parseDate(cert.expiryDate),
            credentialId: cert.credentialId || null,
            credentialUrl: cert.credentialUrl || null,
            profileId,
          };
          console.log(`📋 [ProfileService] Parsed certification:`, parsedCert);
          return parsedCert;
        });

        await prisma.certification.createMany({
          data: certData,
        });
        console.log(`✅ [ProfileService] Created ${certData.length} certifications for profile ${profileId}`);
      } else {
        console.log(`📋 [ProfileService] No certifications to create (empty array)`);
      }
    } else {
      console.log(`📋 [ProfileService] Certifications not provided in input`);
    }

    // Update achievements
    if (input.achievements !== undefined) {
      console.log(`🏆 [ProfileService] Updating achievements for profile ${profileId}:`, input.achievements.length, 'items');
      console.log('🏆 [ProfileService] Achievement data:', JSON.stringify(input.achievements, null, 2));

      await prisma.achievement.deleteMany({ where: { profileId } });
      console.log(`🏆 [ProfileService] Deleted existing achievements for profile ${profileId}`);

      if (input.achievements.length > 0) {
        const achData = input.achievements.map((ach) => ({
          title: ach.title,
          description: ach.description || '',
          date: this.parseDate(ach.date),
          profileId,
        }));

        await prisma.achievement.createMany({
          data: achData,
        });
        console.log(`✅ [ProfileService] Created ${achData.length} achievements for profile ${profileId}`);
      } else {
        console.log(`🏆 [ProfileService] No achievements to create (empty array)`);
      }
    } else {
      console.log(`🏆 [ProfileService] Achievements not provided in input`);
    }

    // Calculate and update completeness
    const completeness = await this.calculateCompleteness(profileId);
    await prisma.profile.update({
      where: { id: profileId },
      data: { completenessPercent: completeness.percent },
    });

    // Get the updated profile with all relations
    const profile = await this.getProfile(profileId);
    if (!profile) {
      throw new Error('Profile not found after save');
    }

    // Verify all sections were saved
    console.log(`✅ [ProfileService] Profile saved successfully. Final state:`, {
      personalInfo: profile.personalInfo ? 'yes' : 'no',
      summary: profile.summary?.length || 0,
      skills: profile.skills.length,
      experiences: profile.experiences.length,
      projects: profile.projects.length,
      educations: profile.educations.length,
      certifications: profile.certifications.length,
      achievements: profile.achievements.length,
    });

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
      personalInfo: 15,
      summary: 10,
      skills: 20,
      experience: 30,
      education: 15,
      projects: 5,
      certifications: 3,
      achievements: 2,
    };

    // Check personal info (15%)
    totalWeight += weights.personalInfo;
    if (profile.personalInfo?.firstName && profile.personalInfo?.lastName && profile.personalInfo?.email) {
      completedWeight += weights.personalInfo;
    } else {
      missing.push('Personal Info');
    }

    // Check summary (10%)
    totalWeight += weights.summary;
    if (profile.summary && profile.summary.length >= 50) {
      completedWeight += weights.summary;
    } else {
      missing.push('Professional Summary');
    }

    // Check skills (20%)
    totalWeight += weights.skills;
    if (profile.skills.length >= 5) {
      completedWeight += weights.skills;
    } else if (profile.skills.length > 0) {
      completedWeight += weights.skills / 2; // Partial credit
      missing.push('Add more skills (5+)');
    } else {
      missing.push('Skills');
    }

    // Check experience (30%)
    totalWeight += weights.experience;
    if (profile.experiences.length > 0) {
      completedWeight += weights.experience;
    } else {
      missing.push('Work Experience');
    }

    // Check education (15%)
    totalWeight += weights.education;
    if (profile.educations.length > 0) {
      completedWeight += weights.education;
    } else {
      missing.push('Education');
    }

    // Optional sections - bonus points up to 100%
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

    // Calculate percentage
    let percent = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

    // Cap at 70% if no experience (crucial for employability)
    if (profile.experiences.length === 0 && percent > 70) {
      percent = 70;
    }

    return { percent: Math.min(100, percent), missing };
  }

  /**
   * Clear all profile data (reset to empty)
   */
  async clearProfile(profileId: string): Promise<void> {
    console.log(`🗑️ [ProfileService] Clearing all data for profile ${profileId}`);

    // Delete all related data
    await prisma.skill.deleteMany({ where: { profileId } });
    await prisma.experience.deleteMany({ where: { profileId } });
    await prisma.project.deleteMany({ where: { profileId } });
    await prisma.education.deleteMany({ where: { profileId } });
    await prisma.certification.deleteMany({ where: { profileId } });
    await prisma.achievement.deleteMany({ where: { profileId } });
    await prisma.personalInfo.deleteMany({ where: { profileId } });

    // Reset profile summary and completeness
    await prisma.profile.update({
      where: { id: profileId },
      data: {
        summary: null,
        completenessPercent: 0,
      },
    });

    console.log(`✅ [ProfileService] Profile ${profileId} cleared successfully`);
  }
}

export const profileService = new ProfileService();
