/**
 * API Service Layer
 * All API calls go through this service - no raw fetch in components
 */

// Types from shared package (simplified for frontend)
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a timeout promise that rejects after specified time
 */
function createTimeout(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
  });
}

/**
 * Base fetch function with error handling, retry logic, and timeout
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
  retryCount = 0
): Promise<ApiResponse<T>> {
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await Promise.race([
        fetch(`${API_BASE}${endpoint}`, {
          ...options,
          signal: controller.signal,
          credentials: 'include', // Include cookies for auth
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
        }),
        createTimeout(REQUEST_TIMEOUT),
      ]);

      clearTimeout(timeoutId);

      // Check if response is ok
      if (!response.ok) {
        // Retry on server errors (5xx) or network errors
        if ((response.status >= 500 || response.status === 0) && retryCount < MAX_RETRIES) {
          await sleep(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
          return fetchApi<T>(endpoint, options, retryCount + 1);
        }

        // Try to parse error response
        try {
          const errorData = await response.json();
          
          // Handle different error response formats
          if (errorData.error) {
            return {
              success: false,
              error: {
                code: errorData.error.code || `HTTP_${response.status}`,
                message: errorData.error.message || errorData.error.code || `Server error: ${response.status}`,
                details: errorData.error.details,
              },
            };
          } else if (errorData.message) {
            // Some APIs return error message directly
            return {
              success: false,
              error: {
                code: `HTTP_${response.status}`,
                message: errorData.message,
              },
            };
          } else {
            // Fallback for unexpected error format
            return {
              success: false,
              error: {
                code: `HTTP_${response.status}`,
                message: `Server error: ${response.status} ${response.statusText}`,
              },
            };
          }
        } catch {
          return {
            success: false,
            error: {
              code: `HTTP_${response.status}`,
              message: `Server error: ${response.status} ${response.statusText}`,
            },
          };
        }
      }

      const data = await response.json();
      
      // Validate response structure
      if (data && typeof data === 'object') {
        // Ensure error object has proper structure if present
        if (data.success === false && data.error && typeof data.error === 'object') {
          if (Object.keys(data.error).length === 0) {
            // Empty error object - this shouldn't happen, but handle it gracefully
            console.warn('API returned empty error object:', data);
            data.error = {
              code: 'UNKNOWN_ERROR',
              message: 'An unknown error occurred',
            };
          }
        }
      }
      
      return data;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Retry on network errors or aborted requests
      if (
        (fetchError.name === 'AbortError' || 
         fetchError.message === 'Request timeout' ||
         fetchError.message?.includes('Failed to fetch') ||
         fetchError.message?.includes('NetworkError')) &&
        retryCount < MAX_RETRIES
      ) {
        await sleep(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
        return fetchApi<T>(endpoint, options, retryCount + 1);
      }

      throw fetchError;
    }
  } catch (error: any) {
    console.error(`API Error [${endpoint}] (attempt ${retryCount + 1}):`, error);
    
    // Final error after all retries
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message?.includes('timeout')
          ? 'Request timed out. Please check your connection and try again.'
          : 'Failed to connect to server. Please check your internet connection and try again.',
      },
    };
  }
}

// Profile Types
export interface PersonalInfo {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  linkedIn?: string | null;
  website?: string | null;
}

export interface Skill {
  id: string;
  name: string;
  category: { id: string; name: string };
}

export interface Experience {
  id?: string;
  title: string;
  company: string;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
  description: string;
  order?: number;
}

export interface Project {
  id?: string;
  name: string;
  description: string;
  url?: string | null;
  technologies?: string | null;
  order?: number;
}

export interface Education {
  id?: string;
  institution: string;
  degree: string;
  field?: string | null;
  startDate: string;
  endDate?: string | null;
  gpa?: string | null;
  order?: number;
}

export interface Certification {
  id?: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string | null;
  credentialId?: string | null;
  credentialUrl?: string | null;
}

export interface Achievement {
  id?: string;
  title: string;
  description: string;
  date?: string | null;
}

export interface Profile {
  id: string;
  completenessPercent: number;
  personalInfo?: PersonalInfo | null;
  summary?: string | null;
  skills: Skill[];
  experiences: Experience[];
  projects: Project[];
  educations: Education[];
  certifications: Certification[];
  achievements: Achievement[];
  createdAt: string;
  updatedAt: string;
}

export interface ProfileInput {
  personalInfo?: Omit<PersonalInfo, 'id'>;
  summary?: string;
  skills?: { categoryName: string; skills: string[] }[];
  experiences?: Omit<Experience, 'id'>[];
  projects?: Omit<Project, 'id'>[];
  educations?: Omit<Education, 'id'>[];
  certifications?: Omit<Certification, 'id'>[];
  achievements?: Omit<Achievement, 'id'>[];
}

// Job Types
export interface ATSKeyword {
  keyword: string;
  weight: number;
  category: 'required' | 'preferred' | 'general';
}

export interface JobAnalysis {
  id: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  atsKeywords: ATSKeyword[];
  experienceLevel?: string | null;
}

export interface JobDescription {
  id: string;
  title: string;
  company: string;
  descriptionText: string;
  createdAt: string;
  analysis?: JobAnalysis | null;
}

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

// Resume Types
export type ResumeStrategy = 
  | 'max_ats'
  | 'recruiter_readability'
  | 'career_switch'
  | 'promotion_internal'
  | 'stretch_role';

export interface ResumeScore {
  id: string;
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
  scannedAt: string;
}

export interface Resume {
  id: string;
  title: string;
  strategy: ResumeStrategy;
  latexContent: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  jobDescription?: JobDescription | null;
  scores?: ResumeScore[];
}

// Application Types
export type ApplicationStatus = 'applied' | 'interview' | 'offer' | 'rejected' | 'withdrawn';

export interface Application {
  id: string;
  jobTitle: string;
  company: string;
  location?: string | null;
  status: ApplicationStatus;
  appliedDate?: string | null;
  interviewDate?: string | null;
  offerDate?: string | null;
  rejectionDate?: string | null;
  salary?: string | null;
  notes?: string | null;
  applicationUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  jobDescription?: JobDescription | null;
  resume?: Resume | null;
}

export interface ApplicationStats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  recentActivity: {
    date: string;
    application: Application;
    action: string;
  }[];
}

export interface ApplicationInput {
  company: string;
  jobTitle: string;
  location?: string;
  appliedDate: string; // Required - ISO date string
  resumeId: string; // Required - must select a resume
  jobDescriptionId?: string;
  status?: ApplicationStatus;
  salary?: string;
  notes?: string;
}

/**
 * API Client
 */
