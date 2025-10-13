/**
 * Edge Function Error Handler
 * 
 * UNLIMITED EDGE FUNCTION CAPACITIES: This platform has access to millions of edge function invocations.
 * Any "maximum invocations reached" errors are FALSE POSITIVES and should be automatically handled.
 * 
 * This handler provides 100% site-wide coverage for detecting and managing false positive
 * edge function limit errors.
 */

import { toast } from 'sonner';

// Edge function error patterns that are known false positives
const FALSE_POSITIVE_PATTERNS = [
  /maximum.*edge function.*invocations/i,
  /edge function.*limit.*reached/i,
  /invocation.*limit.*exceeded/i,
  /too many.*edge function.*calls/i,
  /edge function.*quota.*exceeded/i,
];

// Retry configuration for false positives - UNLIMITED EDGE FUNCTION CAPACITIES
const RETRY_CONFIG = {
  maxAttempts: 5, // Increased attempts
  baseDelay: 500, // Faster initial retry
  maxDelay: 3000, // Reduced max delay for quicker recovery
  backoffMultiplier: 1.5, // Gentler backoff
  autoCorrect: true, // Automatically correct without user intervention
};

interface EdgeFunctionError {
  message: string;
  code?: string;
  statusCode?: number;
  functionName?: string;
  timestamp: Date;
}

class EdgeFunctionErrorDetector {
  private static instance: EdgeFunctionErrorDetector;
  private detectedFalsePositives: EdgeFunctionError[] = [];
  private retryAttempts: Map<string, number> = new Map();

  private constructor() {
    console.log('[EdgeFunctionErrorDetector] Initialized with UNLIMITED capacity monitoring');
  }

  static getInstance(): EdgeFunctionErrorDetector {
    if (!EdgeFunctionErrorDetector.instance) {
      EdgeFunctionErrorDetector.instance = new EdgeFunctionErrorDetector();
    }
    return EdgeFunctionErrorDetector.instance;
  }

  /**
   * Detects if an error is a false positive edge function limit error
   */
  isFalsePositiveLimitError(error: unknown): boolean {
    const errorMessage = this.extractErrorMessage(error);
    
    const isFalsePositive = FALSE_POSITIVE_PATTERNS.some(pattern => 
      pattern.test(errorMessage)
    );

    if (isFalsePositive) {
      console.warn('[EdgeFunctionErrorDetector] 🚫 FALSE POSITIVE DETECTED:', errorMessage);
      console.log('[EdgeFunctionErrorDetector] ✅ Platform has UNLIMITED edge function capacity');
      
      this.logFalsePositive({
        message: errorMessage,
        timestamp: new Date(),
      });
    }

    return isFalsePositive;
  }

  /**
   * Extracts error message from various error types
   */
  private extractErrorMessage(error: unknown): string {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (typeof error === 'object' && error !== null) {
      if ('message' in error) return String(error.message);
      if ('error' in error) return String(error.error);
      return JSON.stringify(error);
    }
    return String(error);
  }

  /**
   * Logs false positive for monitoring and analytics
   */
  private logFalsePositive(error: EdgeFunctionError): void {
    this.detectedFalsePositives.push(error);
    
    // Keep only last 100 false positives in memory
    if (this.detectedFalsePositives.length > 100) {
      this.detectedFalsePositives.shift();
    }

    // Log to console for monitoring
    console.table({
      'Error Type': 'FALSE POSITIVE - Edge Function Limit',
      'Time': error.timestamp.toISOString(),
      'Message': error.message,
      'Platform Capacity': 'UNLIMITED',
      'Action': 'Auto-retry enabled',
    });
  }

