// Token Bucket Implementation for Per-Guild and Per-User Rate Limiting
export interface TokenBucketConfig {
  capacity: number; // Maximum tokens (burst capacity)
  refillRate: number; // Tokens per second
  refillInterval: number; // Milliseconds between refills
}

export class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private config: TokenBucketConfig;

  constructor(config: TokenBucketConfig) {
    this.config = config;
    this.tokens = config.capacity;
    this.lastRefill = Date.now();
  }

  // Try to consume tokens, return true if successful
  consume(tokens: number = 1): boolean {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }

  // Get current token count
  getTokens(): number {
    this.refill();
    return this.tokens;
  }

  // Refill tokens based on time elapsed
  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    
    if (timePassed >= this.config.refillInterval) {
      const tokensToAdd = Math.floor(timePassed / this.config.refillInterval) * (this.config.refillRate * this.config.refillInterval / 1000);
      this.tokens = Math.min(this.config.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }
}

// Manager for multiple token buckets
export class TokenBucketManager {
  private buckets = new Map<string, TokenBucket>();
  private guildConfig: TokenBucketConfig;
  private userConfig: TokenBucketConfig;

  constructor() {
    // Guild rate limiting: 1 request/second with burst of 3
    this.guildConfig = {
      capacity: parseInt(process.env.GUILD_RATE_BURST || '3'),
      refillRate: parseInt(process.env.GUILD_RATE_PER_SECOND || '1'),
      refillInterval: 1000,
    };

    // User rate limiting: 1 request/2 seconds with burst of 2
    this.userConfig = {
      capacity: parseInt(process.env.USER_RATE_BURST || '2'),
      refillRate: parseFloat(process.env.USER_RATE_PER_SECOND || '0.5'),
      refillInterval: 1000,
    };
  }

  // Check if guild can make request
  canGuildMakeRequest(guildId: string): boolean {
    const key = `guild:${guildId}`;
    if (!this.buckets.has(key)) {
      this.buckets.set(key, new TokenBucket(this.guildConfig));
    }
    return this.buckets.get(key)!.consume();
  }

  // Check if user can make request
  canUserMakeRequest(userId: string): boolean {
    const key = `user:${userId}`;
    if (!this.buckets.has(key)) {
      this.buckets.set(key, new TokenBucket(this.userConfig));
    }
    return this.buckets.get(key)!.consume();
  }

  // Get current status for debugging
  getStatus(guildId?: string, userId?: string): { guild?: number; user?: number } {
    const status: { guild?: number; user?: number } = {};
    
    if (guildId) {
      const guildKey = `guild:${guildId}`;
      status.guild = this.buckets.get(guildKey)?.getTokens() ?? this.guildConfig.capacity;
    }
    
    if (userId) {
      const userKey = `user:${userId}`;
      status.user = this.buckets.get(userKey)?.getTokens() ?? this.userConfig.capacity;
    }
    
    return status;
  }

  // Cleanup old buckets (call periodically)
  cleanup(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - (bucket as any).lastRefill > maxAge) {
        this.buckets.delete(key);
      }
    }
  }
}