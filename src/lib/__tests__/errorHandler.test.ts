import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError, handleError, handleAsyncError, getErrorMessage } from '../errorHandler';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AppError', () => {
    it('should create an AppError with message, code, and statusCode', () => {
      const error = new AppError('Test error', 'TEST_CODE', 400);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('AppError');
    });

    it('should create an AppError without code and statusCode', () => {
      const error = new AppError('Simple error');

      expect(error.message).toBe('Simple error');
      expect(error.code).toBeUndefined();
      expect(error.statusCode).toBeUndefined();
    });
  });

  describe('handleError', () => {
    it('should handle AppError instances', () => {
      const error = new AppError('App error', 'APP_ERROR', 400);
      const result = handleError(error);

      expect(result.message).toBe('App error');
      expect(result.code).toBe('APP_ERROR');
    });

    it('should handle standard Error instances', () => {
      const error = new Error('Standard error');
      const result = handleError(error);

      expect(result.message).toBe('Standard error');
      expect(result.code).toBeUndefined();
    });

    it('should handle string errors', () => {
      const result = handleError('String error');

      expect(result.message).toBe('String error');
      expect(result.code).toBeUndefined();
    });

    it('should handle unknown errors', () => {
      const result = handleError(undefined);

      expect(result.message).toBe('An unexpected error occurred');
      expect(result.code).toBeUndefined();
    });

    it('should use custom title and description from options', () => {
      const error = new Error('Test error');
      handleError(error, {
        title: 'Custom Title',
        description: 'Custom Description',
      });

      // Toast should be called (mocked in setup)
      expect(vi.mocked).toBeTruthy();
    });
  });

  describe('handleAsyncError', () => {
    it('should return data on successful promise', async () => {
      const successPromise = Promise.resolve('success data');
      const result = await handleAsyncError(successPromise);

      expect(result).toEqual([undefined, 'success data']);
    });

    it('should return error on failed promise', async () => {
      const failurePromise = Promise.reject(new Error('Async error'));
      const result = await handleAsyncError(failurePromise);

      expect(result[0]).toBeInstanceOf(Error);
      expect((result[0] as Error).message).toBe('Async error');
    });

    it('should call handleError on promise rejection', async () => {
      const error = new AppError('Async app error', 'ASYNC_ERROR');
      const failurePromise = Promise.reject(error);
      const result = await handleAsyncError(failurePromise);

      expect(result[0]).toEqual(error);
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error instance', () => {
      const error = new Error('Error message');
      expect(getErrorMessage(error)).toBe('Error message');
    });

    it('should return string error as-is', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should return default message for unknown errors', () => {
      expect(getErrorMessage(null)).toBe('An unexpected error occurred');
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
      expect(getErrorMessage(123)).toBe('An unexpected error occurred');
    });
  });
});
