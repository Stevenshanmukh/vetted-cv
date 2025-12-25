import OpenAI from 'openai';
import crypto from 'crypto';

const MODEL = 'gpt-4o-mini'; // Cost-effective model
const USE_CACHE = process.env.OPENAI_CACHE_ENABLED !== 'false'; // Default: enabled

// Lazy initialization of OpenAI client (only when API key is available)
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  return openai;
}

// In-memory cache (in production, use Redis or database)
interface CacheEntry {
  response: any;
  timestamp: number;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// Cost tracking
let totalTokensUsed = 0;
let totalCost = 0;

// GPT-4o-mini pricing (as of 2024)
const INPUT_COST_PER_1K = 0.15 / 1000; // $0.15 per 1M tokens
const OUTPUT_COST_PER_1K = 0.60 / 1000; // $0.60 per 1M tokens

/**
 * Generate cache key from content
 */
function generateCacheKey(prompt: string, systemPrompt?: string): string {
  const content = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Get cached response if available
 */
function getCached(key: string): any | null {
  if (!USE_CACHE) return null;

  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.response;
}

/**
 * Cache a response
 */
function setCache(key: string, response: any): void {
  if (!USE_CACHE) return;

  cache.set(key, {
    response,
    timestamp: Date.now(),
    expiresAt: Date.now() + CACHE_TTL,
  });

  // Clean old entries (keep cache under 1000 entries)
  if (cache.size > 1000) {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toDelete = entries.slice(0, entries.length - 1000);
    toDelete.forEach(([key]) => cache.delete(key));
  }
}

/**
 * Calculate cost from usage
 */
function calculateCost(usage: { prompt_tokens: number; completion_tokens: number }): number {
  const inputCost = (usage.prompt_tokens / 1000) * INPUT_COST_PER_1K;
  const outputCost = (usage.completion_tokens / 1000) * OUTPUT_COST_PER_1K;
  return inputCost + outputCost;
}

export interface AICallOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  useCache?: boolean;
}

export class OpenAIService {
  /**
   * Call OpenAI API with caching and error handling
   */
  async call(
    prompt: string,
    options: AICallOptions = {}
  ): Promise<{ content: string; usage?: { prompt_tokens: number; completion_tokens: number } }> {
    const {
      systemPrompt,
      temperature = 0.7,
      maxTokens = 2000,
      useCache = true,
    } = options;

    // Check cache
    if (useCache) {
      const cacheKey = generateCacheKey(prompt, systemPrompt);
      const cached = getCached(cacheKey);
      if (cached) {
        return { content: cached };
      }
    }

    // Check if API key is configured
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }

      messages.push({ role: 'user', content: prompt });

      const completion = await client.chat.completions.create({
        model: MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
      });

      const content = completion.choices[0]?.message?.content || '';
      const usage = completion.usage;

      // Track costs
      if (usage) {
        totalTokensUsed += usage.total_tokens;
        const cost = calculateCost(usage);
        totalCost += cost;
      }

      // Cache response
      if (useCache && content) {
        const cacheKey = generateCacheKey(prompt, systemPrompt);
        setCache(cacheKey, content);
      }

      return { content, usage };
    } catch (error: any) {
      console.error('OpenAI API error:', error.message);
      
      // Rate limit or API error - throw to allow fallback
      if (error.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      }
      
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  /**
   * Parse JSON response from AI
   */
  async callJSON<T>(
    prompt: string,
    options: AICallOptions = {}
  ): Promise<T> {
    const jsonPrompt = `${prompt}\n\nRespond with valid JSON only, no markdown formatting.`;
    
    const result = await this.call(jsonPrompt, {
      ...options,
      temperature: 0.3, // Lower temperature for structured data
    });

    try {
      // Try to extract JSON from markdown code blocks if present
      let jsonStr = result.content.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      return JSON.parse(jsonStr) as T;
    } catch (error) {
      console.error('Failed to parse AI JSON response:', result.content);
      throw new Error('AI returned invalid JSON response');
    }
  }

  /**
   * Get cost statistics
   */
  getStats() {
    return {
      totalTokensUsed,
      totalCost: totalCost.toFixed(4),
      cacheSize: cache.size,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    cache.clear();
  }
}

export const openAIService = new OpenAIService();

