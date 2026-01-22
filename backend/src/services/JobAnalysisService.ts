import prisma from '../prisma';
import { JobDescription, JobAnalysis } from '@prisma/client';
import { aiProviderService } from './AIProviderService';

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
    userId: string,
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

    // AI analysis (strict requirement)
    const analysis = await this.performAIAnalysis(userId, title, descriptionText);

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
   * Perform AI-powered analysis using User's Active Provider
   */
  private async performAIAnalysis(userId: string, title: string, descriptionText: string): Promise<AnalysisResult> {
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

    const result = await aiProviderService.callJSON<AnalysisResult>(userId, prompt, {
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

}

export const jobAnalysisService = new JobAnalysisService();
