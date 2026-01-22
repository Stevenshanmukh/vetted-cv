import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, AICallOptions, AICallResult } from './AIProvider';
import { PROVIDER_CONFIGS } from './providerConfig';

/**
 * Google Gemini Provider Implementation
 */
export class GoogleProvider implements AIProvider {
    name = 'google';
    private model = PROVIDER_CONFIGS.google.model;

    /**
     * Validate API key by making a test request
     */
    async validateKey(apiKey: string): Promise<boolean> {
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: this.model });

            await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
                generationConfig: { maxOutputTokens: 5 },
            });

            return true;
        } catch (error: any) {
            console.error('Google Gemini key validation failed:', error.message);
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

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: this.model,
            systemInstruction: systemPrompt,
        });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature,
                maxOutputTokens: maxTokens,
            },
        });

        const response = result.response;
        const content = response.text();

        return {
            content,
            usage: result.response.usageMetadata ? {
                promptTokens: result.response.usageMetadata.promptTokenCount,
                completionTokens: result.response.usageMetadata.candidatesTokenCount,
                totalTokens: result.response.usageMetadata.totalTokenCount,
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

        // Gemini supports JSON mode natively, generally better to use text + parsing for consistency 
        // across generic provider structure unless strict json constraint is needed.
        // For now using same pattern as others for robustness.

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

export const googleProvider = new GoogleProvider();
