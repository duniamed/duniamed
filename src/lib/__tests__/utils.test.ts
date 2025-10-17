import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn', () => {
  it('should merge tailwind classes', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('should handle conditional classes', () => {
    expect(cn('bg-red-500', { 'bg-blue-500': true })).toBe('bg-blue-500');
    expect(cn('bg-red-500', { 'bg-blue-500': false })).toBe('bg-red-500');
  });

  it('should handle different types of inputs', () => {
    expect(cn('bg-red-500', null, undefined, 'bg-blue-500')).toBe('bg-blue-500');
  });
});