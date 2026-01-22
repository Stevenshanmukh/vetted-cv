/**
 * AI Provider Interface
 * Abstract interface for different AI providers (OpenAI, Anthropic, Google, Perplexity)
 */

export interface AICallOptions {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    useCache?: boolean;
}

export interface AICallResult {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export interface AIProvider {
    name: string;

    /**
     * Validate that an API key is valid by making a test request
     */
    validateKey(apiKey: string): Promise<boolean>;

    /**
     * Make an AI call and return the text response
     */
    call(prompt: string, apiKey: string, options?: AICallOptions): Promise<AICallResult>;

    /**
     * Make an AI call expecting a JSON response
     */
    callJSON<T>(prompt: string, apiKey: string, options?: AICallOptions): Promise<T>;
}
