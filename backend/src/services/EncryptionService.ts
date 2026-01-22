import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error('ENCRYPTION_KEY environment variable is not set');
    }

    // Key should be 32 bytes (64 hex characters) for AES-256
    if (key.length !== 64) {
        throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }

    return Buffer.from(key, 'hex');
}

/**
 * Encryption Service for API keys
 * Uses AES-256-GCM for secure encryption with authentication
 */
export class EncryptionService {
    /**
     * Encrypt a plaintext string
     * Returns base64 encoded: iv + authTag + ciphertext
     */
    encrypt(plaintext: string): string {
        const key = getEncryptionKey();
        const iv = crypto.randomBytes(IV_LENGTH);

        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(plaintext, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        const authTag = cipher.getAuthTag();

        // Combine iv + authTag + ciphertext
        const combined = Buffer.concat([
            iv,
            authTag,
            Buffer.from(encrypted, 'base64'),
        ]);

        return combined.toString('base64');
    }

    /**
     * Decrypt an encrypted string
     * Input should be base64 encoded: iv + authTag + ciphertext
     */
    decrypt(encryptedData: string): string {
        const key = getEncryptionKey();
        const combined = Buffer.from(encryptedData, 'base64');

        // Extract components
        const iv = combined.subarray(0, IV_LENGTH);
        const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
        const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(ciphertext);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString('utf8');
    }

    /**
     * Generate a masked key prefix for display
     * e.g., "sk-proj-abc...xyz" → "sk-proj-abc****"
     */
    generateKeyPrefix(apiKey: string): string {
        if (apiKey.length < 12) {
            return apiKey.substring(0, 4) + '****';
        }

        // Show first 10 chars + ****
        return apiKey.substring(0, 10) + '****';
    }

    /**
     * Validate key format based on provider
     */
    validateKeyFormat(provider: string, apiKey: string): boolean {
        const patterns: Record<string, RegExp> = {
            openai: /^sk-[a-zA-Z0-9\-_]{20,}$/,
            anthropic: /^sk-ant-[a-zA-Z0-9\-_]{20,}$/,
            google: /^AI[a-zA-Z0-9\-_]{20,}$/,
            perplexity: /^.{20,}$/,
        };

        const pattern = patterns[provider];
        if (!pattern) {
            return false;
        }

        return pattern.test(apiKey);
    }
}

export const encryptionService = new EncryptionService();
