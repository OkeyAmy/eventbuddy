// Circuit Breaker for AI Provider Outages
export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN', 
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  recoveryTimeout: number; // Milliseconds before trying half-open
  monitoringWindow: number; // Time window for failure counting
  maxRecoveryAttempts: number; // Max attempts in half-open state
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private recoveryAttempts: number = 0;
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  // Execute function with circuit breaker protection
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptRecovery()) {
        this.state = CircuitState.HALF_OPEN;
        this.recoveryAttempts = 0;
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
    }
    this.failures = 0;
    this.recoveryAttempts = 0;
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.recoveryAttempts++;
      if (this.recoveryAttempts >= this.config.maxRecoveryAttempts) {
        this.state = CircuitState.OPEN;
      }
    } else if (this.failures >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  private shouldAttemptRecovery(): boolean {
    return Date.now() - this.lastFailureTime > this.config.recoveryTimeout;
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats(): { state: CircuitState; failures: number; recoveryAttempts: number } {
    return {
      state: this.state,
      failures: this.failures,
      recoveryAttempts: this.recoveryAttempts,
    };
  }

  // Force state change (for testing/manual intervention)
  setState(state: CircuitState): void {
    this.state = state;
    if (state === CircuitState.CLOSED) {
      this.failures = 0;
      this.recoveryAttempts = 0;
    }
  }
}