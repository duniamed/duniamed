import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast, toast, reducer } from '../use-toast';

describe('useToast', () => {
  beforeEach(() => {
    // Reset state before each test
    reducer({ toasts: [] }, { type: 'REMOVE_TOAST' });
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it('should add a toast', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      toast({ title: 'Test Toast' });
    });
    expect(result.current.toasts.length).toBe(1);
    expect(result.current.toasts[0].title).toBe('Test Toast');
  });

  it('should dismiss a toast', () => {
    const { result } = renderHook(() => useToast());
    let toastId;
    act(() => {
      const { id } = toast({ title: 'Test Toast' });
      toastId = id;
    });
    expect(result.current.toasts.length).toBe(1);
    act(() => {
      result.current.dismiss(toastId);
    });
    expect(result.current.toasts[0].open).toBe(false);
  });
});

describe('toast reducer', () => {
  it('should add a toast', () => {
    const initialState = { toasts: [] };
    const newToast = { id: '1', title: 'Test Toast', open: true, onOpenChange: () => {} };
    const action = { type: 'ADD_TOAST', toast: newToast };
    const state = reducer(initialState, action);
    expect(state.toasts).toEqual([newToast]);
  });

  it('should update a toast', () => {
    const initialState = { toasts: [{ id: '1', title: 'Old Title', open: true, onOpenChange: () => {} }] };
    const updatedToast = { id: '1', title: 'New Title' };
    const action = { type: 'UPDATE_TOAST', toast: updatedToast };
    const state = reducer(initialState, action);
    expect(state.toasts[0].title).toBe('New Title');
  });

  it('should dismiss a toast', () => {
    const initialState = { toasts: [{ id: '1', title: 'Test Toast', open: true, onOpenChange: () => {} }] };
    const action = { type: 'DISMISS_TOAST', toastId: '1' };
    const state = reducer(initialState, action);
    expect(state.toasts[0].open).toBe(false);
  });

  it('should remove a toast', () => {
    const initialState = { toasts: [{ id: '1', title: 'Test Toast', open: true, onOpenChange: () => {} }] };
    const action = { type: 'REMOVE_TOAST', toastId: '1' };
    const state = reducer(initialState, action);
    expect(state.toasts).toEqual([]);
  });
});