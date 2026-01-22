# AI Features Quick Reference

## Quick Access to AI Prompts & Configurations

### 1. Job Analysis Prompt
**File**: `backend/src/services/JobAnalysisService.ts` (lines 88-113)

**Key Settings**:
- Temperature: `0.3` (low for structured data)
- Max Tokens: `2000`
- Caching: `true`
- Response: JSON object

**Modify Prompt**: Edit the `prompt` variable in `performAIAnalysis()` method

---

### 2. Profile Matching Recommendations
**File**: `backend/src/services/MatchService.ts` (lines 215-231)

**Key Settings**:
- Temperature: `0.6` (medium for recommendations)
- Max Tokens: `400`
- Caching: `false` (profile-specific)
- Response: JSON array of strings

**Modify Prompt**: Edit the `prompt` variable in `generateAIRecommendations()` method

---

### 3. Resume Summary Optimization
**File**: `backend/src/services/ResumeGeneratorService.ts` (lines 204-212)

**Key Settings**:
- Temperature: `0.7` (higher for creative rewriting)
- Max Tokens: `200`
- Caching: `false` (job-specific)
- Response: Plain text summary

**Modify Prompt**: Edit the `summaryPrompt` variable in `generateLatexWithAI()` method

---

### 4. Resume Experience Optimization
**File**: `backend/src/services/ResumeGeneratorService.ts` (lines 231-240)

**Key Settings**:
- Temperature: `0.7`
- Max Tokens: `300`
- Caching: `false` (job-specific)
- Response: Plain text bullet points

**Modify Prompt**: Edit the `expPrompt` variable in `generateLatexWithAI()` method

---

### 5. Resume Scoring Recommendations
**File**: `backend/src/services/ATSScorerService.ts` (lines 289-305)

**Key Settings**:
- Temperature: `0.5` (balanced)
- Max Tokens: `300`
- Caching: `false` (score-specific)
- Response: JSON array of strings

**Modify Prompt**: Edit the `prompt` variable in `generateRecommendations()` method

---

## OpenAI Service Configuration

**File**: `backend/src/services/OpenAIService.ts`

### Model Selection
```typescript
const MODEL = 'gpt-4o-mini'; // Line 4
```

### Cost Tracking
```typescript
const INPUT_COST_PER_1K = 0.15 / 1000;   // Line 39
const OUTPUT_COST_PER_1K = 0.60 / 1000;  // Line 40
```

### Cache Settings
```typescript
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days (Line 32)
const MAX_CACHE_ENTRIES = 1000; // Line 80
```

---

## How to Modify Prompts

### Example: Update Job Analysis Prompt

1. Open `backend/src/services/JobAnalysisService.ts`
2. Find `performAIAnalysis()` method (line 87)
3. Modify the `prompt` variable (lines 88-113)
4. Adjust `temperature` or `maxTokens` if needed (lines 119-120)

### Example: Add New AI Feature

1. Create a new method in the appropriate service
2. Use `openAIService.call()` for text or `openAIService.callJSON<T>()` for structured data
3. Configure options:
   ```typescript
   const result = await openAIService.callJSON<YourType>(prompt, {
     systemPrompt: 'Your system prompt',
     temperature: 0.7,
     maxTokens: 2000,
     useCache: true,
   });
   ```
4. Add fallback logic for when AI fails

---

## Testing AI Features

### Enable Mock Mode
Remove or don't set `OPENAI_API_KEY` environment variable. All services will use fallback logic.

### Monitor API Usage
```typescript
import { openAIService } from './services/OpenAIService';

const stats = openAIService.getStats();
console.log('Total tokens:', stats.totalTokensUsed);
console.log('Total cost:', stats.totalCost);
console.log('Cache size:', stats.cacheSize);
```

### Clear Cache
```typescript
openAIService.clearCache();
```

---

## Common Patterns

### Pattern 1: Structured Data Extraction
```typescript
const result = await openAIService.callJSON<DataType>(prompt, {
  systemPrompt: 'You are an expert...',
  temperature: 0.3,  // Low for structured data
  maxTokens: 2000,
  useCache: true,
});
```

### Pattern 2: Creative Generation
```typescript
const result = await openAIService.call(prompt, {
  temperature: 0.7,  // Higher for creativity
  maxTokens: 500,
  useCache: false,   // Don't cache unique content
});
```

### Pattern 3: Recommendations
```typescript
const result = await openAIService.callJSON<string[]>(prompt, {
  temperature: 0.5,  // Balanced
  maxTokens: 300,
  useCache: false,   // Context-specific
});
```

---

## Error Handling Pattern

```typescript
try {
  const aiResult = await openAIService.callJSON<ResultType>(prompt, options);
  return aiResult;
} catch (error) {
  console.warn('AI call failed, using fallback:', error);
  return fallbackLogic(); // Always have a fallback
}
```

---

## Environment Variables

```bash
# Required for AI features
OPENAI_API_KEY=sk-your-key-here

# Optional: Disable caching
OPENAI_CACHE_ENABLED=false
```

---

## Cost Estimation

### Per Request Costs (approximate)
- Job Analysis: $0.001-0.002 (cached after first)
- Resume Summary: $0.0005
- Resume Experience (per role): $0.001
- Resume Recommendations: $0.001
- Profile Match Recommendations: $0.001

### Monthly Estimate (100 users, 10 resumes each)
- Job Analyses: ~$10 (cached)
- Resume Generations: ~$50
- Scoring: ~$10
- **Total**: ~$70/month

---

## Best Practices

1. **Always provide fallbacks** - Don't rely solely on AI
2. **Cache aggressively** - Use caching for repeatable analyses
3. **Limit tokens** - Set appropriate maxTokens to control costs
4. **Validate responses** - Check AI output before using
5. **Monitor costs** - Track usage via `getStats()`
6. **Use appropriate temperature** - Lower for structured data, higher for creative
7. **Handle errors gracefully** - Log errors but don't break user flow

---

## Troubleshooting

### AI calls failing
1. Check `OPENAI_API_KEY` is set
2. Check API key is valid and has credits
3. Check rate limits (429 errors)
4. Review error logs in console

### Responses not as expected
1. Adjust `temperature` (lower = more deterministic)
2. Improve prompt clarity and structure
3. Add examples to prompt
4. Increase `maxTokens` if responses are cut off

### High costs
1. Enable caching (`useCache: true`)
2. Reduce `maxTokens` limits
3. Consider using cheaper model
4. Cache more aggressively

---

## Files to Modify

| Feature | File | Method |
|---------|------|--------|
| Job Analysis | `JobAnalysisService.ts` | `performAIAnalysis()` |
| Profile Matching | `MatchService.ts` | `generateAIRecommendations()` |
| Resume Summary | `ResumeGeneratorService.ts` | `generateLatexWithAI()` |
| Resume Experience | `ResumeGeneratorService.ts` | `generateLatexWithAI()` |
| Resume Scoring | `ATSScorerService.ts` | `generateRecommendations()` |
| Base Service | `OpenAIService.ts` | `call()`, `callJSON()` |

---

## Quick Commands

```bash
# Check if API key is set
echo $OPENAI_API_KEY

# Run with AI disabled (uses fallbacks)
unset OPENAI_API_KEY
npm run dev

# Monitor API calls in logs
npm run dev | grep "OpenAI"
```