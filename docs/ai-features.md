# AI Features Documentation

## Overview
This document outlines all AI-powered features, API calls, prompts, and configurations used in the Vetted CV application.

## AI Service Configuration

### Model & Settings
- **Model**: `gpt-4o-mini` (cost-effective model)
- **Default Temperature**: `0.7` (varies by use case)
- **Default Max Tokens**: `2000` (varies by use case)
- **Caching**: Enabled by default (7-day TTL, in-memory cache)

### Cost Tracking
- **Input Cost**: $0.15 per 1M tokens
- **Output Cost**: $0.60 per 1M tokens
- Total tokens and costs are tracked per session

### API Client
- **Service**: OpenAI Chat Completions API
- **Initialization**: Lazy (only when `OPENAI_API_KEY` is set)
- **Error Handling**: Rate limit detection, fallback to mock/rule-based logic

---

## AI Features

### 1. Job Description Analysis
**Service**: `JobAnalysisService`  
**Endpoint**: `POST /api/job/analyze`

#### Purpose
Extracts structured information from job postings for ATS optimization.

#### API Call
```typescript
openAIService.callJSON<AnalysisResult>(prompt, {
  systemPrompt,
  temperature: 0.3,
  maxTokens: 2000,
  useCache: true,
})
```

#### Prompt Structure
```
Analyze this job posting and extract structured information.

Job Title: {title}

Job Description:
{descriptionText}

Extract and return a JSON object with this exact structure:
{
  "requiredSkills": ["skill1", "skill2", ...],  // Technical skills explicitly marked as required/must have
  "preferredSkills": ["skill1", "skill2", ...],  // Skills marked as nice-to-have/preferred/bonus
  "responsibilities": ["responsibility 1", "responsibility 2", ...],  // Key job responsibilities (3-8 items)
  "atsKeywords": [
    {"keyword": "keyword1", "weight": 10, "category": "required"},
    {"keyword": "keyword2", "weight": 7, "category": "preferred"},
    {"keyword": "keyword3", "weight": 5, "category": "general"}
  ],  // Top 20 ATS keywords with weights (10=critical, 5=important, 1=mentioned)
  "experienceLevel": "Junior" | "Mid-Level" | "Senior" | null  // Based on years/level mentioned
}

Focus on:
- Technical skills, tools, frameworks, languages
- Years of experience mentioned
- Required vs preferred qualifications
- Key action verbs and responsibilities
- Industry-specific terms
```

#### System Prompt
```
You are an expert job description analyzer. Extract structured data from job postings for ATS (Applicant Tracking System) optimization. Be precise and focus on technical skills, tools, and qualifications.
```

#### Response Format
```typescript
{
  requiredSkills: string[];      // Max 15 items
  preferredSkills: string[];      // Max 15 items
  responsibilities: string[];     // Max 8 items
  atsKeywords: ATSKeyword[];      // Max 20 items with weight & category
  experienceLevel: string | null; // "Junior" | "Mid-Level" | "Senior"
}
```

#### Fallback
If AI fails, uses mock analysis with keyword extraction, skill categorization, and experience level detection.

---

### 2. Profile-to-Job Matching
**Service**: `MatchService`  
**Endpoint**: `POST /api/job/match`

#### Purpose
Matches user profile against job requirements and provides recommendations.

#### API Call
```typescript
openAIService.callJSON<string[]>(prompt, {
  temperature: 0.6,
  maxTokens: 400,
  useCache: false,
})
```

#### Prompt Structure
```
Analyze the match between a candidate profile and job requirements, then provide 3-5 specific, actionable recommendations.

Match Statistics:
- Direct Matches: {directMatchCount}/{totalKeywords}
- Missing Keywords: {gaps.length}
- Top Missing: {topMissingKeywords}

Profile Summary (first 300 words):
{profileText}

Provide concise recommendations focusing on:
1. How to bridge skill gaps
2. Ways to highlight transferable skills
3. Keywords to naturally incorporate
4. Experience framing strategies

Return as JSON array: ["recommendation 1", "recommendation 2", ...]
```

