import prisma from '../prisma';
import { ResumeScore } from '@prisma/client';
import { NotFoundError } from '../middleware/errorHandler';
import { openAIService } from './OpenAIService';

// Action verbs for scoring
const ACTION_VERBS = new Set([
  'achieved', 'administered', 'analyzed', 'architected', 'automated',
  'built', 'collaborated', 'coordinated', 'created', 'decreased',
  'delivered', 'designed', 'developed', 'directed', 'drove',
  'enabled', 'engineered', 'established', 'executed', 'expanded',
  'facilitated', 'generated', 'grew', 'headed', 'implemented',
  'improved', 'increased', 'influenced', 'initiated', 'innovated',
  'integrated', 'introduced', 'launched', 'led', 'leveraged',
  'managed', 'maximized', 'mentored', 'migrated', 'modernized',
  'optimized', 'orchestrated', 'organized', 'oversaw', 'pioneered',
  'produced', 'reduced', 'refactored', 'redesigned', 'scaled',
  'spearheaded', 'standardized', 'streamlined', 'strengthened',
  'supervised', 'transformed', 'unified', 'upgraded',
]);

export interface ScoreResult {
  atsScore: number;
  recruiterScore: number;
  keywordMatchPct: number;
  formattingScore: number;
  readabilityScore: number;
  metricsScore: number;
  verbsScore: number;
  breakdown: {
    ats: {
      keywordCoverage: number;
      formatScore: number;
      sectionScore: number;
      lengthScore: number;
    };
    recruiter: {
      metricsScore: number;
      actionVerbScore: number;
      readabilityScore: number;
    };
  };
  missingKeywords: string[];
  recommendations: string[];
}

