// AI Integration Layer - Wraps AI calls with rate limiting
import { GoogleGenerativeAI, GenerativeModel, Content } from '@google/generative-ai';
import { aiRateLimiter, AICallOptions } from './ai-rate-limiter';

export class AIIntegration {
  private gemini: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.gemini = new GoogleGenerativeAI(apiKey);
  }

  // Wrap model.generateContent with rate limiting
  async generateContentWithRateLimit(
    model: GenerativeModel,
    request: { contents: Content[] },
    options: AICallOptions
  ) {
    const result = await aiRateLimiter.callAI(
      () => model.generateContent(request),
      options
    );

    if (!result.success) {
      // Log telemetry
      console.log(`[AI-Telemetry] ${result.errorType}: ${result.error} - Queue wait: ${result.queueWaitMs}ms, Attempts: ${result.attemptCount}`);
      
      // Throw with user-friendly message based on error type
      throw new Error(result.error);
    }

    // Log successful call
    if (result.fromCache) {
      console.log(`[AI-Cache] Cache hit - Queue wait: ${result.queueWaitMs}ms`);
    } else {
      console.log(`[AI-Success] Response generated - Queue wait: ${result.queueWaitMs}ms, Attempts: ${result.attemptCount}`);
    }

    return result.data;
  }

  // Create a rate-limited model wrapper
  createRateLimitedModel(modelName: string) {
    const originalModel = this.gemini.getGenerativeModel({ model: modelName });
    
    return {
      // Wrap generateContent with rate limiting
      async generateContent(request: { contents: Content[] }, options: Omit<AICallOptions, 'prompt'>) {
        // Extract prompt from request for cache key
        const prompt = this.extractPromptFromRequest(request);
        
        return this.generateContentWithRateLimit(originalModel, request, {
          ...options,
          prompt,
        });
      },
      
      // Pass through other model methods if needed
      ...originalModel,
    };
  }

  // Extract text content for prompt key
  private extractPromptFromRequest(request: { contents: Content[] }): string {
    return request.contents
      .map(content => 
        content.parts
          ?.map(part => part.text || '')
          .join(' ')
      )
      .join(' ')
      .substring(0, 500); // Limit length for cache key
  }

  // Get system status
  getSystemStatus() {
    return aiRateLimiter.getStatus();
  }

  // Get token bucket status for specific guild/user
  getTokenBucketStatus(guildId?: string, userId?: string) {
    return aiRateLimiter.getTokenBucketStatus(guildId, userId);
  }
}

// Export singleton instance
export const aiIntegration = new AIIntegration(process.env.GEMINI_API_KEY || '');