import prisma from '../prisma';
import { Resume } from '@prisma/client';
import { NotFoundError } from '../middleware/errorHandler';
import { openAIService } from './OpenAIService';

type ResumeStrategy = 'max_ats' | 'recruiter_readability' | 'career_switch' | 'promotion_internal' | 'stretch_role';

const SECTION_ORDER: Record<ResumeStrategy, string[]> = {
  max_ats: ['skills', 'experience', 'education', 'projects', 'certifications'],
  recruiter_readability: ['summary', 'experience', 'skills', 'education', 'projects'],
  career_switch: ['summary', 'skills', 'projects', 'experience', 'education'],
  promotion_internal: ['summary', 'achievements', 'experience', 'skills'],
  stretch_role: ['summary', 'projects', 'skills', 'experience'],
};

export class ResumeGeneratorService {
  /**
   * Generate a resume based on profile and job description
   */
  async generateResume(profileId: string, jobDescriptionId: string, strategy: ResumeStrategy): Promise<Resume> {
    // Get profile
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        personalInfo: true,
        skills: { include: { category: true } },
        experiences: { orderBy: { order: 'asc' } },
        projects: { orderBy: { order: 'asc' } },
        educations: { orderBy: { order: 'asc' } },
        certifications: true,
        achievements: true,
      },
    });

    if (!profile) {
      throw new NotFoundError('Profile');
    }

    // Get job description
    const jobDescription = await prisma.jobDescription.findUnique({
      where: { id: jobDescriptionId },
      include: { analysis: true },
    });

    if (!jobDescription) {
      throw new NotFoundError('Job description');
    }

    // Generate LaTeX (try AI-enhanced, fallback to template-based)
    let latexContent: string;
    try {
      latexContent = await this.generateLatexWithAI(profile, jobDescription, strategy);
    } catch (error) {
      console.warn('AI resume generation failed, using template:', error);
      latexContent = this.generateLatex(profile, jobDescription, strategy);
    }

    // Create resume record
    const resume = await prisma.resume.create({
      data: {
        title: `${jobDescription.title} at ${jobDescription.company}`,
        profileId,
        jobDescriptionId,
        strategy,
        latexContent,
      },
    });

    return resume;
  }

  /**
   * Get resume by ID (with ownership check)
   */
  async getResume(id: string, profileId?: string): Promise<Resume | null> {
    const resume = await prisma.resume.findUnique({
      where: { id },
      include: {
        scores: { orderBy: { scannedAt: 'desc' }, take: 1 },
        jobDescription: true,
      },
    });

    // If profileId provided, verify ownership
    if (profileId && resume && resume.profileId !== profileId) {
      return null;
    }

    return resume;
  }

  /**
   * Get resume history for a user
   */
  async getResumeHistory(profileId: string): Promise<Resume[]> {
    return prisma.resume.findMany({
      where: { profileId },
      orderBy: { createdAt: 'desc' },
      include: {
        scores: { orderBy: { scannedAt: 'desc' }, take: 1 },
        jobDescription: true,
      },
    });
  }

  /**
   * Delete resume (with ownership check)
   */
  async deleteResume(id: string, profileId: string): Promise<void> {
    const resume = await prisma.resume.findUnique({ where: { id } });
    if (!resume || resume.profileId !== profileId) {
      throw new NotFoundError('Resume');
    }
    await prisma.resume.delete({ where: { id } });
  }

  /**
   * Generate LaTeX content with AI optimization
   */
  private async generateLatexWithAI(
    profile: {
      personalInfo: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string | null;
        location?: string | null;
        linkedIn?: string | null;
        website?: string | null;
      } | null;
      summary?: string | null;
      skills: { name: string; category: { name: string } }[];
      experiences: {
        title: string;
        company: string;
        location?: string | null;
        startDate: Date;
        endDate?: Date | null;
        isCurrent: boolean;
        description: string;
      }[];
      projects: { name: string; description: string; technologies?: string | null }[];
      educations: {
        institution: string;
        degree: string;
        field?: string | null;
        startDate: Date;
        endDate?: Date | null;
        gpa?: string | null;
      }[];
      certifications: { name: string; issuer: string; issueDate: Date }[];
      achievements: { title: string; description: string; date?: Date | null }[];
    },
    jobDescription: { title: string; descriptionText: string; analysis: { atsKeywords: string } | null },
    strategy: ResumeStrategy
  ): Promise<string> {
    // Get ATS keywords from job analysis
    const atsKeywords = jobDescription.analysis 
      ? JSON.parse(jobDescription.analysis.atsKeywords) as { keyword: string; weight: number }[]
      : [];

    // Optimize summary with AI
    let optimizedSummary = profile.summary || '';
    if (profile.summary && atsKeywords.length > 0) {
      try {
        const summaryPrompt = `Rewrite this professional summary to be more ATS-friendly and aligned with the job requirements. Keep it concise (2-3 sentences), include relevant keywords naturally, and maintain authenticity.

Original Summary:
${profile.summary}

Target Job: ${jobDescription.title}
Key Keywords to incorporate: ${atsKeywords.slice(0, 10).map(k => k.keyword).join(', ')}

Return only the rewritten summary, no explanations.`;

        const aiSummary = await openAIService.call(summaryPrompt, {
          temperature: 0.7,
          maxTokens: 200,
          useCache: false, // Don't cache summaries as they're job-specific
        });
        optimizedSummary = aiSummary.content.trim();
      } catch (error) {
        console.warn('AI summary optimization failed:', error);
      }
    }

    // Optimize experience descriptions with AI
    const optimizedExperiences = await Promise.all(
      profile.experiences.map(async (exp) => {
        if (!exp.description || atsKeywords.length === 0) return exp;

        try {
          const expPrompt = `Rewrite these job responsibilities to be more ATS-friendly and impactful. Use action verbs, include metrics/numbers where possible, and naturally incorporate relevant keywords. Keep 3-5 bullet points.

Job Title: ${exp.title}
Company: ${exp.company}
Original Description:
${exp.description}

Target Job Keywords: ${atsKeywords.slice(0, 8).map(k => k.keyword).join(', ')}

Return only the rewritten bullet points, one per line, starting with action verbs.`;

          const aiDesc = await openAIService.call(expPrompt, {
            temperature: 0.7,
            maxTokens: 300,
            useCache: false,
          });
          
          return {
            ...exp,
            description: aiDesc.content.trim(),
          };
        } catch (error) {
          console.warn(`AI optimization failed for ${exp.title}:`, error);
          return exp;
        }
      })
    );

    // Use optimized profile
    const optimizedProfile = {
      ...profile,
      summary: optimizedSummary,
      experiences: optimizedExperiences,
    };

    // Generate LaTeX with optimized content
    return this.generateLatex(optimizedProfile, jobDescription, strategy);
  }

  /**
   * Generate LaTeX content (template-based, fallback)
   */
  private generateLatex(
    profile: {
      personalInfo: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string | null;
        location?: string | null;
        linkedIn?: string | null;
        website?: string | null;
      } | null;
      summary?: string | null;
      skills: { name: string; category: { name: string } }[];
      experiences: {
        title: string;
        company: string;
        location?: string | null;
        startDate: Date;
        endDate?: Date | null;
        isCurrent: boolean;
        description: string;
      }[];
      projects: { name: string; description: string; technologies?: string | null }[];
      educations: {
        institution: string;
        degree: string;
        field?: string | null;
        startDate: Date;
        endDate?: Date | null;
        gpa?: string | null;
      }[];
      certifications: { name: string; issuer: string; issueDate: Date }[];
      achievements: { title: string; description: string; date?: Date | null }[];
    },
    jobDescription: { title: string },
    strategy: ResumeStrategy
  ): string {
    const sections = SECTION_ORDER[strategy] || SECTION_ORDER.recruiter_readability;
    
    let latex = this.getHeader(profile, jobDescription.title);
    
    for (const section of sections) {
      latex += this.generateSection(section, profile);
    }
    
    latex += '\\end{document}';
    
    return latex;
  }

  private getHeader(
    profile: {
      personalInfo: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string | null;
        location?: string | null;
        linkedIn?: string | null;
        website?: string | null;
      } | null;
    },
    title: string
  ): string {
    const info = profile.personalInfo;
    const firstName = info?.firstName || 'First';
    const lastName = info?.lastName || 'Last';
    const email = info?.email || 'email@example.com';
    const phone = info?.phone || '';
    const location = info?.location || '';
    const linkedIn = info?.linkedIn ? `\\social[linkedin]{${this.escapeLatex(info.linkedIn.replace('https://linkedin.com/in/', ''))}}` : '';

    return `\\documentclass[11pt,a4paper]{moderncv}
\\moderncvstyle{banking}
\\moderncvcolor{blue}
\\usepackage[utf8]{inputenc}
\\usepackage[scale=0.75]{geometry}

\\name{${this.escapeLatex(firstName)}}{${this.escapeLatex(lastName)}}
\\title{${this.escapeLatex(title)}}
\\address{${this.escapeLatex(location)}}{}{}
\\phone[mobile]{${this.escapeLatex(phone)}}
\\email{${this.escapeLatex(email)}}
${linkedIn}

\\begin{document}
\\makecvtitle

`;
  }

  private generateSection(
    section: string,
    profile: {
      summary?: string | null;
      skills: { name: string; category: { name: string } }[];
      experiences: {
        title: string;
        company: string;
        location?: string | null;
        startDate: Date;
        endDate?: Date | null;
        isCurrent: boolean;
        description: string;
      }[];
      projects: { name: string; description: string; technologies?: string | null }[];
      educations: {
        institution: string;
        degree: string;
        field?: string | null;
        startDate: Date;
        endDate?: Date | null;
        gpa?: string | null;
      }[];
      certifications: { name: string; issuer: string; issueDate: Date }[];
      achievements: { title: string; description: string; date?: Date | null }[];
    }
  ): string {
    switch (section) {
      case 'summary':
        return profile.summary ? `\\section{Professional Summary}
${this.escapeLatex(profile.summary)}

` : '';

      case 'skills':
        return this.generateSkillsSection(profile.skills);

      case 'experience':
        return this.generateExperienceSection(profile.experiences);

      case 'education':
        return this.generateEducationSection(profile.educations);

      case 'projects':
        return this.generateProjectsSection(profile.projects);

      case 'certifications':
        return this.generateCertificationsSection(profile.certifications);

      case 'achievements':
        return this.generateAchievementsSection(profile.achievements);

      default:
        return '';
    }
  }

  private generateSkillsSection(skills: { name: string; category: { name: string } }[]): string {
    if (skills.length === 0) return '';

    // Group by category
    const grouped = new Map<string, string[]>();
    for (const skill of skills) {
      const category = skill.category.name;
      if (!grouped.has(category)) grouped.set(category, []);
      grouped.get(category)!.push(skill.name);
    }

    let latex = '\\section{Skills}\n';
    for (const [category, skillList] of grouped) {
      latex += `\\cvitem{${this.escapeLatex(category)}}{${skillList.map(s => this.escapeLatex(s)).join(', ')}}\n`;
    }
    latex += '\n';

    return latex;
  }

  private generateExperienceSection(
    experiences: {
      title: string;
      company: string;
      location?: string | null;
      startDate: Date;
      endDate?: Date | null;
      isCurrent: boolean;
      description: string;
    }[]
  ): string {
    if (experiences.length === 0) return '';

    let latex = '\\section{Professional Experience}\n';
    
    for (const exp of experiences) {
      const dates = this.formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
      const bullets = this.formatBullets(exp.description);
      
      latex += `\\cventry{${dates}}{${this.escapeLatex(exp.title)}}{${this.escapeLatex(exp.company)}}{${this.escapeLatex(exp.location || '')}}{}{
\\begin{itemize}
${bullets}
\\end{itemize}
}
`;
    }
    latex += '\n';

    return latex;
  }

  private generateEducationSection(
    educations: {
      institution: string;
      degree: string;
      field?: string | null;
      startDate: Date;
      endDate?: Date | null;
      gpa?: string | null;
    }[]
  ): string {
    if (educations.length === 0) return '';

    let latex = '\\section{Education}\n';
    
    for (const edu of educations) {
      const dates = this.formatDateRange(edu.startDate, edu.endDate);
      const degree = edu.field ? `${edu.degree} in ${edu.field}` : edu.degree;
      const gpa = edu.gpa ? `GPA: ${edu.gpa}` : '';
      
      latex += `\\cventry{${dates}}{${this.escapeLatex(degree)}}{${this.escapeLatex(edu.institution)}}{}{${gpa}}{}\n`;
    }
    latex += '\n';

    return latex;
  }

  private generateProjectsSection(
    projects: { name: string; description: string; technologies?: string | null }[]
  ): string {
    if (projects.length === 0) return '';

    let latex = '\\section{Projects}\n';
    
    for (const proj of projects) {
      const tech = proj.technologies ? ` (${proj.technologies})` : '';
      latex += `\\cvitem{${this.escapeLatex(proj.name)}}{${this.escapeLatex(proj.description)}${tech}}\n`;
    }
    latex += '\n';

    return latex;
  }

  private generateCertificationsSection(
    certifications: { name: string; issuer: string; issueDate: Date }[]
  ): string {
    if (certifications.length === 0) return '';

    let latex = '\\section{Certifications}\n';
    
    for (const cert of certifications) {
      const date = new Date(cert.issueDate).getFullYear().toString();
      latex += `\\cvitem{${date}}{${this.escapeLatex(cert.name)} -- ${this.escapeLatex(cert.issuer)}}\n`;
    }
    latex += '\n';

    return latex;
  }

  private generateAchievementsSection(
    achievements: { title: string; description: string; date?: Date | null }[]
  ): string {
    if (achievements.length === 0) return '';

    let latex = '\\section{Achievements}\n';
    
    for (const ach of achievements) {
      const date = ach.date ? new Date(ach.date).getFullYear().toString() : '';
      latex += `\\cvitem{${date}}{\\textbf{${this.escapeLatex(ach.title)}}: ${this.escapeLatex(ach.description)}}\n`;
    }
    latex += '\n';

    return latex;
  }

  private formatDateRange(startDate: Date, endDate?: Date | null, isCurrent?: boolean): string {
    const start = new Date(startDate);
    const startStr = `${start.toLocaleString('en-US', { month: 'short' })} ${start.getFullYear()}`;

    if (isCurrent) {
      return `${startStr} -- Present`;
    }

    if (endDate) {
      const end = new Date(endDate);
      const endStr = `${end.toLocaleString('en-US', { month: 'short' })} ${end.getFullYear()}`;
      return `${startStr} -- ${endStr}`;
    }

    return startStr;
  }

  private formatBullets(description: string): string {
    const lines = description
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^[•\-\*]\s*/, ''));

    return lines.map((line) => `\\item ${this.escapeLatex(line)}`).join('\n');
  }

  private escapeLatex(text: string): string {
    const specialChars: Record<string, string> = {
      '&': '\\&',
      '%': '\\%',
      '$': '\\$',
      '#': '\\#',
      '_': '\\_',
      '{': '\\{',
      '}': '\\}',
    };

    return text.replace(/[&%$#_{}]/g, (match) => specialChars[match] || match);
  }
}

export const resumeGeneratorService = new ResumeGeneratorService();

