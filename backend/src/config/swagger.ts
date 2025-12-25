import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vetted CV API',
      version: '2.0.0',
      description: 'Resume Intelligence Platform API - ATS-optimized resume generation and analysis',
      contact: {
        name: 'Vetted CV Support',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'object' },
              },
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                requestId: { type: 'string' },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
          },
        },
        Profile: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            completenessPercent: { type: 'number' },
            personalInfo: { $ref: '#/components/schemas/PersonalInfo' },
            summary: { type: 'string' },
            skills: { type: 'array', items: { $ref: '#/components/schemas/Skill' } },
            experiences: { type: 'array', items: { $ref: '#/components/schemas/Experience' } },
          },
        },
        PersonalInfo: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            location: { type: 'string' },
            linkedIn: { type: 'string' },
            website: { type: 'string' },
          },
        },
        Skill: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            category: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } },
          },
        },
        Experience: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            company: { type: 'string' },
            location: { type: 'string' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            isCurrent: { type: 'boolean' },
            description: { type: 'string' },
          },
        },
        JobDescription: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            company: { type: 'string' },
            descriptionText: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            analysis: { $ref: '#/components/schemas/JobAnalysis' },
          },
        },
        JobAnalysis: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            requiredSkills: { type: 'array', items: { type: 'string' } },
            preferredSkills: { type: 'array', items: { type: 'string' } },
            responsibilities: { type: 'array', items: { type: 'string' } },
            atsKeywords: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  keyword: { type: 'string' },
                  weight: { type: 'number' },
                  category: { type: 'string', enum: ['required', 'preferred', 'general'] },
                },
              },
            },
            experienceLevel: { type: 'string' },
          },
        },
        Resume: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            strategy: { type: 'string', enum: ['max_ats', 'recruiter_readability', 'career_switch', 'promotion_internal', 'stretch_role'] },
            latexContent: { type: 'string' },
            version: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ResumeScore: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            atsScore: { type: 'number' },
            recruiterScore: { type: 'number' },
            keywordMatchPct: { type: 'number' },
            breakdown: { type: 'object' },
            missingKeywords: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } },
          },
        },
        Application: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            jobTitle: { type: 'string' },
            company: { type: 'string' },
            location: { type: 'string' },
            status: { type: 'string', enum: ['applied', 'interview', 'offer', 'rejected', 'withdrawn'] },
            appliedDate: { type: 'string', format: 'date-time' },
            resumeId: { type: 'string' },
          },
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to the API files
};

export const swaggerSpec = swaggerJsdoc(options);

