import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAvailability } from '../useAvailability';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('useAvailability', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch availability schedules successfully', async () => {
    const mockData = [{ id: '1', day_of_week: 1, start_time: '09:00', end_time: '17:00' }];
    const from = vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    } as any);

    const { result } = renderHook(() =>
      useAvailability({ specialistId: 'specialist-1', autoFetch: true })
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.availability).toEqual(mockData);
  });

  it('should handle fetch errors gracefully', async () => {
    const from = vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
    } as any);

    const { result } = renderHook(() =>
      useAvailability({ specialistId: 'specialist-1', autoFetch: true })
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.availability).toEqual([]);
  });

  it('should add a new availability slot and refetch', async () => {
    const newSlot = { specialist_id: 'specialist-1', day_of_week: 2, start_time: '10:00', end_time: '11:00', is_active: true };
    const from = vi.spyOn(supabase, 'from').mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: [newSlot], error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [newSlot], error: null }),
    } as any);

    const { result } = renderHook(() =>
      useAvailability({ specialistId: 'specialist-1', autoFetch: false })
    );

    await act(async () => {
      await result.current.addSlot(newSlot);
    });

    expect(from().insert).toHaveBeenCalledWith(newSlot);
    expect(result.current.availability).toEqual([newSlot]);
  });

  it('should update an existing slot and refetch', async () => {
    const updatedSlot = { start_time: '10:00' };
    const from = vi.spyOn(supabase, 'from').mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [{...updatedSlot}], error: null }),
    } as any);

    const { result } = renderHook(() =>
      useAvailability({ specialistId: 'specialist-1', autoFetch: false })
    );

    await act(async () => {
      await result.current.updateSlot('slot-1', updatedSlot);
    });

    expect(from().update).toHaveBeenCalledWith(updatedSlot);
    expect(from().eq).toHaveBeenCalledWith('id', 'slot-1');
  });

  it('should delete a slot and refetch', async () => {
    const from = vi.spyOn(supabase, 'from').mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    } as any);

    const { result } = renderHook(() =>
      useAvailability({ specialistId: 'specialist-1', autoFetch: false })
    );

    await act(async () => {
      await result.current.deleteSlot('slot-1');
    });

    expect(from().delete).toHaveBeenCalled();
    expect(from().eq).toHaveBeenCalledWith('id', 'slot-1');
  });
});