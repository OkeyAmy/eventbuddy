// Response Cache for AI Calls
import crypto from 'crypto';

export interface CacheEntry {
  response: any;
  timestamp: number;
  ttl: number;
}

export class AIResponseCache {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL: number;

  constructor() {
    this.defaultTTL = parseInt(process.env.AI_CACHE_TTL_MS || '60000'); // 60 seconds default
  }

  // Generate cache key from prompt and context
  private generateKey(prompt: string, context?: any): string {
    const normalizedPrompt = prompt.trim().toLowerCase();
    const contextStr = context ? JSON.stringify(context) : '';
    return crypto.createHash('md5').update(normalizedPrompt + contextStr).digest('hex');
  }

  // Get cached response if available and not expired
  get(prompt: string, context?: any): any | null {
    const key = this.generateKey(prompt, context);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.response;
  }

  // Store response in cache
  set(prompt: string, response: any, context?: any, customTTL?: number): void {
    const key = this.generateKey(prompt, context);
    const ttl = customTTL || this.defaultTTL;
    
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      ttl,
    });
  }

  // Check if response exists and is valid
  has(prompt: string, context?: any): boolean {
    return this.get(prompt, context) !== null;
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache stats
  getStats(): { size: number; hitRate?: number } {
    return {
      size: this.cache.size,
    };
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }
}