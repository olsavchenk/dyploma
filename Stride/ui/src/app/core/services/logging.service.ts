import { Injectable, signal } from '@angular/core';

/**
 * Log levels ordered by severity
 */
export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
}

/**
 * Structured log entry for AI-friendly debugging
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  levelName: string;
  message: string;
  context?: string;
  correlationId?: string;
  userId?: string;
  data?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  url?: string;
  userAgent?: string;
}

/**
 * Configuration for the logging service
 */
export interface LoggingConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  maxBufferSize: number;
}

/**
 * AI-oriented logging service for comprehensive debugging.
 * 
 * Features:
 * - Structured log format with correlation IDs
 * - Automatic user context injection
 * - Log buffering for batch operations
 * - Multiple log levels (Debug, Info, Warn, Error)
 * 
 * Usage:
 * ```typescript
 * this.log.debug('TaskService', 'Loading tasks', { subjectId: '123' });
 * this.log.error('AuthService', 'Login failed', { email: 'user@...' }, error);
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class LoggingService {
  // Current correlation ID from the last HTTP request
  private currentCorrelationId = signal<string | null>(null);

  // Current user ID – set externally by AuthService to avoid circular dependency
  private currentUserId = signal<string | null>(null);

  // Log buffer for batch operations (future: send to backend)
  private logBuffer: LogEntry[] = [];

  // Configuration
  private config: LoggingConfig = {
    minLevel: this.isDevMode() ? LogLevel.Debug : LogLevel.Info,
    enableConsole: true,
    maxBufferSize: 100,
  };

  /**
   * Set the current user ID (called by AuthService via effect to avoid circular dependency)
   */
  setCurrentUser(userId: string | null): void {
    this.currentUserId.set(userId);
  }

  /**
   * Set the current correlation ID (called by logging interceptor)
   */

  setCorrelationId(correlationId: string | null): void {
    this.currentCorrelationId.set(correlationId);
  }

  /**
   * Get the current correlation ID
   */
  getCorrelationId(): string | null {
    return this.currentCorrelationId();
  }

  /**
   * Log a debug message (development only, high-frequency operations)
   */
  debug(context: string, message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.Debug, context, message, data);
  }

  /**
   * Log an informational message (user actions, state changes)
   */
  info(context: string, message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.Info, context, message, data);
  }

  /**
   * Log a warning message (recoverable issues, deprecations)
   */
  warn(context: string, message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.Warn, context, message, data);
  }

  /**
   * Log an error message (failures, exceptions)
   */
  error(
    context: string,
    message: string,
    data?: Record<string, unknown>,
    error?: Error | unknown
  ): void {
    this.log(LogLevel.Error, context, message, data, error);
  }

  /**
   * Create a scoped logger for a specific context (e.g., component or service)
   */
  createScoped(context: string): ScopedLogger {
    return new ScopedLogger(this, context);
  }

  /**
   * Get buffered logs (for debugging or future backend submission)
   */
  getLogBuffer(): ReadonlyArray<LogEntry> {
    return [...this.logBuffer];
  }

  /**
   * Clear the log buffer
   */
  clearLogBuffer(): void {
    this.logBuffer = [];
  }

  /**
   * Update logging configuration
   */
  configure(config: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    context: string,
    message: string,
    data?: Record<string, unknown>,
    error?: Error | unknown
  ): void {
    // Skip if below minimum level
    if (level < this.config.minLevel) {
      return;
    }

    const entry = this.createLogEntry(level, context, message, data, error);

    // Add to buffer
    this.addToBuffer(entry);

    // Output to console
    if (this.config.enableConsole) {
      this.writeToConsole(entry);
    }
  }

  /**
   * Create a structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    context: string,
    message: string,
    data?: Record<string, unknown>,
    error?: Error | unknown
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      levelName: LogLevel[level],
      message,
      context,
      correlationId: this.currentCorrelationId() ?? undefined,
      userId: this.currentUserId() ?? undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    if (data && Object.keys(data).length > 0) {
      entry.data = this.sanitizeData(data);
    }

    if (error) {
      entry.error = this.extractErrorInfo(error);
    }

    return entry;
  }

  /**
   * Sanitize data to remove sensitive information
   */
  private sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = ['password', 'token', 'secret', 'credential', 'authorization'];
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Extract error information into a structured format
   */
  private extractErrorInfo(error: Error | unknown): LogEntry['error'] {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // Handle non-Error objects
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, unknown>;
      return {
        name: String(errorObj['name'] ?? 'UnknownError'),
        message: String(errorObj['message'] ?? JSON.stringify(error)),
        stack: errorObj['stack'] as string | undefined,
      };
    }

    return {
      name: 'UnknownError',
      message: String(error),
    };
  }

  /**
   * Add entry to buffer with size limit
   */
  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);

    // Trim buffer if it exceeds max size
    if (this.logBuffer.length > this.config.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.config.maxBufferSize);
    }
  }

  /**
   * Write log entry to browser console with formatting
   */
  private writeToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp.slice(11, 23)}] [${entry.levelName.toUpperCase().padEnd(5)}] [${entry.context}]`;
    const correlationSuffix = entry.correlationId ? ` [CID:${entry.correlationId.slice(0, 8)}]` : '';
    const userSuffix = entry.userId ? ` [User:${entry.userId.slice(0, 8)}]` : '';

    const fullPrefix = `${prefix}${correlationSuffix}${userSuffix}`;

    // Build console arguments
    const args: unknown[] = [`${fullPrefix} ${entry.message}`];

    if (entry.data) {
      args.push(entry.data);
    }

    if (entry.error) {
      args.push('\n  Error:', entry.error);
    }

    // Use appropriate console method based on level
    switch (entry.level) {
      case LogLevel.Debug:
        console.debug(...args);
        break;
      case LogLevel.Info:
        console.info(...args);
        break;
      case LogLevel.Warn:
        console.warn(...args);
        break;
      case LogLevel.Error:
        console.error(...args);
        break;
    }
  }

  /**
   * Check if running in development mode
   */
  private isDevMode(): boolean {
    try {
      // Check Angular's isDevMode or environment
      return typeof window !== 'undefined' && 
             (window.location.hostname === 'localhost' || 
              window.location.hostname === '127.0.0.1');
    } catch {
      return false;
    }
  }
}

/**
 * Scoped logger for a specific context (component/service)
 * Reduces boilerplate by pre-setting the context
 */
export class ScopedLogger {
  constructor(
    private readonly loggingService: LoggingService,
    private readonly context: string
  ) {}

  debug(message: string, data?: Record<string, unknown>): void {
    this.loggingService.debug(this.context, message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.loggingService.info(this.context, message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.loggingService.warn(this.context, message, data);
  }

  error(message: string, data?: Record<string, unknown>, error?: Error | unknown): void {
    this.loggingService.error(this.context, message, data, error);
  }
}
