/**
 * Entity Types for Vetted CV
 * These types mirror the Prisma schema but are framework-agnostic
 */

// Profile & Personal Info
export interface PersonalInfo {
  id: string;
  profileId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  linkedIn?: string | null;
  website?: string | null;
}

export interface Profile {
  id: string;
  completenessPercent: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  personalInfo?: PersonalInfo | null;
  summary?: string | null;
  skills?: Skill[];
  experiences?: Experience[];
  projects?: Project[];
  educations?: Education[];
  certifications?: Certification[];
  achievements?: Achievement[];
}

// Skills
export interface SkillCategory {
  id: string;
  name: string;
  skills?: Skill[];
}

export interface Skill {
  id: string;
  name: string;
  categoryId: string;
  profileId: string;
  category?: SkillCategory;
}

// Experience
export interface Experience {
  id: string;
  title: string;
  company: string;
  location?: string | null;
  startDate: Date | string;
  endDate?: Date | string | null;
  isCurrent: boolean;
  description: string;
  profileId: string;
  order: number;
}

// Projects
export interface Project {
  id: string;
  name: string;
  description: string;
  url?: string | null;
  technologies?: string | null;
  profileId: string;
  order: number;
}

// Education
export interface Education {
  id: string;
  institution: string;
  degree: string;
  field?: string | null;
  startDate: Date | string;
  endDate?: Date | string | null;
  gpa?: string | null;
  profileId: string;
  order: number;
}

// Certifications
export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: Date | string;
  expiryDate?: Date | string | null;
  credentialId?: string | null;
  credentialUrl?: string | null;
  profileId: string;
}

// Achievements
export interface Achievement {
  id: string;
  title: string;
  description: string;
  date?: Date | string | null;
  profileId: string;
}

// Job Description & Analysis
export interface JobDescription {
  id: string;
  title: string;
  company: string;
  descriptionText: string;
  createdAt: Date | string;
  analysis?: JobAnalysis | null;
}

export interface ATSKeyword {
  keyword: string;
  weight: number;
  category: 'required' | 'preferred' | 'general';
}

export interface JobAnalysis {
  id: string;
  jobDescriptionId: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  atsKeywords: ATSKeyword[];
  experienceLevel?: string | null;
  createdAt: Date | string;
}

// Match Result
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

// Resume
export interface Resume {
  id: string;
  title: string;
  profileId: string;
  jobDescriptionId?: string | null;
  strategy: ResumeStrategy;
  latexContent: string;
  version: number;
  parentResumeId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  scores?: ResumeScore[];
  changes?: ResumeChange[];
}

export type ResumeStrategy =
  | 'max_ats'
  | 'recruiter_readability'
  | 'career_switch'
  | 'promotion_internal'
  | 'stretch_role';

export interface ResumeScore {
  id: string;
  resumeId: string;
  atsScore: number;
  recruiterScore: number;
  keywordMatchPct: number;
  formattingScore: number;
  readabilityScore: number;
  metricsScore: number;
  verbsScore: number;
  breakdown: ScoreBreakdown;
  missingKeywords: string[];
  recommendations: string[];
  scannedAt: Date | string;
}

export interface ScoreBreakdown {
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
}

export interface ResumeChange {
  id: string;
  resumeId: string;
  changeType: 'keyword_added' | 'bullet_rewritten' | 'section_reordered';
  description: string;
  before?: string | null;
  after?: string | null;
  createdAt: Date | string;
}

// Applications
export type ApplicationStatus = 'applied' | 'interview' | 'offer' | 'rejected' | 'withdrawn';

export interface Application {
  id: string;
  profileId: string;
  jobTitle: string;
  company: string;
  location?: string | null;
  jobDescriptionId?: string | null;
  resumeId?: string | null;
  status: ApplicationStatus;
  appliedDate?: Date | string | null;
  interviewDate?: Date | string | null;
  offerDate?: Date | string | null;
  rejectionDate?: Date | string | null;
  salary?: string | null;
  notes?: string | null;
  applicationUrl?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ApplicationStats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  recentActivity: {
    date: Date | string;
    application: Application;
    action: string;
  }[];
}

// Input Types for API
export interface ProfileInput {
  personalInfo?: Omit<PersonalInfo, 'id' | 'profileId'>;
  summary?: string;
  skills?: { categoryName: string; skills: string[] }[];
  experiences?: Omit<Experience, 'id' | 'profileId'>[];
  projects?: Omit<Project, 'id' | 'profileId'>[];
  educations?: Omit<Education, 'id' | 'profileId'>[];
  certifications?: Omit<Certification, 'id' | 'profileId'>[];
  achievements?: Omit<Achievement, 'id' | 'profileId'>[];
}

export interface JobInput {
  title: string;
  company: string;
  descriptionText: string;
}

export interface ResumeGenerateInput {
  jobDescriptionId: string;
  strategy: ResumeStrategy;
}

export interface ApplicationInput {
  jobTitle: string;
  company: string;
  location?: string;
  jobDescriptionId?: string;
  resumeId?: string;
  status?: ApplicationStatus;
  appliedDate?: string;
  salary?: string;
  notes?: string;
  applicationUrl?: string;
}

