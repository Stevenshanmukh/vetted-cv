import prisma from '../prisma';
import { JobDescription, JobAnalysis } from '@prisma/client';
import { openAIService } from './OpenAIService';

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
   * Analyze a job description using AI with fallback to mock
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

    // Try AI analysis first, fallback to mock
    let analysis: AnalysisResult;
    try {
      analysis = await this.performAIAnalysis(title, descriptionText);
    } catch (error) {
      console.warn('AI analysis failed, using mock:', error);
      analysis = this.performMockAnalysis(title, descriptionText);
    }

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
   * Perform AI-powered analysis using OpenAI
   */
  private async performAIAnalysis(title: string, descriptionText: string): Promise<AnalysisResult> {
    const prompt = `Analyze this job posting and extract structured information.

Job Title: ${title}

Job Description:
${descriptionText}

Extract and return a JSON object with this exact structure:
{
  "requiredSkills": ["skill1", "skill2", ...],  // Technical skills explicitly marked as required/must have
  "preferredSkills": ["skill1", "skill2", ...],  // Skills marked as nice-to-have/preferred/bonus
  "responsibilities": ["responsibility 1", "responsibility 2", ...],  // Key job responsibilities (3-8 items)
  "atsKeywords": [
    {"keyword": "keyword1", "weight": 10, "category": "required"},
    {"keyword": "keyword2", "weight": 7, "category": "preferred"},
    {"keyword": "keyword3", "weight": 5, "category": "general"}
  ],  // Top 20 ATS keywords with weights (10=critical, 5=important, 1=mentioned)
  "experienceLevel": "Junior" | "Mid-Level" | "Senior" | null  // Based on years/level mentioned
}

Focus on:
- Technical skills, tools, frameworks, languages
- Years of experience mentioned
- Required vs preferred qualifications
- Key action verbs and responsibilities
- Industry-specific terms`;

    const systemPrompt = `You are an expert job description analyzer. Extract structured data from job postings for ATS (Applicant Tracking System) optimization. Be precise and focus on technical skills, tools, and qualifications.`;

    const result = await openAIService.callJSON<AnalysisResult>(prompt, {
      systemPrompt,
      temperature: 0.3,
      maxTokens: 2000,
      useCache: true, // Cache job analyses
    });

    // Validate and normalize response
    return {
      requiredSkills: Array.isArray(result.requiredSkills) ? result.requiredSkills.slice(0, 15) : [],
      preferredSkills: Array.isArray(result.preferredSkills) ? result.preferredSkills.slice(0, 15) : [],
      responsibilities: Array.isArray(result.responsibilities) ? result.responsibilities.slice(0, 8) : [],
      atsKeywords: Array.isArray(result.atsKeywords) 
        ? result.atsKeywords.slice(0, 20).map(kw => ({
            keyword: kw.keyword || '',
            weight: typeof kw.weight === 'number' ? kw.weight : 5,
            category: (kw.category === 'required' || kw.category === 'preferred') ? kw.category : 'general',
          }))
        : [],
      experienceLevel: result.experienceLevel || null,
    };
  }

  /**
   * Fallback mock analysis (original implementation)
   */
  private performMockAnalysis(title: string, descriptionText: string): AnalysisResult {
    const STOPWORDS = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    ]);

    const REQUIRED_INDICATORS = ['must', 'required', 'essential', 'mandatory', 'need', 'needs'];
    const PREFERRED_INDICATORS = ['nice to have', 'preferred', 'bonus', 'plus', 'ideal'];

    const fullText = `${title}\n${descriptionText}`;
    const lowerText = fullText.toLowerCase();

    // Extract keywords
    const wordCounts = new Map<string, number>();
    const words = fullText
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOPWORDS.has(word));

    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }

    const keywords: ATSKeyword[] = Array.from(wordCounts.entries())
      .map(([keyword, weight]) => ({
        keyword: keyword.charAt(0).toUpperCase() + keyword.slice(1),
        weight,
        category: 'general' as const,
      }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 20);

    // Categorize skills
    const requiredSkills: string[] = [];
    const preferredSkills: string[] = [];

    for (const kw of keywords) {
      const context = lowerText.substring(
        Math.max(0, lowerText.indexOf(kw.keyword.toLowerCase()) - 100),
        Math.min(lowerText.length, lowerText.indexOf(kw.keyword.toLowerCase()) + kw.keyword.length + 100)
      );

      if (REQUIRED_INDICATORS.some((ind) => context.includes(ind))) {
        requiredSkills.push(kw.keyword);
        kw.category = 'required';
      } else if (PREFERRED_INDICATORS.some((ind) => context.includes(ind))) {
        preferredSkills.push(kw.keyword);
        kw.category = 'preferred';
      }
    }

    // Extract responsibilities
    const actionVerbs = ['lead', 'develop', 'design', 'build', 'create', 'manage', 'implement'];
    const sentences = descriptionText.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 20);
    const responsibilities = sentences.filter((sentence) => {
      const firstWord = sentence.split(/\s+/)[0]?.toLowerCase() || '';
      return actionVerbs.some((verb) => firstWord.includes(verb));
    }).slice(0, 8);

    // Detect experience level
    let experienceLevel: string | null = null;
    if (lowerText.includes('senior') || lowerText.includes('lead') || lowerText.includes('principal')) {
      experienceLevel = 'Senior';
    } else if (lowerText.includes('junior') || lowerText.includes('entry') || lowerText.includes('graduate')) {
      experienceLevel = 'Junior';
    } else if (lowerText.includes('mid-level') || lowerText.includes('intermediate')) {
      experienceLevel = 'Mid-Level';
    } else {
      const match = lowerText.match(/(\d+)\+?\s*years/);
      if (match) {
        const years = parseInt(match[1], 10);
        if (years >= 7) experienceLevel = 'Senior';
        else if (years >= 3) experienceLevel = 'Mid-Level';
        else experienceLevel = 'Junior';
      } else {
        experienceLevel = 'Mid-Level';
      }
    }

    return {
      requiredSkills: [...new Set(requiredSkills)].slice(0, 10),
      preferredSkills: [...new Set(preferredSkills)].slice(0, 10),
      responsibilities: responsibilities.slice(0, 8),
      atsKeywords: keywords,
      experienceLevel,
    };
  }
}

export const jobAnalysisService = new JobAnalysisService();
