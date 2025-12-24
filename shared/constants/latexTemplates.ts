import { ResumeStrategy } from '../types/entities';

/**
 * Base LaTeX template using moderncv
 */
export const BASE_TEMPLATE = `\\documentclass[11pt,a4paper]{moderncv}
\\moderncvstyle{banking}
\\moderncvcolor{blue}
\\usepackage[utf8]{inputenc}
\\usepackage[scale=0.75]{geometry}

\\name{%FIRSTNAME%}{%LASTNAME%}
\\title{%TITLE%}
\\address{%LOCATION%}{}{}
\\phone[mobile]{%PHONE%}
\\email{%EMAIL%}
%LINKEDIN%
%WEBSITE%

\\begin{document}
\\makecvtitle

%SECTIONS%

\\end{document}
`;

/**
 * Section templates
 */
export const SECTION_TEMPLATES = {
  summary: `\\section{Professional Summary}
%SUMMARY%
`,

  skills: `\\section{Skills}
%SKILLS%
`,

  experience: `\\section{Professional Experience}
%EXPERIENCES%
`,

  education: `\\section{Education}
%EDUCATION%
`,

  projects: `\\section{Projects}
%PROJECTS%
`,

  certifications: `\\section{Certifications}
%CERTIFICATIONS%
`,

  achievements: `\\section{Achievements}
%ACHIEVEMENTS%
`,
};

/**
 * Experience entry template
 */
export const EXPERIENCE_TEMPLATE = `\\cventry{%DATES%}{%TITLE%}{%COMPANY%}{%LOCATION%}{}{
\\begin{itemize}
%BULLETS%
\\end{itemize}
}
`;

/**
 * Education entry template
 */
export const EDUCATION_TEMPLATE = `\\cventry{%DATES%}{%DEGREE%}{%INSTITUTION%}{%LOCATION%}{%GPA%}{}
`;

/**
 * Project entry template
 */
export const PROJECT_TEMPLATE = `\\cvitem{%NAME%}{%DESCRIPTION%}
`;

/**
 * Certification entry template
 */
export const CERTIFICATION_TEMPLATE = `\\cvitem{%DATE%}{%NAME% -- %ISSUER%}
`;

/**
 * Achievement entry template
 */
export const ACHIEVEMENT_TEMPLATE = `\\cvitem{%DATE%}{%TITLE%: %DESCRIPTION%}
`;

/**
 * Section order by strategy
 */
export const SECTION_ORDER: Record<ResumeStrategy, string[]> = {
  max_ats: ['skills', 'experience', 'education', 'projects', 'certifications'],
  recruiter_readability: ['summary', 'experience', 'skills', 'education', 'projects'],
  career_switch: ['summary', 'skills', 'projects', 'experience', 'education'],
  promotion_internal: ['summary', 'achievements', 'experience', 'skills'],
  stretch_role: ['summary', 'projects', 'skills', 'experience'],
};

/**
 * Format a date range for LaTeX
 */
export function formatDateRange(
  startDate: Date | string,
  endDate?: Date | string | null,
  isCurrent?: boolean
): string {
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

/**
 * Escape special LaTeX characters
 */
export function escapeLatex(text: string): string {
  const specialChars: Record<string, string> = {
    '&': '\\&',
    '%': '\\%',
    '$': '\\$',
    '#': '\\#',
    '_': '\\_',
    '{': '\\{',
    '}': '\\}',
    '~': '\\textasciitilde{}',
    '^': '\\textasciicircum{}',
  };

  return text.replace(/[&%$#_{}~^]/g, (match) => specialChars[match] || match);
}

/**
 * Format skills for LaTeX
 */
export function formatSkills(
  skills: { categoryName: string; skills: string[] }[]
): string {
  return skills
    .map(
      (category) =>
        `\\cvitem{${escapeLatex(category.categoryName)}}{${category.skills.map(escapeLatex).join(', ')}}`
    )
    .join('\n');
}

/**
 * Format bullet points for experience
 */
export function formatBullets(description: string): string {
  const bullets = description
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      // Remove leading bullet characters
      const cleaned = line.replace(/^[•\-\*]\s*/, '');
      return `\\item ${escapeLatex(cleaned)}`;
    });

  return bullets.join('\n');
}

