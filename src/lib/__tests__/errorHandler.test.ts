import { describe, it, expect, vi } from 'vitest';
import { AppError, handleError, handleAsyncError, getErrorMessage } from '../errorHandler';
import { toast as sonnerToast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('errorHandler', () => {
  it('should handle AppError instances', () => {
    const error = new AppError('Test AppError', 'TEST_CODE', 400);
    const result = handleError(error);
    expect(result.message).toBe('Test AppError');
    expect(result.code).toBe('TEST_CODE');
    expect(sonnerToast.error).toHaveBeenCalledWith('Error', {
      description: 'Test AppError',
      action: undefined,
    });
  });

  it('should handle standard Error instances', () => {
    const error = new Error('Test Error');
    const result = handleError(error);
    expect(result.message).toBe('Test Error');
    expect(result.code).toBe(undefined);
    expect(sonnerToast.error).toHaveBeenCalledWith('Error', {
      description: 'Test Error',
      action: undefined,
    });
  });

  it('should handle string errors', () => {
    const error = 'Test string error';
    const result = handleError(error);
    expect(result.message).toBe('Test string error');
    expect(result.code).toBe(undefined);
    expect(sonnerToast.error).toHaveBeenCalledWith('Error', {
      description: 'Test string error',
      action: undefined,
    });
  });

  it('should handle unknown errors', () => {
    const error = { an: 'object' };
    const result = handleError(error);
    expect(result.message).toBe('An unexpected error occurred');
    expect(result.code).toBe(undefined);
    expect(sonnerToast.error).toHaveBeenCalledWith('Error', {
      description: 'An unexpected error occurred',
      action: undefined,
    });
  });

  it('should use custom title and description from options', () => {
    const error = new Error('Test Error');
    const options = {
      title: 'Custom Title',
      description: 'Custom Description',
    };
    handleError(error, options);
    expect(sonnerToast.error).toHaveBeenCalledWith('Custom Title', {
      description: 'Custom Description',
      action: undefined,
    });
  });
});

describe('handleAsyncError', () => {
  it('should return data on successful promise resolution', async () => {
    const promise = Promise.resolve('test data');
    const [error, data] = await handleAsyncError(promise);
    expect(error).toBeUndefined();
    expect(data).toBe('test data');
  });

  it('should return error on failed promise resolution', async () => {
    const testError = new Error('Test Error');
    const promise = Promise.reject(testError);
    const [error, data] = await handleAsyncError(promise);
    expect(error).toBe(testError);
    expect(data).toBeUndefined();
  });
});

describe('getErrorMessage', () => {
  it('should return the message from an Error object', () => {
    const error = new Error('Test Error');
    expect(getErrorMessage(error)).toBe('Test Error');
  });

  it('should return the string if the error is a string', () => {
    const error = 'Test string error';
    expect(getErrorMessage(error)).toBe('Test string error');
  });

  it('should return a generic message for unknown errors', () => {
    const error = { an: 'object' };
    expect(getErrorMessage(error)).toBe('An unexpected error occurred');
  });
});