#### Response Format
```typescript
string[] // Array of 3-5 recommendation strings
```

#### Fallback
Rule-based recommendations based on match percentage and missing keywords.

---

### 3. Resume Generation (AI-Enhanced)
**Service**: `ResumeGeneratorService`  
**Endpoint**: `POST /api/resume/generate`

#### Purpose
Generates optimized resume content using AI to enhance summary and experience descriptions.

#### API Calls

##### 3a. Summary Optimization
```typescript
openAIService.call(summaryPrompt, {
  temperature: 0.7,
  maxTokens: 200,
  useCache: false, // Job-specific, don't cache
})
```

**Prompt**:
```
Rewrite this professional summary to be more ATS-friendly and aligned with the job requirements. Keep it concise (2-3 sentences), include relevant keywords naturally, and maintain authenticity.

Original Summary:
{profile.summary}

Target Job: {jobDescription.title}
Key Keywords to incorporate: {top10Keywords}

Return only the rewritten summary, no explanations.
```

##### 3b. Experience Description Optimization
```typescript
openAIService.call(expPrompt, {
  temperature: 0.7,
  maxTokens: 300,
  useCache: false, // Job-specific, don't cache
})
```

**Prompt** (per experience):
```
Rewrite these job responsibilities to be more ATS-friendly and impactful. Use action verbs, include metrics/numbers where possible, and naturally incorporate relevant keywords. Keep 3-5 bullet points.

Job Title: {exp.title}
Company: {exp.company}
Original Description:
{exp.description}

Target Job Keywords: {top8Keywords}

Return only the rewritten bullet points, one per line, starting with action verbs.
```

#### Strategy-Based Section Ordering
Different resume strategies prioritize different sections:
- **max_ats**: `['skills', 'experience', 'education', 'projects', 'certifications']`
- **recruiter_readability**: `['summary', 'experience', 'skills', 'education', 'projects']`
- **career_switch**: `['summary', 'skills', 'projects', 'experience', 'education']`
- **promotion_internal**: `['summary', 'achievements', 'experience', 'skills']`
- **stretch_role**: `['summary', 'projects', 'skills', 'experience']`

#### Fallback
If AI optimization fails, uses template-based LaTeX generation with original content.

---

### 4. Resume Scoring & Recommendations
**Service**: `ATSScorerService`  
**Endpoint**: `POST /api/resume/score`

#### Purpose
Scores resumes for ATS compatibility and recruiter appeal, then provides AI-powered recommendations.

#### API Call
```typescript
openAIService.callJSON<string[]>(prompt, {
  temperature: 0.5,
  maxTokens: 300,
  useCache: false, // Score-specific, don't cache
})
```

#### Prompt Structure
```
Analyze this resume and provide 3-5 specific, actionable recommendations to improve ATS score and recruiter appeal.

Resume Score: ATS {atsScore}/100, Recruiter {recruiterScore}/100
Missing Keywords: {top10MissingKeywords}
Metrics Score: {metricsScore}/100
Action Verb Score: {actionVerbScore}/100

Resume Content (first 500 words):
{resumeText}

Provide concise, actionable recommendations (one sentence each). Focus on:
1. How to naturally incorporate missing keywords
2. Improving quantifiable achievements
3. Strengthening action verbs
4. Overall optimization tips

Return as JSON array: ["recommendation 1", "recommendation 2", ...]
```

#### Scoring Algorithm

**ATS Score (0-100)**:
- Keyword Coverage: 40%
- Format Compliance: 20%
- Section Structure: 20%
- Length Optimization: 20%

**Recruiter Score (0-100)**:
- Quantified Metrics: 40%
- Action Verbs: 30%
- Readability: 30%

#### Response Format
```typescript
{
  atsScore: number;
  recruiterScore: number;
  keywordMatchPct: number;
  formattingScore: number;
  readabilityScore: number;
  metricsScore: number;
  verbsScore: number;
  breakdown: {
    ats: { keywordCoverage, formatScore, sectionScore, lengthScore };
    recruiter: { metricsScore, actionVerbScore, readabilityScore };
  };
  missingKeywords: string[];
  recommendations: string[];
}
```

