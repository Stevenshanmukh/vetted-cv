import { z } from 'zod';

// Personal Info Schema
export const personalInfoSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  phone: z
    .string()
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
    .optional()
    .nullable(),
  location: z.string().max(200, 'Location must be less than 200 characters').optional().nullable(),
  linkedIn: z.string().url('Invalid LinkedIn URL').optional().nullable().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().nullable().or(z.literal('')),
});

// Summary Schema
export const summarySchema = z.object({
  summary: z
    .string()
    .min(50, 'Summary must be at least 50 characters')
    .max(500, 'Summary must be less than 500 characters'),
});

// Skill Schema
export const skillCategorySchema = z.object({
  categoryName: z.string().min(1, 'Category name is required').max(50),
  skills: z.array(z.string().min(1).max(50)).min(1, 'At least one skill is required'),
});

export const skillsSchema = z.object({
  skills: z.array(skillCategorySchema).min(1, 'At least one skill category is required'),
});

// Experience Schema
export const experienceSchema = z.object({
  title: z.string().min(2, 'Job title is required').max(100),
  company: z.string().min(2, 'Company name is required').max(100),
  location: z.string().max(100).optional().nullable(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional().nullable(),
  isCurrent: z.boolean().default(false),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be less than 5000 characters'),
  order: z.number().int().min(0).default(0),
});

export const experiencesSchema = z.object({
  experiences: z.array(experienceSchema).min(1, 'At least one experience is required'),
});

// Project Schema
export const projectSchema = z.object({
  name: z.string().min(2, 'Project name is required').max(100),
  description: z.string().min(10).max(2000),
  url: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  technologies: z.string().max(500).optional().nullable(),
  order: z.number().int().min(0).default(0),
});

export const projectsSchema = z.object({
  projects: z.array(projectSchema).optional(),
});

// Education Schema
export const educationSchema = z.object({
  institution: z.string().min(2, 'Institution name is required').max(150),
  degree: z.string().min(2, 'Degree is required').max(100),
  field: z.string().max(100).optional().nullable(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional().nullable(),
  gpa: z.string().max(10).optional().nullable(),
  order: z.number().int().min(0).default(0),
});

export const educationsSchema = z.object({
  educations: z.array(educationSchema).min(1, 'At least one education entry is required'),
});

// Certification Schema
export const certificationSchema = z.object({
  name: z.string().min(2, 'Certification name is required').max(150),
  issuer: z.string().min(2, 'Issuer is required').max(100),
  issueDate: z.string().or(z.date()),
  expiryDate: z.string().or(z.date()).optional().nullable(),
  credentialId: z.string().max(100).optional().nullable(),
  credentialUrl: z.string().url().optional().nullable().or(z.literal('')),
});

export const certificationsSchema = z.object({
  certifications: z.array(certificationSchema).optional(),
});

// Achievement Schema
export const achievementSchema = z.object({
  title: z.string().min(2, 'Achievement title is required').max(150),
  description: z.string().min(10).max(1000),
  date: z.string().or(z.date()).optional().nullable(),
});

export const achievementsSchema = z.object({
  achievements: z.array(achievementSchema).optional(),
});

// Full Profile Schema
export const profileInputSchema = z.object({
  personalInfo: personalInfoSchema.optional(),
  summary: z.string().min(50).max(500).optional(),
  skills: z.array(skillCategorySchema).optional(),
  experiences: z.array(experienceSchema).optional(),
  projects: z.array(projectSchema).optional(),
  educations: z.array(educationSchema).optional(),
  certifications: z.array(certificationSchema).optional(),
  achievements: z.array(achievementSchema).optional(),
});

// Job Description Schema
export const jobInputSchema = z.object({
  title: z.string().min(2, 'Job title is required').max(100),
  company: z.string().min(2, 'Company name is required').max(100),
  descriptionText: z
    .string()
    .min(100, 'Job description must be at least 100 characters')
    .max(10000, 'Job description must be less than 10000 characters'),
});

// Resume Strategy Schema
export const resumeStrategySchema = z.enum([
  'max_ats',
  'recruiter_readability',
  'career_switch',
  'promotion_internal',
  'stretch_role',
]);

// Resume Generate Schema
export const resumeGenerateSchema = z.object({
  jobDescriptionId: z.string().min(1, 'Job description ID is required'),
  strategy: resumeStrategySchema,
});

// Resume Score Schema
export const resumeScoreInputSchema = z.object({
  resumeId: z.string().min(1, 'Resume ID is required'),
});

// Application Status Schema
export const applicationStatusSchema = z.enum([
  'applied',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
]);

// Application Schema
export const applicationInputSchema = z.object({
  jobTitle: z.string().min(2, 'Job title is required').max(100),
  company: z.string().min(2, 'Company name is required').max(100),
  location: z.string().max(100).optional(),
  jobDescriptionId: z.string().optional(),
  resumeId: z.string().optional(),
  status: applicationStatusSchema.default('applied'),
  appliedDate: z.string().optional(),
  salary: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
  applicationUrl: z.string().url().optional().or(z.literal('')),
});

// Export types from schemas
export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type CertificationInput = z.infer<typeof certificationSchema>;
export type AchievementInput = z.infer<typeof achievementSchema>;
export type ProfileInput = z.infer<typeof profileInputSchema>;
export type JobInput = z.infer<typeof jobInputSchema>;
export type ResumeGenerateInput = z.infer<typeof resumeGenerateSchema>;
export type ApplicationInput = z.infer<typeof applicationInputSchema>;

