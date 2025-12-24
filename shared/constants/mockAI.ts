/**
 * Mock AI Constants and Algorithms
 * These implement the scoring and analysis logic for v1
 */

// Common stopwords to filter out during keyword extraction
export const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
  'she', 'we', 'they', 'what', 'which', 'who', 'whom', 'whose', 'where',
  'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here',
  'there', 'then', 'once', 'if', 'unless', 'until', 'while', 'although',
  'because', 'since', 'though', 'whether', 'after', 'before', 'about',
  'into', 'through', 'during', 'above', 'below', 'between', 'under',
  'again', 'further', 'being', 'having', 'doing', 'our', 'your', 'their',
  'my', 'his', 'her', 'us', 'him', 'them', 'me', 'etc', 'ie', 'eg',
]);

// Words that indicate required skills
export const REQUIRED_INDICATORS = [
  'must', 'required', 'essential', 'mandatory', 'need', 'needs',
  'necessary', 'critical', 'crucial', 'vital', 'key', 'core',
];

// Words that indicate preferred skills
export const PREFERRED_INDICATORS = [
  'nice to have', 'preferred', 'bonus', 'plus', 'ideal', 'ideally',
  'advantageous', 'desirable', 'beneficial', 'helpful', 'optional',
];

// Common action verbs for resume bullets
export const ACTION_VERBS = new Set([
  'achieved', 'administered', 'analyzed', 'architected', 'automated',
  'built', 'collaborated', 'coordinated', 'created', 'decreased',
  'delivered', 'designed', 'developed', 'directed', 'drove',
  'enabled', 'engineered', 'established', 'executed', 'expanded',
  'facilitated', 'generated', 'grew', 'headed', 'implemented',
  'improved', 'increased', 'influenced', 'initiated', 'innovated',
  'integrated', 'introduced', 'launched', 'led', 'leveraged',
  'managed', 'maximized', 'mentored', 'migrated', 'modernized',
  'negotiated', 'optimized', 'orchestrated', 'organized', 'oversaw',
  'partnered', 'pioneered', 'planned', 'produced', 'promoted',
  'proposed', 'provided', 'reduced', 'refactored', 'redesigned',
  'reengineered', 'resolved', 'restructured', 'revamped', 'scaled',
  'shaped', 'simplified', 'spearheaded', 'standardized', 'streamlined',
  'strengthened', 'supervised', 'supported', 'surpassed', 'trained',
  'transformed', 'transitioned', 'unified', 'upgraded', 'utilized',
]);

// Common tech skill synonyms
export const SKILL_SYNONYMS: Record<string, string[]> = {
  'javascript': ['js', 'ecmascript', 'es6', 'es2015'],
  'typescript': ['ts'],
  'python': ['py', 'python3'],
  'react': ['reactjs', 'react.js'],
  'node': ['nodejs', 'node.js'],
  'postgresql': ['postgres', 'psql'],
  'mongodb': ['mongo'],
  'kubernetes': ['k8s'],
  'amazon web services': ['aws'],
  'google cloud platform': ['gcp'],
  'microsoft azure': ['azure'],
  'continuous integration': ['ci', 'ci/cd'],
  'continuous deployment': ['cd', 'ci/cd'],
  'machine learning': ['ml'],
  'artificial intelligence': ['ai'],
  'natural language processing': ['nlp'],
  'user experience': ['ux'],
  'user interface': ['ui'],
  'application programming interface': ['api', 'apis'],
  'software development kit': ['sdk'],
  'object oriented programming': ['oop'],
  'test driven development': ['tdd'],
  'behavior driven development': ['bdd'],
  'agile': ['scrum', 'kanban'],
};

// Standard resume sections
export const STANDARD_SECTIONS = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'achievements',
];

/**
 * Extract keywords from job description text
 */
export function extractKeywords(
  text: string,
  titleWeight = 3,
  firstParagraphWeight = 2
): { keyword: string; weight: number }[] {
  const lines = text.split('\n').filter((line) => line.trim());
  const titleLine = lines[0] || '';
  const firstParagraph = lines.slice(1, 3).join(' ');
  const restContent = lines.slice(3).join(' ');

  const wordCounts = new Map<string, number>();

  // Process title (highest weight)
  processText(titleLine, wordCounts, titleWeight);
  // Process first paragraph (medium weight)
  processText(firstParagraph, wordCounts, firstParagraphWeight);
  // Process rest (normal weight)
  processText(restContent, wordCounts, 1);

  // Sort by weight and take top 20
  const keywords = Array.from(wordCounts.entries())
    .map(([keyword, weight]) => ({ keyword, weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 20);

  return keywords;
}

function processText(text: string, wordCounts: Map<string, number>, weight: number): void {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));

  for (const word of words) {
    wordCounts.set(word, (wordCounts.get(word) || 0) + weight);
  }
}

/**
 * Categorize a skill as required or preferred based on context
 */
