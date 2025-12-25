# Vetted CV - Resume Intelligence Platform

A production-grade, single-user resume intelligence platform that analyzes job descriptions and generates ATS-optimized, recruiter-approved resumes with evidence-based scoring.

## Features

- **User Authentication** - Secure email/password registration and login
- **Profile Builder** - Comprehensive multi-step profile creation with skills, experience, education, and more
- **Job Description Analysis** - AI-powered extraction of keywords, requirements, and responsibilities using OpenAI GPT-4o-mini
- **Match Analysis** - See how your profile matches against job requirements
- **Resume Generation** - Create tailored resumes using 5 different strategies
- **ATS & Recruiter Scoring** - Get instant feedback on resume optimization with AI-powered analysis
- **Application Tracker** - Track your job applications across different stages with resume linking
- **Dark Mode** - Full dark mode support
- **Production Ready** - Security headers, rate limiting, error handling, logging, API documentation, and more

## Tech Stack

### Frontend
- Next.js 15 with App Router
- React 19
- TypeScript
- Tailwind CSS
- Radix UI primitives
- React Hook Form + Zod

### Backend
- Node.js + Express.js
- TypeScript
- Prisma ORM
- SQLite database (ready for PostgreSQL migration)
- Zod validation
- OpenAI API integration (GPT-4o-mini)
- JWT authentication
- Security middleware (Helmet, rate limiting, input sanitization)
- Comprehensive error handling and logging

### Shared
- TypeScript types and contracts
- Validation schemas
- Mock AI algorithms
- LaTeX templates

## Project Structure

```
vetted-cv/
├── frontend/          # Next.js application
│   ├── app/          # App Router pages
│   └── src/          # Components, hooks, services
├── backend/          # Express.js API
│   └── src/          # Routes, controllers, services
├── shared/           # Shared types and constants
│   ├── types/        # TypeScript types
│   ├── constants/    # Algorithms, templates
│   └── validators/   # Zod schemas
└── prisma/           # Database schema and migrations
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
```bash
cd vetted-cv
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables

Create a `.env` file in the root directory:
```bash
# Database
DATABASE_URL="file:./prisma/dev.db"

# JWT Secret (generate a random string)
JWT_SECRET="your-secret-key-here"

# OpenAI API Key (optional - will use mock AI if not provided)
OPENAI_API_KEY="your-openai-api-key-here"

# Server
PORT=3001
NODE_ENV=development
```

4. Generate Prisma client
```bash
npm run db:generate
```

5. Run database migrations
```bash
npm run db:migrate
```

6. Seed the database (optional)
```bash
npm run db:seed
```

7. Start development servers
```bash
npm run dev
```

### URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Prisma Studio: `npm run db:studio` (http://localhost:5555)

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run dev:frontend` | Start only the frontend |
| `npm run dev:backend` | Start only the backend |
| `npm run build` | Build all packages for production |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Type check TypeScript |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset database and re-seed |

## Resume Strategies

| Strategy | Use Case |
|----------|----------|
| **Max ATS** | Large companies with automated screening |
| **Recruiter Readability** | Human-first reviews |
| **Career Switch** | Changing industries |
| **Promotion / Internal** | Internal mobility |
| **Stretch Role** | Applying above your level |

## API Endpoints

### Profile
- `GET /api/profile` - Get user profile
- `POST /api/profile/save` - Save profile data
- `GET /api/profile/completeness` - Get profile completeness

### Job Analysis
- `POST /api/job/analyze` - Analyze job description
- `POST /api/job/match` - Match profile to job
- `GET /api/job/:id` - Get job by ID
- `GET /api/job` - Get job history

### Resume
- `POST /api/resume/generate` - Generate resume
- `POST /api/resume/score` - Score resume
- `GET /api/resume/history` - Get resume history
- `GET /api/resume/:id` - Get resume by ID
- `DELETE /api/resume/:id` - Delete resume
- `GET /api/resume/:id/download` - Download LaTeX

### Applications
- `GET /api/applications` - Get all applications
- `GET /api/applications/stats` - Get statistics
- `POST /api/applications` - Create application
- `PUT /api/applications/:id` - Update application
- `DELETE /api/applications/:id` - Delete application

## Scoring Algorithms

### ATS Score (0-100)
- Keyword Coverage: 40%
- Format Compliance: 20%
- Section Structure: 20%
- Length Optimization: 20%

### Recruiter Score (0-100)
- Quantified Metrics: 40%
- Action Verbs: 30%
- Readability: 30%

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Monitoring
- `GET /api/monitoring/health` - Health check endpoint
- `GET /api/monitoring/metrics` - Application metrics

### Backup
- `GET /api/backup/export` - Export database backup
- `POST /api/backup/import` - Import database backup

## Future Enhancements

- [ ] Social logins (Google, LinkedIn)
- [ ] Password reset functionality
- [ ] Cloud database migration (PostgreSQL)
- [ ] PDF export
- [ ] Resume comparison view
- [ ] Interview tracking
- [ ] Email notifications
- [ ] Resume templates
- [ ] Multi-language support

## Known Limitations

- SQLite database (ready for PostgreSQL migration)
- LaTeX output only (no direct PDF export)
- Single database instance (no multi-tenancy)

## License

MIT

---

**Version:** 1.0.0  
**Status:** Production Ready (Single-User)

