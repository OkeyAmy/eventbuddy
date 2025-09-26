# AI Rate Limiting System

## Overview
This system provides comprehensive rate limiting, retry logic, caching, and circuit breaking for AI API calls in the Discord bot.

## Components

### 1. Token Bucket (`token-bucket.ts`)
- **Purpose**: Per-guild and per-user rate limiting with burst capacity
- **Features**: 
  - Configurable burst capacity and refill rates
  - Automatic token replenishment
  - Separate buckets for guilds and users

### 2. AI Response Cache (`ai-cache.ts`)
- **Purpose**: Short-TTL cache for identical prompts to reduce duplicate AI calls
- **Features**:
  - MD5-based cache keys from normalized prompts
  - Configurable TTL (default 60 seconds)
  - Automatic cleanup of expired entries

### 3. Circuit Breaker (`circuit-breaker.ts`)
- **Purpose**: Protect against AI provider outages
- **States**: CLOSED → OPEN → HALF_OPEN → CLOSED
- **Features**:
  - Configurable failure thresholds
  - Automatic recovery attempts
  - Graceful degradation

### 4. AI Rate Limiter (`ai-rate-limiter.ts`)
- **Purpose**: Main orchestration of all rate limiting components
- **Features**:
  - Global concurrency control via p-queue
  - Exponential backoff with jitter
  - Retry-After header support
  - Comprehensive error classification
  - Detailed telemetry logging

### 5. AI Integration (`ai-integration.ts`)
- **Purpose**: Wrapper for existing AI calls to add rate limiting
- **Features**:
  - Drop-in replacement for direct model.generateContent calls
  - Automatic context extraction for cache keys
  - Status monitoring endpoints

## Configuration

### Environment Variables

```bash
# Concurrency Control
AI_MAX_CONCURRENT=3              # Max simultaneous AI requests
AI_REQUESTS_PER_MINUTE=60        # Global rate limit

# Retry Configuration  
AI_MAX_RETRIES=4                 # Max retry attempts
AI_BASE_DELAY_MS=250             # Base delay for exponential backoff
AI_MAX_DELAY_MS=8000             # Maximum delay cap
AI_TIMEOUT_MS=12000              # Hard timeout for AI calls

# Per-Guild Rate Limiting
GUILD_RATE_BURST=3               # Burst capacity per guild
GUILD_RATE_PER_SECOND=1          # Sustained rate per guild

# Per-User Rate Limiting  
USER_RATE_BURST=2                # Burst capacity per user
USER_RATE_PER_SECOND=0.5         # Sustained rate per user

# Response Caching
AI_CACHE_TTL_MS=60000            # Cache TTL in milliseconds

# Circuit Breaker
CIRCUIT_FAILURE_THRESHOLD=5      # Failures before opening circuit
CIRCUIT_RECOVERY_TIMEOUT=30000   # Wait time before recovery attempt
CIRCUIT_MAX_RECOVERY_ATTEMPTS=3  # Max recovery attempts

# Logging
DEBUG_LOGGING=true               # Enable detailed logging
```

## Error Messages

The system provides user-friendly error messages:

- **Rate Limit (429)**: "I'm getting a bit busy right now. Please try again in a moment."
- **Timeout**: "Request timed out. Please try again."
- **Circuit Open**: "AI service is temporarily unavailable. Please try again later."
- **Provider Error**: "Temporary service issue. Please try again."
- **Unknown**: "An unexpected error occurred. Please try again."

## Usage

### Basic Integration

```typescript
import { aiIntegration } from './ai-integration';

// Replace direct model calls
const result = await aiIntegration.generateContentWithRateLimit(
  model, 
  { contents }, 
  {
    guildId: message.guild?.id,
    userId: message.author.id,
    prompt: message.content,
    context: { messageId: message.id }
  }
);
```

### Status Monitoring

```typescript
// Get system status
const status = aiIntegration.getSystemStatus();
// Returns: { queue, cache, circuitBreaker }

// Get token bucket status for specific guild/user
const bucketStatus = aiIntegration.getTokenBucketStatus(guildId, userId);
// Returns: { guild?: number, user?: number }
```

## Logging and Telemetry

The system logs comprehensive telemetry:

```
[AI-Cache] Cache hit for prompt: what time is the event...
[AI-Success] Response generated - Queue wait: 45ms, Attempts: 1
[AI-Error] Attempt 2: rate_limit - Rate limited (Retry-After: 30s)
[AI-Telemetry] rate_limit: I'm getting a bit busy... - Queue wait: 120ms, Attempts: 4
```

## Scenario Testing

### Low Traffic (1-2 rps)
- **Expected**: 0 user-visible errors, sub-second replies
- **Implementation**: Limiter rarely engages, cache hits rare

### Burst Traffic (50 messages in 5s)
- **Expected**: Most queued, few "busy" messages, no generic errors
- **Implementation**: Global + per-guild limiting smooths load

### Sustained High Load (5-10 rps for 2 minutes)
- **Expected**: Throughput capped, latency rises, small fraction rate-limited
- **Implementation**: Global limiter protects quotas, per-guild fairness

### Provider 429 with Retry-After
- **Expected**: Exact backoff per header, specific busy message, logged
- **Implementation**: No hammering, jittered wait to avoid thundering herd

### Provider Outage
- **Expected**: Immediate circuit breaker, friendly fallback, auto-recovery
- **Implementation**: Per-provider breaker state, configurable cool-off

## Architecture

```
Discord Message
       ↓
AI Integration Layer (ai-integration.ts)
       ↓
AI Rate Limiter (ai-rate-limiter.ts)
       ↓
┌─────────────────┬─────────────────┬─────────────────┐
│   Token Bucket  │   Response Cache │  Circuit Breaker │
│   (Per-guild/   │   (Short TTL)   │   (Provider     │
│    user limits) │                 │    Protection)  │
└─────────────────┴─────────────────┴─────────────────┘
       ↓
Global Queue (p-queue)
       ↓
Gemini API with Retry Logic
```

## Benefits

1. **Reliability**: Robust retry logic with exponential backoff
2. **Performance**: Response caching reduces duplicate calls  
3. **Fairness**: Per-guild/user token buckets prevent monopolization
4. **Resilience**: Circuit breaker protects against provider outages
5. **Observability**: Comprehensive logging and telemetry
6. **User Experience**: Specific, user-friendly error messages
7. **Cost Optimization**: Global rate limiting stays within quotas