export class ATSScorerService {
  /**
   * Score a resume
   */
  async scoreResume(resumeId: string): Promise<ResumeScore> {
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        jobDescription: {
          include: { analysis: true },
        },
      },
    });

    if (!resume) {
      throw new NotFoundError('Resume');
    }

    // Calculate scores
    const scoreResult = await this.calculateScores(
      resume.latexContent,
      resume.jobDescription?.analysis?.atsKeywords || '[]'
    );

    // Save score
    const score = await prisma.resumeScore.create({
      data: {
        resumeId,
        atsScore: scoreResult.atsScore,
        recruiterScore: scoreResult.recruiterScore,
        keywordMatchPct: scoreResult.keywordMatchPct,
        formattingScore: scoreResult.formattingScore,
        readabilityScore: scoreResult.readabilityScore,
        metricsScore: scoreResult.metricsScore,
        verbsScore: scoreResult.verbsScore,
        breakdown: JSON.stringify(scoreResult.breakdown),
        missingKeywords: JSON.stringify(scoreResult.missingKeywords),
        recommendations: JSON.stringify(scoreResult.recommendations),
      },
    });

    return score;
  }

  /**
   * Calculate all scores for a resume
   */
  private async calculateScores(latexContent: string, atsKeywordsJson: string): Promise<ScoreResult> {
    const plainText = this.extractPlainText(latexContent);
    const bullets = this.extractBullets(latexContent);
    const wordCount = this.countWords(plainText);
    const atsKeywords = JSON.parse(atsKeywordsJson) as { keyword: string; weight: number }[];

    // Calculate keyword match
    const { matchPct, missingKeywords } = this.calculateKeywordMatch(plainText, atsKeywords);

    // Detect sections
    const hasSections = this.detectSections(latexContent);

    // Calculate ATS components
    const keywordCoverage = matchPct;
    const formatScore = 100; // Simplified - LaTeX is always well-formatted
    const sectionScore = this.calculateSectionScore(hasSections);
    const lengthScore = this.calculateLengthScore(wordCount);

    const atsScore = Math.round(
      keywordCoverage * 0.4 + formatScore * 0.2 + sectionScore * 0.2 + lengthScore * 0.2
    );

    // Calculate Recruiter components
    const metricsScore = this.calculateMetricsScore(bullets);
    const actionVerbScore = this.calculateActionVerbScore(bullets);
    const readabilityScore = this.calculateReadabilityScore(bullets);

    const recruiterScore = Math.round(
      metricsScore * 0.4 + actionVerbScore * 0.3 + readabilityScore * 0.3
    );

    // Generate recommendations (with AI if available)
    const recommendations = await this.generateRecommendations(
      atsScore,
      recruiterScore,
      missingKeywords,
      hasSections,
      metricsScore,
      actionVerbScore,
      plainText
    );

    return {
      atsScore: Math.min(100, Math.max(0, atsScore)),
      recruiterScore: Math.min(100, Math.max(0, recruiterScore)),
      keywordMatchPct: matchPct,
      formattingScore: formatScore,
      readabilityScore,
      metricsScore,
      verbsScore: actionVerbScore,
      breakdown: {
        ats: {
          keywordCoverage,
          formatScore,
          sectionScore,
          lengthScore,
        },
        recruiter: {
          metricsScore,
          actionVerbScore,
          readabilityScore,
        },
      },
      missingKeywords,
      recommendations,
    };
  }

  private extractPlainText(latex: string): string {
    return latex
      .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')
      .replace(/\\[a-zA-Z]+/g, '')
      .replace(/[{}\\%]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  private extractBullets(latex: string): string[] {
    const bulletRegex = /\\item\s+([^\\]+)/g;
    const bullets: string[] = [];
    let match;

    while ((match = bulletRegex.exec(latex)) !== null) {
      bullets.push(match[1].trim());
    }

    return bullets;
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }

  private calculateKeywordMatch(
    text: string,
    keywords: { keyword: string; weight: number }[]
  ): { matchPct: number; missingKeywords: string[] } {
    if (keywords.length === 0) {
      return { matchPct: 100, missingKeywords: [] };
    }

    const missingKeywords: string[] = [];
    let matchedWeight = 0;
    let totalWeight = 0;

    for (const kw of keywords) {
      totalWeight += kw.weight;
      if (text.includes(kw.keyword.toLowerCase())) {
        matchedWeight += kw.weight;
      } else {
        missingKeywords.push(kw.keyword);
      }
    }

    const matchPct = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 100;

    return { matchPct, missingKeywords };
  }

  private detectSections(latex: string): string[] {
    const sectionRegex = /\\section\{([^}]+)\}/g;
    const sections: string[] = [];
    let match;

    while ((match = sectionRegex.exec(latex)) !== null) {
      sections.push(match[1].toLowerCase());
    }

    return sections;
  }

  private calculateSectionScore(sections: string[]): number {
    const required = ['experience', 'professional experience', 'education', 'skills'];
    let score = 100;

    for (const req of required) {
      if (!sections.some((s) => s.includes(req))) {
        score -= 20;
      }
    }

    return Math.max(0, score);
  }

  private calculateLengthScore(wordCount: number): number {
    if (wordCount >= 400 && wordCount <= 800) {
      return 100;
    }

    if (wordCount < 400) {
      return Math.max(0, 100 - Math.floor((400 - wordCount) / 10));
    }

    return Math.max(0, 100 - Math.floor((wordCount - 800) / 10));
  }

  private calculateMetricsScore(bullets: string[]): number {
    const bulletsWithMetrics = bullets.filter((b) => /\d+%?/.test(b)).length;
    return Math.min(100, bulletsWithMetrics * 8);
  }

  private calculateActionVerbScore(bullets: string[]): number {
    if (bullets.length === 0) return 0;

    const bulletsWithActionVerbs = bullets.filter((b) => {
      const firstWord = b.trim().split(/\s+/)[0]?.toLowerCase() || '';
      return ACTION_VERBS.has(firstWord);
    }).length;

    return Math.round((bulletsWithActionVerbs / bullets.length) * 100);
  }

  private calculateReadabilityScore(bullets: string[]): number {
    if (bullets.length === 0) return 100;

    const avgLength =
      bullets.reduce((sum, b) => sum + b.split(/\s+/).length, 0) / bullets.length;

    // Optimal is around 15 words
    return Math.max(0, 100 - Math.abs(avgLength - 15) * 2);
  }

  private async generateRecommendations(
    atsScore: number,
    recruiterScore: number,
    missingKeywords: string[],
    sections: string[],
    metricsScore: number,
    actionVerbScore: number,
    resumeText?: string
  ): Promise<string[]> {
    // Try AI-powered recommendations first
    if (resumeText && missingKeywords.length > 0) {
      try {
        const prompt = `Analyze this resume and provide 3-5 specific, actionable recommendations to improve ATS score and recruiter appeal.

Resume Score: ATS ${atsScore}/100, Recruiter ${recruiterScore}/100
Missing Keywords: ${missingKeywords.slice(0, 10).join(', ')}
Metrics Score: ${metricsScore}/100
Action Verb Score: ${actionVerbScore}/100

Resume Content (first 500 words):
${resumeText.substring(0, 500)}

Provide concise, actionable recommendations (one sentence each). Focus on:
1. How to naturally incorporate missing keywords
2. Improving quantifiable achievements
3. Strengthening action verbs
4. Overall optimization tips

Return as JSON array: ["recommendation 1", "recommendation 2", ...]`;

        const aiRecs = await openAIService.callJSON<string[]>(prompt, {
          temperature: 0.5,
          maxTokens: 300,
          useCache: false, // Don't cache as recommendations are score-specific
        });

        if (Array.isArray(aiRecs) && aiRecs.length > 0) {
          return aiRecs.slice(0, 5);
        }
      } catch (error) {
        console.warn('AI recommendations failed, using fallback:', error);
      }
    }

    // Fallback to rule-based recommendations
    const recommendations: string[] = [];

    if (missingKeywords.length > 0) {
      recommendations.push(
        `Add these keywords to improve ATS score: ${missingKeywords.slice(0, 5).join(', ')}`
      );
    }

    if (metricsScore < 50) {
      recommendations.push('Add more quantified achievements (numbers, percentages) to your bullets');
    }

    if (actionVerbScore < 70) {
      recommendations.push('Start more bullet points with strong action verbs (Led, Developed, Increased)');
    }

    if (!sections.some((s) => s.includes('summary'))) {
      recommendations.push('Consider adding a Professional Summary section');
    }

    if (atsScore >= 80 && recruiterScore >= 80) {
      recommendations.push('Your resume is well-optimized! Consider minor tweaks for specific roles.');
    }

    return recommendations.slice(0, 5);
  }
}

export const atsScorerService = new ATSScorerService();

