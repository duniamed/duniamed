import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

// Mock hook
const useAuth = () => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };
    getUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (data.user) setUser(data.user);
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return { user, loading, signIn, signOut };
};

describe('useAuth Hook', () => {
  it('initializes with loading state', () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null
    } as any);

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('loads user successfully', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com'
    };

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null
    } as any);

    const { result } = renderHook(() => useAuth());

    // Wait for state update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual(mockUser);
  });

  it('handles sign in', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com'
    };

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: mockUser, session: {} },
      error: null
    } as any);

    const { result } = renderHook(() => useAuth());

    const signInResult = await result.current.signIn('test@example.com', 'password');

    expect(signInResult.data.user).toEqual(mockUser);
    expect(signInResult.error).toBeNull();
  });

  it('handles sign out', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth());

    await result.current.signOut();

    expect(result.current.user).toBeNull();
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});