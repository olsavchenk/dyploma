import { ErrorHandler, Injectable, inject, NgZone } from '@angular/core';
import { LoggingService } from '../services/logging.service';

/**
 * Global error handler that catches all unhandled errors in the Angular application.
 * 
 * Features:
 * - Catches unhandled Promise rejections
 * - Catches synchronous errors in components/services
 * - Logs errors with full stack traces for AI debugging
 * - Includes correlation ID from last HTTP request
 * - Extracts component/directive context when available
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly logger = inject(LoggingService);
  private readonly zone = inject(NgZone);

  handleError(error: unknown): void {
    // Run outside Angular zone to prevent change detection issues
    this.zone.runOutsideAngular(() => {
      this.logError(error);
    });
  }

  private logError(error: unknown): void {
    const errorInfo = this.extractErrorInfo(error);

    this.logger.error(
      'GlobalErrorHandler',
      `Unhandled error: ${errorInfo.message}`,
      {
        errorType: errorInfo.type,
        componentStack: errorInfo.componentStack,
        source: errorInfo.source,
        isPromiseRejection: errorInfo.isPromiseRejection,
        additionalInfo: errorInfo.additionalInfo,
      },
      errorInfo.originalError
    );

    // Also log to console in development for immediate visibility
    if (this.isDevMode()) {
      console.groupCollapsed(
        `%c🔴 Unhandled Error: ${errorInfo.message}`,
        'color: #ff4444; font-weight: bold;'
      );
      console.error('Original Error:', errorInfo.originalError);
      if (errorInfo.componentStack) {
        console.log('Component Stack:', errorInfo.componentStack);
      }
      console.log('Correlation ID:', this.logger.getCorrelationId() ?? 'N/A');
      console.groupEnd();
    }
  }

  private extractErrorInfo(error: unknown): ErrorInfo {
    const info: ErrorInfo = {
      message: 'Unknown error',
      type: 'UnknownError',
      originalError: error,
      isPromiseRejection: false,
    };

    // Handle Error objects
    if (error instanceof Error) {
      info.message = error.message;
      info.type = error.name;
      info.originalError = error;

      // Check for Angular-specific error properties
      if ('ngDebugContext' in error) {
        info.componentStack = this.extractComponentStack(error);
      }

      // Check for zone.js unhandled promise rejection
      if (error.message?.includes('Uncaught (in promise)')) {
        info.isPromiseRejection = true;
        info.message = error.message.replace('Uncaught (in promise): ', '');
      }
    }

    // Handle ErrorEvent (e.g., from window.onerror)
    if (error instanceof ErrorEvent) {
      info.message = error.message;
      info.type = 'ErrorEvent';
      info.source = `${error.filename}:${error.lineno}:${error.colno}`;
      if (error.error) {
        info.originalError = error.error;
      }
    }

    // Handle PromiseRejectionEvent
    if (typeof PromiseRejectionEvent !== 'undefined' && error instanceof PromiseRejectionEvent) {
      info.isPromiseRejection = true;
      info.type = 'UnhandledPromiseRejection';
      
      if (error.reason instanceof Error) {
        info.message = error.reason.message;
        info.originalError = error.reason;
      } else {
        info.message = String(error.reason);
        info.additionalInfo = { reason: error.reason };
      }
    }

    // Handle HTTP errors that weren't caught
    if (this.isHttpErrorResponse(error)) {
      info.type = 'HttpError';
      info.message = `HTTP ${error.status}: ${error.statusText}`;
      info.additionalInfo = {
        url: error.url,
        status: error.status,
        statusText: error.statusText,
      };
    }

    // Handle plain objects (sometimes thrown)
    if (typeof error === 'object' && error !== null && !(error instanceof Error)) {
      const errorObj = error as Record<string, unknown>;
      if (errorObj['message']) {
        info.message = String(errorObj['message']);
      }
      if (errorObj['name']) {
        info.type = String(errorObj['name']);
      }
      info.additionalInfo = { ...errorObj };
    }

    // Handle primitive types
    if (typeof error === 'string') {
      info.message = error;
      info.type = 'StringError';
    }

    return info;
  }

  private extractComponentStack(error: Error): string | undefined {
    try {
      // Angular debug context may contain component information
      const ngDebugContext = (error as ErrorWithNgContext).ngDebugContext;
      if (ngDebugContext) {
        const components: string[] = [];
        let context: typeof ngDebugContext | undefined = ngDebugContext;
        
        while (context) {
          if (context.component) {
            const componentName = context.component.constructor?.name ?? 'Unknown';
            components.push(componentName);
          }
          context = context.parentContext;
        }

        return components.length > 0 ? components.join(' → ') : undefined;
      }
    } catch {
      // Ignore errors extracting component stack
    }
    return undefined;
  }

  private isHttpErrorResponse(error: unknown): error is HttpErrorLike {
    return (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      'statusText' in error &&
      'url' in error
    );
  }

  private isDevMode(): boolean {
    try {
      return (
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1')
      );
    } catch {
      return false;
    }
  }
}

/**
 * Internal interface for extracted error information
 */
interface ErrorInfo {
  message: string;
  type: string;
  originalError: unknown;
  componentStack?: string;
  source?: string;
  isPromiseRejection: boolean;
  additionalInfo?: Record<string, unknown>;
}

/**
 * Interface for Angular errors with debug context
 */
interface ErrorWithNgContext extends Error {
  ngDebugContext?: {
    component?: { constructor?: { name?: string } };
    parentContext?: ErrorWithNgContext['ngDebugContext'];
  };
}

/**
 * Interface for HTTP-like errors
 */
interface HttpErrorLike {
  status: number;
  statusText: string;
  url: string;
}
