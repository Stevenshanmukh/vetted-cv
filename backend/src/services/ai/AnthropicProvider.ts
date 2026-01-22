import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, AICallOptions, AICallResult } from './AIProvider';
import { PROVIDER_CONFIGS } from './providerConfig';

/**
 * Anthropic (Claude) Provider Implementation
 */
export class AnthropicProvider implements AIProvider {
    name = 'anthropic';
    private model = PROVIDER_CONFIGS.anthropic.model;

    /**
     * Validate API key by making a test request
     */
    async validateKey(apiKey: string): Promise<boolean> {
        try {
            const client = new Anthropic({ apiKey });

            await client.messages.create({
                model: this.model,
                max_tokens: 10,
                messages: [{ role: 'user', content: 'Hi' }],
            });

            return true;
        } catch (error: any) {
            console.error('Anthropic key validation failed:', error.message);
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

        const client = new Anthropic({ apiKey });

        const response = await client.messages.create({
            model: this.model,
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: [{ role: 'user', content: prompt }],
            temperature,
        });

        const content = response.content[0]?.type === 'text'
            ? response.content[0].text
            : '';

        return {
            content,
            usage: {
                promptTokens: response.usage.input_tokens,
                completionTokens: response.usage.output_tokens,
                totalTokens: response.usage.input_tokens + response.usage.output_tokens,
            },
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

        let jsonStr = result.content.trim();
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        }

        return JSON.parse(jsonStr) as T;
    }
}

export const anthropicProvider = new AnthropicProvider();