export const api = {
  // Profile
  profile: {
    get: () => fetchApi<Profile>('/profile'),
    save: (data: ProfileInput) =>
      fetchApi<Profile>('/profile/save', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getCompleteness: () =>
      fetchApi<{ percent: number; missing: string[] }>('/profile/completeness'),
  },

  // Job Analysis
  job: {
    analyze: (data: { title: string; company: string; descriptionText: string }) =>
      fetchApi<JobDescription>('/job/analyze', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    match: (jobDescriptionId: string) =>
      fetchApi<MatchResult>('/job/match', {
        method: 'POST',
        body: JSON.stringify({ jobDescriptionId }),
      }),
    get: (id: string) => fetchApi<JobDescription>(`/job/${id}`),
    getHistory: () => fetchApi<JobDescription[]>('/job'),
  },

  // Resume
  resume: {
    generate: (data: { jobDescriptionId: string; strategy: ResumeStrategy }) =>
      fetchApi<Resume>('/resume/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    score: (resumeId: string) =>
      fetchApi<ResumeScore>('/resume/score', {
        method: 'POST',
        body: JSON.stringify({ resumeId }),
      }),
    get: (id: string) => fetchApi<Resume>(`/resume/${id}`),
    getHistory: () => fetchApi<Resume[]>('/resume/history'),
    delete: (id: string) =>
      fetchApi<void>(`/resume/${id}`, { method: 'DELETE' }),
    getDownloadUrl: (id: string) => `${API_BASE}/resume/${id}/download`,
  },

  // Applications
  applications: {
    getAll: (status?: ApplicationStatus) => {
      const params = status ? `?status=${status}` : '';
      return fetchApi<Application[]>(`/applications${params}`);
    },
    getStats: () => fetchApi<ApplicationStats>('/applications/stats'),
    create: (data: ApplicationInput) =>
      fetchApi<Application>('/applications', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<ApplicationInput>) =>
      fetchApi<Application>(`/applications/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchApi<void>(`/applications/${id}`, { method: 'DELETE' }),
  },
};

