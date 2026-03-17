import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap, catchError, throwError } from 'rxjs';
import { LoggingService } from '../services/logging.service';

/**
 * HTTP interceptor for comprehensive request/response logging.
 * 
 * Features:
 * - Logs all HTTP requests with method, URL, and timing
 * - Captures and propagates X-Correlation-ID from backend
 * - Logs responses with status codes and duration
 * - Logs errors with full context for AI debugging
 * - Sanitizes sensitive data (auth headers, passwords)
 */
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggingService);
  const startTime = performance.now();
  const requestId = generateRequestId();

  // Extract correlation ID from request if present, or generate one
  let correlationId = req.headers.get('X-Correlation-ID');
  
  // Clone request to add correlation ID header if not present
  let loggedReq = req;
  if (!correlationId) {
    correlationId = requestId;
    loggedReq = req.clone({
      setHeaders: {
        'X-Correlation-ID': correlationId,
      },
    });
  }

  // Update the logging service with current correlation ID
  logger.setCorrelationId(correlationId);

  // Log the outgoing request
  logger.debug('HTTP', `→ ${req.method} ${getUrlPath(req.url)}`, {
    requestId,
    method: req.method,
    url: req.url,
    hasBody: !!req.body,
    bodyType: req.body ? typeof req.body : undefined,
    headers: sanitizeHeaders(req.headers.keys()),
  });

  return next(loggedReq).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        const duration = Math.round(performance.now() - startTime);
        
        // Capture correlation ID from response
        const responseCorrelationId = event.headers.get('X-Correlation-ID');
        if (responseCorrelationId) {
          logger.setCorrelationId(responseCorrelationId);
        }

        // Log successful response
        logger.debug('HTTP', `← ${req.method} ${getUrlPath(req.url)} ${event.status}`, {
          requestId,
          method: req.method,
          url: req.url,
          status: event.status,
          statusText: event.statusText,
          duration: `${duration}ms`,
          correlationId: responseCorrelationId ?? correlationId,
          responseType: getResponseType(event.body),
          responseSize: getResponseSize(event.body),
        });
      }
    }),
    catchError((error: HttpErrorResponse) => {
      const duration = Math.round(performance.now() - startTime);

      // Capture correlation ID from error response if available
      const errorCorrelationId = error.headers?.get('X-Correlation-ID');
      if (errorCorrelationId) {
        logger.setCorrelationId(errorCorrelationId);
      }

      // Log the error with full context
      logger.error('HTTP', `✗ ${req.method} ${getUrlPath(req.url)} ${error.status}`, {
        requestId,
        method: req.method,
        url: req.url,
        status: error.status,
        statusText: error.statusText,
        duration: `${duration}ms`,
        correlationId: errorCorrelationId ?? correlationId,
        errorType: getErrorType(error),
        errorMessage: getErrorMessage(error),
        errorDetails: getErrorDetails(error),
        requestBody: sanitizeRequestBody(req.body),
      }, createHttpError(error));

      return throwError(() => error);
    }),
  );
};

/**
 * Generate a unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Extract path from full URL for cleaner logs
 */
function getUrlPath(url: string): string {
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.pathname + urlObj.search;
  } catch {
    return url;
  }
}

/**
 * Sanitize header names (don't log sensitive header values)
 */
function sanitizeHeaders(headerNames: string[]): string[] {
  return headerNames.filter((name) => {
    const lower = name.toLowerCase();
    return !['authorization', 'cookie', 'x-auth-token'].includes(lower);
  });
}

/**
 * Get the type of response body
 */
function getResponseType(body: unknown): string {
  if (body === null || body === undefined) return 'empty';
  if (Array.isArray(body)) return `array[${body.length}]`;
  if (typeof body === 'object') return 'object';
  return typeof body;
}

/**
 * Estimate response size
 */
function getResponseSize(body: unknown): string | undefined {
  if (body === null || body === undefined) return undefined;
  try {
    const size = JSON.stringify(body).length;
    if (size < 1024) return `${size}B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
    return `${(size / 1024 / 1024).toFixed(1)}MB`;
  } catch {
    return undefined;
  }
}

/**
 * Classify the error type
 */
function getErrorType(error: HttpErrorResponse): string {
  if (error.status === 0) return 'NetworkError';
  if (error.status === 401) return 'Unauthorized';
  if (error.status === 403) return 'Forbidden';
  if (error.status === 404) return 'NotFound';
  if (error.status === 400) return 'BadRequest';
  if (error.status === 422) return 'ValidationError';
  if (error.status >= 500) return 'ServerError';
  return 'HttpError';
}

/**
 * Extract error message from response
 */
function getErrorMessage(error: HttpErrorResponse): string {
  // Handle different error response formats
  if (error.error) {
    if (typeof error.error === 'string') return error.error;
    if (error.error.message) return error.error.message;
    if (error.error.detail) return error.error.detail;
    if (error.error.title) return error.error.title;
    if (error.error.errors) {
      // Handle validation errors
      const errors = error.error.errors;
      if (typeof errors === 'object') {
        const messages = Object.values(errors).flat();
        return messages.slice(0, 3).join('; ');
      }
    }
  }
  return error.statusText || 'Unknown error';
}

/**
 * Extract additional error details (e.g., validation errors)
 */
function getErrorDetails(error: HttpErrorResponse): Record<string, unknown> | undefined {
  if (!error.error) return undefined;
  
  const details: Record<string, unknown> = {};

  // ProblemDetails format from ASP.NET Core
  if (error.error.traceId) details['traceId'] = error.error.traceId;
  if (error.error.type) details['type'] = error.error.type;
  if (error.error.instance) details['instance'] = error.error.instance;
  
  // Validation errors
  if (error.error.errors) {
    details['validationErrors'] = error.error.errors;
  }

  return Object.keys(details).length > 0 ? details : undefined;
}

/**
 * Sanitize request body for logging (remove sensitive data)
 */
function sanitizeRequestBody(body: unknown): Record<string, unknown> | undefined {
  if (!body || typeof body !== 'object') return undefined;

  const sensitiveKeys = ['password', 'token', 'secret', 'credential', 'refreshToken'];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Create an Error object from HttpErrorResponse for structured logging
 */
function createHttpError(error: HttpErrorResponse): Error {
  const httpError = new Error(`HTTP ${error.status}: ${getErrorMessage(error)}`);
  httpError.name = getErrorType(error);
  return httpError;
}
