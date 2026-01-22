import OpenAI from 'openai';
import { AIProvider, AICallOptions, AICallResult } from './AIProvider';
import { PROVIDER_CONFIGS } from './providerConfig';

/**
 * OpenAI Provider Implementation
 */
export class OpenAIProvider implements AIProvider {
    name = 'openai';
    private model = PROVIDER_CONFIGS.openai.model;

    /**
     * Validate API key by making a test request
     */
    async validateKey(apiKey: string): Promise<boolean> {
        try {
            const client = new OpenAI({ apiKey });

            // Make a minimal request to validate the key
            await client.chat.completions.create({
                model: this.model,
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 5,
            });

            return true;
        } catch (error: any) {
            console.error('OpenAI key validation failed:', error.message);
            return false;
        }
    }

    /**
     * Make an AI call
     */
    async call(
        prompt: string,
        apiKey: string,
        options: AICallOptions = {}
    ): Promise<AICallResult> {
        const {
            systemPrompt,
            temperature = 0.7,
            maxTokens = 2000,
        } = options;

        const client = new OpenAI({ apiKey });

        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const completion = await client.chat.completions.create({
            model: this.model,
            messages,
            temperature,
            max_tokens: maxTokens,
        });

        const content = completion.choices[0]?.message?.content || '';
        const usage = completion.usage;

        return {
            content,
            usage: usage ? {
                promptTokens: usage.prompt_tokens,
                completionTokens: usage.completion_tokens,
                totalTokens: usage.total_tokens,
            } : undefined,
        };
    }

    /**
     * Make an AI call expecting JSON response
     */
    async callJSON<T>(
        prompt: string,
        apiKey: string,
        options: AICallOptions = {}
    ): Promise<T> {
        const jsonPrompt = `${prompt}\n\nRespond with valid JSON only, no markdown formatting.`;

        const result = await this.call(jsonPrompt, apiKey, {
            ...options,
            temperature: 0.3,
        });

        // Try to extract JSON from response
        let jsonStr = result.content.trim();
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        }

        return JSON.parse(jsonStr) as T;
    }
}

export const openAIProvider = new OpenAIProvider();
