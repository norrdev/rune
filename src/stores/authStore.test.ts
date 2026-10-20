import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authStore } from './authStore';
import { supabase } from '../services/supabase';

describe('authStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    authStore.setUser(null);
    authStore.setLoading(false);
  });

  it('computes authentication state correctly', () => {
    expect(authStore.isAuthenticated).toBe(false);
    expect(authStore.isEmailConfirmed).toBe(false);
    expect(authStore.isFullyAuthenticated).toBe(false);
    expect(authStore.userId).toBeUndefined();
    expect(authStore.userEmail).toBeUndefined();

    // User without email confirmation
    authStore.setUser({
      id: 'uid-1',
      email: 'user@example.com',
    } as any);

    expect(authStore.isAuthenticated).toBe(true);
    expect(authStore.isEmailConfirmed).toBe(false);
    expect(authStore.isFullyAuthenticated).toBe(false);
    expect(authStore.userId).toBe('uid-1');
    expect(authStore.userEmail).toBe('user@example.com');

    // Confirmed user
    authStore.setUser({
      id: 'uid-1',
      email: 'user@example.com',
      email_confirmed_at: '2026-01-01T00:00:00Z',
    } as any);

    expect(authStore.isEmailConfirmed).toBe(true);
    expect(authStore.isFullyAuthenticated).toBe(true);
  });

  it('handles signIn successfully', async () => {
    const mockUser = {
      id: 'user-in',
      email: 'in@example.com',
      email_confirmed_at: '2026-01-01',
    } as any;
    vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
      data: { user: mockUser, session: {} as any },
      error: null,
    });

    await authStore.signIn('in@example.com', 'password');
    expect(authStore.user).toEqual(mockUser);
    expect(authStore.isAuthenticated).toBe(true);
  });

  it('throws on signIn error', async () => {
    vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
      data: { user: null, session: null },
      error: new Error('Wrong password') as any,
    });

    await expect(authStore.signIn('in@example.com', 'bad')).rejects.toThrow('Wrong password');
  });

  it('handles signUp successfully', async () => {
    const mockUser = { id: 'user-up', email: 'up@example.com' } as any;
    vi.spyOn(supabase.auth, 'signUp').mockResolvedValueOnce({
      data: { user: mockUser, session: null },
      error: null,
    });

    await authStore.signUp('up@example.com', 'password');
    expect(authStore.user).toEqual(mockUser);
  });

  it('handles signInWithMagicLink', async () => {
    const otpSpy = vi.spyOn(supabase.auth, 'signInWithOtp').mockResolvedValueOnce({
      data: { user: null, session: null },
      error: null,
    });

    await authStore.signInWithMagicLink('otp@example.com');
    expect(otpSpy).toHaveBeenCalled();
  });

  it('handles signOut', async () => {
    authStore.setUser({ id: 'u' } as any);
    vi.spyOn(supabase.auth, 'signOut').mockResolvedValueOnce({
      error: null,
    });

    await authStore.signOut();
    expect(authStore.user).toBeNull();
  });

  it('handles resetPassword', async () => {
    const resetSpy = vi.spyOn(supabase.auth, 'resetPasswordForEmail').mockResolvedValueOnce({
      data: {} as any,
      error: null,
    });

    await authStore.resetPassword('reset@example.com');
    expect(resetSpy).toHaveBeenCalledWith('reset@example.com', {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  });

  it('handles deleteUser', async () => {
    authStore.setUser({ id: 'u' } as any);
    vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
      data: null,
      error: null,
    } as any);
    vi.spyOn(supabase.auth, 'signOut').mockResolvedValueOnce({ error: null });

    await authStore.deleteUser();
    expect(supabase.rpc).toHaveBeenCalledWith('delete_user');
    expect(authStore.user).toBeNull();
  });
});

