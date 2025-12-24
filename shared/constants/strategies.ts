import { ResumeStrategy } from '../types/entities';

export interface StrategyConfig {
  id: ResumeStrategy;
  name: string;
  description: string;
  useCase: string;
  sectionOrder: string[];
  keywordDensity: 'high' | 'medium' | 'low';
  emphasis: string[];
}

export const RESUME_STRATEGIES: Record<ResumeStrategy, StrategyConfig> = {
  max_ats: {
    id: 'max_ats',
    name: 'Max ATS',
    description: 'Maximize keyword matching for applicant tracking systems',
    useCase: 'When applying to large companies with automated screening',
    sectionOrder: ['skills', 'experience', 'education', 'projects', 'certifications'],
    keywordDensity: 'high',
    emphasis: ['exact JD keywords', 'skills section prominence', 'standard formatting'],
  },
  recruiter_readability: {
    id: 'recruiter_readability',
    name: 'Recruiter Readability',
    description: 'Optimized for human recruiters with clear, scannable format',
    useCase: 'When you know a human will review your resume first',
    sectionOrder: ['summary', 'experience', 'skills', 'education', 'projects'],
    keywordDensity: 'medium',
    emphasis: ['strong summary', 'clean bullet points', 'quantified achievements'],
  },
  career_switch: {
    id: 'career_switch',
    name: 'Career Switch',
    description: 'Emphasizes transferable skills and relevant projects',
    useCase: 'When transitioning to a new industry or role',
    sectionOrder: ['summary', 'skills', 'projects', 'experience', 'education'],
    keywordDensity: 'medium',
    emphasis: ['transferable skills', 'relevant projects', 'adaptability'],
  },
  promotion_internal: {
    id: 'promotion_internal',
    name: 'Promotion / Internal',
    description: 'Highlights growth trajectory and leadership',
    useCase: 'When applying for an internal promotion',
    sectionOrder: ['summary', 'achievements', 'experience', 'skills'],
    keywordDensity: 'low',
    emphasis: ['achievements', 'growth story', 'leadership examples'],
  },
  stretch_role: {
    id: 'stretch_role',
    name: 'Stretch Role',
    description: 'Emphasizes ambition and potential over exact experience',
    useCase: 'When applying for a role above your current level',
    sectionOrder: ['summary', 'projects', 'skills', 'experience'],
    keywordDensity: 'medium',
    emphasis: ['projects', 'leadership', 'impact at scale'],
  },
};

export const STRATEGY_LIST = Object.values(RESUME_STRATEGIES);

