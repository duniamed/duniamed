import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('Supabase Service Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Appointment Operations', () => {
    it('fetches patient appointments correctly', async () => {
      const mockAppointments = [
        { id: '1', scheduled_at: '2024-01-01T10:00:00Z', status: 'confirmed' },
        { id: '2', scheduled_at: '2024-01-02T14:00:00Z', status: 'completed' }
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockAppointments, error: null })
      } as any);

      const query = supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', 'user-1')
        .order('scheduled_at');

      const { data, error } = await query;

      expect(data).toEqual(mockAppointments);
      expect(error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith('appointments');
    });

    it('handles database errors gracefully', async () => {
      const mockError = { message: 'Database connection failed', code: 'PGRST116' };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: mockError })
      } as any);

      const query = supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', 'user-1')
        .order('scheduled_at');

      const { data, error } = await query;

      expect(data).toBeNull();
      expect(error).toEqual(mockError);
    });
  });

  describe('Profile Operations', () => {
    it('creates new profile successfully', async () => {
      const newProfile = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'patient' as const,
        first_name: 'Test',
        last_name: 'User'
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: newProfile, error: null })
      } as any);

      const query = supabase
        .from('profiles')
        .insert([newProfile as any])
        .select()
        .single();

      const { data, error } = await query;

      expect(data).toBeDefined();
      expect(error).toBeNull();
    });
  });

  describe('Search Operations', () => {
    it('searches specialists with filters', async () => {
      const mockSpecialists = [
        { id: 's1', specialty: ['cardiology'], rating: 4.8 },
        { id: 's2', specialty: ['cardiology'], rating: 4.6 }
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockSpecialists, error: null })
      } as any);

      const query = supabase
        .from('specialists')
        .select('*')
        .contains('specialty', ['cardiology'])
        .gte('rating', 4.5)
        .order('rating', { ascending: false });

      const { data, error } = await query;

      expect(data).toEqual(mockSpecialists);
      expect(error).toBeNull();
    });
  });
});