export function categorizeSkill(
  skill: string,
  context: string
): 'required' | 'preferred' | 'general' {
  const lowerContext = context.toLowerCase();
  const skillIndex = lowerContext.indexOf(skill.toLowerCase());

  if (skillIndex === -1) return 'general';

  // Check surrounding text (100 chars before and after)
  const start = Math.max(0, skillIndex - 100);
  const end = Math.min(lowerContext.length, skillIndex + skill.length + 100);
  const surrounding = lowerContext.slice(start, end);

  if (REQUIRED_INDICATORS.some((indicator) => surrounding.includes(indicator))) {
    return 'required';
  }

  if (PREFERRED_INDICATORS.some((indicator) => surrounding.includes(indicator))) {
    return 'preferred';
  }

  return 'general';
}

/**
 * Calculate match score between profile skills and job keywords
 */
export function calculateMatchScore(
  profileSkills: string[],
  jobKeywords: string[]
): { score: number; directMatches: string[]; partialMatches: string[]; gaps: string[] } {
  const profileSkillsLower = new Set(profileSkills.map((s) => s.toLowerCase()));
  const directMatches: string[] = [];
  const partialMatches: string[] = [];
  const gaps: string[] = [];

  for (const keyword of jobKeywords) {
    const keywordLower = keyword.toLowerCase();

    // Check for direct match
    if (profileSkillsLower.has(keywordLower)) {
      directMatches.push(keyword);
      continue;
    }

    // Check for synonym match
    let foundSynonym = false;
    for (const [main, synonyms] of Object.entries(SKILL_SYNONYMS)) {
      if (
        keywordLower === main ||
        synonyms.includes(keywordLower) ||
        synonyms.some((s) => profileSkillsLower.has(s)) ||
        profileSkillsLower.has(main)
      ) {
        partialMatches.push(keyword);
        foundSynonym = true;
        break;
      }
    }

    if (!foundSynonym) {
      gaps.push(keyword);
    }
  }

  const totalKeywords = jobKeywords.length || 1;
  const score = Math.round(
    ((directMatches.length + partialMatches.length * 0.5) / totalKeywords) * 100
  );

  return { score: Math.min(100, score), directMatches, partialMatches, gaps };
}

/**
 * Calculate ATS compatibility score
 */
export function calculateATSScore(
  keywordMatchPct: number,
  hasSections: string[],
  wordCount: number
): {
  score: number;
  keywordCoverage: number;
  formatScore: number;
  sectionScore: number;
  lengthScore: number;
} {
  // Keyword coverage (40%)
  const keywordCoverage = keywordMatchPct;

  // Format score (20%) - simplified for mock
  const formatScore = 100;

  // Section score (20%)
  const requiredSections = ['experience', 'education', 'skills'];
  const missingRequired = requiredSections.filter((s) => !hasSections.includes(s.toLowerCase()));
  const sectionScore = Math.max(0, 100 - missingRequired.length * 20);

  // Length score (20%)
  let lengthScore = 100;
  if (wordCount < 400) {
    lengthScore = Math.max(0, 100 - Math.floor((400 - wordCount) / 10));
  } else if (wordCount > 800) {
    lengthScore = Math.max(0, 100 - Math.floor((wordCount - 800) / 10));
  }

  const score = Math.round(
    keywordCoverage * 0.4 + formatScore * 0.2 + sectionScore * 0.2 + lengthScore * 0.2
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    keywordCoverage,
    formatScore,
    sectionScore,
    lengthScore,
  };
}

/**
 * Calculate Recruiter Confidence Score
 */
export function calculateRecruiterScore(
  bullets: string[],
  avgSentenceLength: number
): {
  score: number;
  metricsScore: number;
  actionVerbScore: number;
  readabilityScore: number;
} {
  // Metrics score (40%) - count bullets with numbers/percentages
  const bulletsWithMetrics = bullets.filter((b) => /\d+%?/.test(b)).length;
  const metricsScore = Math.min(100, bulletsWithMetrics * 8);

  // Action verb score (30%)
  const bulletsWithActionVerbs = bullets.filter((b) => {
    const firstWord = b.trim().split(/\s+/)[0]?.toLowerCase() || '';
    return ACTION_VERBS.has(firstWord);
  }).length;
  const actionVerbScore = bullets.length > 0 
    ? Math.round((bulletsWithActionVerbs / bullets.length) * 100) 
    : 0;

  // Readability score (30%) - optimal sentence length is 15 words
  const readabilityScore = Math.max(0, 100 - Math.abs(avgSentenceLength - 15) * 2);

  const score = Math.round(
    metricsScore * 0.4 + actionVerbScore * 0.3 + readabilityScore * 0.3
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    metricsScore,
    actionVerbScore,
    readabilityScore,
  };
}

/**
 * Extract plain text from LaTeX content
 */
export function extractPlainText(latex: string): string {
  return latex
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1') // Extract content from commands
    .replace(/\\[a-zA-Z]+/g, '') // Remove standalone commands
    .replace(/[{}\\%]/g, '') // Remove LaTeX syntax
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Count words in LaTeX content
 */
export function countWords(latex: string): number {
  const plainText = extractPlainText(latex);
  return plainText.split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Extract bullet points from LaTeX content
 */
export function extractBullets(latex: string): string[] {
  const bulletRegex = /\\item\s+([^\\]+)/g;
  const bullets: string[] = [];
  let match;

  while ((match = bulletRegex.exec(latex)) !== null) {
    bullets.push(match[1].trim());
  }

  return bullets;
}

