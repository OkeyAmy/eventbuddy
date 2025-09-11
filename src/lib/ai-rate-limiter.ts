// AI Rate Limiter with Retries, Concurrency Control, and Error Handling
import PQueue from 'p-queue';
import { TokenBucketManager } from './token-bucket';
import { AIResponseCache } from './ai-cache';
import { CircuitBreaker, CircuitState } from './circuit-breaker';

export interface AIRateLimiterConfig {
  maxConcurrent: number;
  intervalCap: number; // requests per interval
  interval: number; // milliseconds
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  timeout: number; // milliseconds
}

export interface AICallOptions {
  guildId?: string;
  userId?: string;
  prompt: string;
  context?: any;
  skipCache?: boolean;
  priority?: number; // Lower numbers = higher priority
}

export interface AICallResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorType?: 'rate_limit' | 'timeout' | 'provider_error' | 'circuit_open' | 'unknown';
  fromCache?: boolean;
  queueWaitMs?: number;
  attemptCount?: number;
  retryAfter?: number;
}

export class AIRateLimiter {
  private queue: PQueue;
  private tokenBuckets: TokenBucketManager;
  private cache: AIResponseCache;
  private circuitBreaker: CircuitBreaker;
  private config: AIRateLimiterConfig;

  constructor() {
    this.config = {
      maxConcurrent: parseInt(process.env.AI_MAX_CONCURRENT || '3'),
      intervalCap: parseInt(process.env.AI_REQUESTS_PER_MINUTE || '60'),
      interval: 60 * 1000, // 1 minute
      maxRetries: parseInt(process.env.AI_MAX_RETRIES || '4'),
      baseDelay: parseInt(process.env.AI_BASE_DELAY_MS || '250'),
      maxDelay: parseInt(process.env.AI_MAX_DELAY_MS || '8000'),
      timeout: parseInt(process.env.AI_TIMEOUT_MS || '12000'),
    };

    this.queue = new PQueue({
      concurrency: this.config.maxConcurrent,
      intervalCap: this.config.intervalCap,
      interval: this.config.interval,
    });

    this.tokenBuckets = new TokenBucketManager();
    this.cache = new AIResponseCache();
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      recoveryTimeout: 30000, // 30 seconds
      monitoringWindow: 60000, // 1 minute
      maxRecoveryAttempts: 3,
    });

    // Periodic cleanup
    setInterval(() => {
      this.tokenBuckets.cleanup();
      this.cache.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  // Main method to call AI with rate limiting
  async callAI<T>(
    aiFunction: () => Promise<T>,
    options: AICallOptions
  ): Promise<AICallResult<T>> {
    const startTime = Date.now();

    // Check cache first
    if (!options.skipCache) {
      const cached = this.cache.get(options.prompt, options.context);
      if (cached) {
        console.log(`[AI-Cache] Cache hit for prompt: ${options.prompt.substring(0, 50)}...`);
        return {
          success: true,
          data: cached,
          fromCache: true,
        };
      }
    }

    // Check token buckets
    const rateLimitCheck = this.checkRateLimits(options.guildId, options.userId);
    if (!rateLimitCheck.allowed) {
      console.log(`[AI-RateLimit] ${rateLimitCheck.reason} - Guild: ${options.guildId}, User: ${options.userId}`);
      return {
        success: false,
        error: "I'm getting a bit busy right now. Please try again in a moment.",
        errorType: 'rate_limit',
      };
    }

    // Check circuit breaker
    if (this.circuitBreaker.getState() === CircuitState.OPEN) {
      console.log('[AI-Circuit] Circuit breaker is OPEN - service unavailable');
      return {
        success: false,
        error: "AI service is temporarily unavailable. Please try again later.",
        errorType: 'circuit_open',
      };
    }

    // Queue the request
    try {
      const result = await this.queue.add(
        () => this.executeWithRetry(aiFunction, options),
        { priority: options.priority || 0 }
      );

      const queueWaitMs = Date.now() - startTime;

      if (result && result.success && !options.skipCache && result.data) {
        this.cache.set(options.prompt, result.data, options.context);
      }

      return {
        ...result,
        queueWaitMs,
      } as AICallResult<T>;
    } catch (error) {
      console.error('[AI-Queue] Queue execution failed:', error);
      return {
        success: false,
        error: 'Request processing failed',
        errorType: 'unknown',
        queueWaitMs: Date.now() - startTime,
      };
    }
  }

  // Execute AI call with retry logic
  private async executeWithRetry<T>(
    aiFunction: () => Promise<T>,
    options: AICallOptions
  ): Promise<AICallResult<T>> {
    let lastError: any;
    let attemptCount = 0;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      attemptCount = attempt + 1;

      try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('AI_TIMEOUT')), this.config.timeout);
        });

        // Race between AI call and timeout
        const result = await Promise.race([
          this.circuitBreaker.execute(() => aiFunction()),
          timeoutPromise,
        ]);

        console.log(`[AI-Success] Request completed in ${attemptCount} attempt(s) for: ${options.prompt.substring(0, 50)}...`);

        return {
          success: true,
          data: result,
          attemptCount,
        };
      } catch (error: any) {
        lastError = error;
        
        const errorInfo = this.parseError(error);
        console.log(`[AI-Error] Attempt ${attemptCount}: ${errorInfo.type} - ${errorInfo.message}${errorInfo.retryAfter ? ` (Retry-After: ${errorInfo.retryAfter}s)` : ''}`);

        // Don't retry on certain errors
        if (errorInfo.type === 'rate_limit' && attempt === this.config.maxRetries) {
          return {
            success: false,
            error: "I'm getting a bit busy right now. Please try again in a moment.",
            errorType: 'rate_limit',
            attemptCount,
            retryAfter: errorInfo.retryAfter,
          };
        }

        if (errorInfo.type === 'timeout') {
          return {
            success: false,
            error: 'Request timed out. Please try again.',
            errorType: 'timeout',
            attemptCount,
          };
        }

        // Calculate delay for next attempt
        if (attempt < this.config.maxRetries) {
          const delay = this.calculateDelay(attempt, errorInfo.retryAfter);
          console.log(`[AI-Retry] Waiting ${delay}ms before attempt ${attempt + 2}`);
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted
    const errorInfo = this.parseError(lastError);
    return {
      success: false,
      error: errorInfo.userMessage,
      errorType: errorInfo.type,
      attemptCount,
    };
  }

  // Check rate limits for guild and user
  private checkRateLimits(guildId?: string, userId?: string): { allowed: boolean; reason?: string } {
    if (guildId && !this.tokenBuckets.canGuildMakeRequest(guildId)) {
      return { allowed: false, reason: 'Guild rate limit exceeded' };
    }

    if (userId && !this.tokenBuckets.canUserMakeRequest(userId)) {
      return { allowed: false, reason: 'User rate limit exceeded' };
    }

    return { allowed: true };
  }

  // Parse error and determine type and retry strategy
  private parseError(error: any): {
    type: 'rate_limit' | 'timeout' | 'provider_error' | 'unknown';
    message: string;
    userMessage: string;
    retryAfter?: number;
  } {
    const message = error?.message || String(error);

    if (message.includes('AI_TIMEOUT')) {
      return {
        type: 'timeout',
        message: 'Request timed out',
        userMessage: 'Request timed out. Please try again.',
      };
    }

    if (error?.status === 429 || message.includes('429') || message.includes('rate limit')) {
      const retryAfter = this.extractRetryAfter(error);
      return {
        type: 'rate_limit',
        message: `Rate limited${retryAfter ? ` (retry after ${retryAfter}s)` : ''}`,
        userMessage: "I'm getting a bit busy right now. Please try again in a moment.",
        retryAfter,
      };
    }

    if (error?.status >= 500 || message.includes('ETIMEDOUT') || message.includes('ECONNRESET')) {
      return {
        type: 'provider_error',
        message: `Provider error: ${message}`,
        userMessage: 'Temporary service issue. Please try again.',
      };
    }

    return {
      type: 'unknown',
      message,
      userMessage: 'An unexpected error occurred. Please try again.',
    };
  }

  // Extract Retry-After header value
  private extractRetryAfter(error: any): number | undefined {
    const retryAfter = error?.headers?.['retry-after'] || error?.retryAfter;
    if (retryAfter) {
      const seconds = parseInt(retryAfter);
      return isNaN(seconds) ? undefined : seconds;
    }
    return undefined;
  }

  // Calculate delay with exponential backoff and jitter
  private calculateDelay(attempt: number, retryAfter?: number): number {
    if (retryAfter) {
      // Honor Retry-After header with some jitter
      const jitter = Math.random() * 1000; // 0-1000ms jitter
      return (retryAfter * 1000) + jitter;
    }

    // Exponential backoff: 250ms → 500ms → 1s → 2s → 4s → 8s
    const exponentialDelay = this.config.baseDelay * Math.pow(2, attempt);
    const delay = Math.min(exponentialDelay, this.config.maxDelay);
    
    // Add jitter (±25%)
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    return Math.max(0, delay + jitter);
  }

  // Sleep utility
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get system status
  getStatus(): {
    queue: { size: number; pending: number };
    cache: { size: number };
    circuitBreaker: { state: string; failures: number };
    tokenBuckets?: { guild?: number; user?: number };
  } {
    return {
      queue: {
        size: this.queue.size,
        pending: this.queue.pending,
      },
      cache: this.cache.getStats(),
      circuitBreaker: this.circuitBreaker.getStats(),
    };
  }

  // Get token bucket status for specific guild/user
  getTokenBucketStatus(guildId?: string, userId?: string) {
    return this.tokenBuckets.getStatus(guildId, userId);
  }
}

// Singleton instance
export const aiRateLimiter = new AIRateLimiter();