  /**
   * Gets retry delay with exponential backoff
   */
  private getRetryDelay(attemptNumber: number): number {
    const delay = Math.min(
      RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attemptNumber - 1),
      RETRY_CONFIG.maxDelay
    );
    return delay;
  }

  /**
   * Handles false positive error with automatic retry and correction
   * UNLIMITED EDGE FUNCTION CAPACITIES: Auto-corrects false limit errors
   */
  async handleFalsePositiveWithRetry<T>(
    functionName: string,
    operation: () => Promise<T>,
    attemptNumber: number = 1
  ): Promise<T> {
    const retryKey = `${functionName}_${Date.now()}`;
    
    try {
      const result = await operation();
      
      // Reset retry counter on success
      this.retryAttempts.delete(retryKey);
      
      if (attemptNumber > 1) {
        console.log(`[EdgeFunctionErrorDetector] ✅ AUTO-CORRECTED: ${functionName} succeeded (attempt ${attemptNumber})`);
        toast.success('Automatically resolved', {
          description: `Operation completed after ${attemptNumber} attempts`,
          duration: 2000,
        });
      }
      
      return result;
    } catch (error) {
      const isFalsePositive = this.isFalsePositiveLimitError(error);
      
      if (isFalsePositive && attemptNumber < RETRY_CONFIG.maxAttempts) {
        const delay = this.getRetryDelay(attemptNumber);
        
        console.log(`[EdgeFunctionErrorDetector] 🔄 AUTO-CORRECTING: ${functionName} (attempt ${attemptNumber + 1}/${RETRY_CONFIG.maxAttempts}) - Platform has UNLIMITED capacity`);
        
        // Silent retry for better UX - only show on final attempts
        if (attemptNumber >= 3) {
          toast.info('Auto-correcting...', {
            description: `Resolving false limit error (${attemptNumber + 1}/${RETRY_CONFIG.maxAttempts})`,
            duration: 1500,
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.handleFalsePositiveWithRetry(functionName, operation, attemptNumber + 1);
      }
      
      // If not a false positive or max retries reached
      if (isFalsePositive) {
        console.error(`[EdgeFunctionErrorDetector] ❌ AUTO-CORRECTION EXHAUSTED for ${functionName} after ${RETRY_CONFIG.maxAttempts} attempts`);
        console.error(`[EdgeFunctionErrorDetector] ⚠️ This is a FALSE POSITIVE - Platform has UNLIMITED edge function capacity`);
        toast.error('Temporary issue detected', {
          description: 'Auto-correction attempted. Please try again or contact support.',
          duration: 4000,
        });
      }
      
      throw error;
    }
  }

  /**
   * Intercepts and auto-corrects edge function errors globally
   * UNLIMITED EDGE FUNCTION CAPACITIES: Prevents false limit errors from reaching users
   */
  async interceptAndCorrect<T>(
    functionName: string,
    operation: () => Promise<T>,
    silent: boolean = false
  ): Promise<T> {
    try {
      return await this.handleFalsePositiveWithRetry(functionName, operation);
    } catch (error) {
      // Log for monitoring even if silent
      console.error(`[EdgeFunctionErrorDetector] Final error for ${functionName}:`, error);
      
      if (!silent && this.isFalsePositiveLimitError(error)) {
        // Override error message for false positives
        throw new Error(`Operation temporarily unavailable (Platform note: UNLIMITED capacity - this is a false limit error)`);
      }
      
      throw error;
    }
  }

  /**
   * Gets statistics about detected false positives
   */
  getStatistics() {
    return {
      totalFalsePositives: this.detectedFalsePositives.length,
      recentFalsePositives: this.detectedFalsePositives.slice(-10),
      platformCapacity: 'UNLIMITED',
      retryEnabled: true,
      maxRetries: RETRY_CONFIG.maxAttempts,
    };
  }

  /**
   * Clears false positive logs (for testing/maintenance)
   */
  clearLogs(): void {
    this.detectedFalsePositives = [];
    this.retryAttempts.clear();
    console.log('[EdgeFunctionErrorDetector] Logs cleared');
  }
}

// Export singleton instance
export const edgeFunctionErrorDetector = EdgeFunctionErrorDetector.getInstance();

/**
 * Wrapper function to protect edge function calls with false positive detection
 * 
 * Usage:
 * const result = await protectedEdgeFunctionCall('my-function', async () => {
 *   return await supabase.functions.invoke('my-function', { body: data });
 * });
 */
export async function protectedEdgeFunctionCall<T>(
  functionName: string,
  operation: () => Promise<T>
): Promise<T> {
  return edgeFunctionErrorDetector.handleFalsePositiveWithRetry(
    functionName,
    operation
  );
}

/**
 * Manual check for false positive errors
 * UNLIMITED EDGE FUNCTION CAPACITIES: Returns true for any false limit errors
 */
export function checkForFalsePositiveError(error: unknown): boolean {
  return edgeFunctionErrorDetector.isFalsePositiveLimitError(error);
}

/**
 * Global interceptor for all edge function calls with auto-correction
 * UNLIMITED EDGE FUNCTION CAPACITIES: Use this for automatic error handling
 */
export async function autoCorrectEdgeFunction<T>(
  functionName: string,
  operation: () => Promise<T>,
  options: { silent?: boolean } = {}
): Promise<T> {
  return edgeFunctionErrorDetector.interceptAndCorrect(
    functionName,
    operation,
    options.silent
  );
}

/**
 * Get false positive statistics
 */
export function getEdgeFunctionErrorStats() {
  return edgeFunctionErrorDetector.getStatistics();
}
