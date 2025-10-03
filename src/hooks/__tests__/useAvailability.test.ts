import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAvailability } from '../useAvailability';

const waitFor = async (callback: () => void) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  callback();
};

// Mock Supabase
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
  },
}));

describe('useAvailability', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock chain
    mockOrder.mockReturnThis();
    mockEq.mockReturnThis();
    mockSelect.mockReturnThis();
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    });
  });

  describe('fetchAvailability', () => {
    it('should fetch availability schedules successfully', async () => {
      const mockData = [
        {
          id: '1',
          specialist_id: 'specialist-1',
          day_of_week: 1,
          start_time: '09:00',
          end_time: '17:00',
          is_active: true,
        },
      ];

      mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          eq: mockEq.mockReturnValue({
            order: mockOrder.mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() =>
        useAvailability({ specialistId: 'specialist-1', autoFetch: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.availability).toEqual(mockData);
      expect(mockFrom).toHaveBeenCalledWith('availability_schedules');
    });

    it('should handle fetch errors gracefully', async () => {
      mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          eq: mockEq.mockReturnValue({
            order: mockOrder.mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      const { result } = renderHook(() =>
        useAvailability({ specialistId: 'specialist-1', autoFetch: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.availability).toEqual([]);
    });

    it('should not auto-fetch when autoFetch is false', () => {
      renderHook(() =>
        useAvailability({ specialistId: 'specialist-1', autoFetch: false })
      );

      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('addSlot', () => {
    it('should add a new availability slot', async () => {
      const mockData = [
        {
          id: '1',
          specialist_id: 'specialist-1',
          day_of_week: 1,
          start_time: '09:00',
          end_time: '17:00',
          is_active: true,
        },
      ];

      mockInsert.mockResolvedValue({ data: null, error: null });
      mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          eq: mockEq.mockReturnValue({
            order: mockOrder.mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() =>
        useAvailability({ specialistId: 'specialist-1', autoFetch: false })
      );

      await result.current.addSlot({
        specialist_id: 'specialist-1',
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00',
        is_active: true,
      });

      expect(mockInsert).toHaveBeenCalledWith({
        specialist_id: 'specialist-1',
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00',
        is_active: true,
      });
    });
  });

  describe('updateSlot', () => {
    it('should update an existing slot', async () => {
      mockUpdate.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });
      mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          eq: mockEq.mockReturnValue({
            order: mockOrder.mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() =>
        useAvailability({ specialistId: 'specialist-1', autoFetch: false })
      );

      await result.current.updateSlot('slot-1', { start_time: '10:00' });

      expect(mockUpdate).toHaveBeenCalledWith({ start_time: '10:00' });
    });
  });

  describe('deleteSlot', () => {
    it('should delete a slot', async () => {
      mockDelete.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });
      mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          eq: mockEq.mockReturnValue({
            order: mockOrder.mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() =>
        useAvailability({ specialistId: 'specialist-1', autoFetch: false })
      );

      await result.current.deleteSlot('slot-1');

      expect(mockDelete).toHaveBeenCalled();
    });
  });
});
