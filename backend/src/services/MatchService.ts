import prisma from '../prisma';
import { NotFoundError } from '../middleware/errorHandler';
import { aiProviderService } from './AIProviderService';

// Skill synonyms for partial matching
const SKILL_SYNONYMS: Record<string, string[]> = {
  'javascript': ['js', 'ecmascript', 'es6'],
  'typescript': ['ts'],
  'python': ['py'],
  'react': ['reactjs', 'react.js'],
  'node': ['nodejs', 'node.js'],
  'postgresql': ['postgres', 'psql'],
  'mongodb': ['mongo'],
  'kubernetes': ['k8s'],
  'aws': ['amazon web services'],
  'gcp': ['google cloud platform'],
  'azure': ['microsoft azure'],
  'ci/cd': ['continuous integration', 'continuous deployment'],
  'ml': ['machine learning'],
  'ai': ['artificial intelligence'],
  'api': ['apis', 'rest api', 'restful'],
  'agile': ['scrum', 'kanban'],
};

export interface MatchItem {
  keyword: string;
  matchType: 'direct' | 'partial' | 'gap';
  evidence?: string;
  suggestion?: string;
}

export interface MatchResult {
  matchPercent: number;
  directMatches: MatchItem[];
  partialMatches: MatchItem[];
  gaps: MatchItem[];
  recommendations: string[];
}

export class MatchService {
  /**
   * Match profile against job description
   */
  async matchProfileToJob(userId: string, profileId: string, jobDescriptionId: string): Promise<MatchResult> {
    // Get job analysis
    const jobDescription = await prisma.jobDescription.findUnique({
      where: { id: jobDescriptionId },
      include: { analysis: true },
    });

    if (!jobDescription || !jobDescription.analysis) {
      throw new NotFoundError('Job description or analysis');
    }

    // Get profile
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        skills: { include: { category: true } },
        experiences: true,
        projects: true,
      },
    });

    if (!profile) {
      throw new NotFoundError('Profile');
    }

    // Parse job keywords
    const atsKeywords = JSON.parse(jobDescription.analysis.atsKeywords) as {
      keyword: string;
      weight: number;
      category: string;
    }[];

    // Get all profile text for matching
    const profileText = this.getProfileText(profile);
    const profileSkills = profile.skills.map((s) => s.name.toLowerCase());

    // Categorize matches
    const directMatches: MatchItem[] = [];
    const partialMatches: MatchItem[] = [];
    const gaps: MatchItem[] = [];

    for (const kw of atsKeywords) {
      const keywordLower = kw.keyword.toLowerCase();

      // Check for direct match
      if (profileSkills.includes(keywordLower) || profileText.includes(keywordLower)) {
        directMatches.push({
          keyword: kw.keyword,
          matchType: 'direct',
          evidence: this.findEvidence(profile, keywordLower),
        });
        continue;
      }

      // Check for synonym match
      let foundSynonym = false;
      for (const [main, synonyms] of Object.entries(SKILL_SYNONYMS)) {
        const allVariants = [main, ...synonyms];
        if (allVariants.includes(keywordLower)) {
          // Check if profile has any variant
          for (const variant of allVariants) {
            if (profileSkills.includes(variant) || profileText.includes(variant)) {
              partialMatches.push({
                keyword: kw.keyword,
                matchType: 'partial',
                evidence: `Found related skill: ${variant}`,
              });
              foundSynonym = true;
              break;
            }
          }
          break;
        }
      }

      if (!foundSynonym) {
        gaps.push({
          keyword: kw.keyword,
          matchType: 'gap',
          suggestion: this.getSuggestion(kw.keyword),
        });
      }
    }

    // Calculate match percentage
    const totalKeywords = atsKeywords.length || 1;
    const matchPercent = Math.round(
      ((directMatches.length + partialMatches.length * 0.5) / totalKeywords) * 100
    );

    // Generate recommendations (strict AI)
    const recommendations = await this.generateAIRecommendations(
      userId,
      gaps,
      directMatches.length,
      atsKeywords.length,
      profileText
    );

    return {
      matchPercent: Math.min(100, matchPercent),
      directMatches,
      partialMatches,
      gaps,
      recommendations,
    };
  }

  private getProfileText(profile: {
    summary?: string | null;
    experiences: { description: string; title: string; company: string }[];
    projects: { description: string; name: string }[];
  }): string {
    const parts: string[] = [];

    if (profile.summary) parts.push(profile.summary);

    for (const exp of profile.experiences) {
      parts.push(exp.title, exp.company, exp.description);
    }

    for (const proj of profile.projects) {
      parts.push(proj.name, proj.description);
    }

    return parts.join(' ').toLowerCase();
  }

  private findEvidence(
    profile: {
      skills: { name: string }[];
      experiences: { description: string; title: string }[];
    },
    keyword: string
  ): string {
    // Check skills
    const skill = profile.skills.find((s) => s.name.toLowerCase() === keyword);
    if (skill) return `Listed in Skills: ${skill.name}`;

    // Check experiences
    for (const exp of profile.experiences) {
      if (exp.description.toLowerCase().includes(keyword)) {
        return `Found in experience: ${exp.title}`;
      }
    }

    return 'Found in profile';
  }

  private getSuggestion(keyword: string): string {
    const suggestions: Record<string, string> = {
      'python': 'Consider adding Python projects or courses to your profile',
      'kubernetes': 'K8s experience is valuable - consider container orchestration training',
      'aws': 'Cloud skills are in demand - explore AWS certifications',
      'leadership': 'Highlight team lead or mentoring experiences',
    };

    return suggestions[keyword.toLowerCase()] || `Consider gaining experience with ${keyword}`;
  }

  private async generateAIRecommendations(
    userId: string,
    gaps: MatchItem[],
    directMatchCount: number,
    totalKeywords: number,
    profileText: string
  ): Promise<string[]> {
    const prompt = `Analyze the match between a candidate profile and job requirements, then provide 3-5 specific, actionable recommendations.

Match Statistics:
- Direct Matches: ${directMatchCount}/${totalKeywords}
- Missing Keywords: ${gaps.length}
- Top Missing: ${gaps.slice(0, 5).map(g => g.keyword).join(', ')}

Profile Summary (first 300 words):
${profileText.substring(0, 300)}

Provide concise recommendations focusing on:
1. How to bridge skill gaps
2. Ways to highlight transferable skills
3. Keywords to naturally incorporate
4. Experience framing strategies

Return as JSON array: ["recommendation 1", "recommendation 2", ...]`;

    const aiRecs = await aiProviderService.callJSON<string[]>(userId, prompt, {
      temperature: 0.6,
      maxTokens: 400,
      useCache: false,
    });

    if (Array.isArray(aiRecs) && aiRecs.length > 0) {
      return aiRecs.slice(0, 5);
    }

    // Fallback if AI returns invalid format (return empty or throw? strict means maybe just empty list if format invalid, but no rule-based fallback)
    return [];
  }

}

export const matchService = new MatchService();

