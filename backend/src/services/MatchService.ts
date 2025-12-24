import prisma from '../prisma';
import { NotFoundError } from '../middleware/errorHandler';

const DEFAULT_PROFILE_ID = 'default-user';

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
  async matchProfileToJob(jobDescriptionId: string): Promise<MatchResult> {
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
      where: { id: DEFAULT_PROFILE_ID },
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

    // Generate recommendations
    const recommendations = this.generateRecommendations(gaps, directMatches.length, atsKeywords.length);

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

  private generateRecommendations(
    gaps: MatchItem[],
    directMatchCount: number,
    totalKeywords: number
  ): string[] {
    const recommendations: string[] = [];

    if (gaps.length > 5) {
      recommendations.push(
        `You're missing ${gaps.length} key skills. Focus on the top 3-5 most critical ones.`
      );
    }

    if (directMatchCount < totalKeywords * 0.5) {
      recommendations.push(
        'Consider tailoring your experience descriptions to include more job-specific keywords.'
      );
    }

    const topGaps = gaps.slice(0, 3);
    for (const gap of topGaps) {
      if (gap.suggestion) {
        recommendations.push(gap.suggestion);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Your profile is well-matched to this role!');
    }

    return recommendations.slice(0, 5);
  }
}

export const matchService = new MatchService();

