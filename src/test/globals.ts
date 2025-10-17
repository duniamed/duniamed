import { vi } from 'vitest';

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

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  });
  mockSelect.mockReturnValue({
    eq: mockEq,
  });
  mockEq.mockReturnValue({
    eq: mockEq,
    order: mockOrder,
  });
  mockUpdate.mockReturnValue({
    eq: mockEq,
  });
  mockDelete.mockReturnValue({
    eq: mockEq,
  });
});