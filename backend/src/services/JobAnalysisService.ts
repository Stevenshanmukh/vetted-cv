import prisma from '../prisma';
import { JobDescription, JobAnalysis } from '@prisma/client';

// Stopwords for keyword extraction
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
  'she', 'we', 'they', 'what', 'which', 'who', 'whom', 'whose', 'where',
  'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'your',
]);

const REQUIRED_INDICATORS = ['must', 'required', 'essential', 'mandatory', 'need', 'needs'];
const PREFERRED_INDICATORS = ['nice to have', 'preferred', 'bonus', 'plus', 'ideal'];

export interface ATSKeyword {
  keyword: string;
  weight: number;
  category: 'required' | 'preferred' | 'general';
}

export interface AnalysisResult {
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  atsKeywords: ATSKeyword[];
  experienceLevel: string | null;
}

export class JobAnalysisService {
  /**
   * Analyze a job description
   */
  async analyzeJob(
    title: string,
    company: string,
    descriptionText: string
  ): Promise<JobDescription & { analysis: JobAnalysis }> {
    // Create job description
    const jobDescription = await prisma.jobDescription.create({
      data: {
        title,
        company,
        descriptionText,
      },
    });

    // Perform analysis
    const analysis = this.performAnalysis(title, descriptionText);

    // Save analysis
    const savedAnalysis = await prisma.jobAnalysis.create({
      data: {
        jobDescriptionId: jobDescription.id,
        requiredSkills: JSON.stringify(analysis.requiredSkills),
        preferredSkills: JSON.stringify(analysis.preferredSkills),
        responsibilities: JSON.stringify(analysis.responsibilities),
        atsKeywords: JSON.stringify(analysis.atsKeywords),
        experienceLevel: analysis.experienceLevel,
      },
    });

    return {
      ...jobDescription,
      analysis: savedAnalysis,
    };
  }

  /**
   * Get job description by ID
   */
  async getJobDescription(id: string): Promise<(JobDescription & { analysis: JobAnalysis | null }) | null> {
    return prisma.jobDescription.findUnique({
      where: { id },
      include: { analysis: true },
    });
  }

  /**
   * Get job history
   */
  async getJobHistory(): Promise<JobDescription[]> {
    return prisma.jobDescription.findMany({
      orderBy: { createdAt: 'desc' },
      include: { analysis: true },
    });
  }

  /**
   * Perform mock AI analysis on job description
   */
  private performAnalysis(title: string, descriptionText: string): AnalysisResult {
    const fullText = `${title}\n${descriptionText}`;
    const lowerText = fullText.toLowerCase();

    // Extract keywords with weights
    const keywords = this.extractKeywords(title, descriptionText);

    // Categorize skills
    const requiredSkills: string[] = [];
    const preferredSkills: string[] = [];

    for (const kw of keywords) {
      const context = this.getContext(lowerText, kw.keyword.toLowerCase());
      
      if (REQUIRED_INDICATORS.some((ind) => context.includes(ind))) {
        requiredSkills.push(kw.keyword);
        kw.category = 'required';
      } else if (PREFERRED_INDICATORS.some((ind) => context.includes(ind))) {
        preferredSkills.push(kw.keyword);
        kw.category = 'preferred';
      }
    }

    // Extract responsibilities (sentences with action verbs)
    const responsibilities = this.extractResponsibilities(descriptionText);

    // Detect experience level
    const experienceLevel = this.detectExperienceLevel(lowerText);

    return {
      requiredSkills: [...new Set(requiredSkills)].slice(0, 10),
      preferredSkills: [...new Set(preferredSkills)].slice(0, 10),
      responsibilities: responsibilities.slice(0, 8),
      atsKeywords: keywords,
      experienceLevel,
    };
  }

  /**
   * Extract keywords from job description
   */
  private extractKeywords(title: string, descriptionText: string): ATSKeyword[] {
    const wordCounts = new Map<string, number>();

    // Process title with highest weight
    this.processText(title, wordCounts, 3);

    // Process first paragraph with medium weight
    const paragraphs = descriptionText.split('\n\n');
    if (paragraphs[0]) {
      this.processText(paragraphs[0], wordCounts, 2);
    }

    // Process rest with normal weight
    const rest = paragraphs.slice(1).join('\n\n');
    this.processText(rest, wordCounts, 1);

    // Sort by weight and take top 20
    const keywords = Array.from(wordCounts.entries())
      .map(([keyword, weight]) => ({
        keyword: this.capitalizeFirst(keyword),
        weight,
        category: 'general' as const,
      }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 20);

    return keywords;
  }

  private processText(text: string, wordCounts: Map<string, number>, weight: number): void {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOPWORDS.has(word));

    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + weight);
    }
  }

  private getContext(text: string, word: string): string {
    const index = text.indexOf(word);
    if (index === -1) return '';
    const start = Math.max(0, index - 100);
    const end = Math.min(text.length, index + word.length + 100);
    return text.slice(start, end);
  }

  private extractResponsibilities(text: string): string[] {
    const actionVerbs = [
      'lead', 'develop', 'design', 'build', 'create', 'manage', 'implement',
      'collaborate', 'drive', 'own', 'define', 'work', 'partner', 'ensure',
    ];

    const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 20);
    
    return sentences.filter((sentence) => {
      const firstWord = sentence.split(/\s+/)[0]?.toLowerCase() || '';
      return actionVerbs.some((verb) => firstWord.includes(verb));
    });
  }

  private detectExperienceLevel(text: string): string | null {
    if (text.includes('senior') || text.includes('lead') || text.includes('principal')) {
      return 'Senior';
    }
    if (text.includes('junior') || text.includes('entry') || text.includes('graduate')) {
      return 'Junior';
    }
    if (text.includes('mid-level') || text.includes('intermediate')) {
      return 'Mid-Level';
    }
    if (/\d+\+?\s*years/.test(text)) {
      const match = text.match(/(\d+)\+?\s*years/);
      if (match) {
        const years = parseInt(match[1], 10);
        if (years >= 7) return 'Senior';
        if (years >= 3) return 'Mid-Level';
        return 'Junior';
      }
    }
    return 'Mid-Level';
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export const jobAnalysisService = new JobAnalysisService();

