// Configuration for AI Rate Limiting System
export const AI_CONFIG = {
  // Concurrency Control
  MAX_CONCURRENT: parseInt(process.env.AI_MAX_CONCURRENT || '3'),
  REQUESTS_PER_MINUTE: parseInt(process.env.AI_REQUESTS_PER_MINUTE || '60'),
  
  // Retry Configuration
  MAX_RETRIES: parseInt(process.env.AI_MAX_RETRIES || '4'),
  BASE_DELAY_MS: parseInt(process.env.AI_BASE_DELAY_MS || '250'),
  MAX_DELAY_MS: parseInt(process.env.AI_MAX_DELAY_MS || '8000'),
  TIMEOUT_MS: parseInt(process.env.AI_TIMEOUT_MS || '12000'),
  
  // Token Buckets
  GUILD_RATE_BURST: parseInt(process.env.GUILD_RATE_BURST || '3'),
  GUILD_RATE_PER_SECOND: parseInt(process.env.GUILD_RATE_PER_SECOND || '1'),
  USER_RATE_BURST: parseInt(process.env.USER_RATE_BURST || '2'),
  USER_RATE_PER_SECOND: parseFloat(process.env.USER_RATE_PER_SECOND || '0.5'),
  
  // Cache Configuration
  CACHE_TTL_MS: parseInt(process.env.AI_CACHE_TTL_MS || '60000'), // 60 seconds
  
  // Circuit Breaker
  CIRCUIT_FAILURE_THRESHOLD: parseInt(process.env.CIRCUIT_FAILURE_THRESHOLD || '5'),
  CIRCUIT_RECOVERY_TIMEOUT: parseInt(process.env.CIRCUIT_RECOVERY_TIMEOUT || '30000'),
  CIRCUIT_MAX_RECOVERY_ATTEMPTS: parseInt(process.env.CIRCUIT_MAX_RECOVERY_ATTEMPTS || '3'),
  
  // Logging
  DEBUG_LOGGING: process.env.DEBUG_LOGGING === 'true',
};

export const ERROR_MESSAGES = {
  RATE_LIMIT: "I'm getting a bit busy right now. Please try again in a moment.",
  TIMEOUT: "Request timed out. Please try again.",
  CIRCUIT_OPEN: "AI service is temporarily unavailable. Please try again later.",
  PROVIDER_ERROR: "Temporary service issue. Please try again.",
  UNKNOWN: "An unexpected error occurred. Please try again.",
};