#### Fallback
Rule-based recommendations based on scores and missing keywords.

---

## Error Handling & Fallbacks

### Error Types
1. **API Key Not Configured**: Throws error, services fall back to mock/rule-based logic
2. **Rate Limit (429)**: Throws specific error message, user can retry
3. **API Error**: Logs error, falls back to mock/rule-based logic
4. **Invalid JSON Response**: Logs error, throws parsing error

### Fallback Strategy
All AI features have fallback mechanisms:
- **Job Analysis**: Mock keyword extraction and categorization
- **Profile Matching**: Rule-based recommendations
- **Resume Generation**: Template-based LaTeX without AI optimization
- **Resume Scoring**: Rule-based recommendations

---

## Caching Strategy

### Cache Configuration
- **TTL**: 7 days
- **Storage**: In-memory Map (max 1000 entries)
- **Key Generation**: SHA-256 hash of prompt + systemPrompt

### Caching Rules
- **Cached**: Job analyses (same job description = same analysis)
- **Not Cached**: 
  - Resume summaries (job-specific)
  - Experience descriptions (job-specific)
  - Resume recommendations (score-specific)
  - Match recommendations (profile-specific)

---

## API Usage Patterns

### Temperature Settings
- **Low (0.3)**: Structured data extraction (job analysis)
- **Medium (0.5-0.6)**: Recommendations (scoring, matching)
- **High (0.7)**: Creative rewriting (resume generation)

### Token Limits
- **Job Analysis**: 2000 tokens (large input, structured output)
- **Recommendations**: 300-400 tokens (concise, actionable)
- **Resume Optimization**: 200-300 tokens per section (focused rewrites)

---

## Cost Optimization

### Strategies
1. **Model Choice**: Using `gpt-4o-mini` instead of `gpt-4` (10x cheaper)
2. **Caching**: Aggressive caching for repeatable analyses
3. **Token Limits**: Conservative max tokens to prevent over-generation
4. **Selective AI**: Only use AI where it adds value (fallback to rules)

### Estimated Costs (per request)
- **Job Analysis**: ~$0.001-0.002 (cached after first call)
- **Resume Generation**: ~$0.002-0.005 (3-4 AI calls per resume)
- **Resume Scoring**: ~$0.001 (recommendations only)
- **Profile Matching**: ~$0.001 (recommendations only)

---

## Future Enhancements

### Potential Improvements
1. **Streaming Responses**: For long resume generations
2. **Redis Cache**: Replace in-memory cache for production
3. **Prompt Templates**: Externalize prompts for easier iteration
4. **A/B Testing**: Compare different prompt strategies
5. **Cost Analytics**: Dashboard for tracking API usage
6. **Multi-Model Support**: Fallback to cheaper models if primary fails

---

## Environment Variables

```bash
OPENAI_API_KEY=sk-...           # Required for AI features
OPENAI_CACHE_ENABLED=true       # Default: true
NODE_ENV=development|production # Affects error handling
```

---

## Testing & Debugging

### Logging
- All AI calls log errors to console
- Failed AI calls fall back gracefully
- Cache hits/misses can be monitored via `openAIService.getStats()`

### Mock Mode
- If `OPENAI_API_KEY` is not set, all services use fallback logic
- Allows development/testing without API costs
- Mock responses are deterministic and predictable

---

## Security Considerations

1. **API Key**: Stored in environment variables, never in code
2. **Input Sanitization**: All user inputs are validated before sending to AI
3. **Rate Limiting**: Backend rate limiting prevents abuse
4. **Error Messages**: Generic error messages prevent API key leakage
5. **Cache Isolation**: Cache keys include full prompt context

---

## Summary

The application uses AI strategically in 4 main areas:
1. **Job Analysis**: Extract structured data from job postings
2. **Profile Matching**: Provide personalized recommendations
3. **Resume Generation**: Optimize content for ATS and recruiters
4. **Resume Scoring**: Provide actionable improvement suggestions

All features include robust error handling, fallback mechanisms, and cost optimization strategies.


