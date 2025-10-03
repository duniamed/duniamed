import { toast as sonnerToast } from 'sonner';

interface ErrorOptions {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export class AppError extends Error {
  public code?: string;
  public statusCode?: number;
  
  constructor(message: string, code?: string, statusCode?: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function handleError(error: unknown, options?: ErrorOptions) {
  console.error('Error occurred:', error);

  let errorMessage = 'An unexpected error occurred';
  let errorCode: string | undefined;

  if (error instanceof AppError) {
    errorMessage = error.message;
    errorCode = error.code;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  // Show toast notification
  sonnerToast.error(options?.title || 'Error', {
    description: options?.description || errorMessage,
    action: options?.action,
  });

  // Log to monitoring service (if configured)
  if (errorCode) {
    logErrorToMonitoring({ error, code: errorCode });
  }

  return {
    message: errorMessage,
    code: errorCode,
  };
}

export function handleAsyncError<T>(
  promise: Promise<T>,
  options?: ErrorOptions
): Promise<[undefined, T] | [Error]> {
  return promise
    .then((data) => [undefined, data] as [undefined, T])
    .catch((error) => {
      handleError(error, options);
      return [error] as [Error];
    });
}

function logErrorToMonitoring(errorData: { error: unknown; code: string }) {
  // Placeholder for monitoring integration (e.g., NewRelic, Sentry)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with monitoring service
    console.error('Error logged to monitoring:', errorData);
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}
