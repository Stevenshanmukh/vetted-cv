export interface ProfileStep {
  id: number;
  key: string;
  title: string;
  description: string;
  required: boolean;
  fields: string[];
}

export const PROFILE_STEPS: ProfileStep[] = [
  {
    id: 1,
    key: 'personalInfo',
    title: 'Personal Info',
    description: 'Your basic contact information',
    required: true,
    fields: ['firstName', 'lastName', 'email', 'phone', 'location', 'linkedIn', 'website'],
  },
  {
    id: 2,
    key: 'summary',
    title: 'Professional Summary',
    description: 'A brief overview of your professional background',
    required: true,
    fields: ['summary'],
  },
  {
    id: 3,
    key: 'skills',
    title: 'Skills',
    description: 'Your technical and soft skills organized by category',
    required: true,
    fields: ['skills'],
  },
  {
    id: 4,
    key: 'experience',
    title: 'Work Experience',
    description: 'Your professional work history',
    required: true,
    fields: ['experiences'],
  },
  {
    id: 5,
    key: 'projects',
    title: 'Projects',
    description: 'Personal or professional projects that showcase your skills',
    required: false,
    fields: ['projects'],
  },
  {
    id: 6,
    key: 'education',
    title: 'Education',
    description: 'Your educational background',
    required: true,
    fields: ['educations'],
  },
  {
    id: 7,
    key: 'certifications',
    title: 'Certifications',
    description: 'Professional certifications and credentials',
    required: false,
    fields: ['certifications'],
  },
  {
    id: 8,
    key: 'achievements',
    title: 'Achievements',
    description: 'Notable accomplishments and awards',
    required: false,
    fields: ['achievements'],
  },
];

export const TOTAL_STEPS = PROFILE_STEPS.length;

export const REQUIRED_STEPS = PROFILE_STEPS.filter((step) => step.required);

/**
 * Calculate profile completeness percentage
 */
export function calculateCompleteness(profile: {
  personalInfo?: { firstName?: string; lastName?: string; email?: string } | null;
  summary?: string | null;
  skills?: unknown[];
  experiences?: unknown[];
  educations?: unknown[];
  projects?: unknown[];
  certifications?: unknown[];
  achievements?: unknown[];
}): { percent: number; missing: string[] } {
  const missing: string[] = [];
  let completedWeight = 0;
  let totalWeight = 0;

  // Required sections have higher weight
  const weights: Record<string, number> = {
    personalInfo: 20,
    summary: 15,
    skills: 20,
    experience: 25,
    education: 10,
    projects: 5,
    certifications: 3,
    achievements: 2,
  };

  // Check personal info
  totalWeight += weights.personalInfo;
  if (profile.personalInfo?.firstName && profile.personalInfo?.lastName && profile.personalInfo?.email) {
    completedWeight += weights.personalInfo;
  } else {
    missing.push('Personal Info');
  }

  // Check summary
  totalWeight += weights.summary;
  if (profile.summary && profile.summary.length >= 50) {
    completedWeight += weights.summary;
  } else {
    missing.push('Professional Summary');
  }

  // Check skills
  totalWeight += weights.skills;
  if (profile.skills && profile.skills.length > 0) {
    completedWeight += weights.skills;
  } else {
    missing.push('Skills');
  }

  // Check experience
  totalWeight += weights.experience;
  if (profile.experiences && profile.experiences.length > 0) {
    completedWeight += weights.experience;
  } else {
    missing.push('Work Experience');
  }

  // Check education
  totalWeight += weights.education;
  if (profile.educations && profile.educations.length > 0) {
    completedWeight += weights.education;
  } else {
    missing.push('Education');
  }

  // Optional sections (add weight only if filled)
  if (profile.projects && profile.projects.length > 0) {
    totalWeight += weights.projects;
    completedWeight += weights.projects;
  }

  if (profile.certifications && profile.certifications.length > 0) {
    totalWeight += weights.certifications;
    completedWeight += weights.certifications;
  }

  if (profile.achievements && profile.achievements.length > 0) {
    totalWeight += weights.achievements;
    completedWeight += weights.achievements;
  }

  const percent = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

  return { percent, missing };
}

