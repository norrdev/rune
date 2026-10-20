import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from './supabase';
import { authService } from './auth';

describe('authService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes auth and returns user/loading state', async () => {
    expect(typeof authService.getUser).toBe('function');
    expect(typeof authService.isLoading).toBe('function');
  });

  describe('signIn', () => {
    it('calls supabase signInWithPassword and updates user', async () => {
      const mockUser = { id: 'u1', email: 'test@example.com' } as any;
      vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
        data: { user: mockUser, session: {} as any },
        error: null,
      });

      const result = await authService.signIn('test@example.com', 'password', null);
      expect(result.user).toEqual(mockUser);
      expect(authService.getUser()).toEqual(mockUser);
    });

    it('throws when supabase signInWithPassword returns error', async () => {
      vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
        data: { user: null, session: null },
        error: new Error('Invalid credentials') as any,
      });

      await expect(
        authService.signIn('test@example.com', 'wrong', 'captcha-123'),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('signUp', () => {
    it('calls supabase signUp and updates user', async () => {
      const mockUser = { id: 'u2', email: 'new@example.com' } as any;
      vi.spyOn(supabase.auth, 'signUp').mockResolvedValueOnce({
        data: { user: mockUser, session: null },
        error: null,
      });

      const result = await authService.signUp('new@example.com', 'pass', 'captcha-456');
      expect(result.user).toEqual(mockUser);
      expect(authService.getUser()).toEqual(mockUser);
    });

    it('throws when supabase signUp fails', async () => {
      vi.spyOn(supabase.auth, 'signUp').mockResolvedValueOnce({
        data: { user: null, session: null },
        error: new Error('User already registered') as any,
      });

      await expect(authService.signUp('test@example.com', 'pass', null)).rejects.toThrow(
        'User already registered',
      );
    });
  });

  describe('signInWithMagicLink', () => {
    it('calls signInWithOtp with emailRedirectTo', async () => {
      const otpSpy = vi.spyOn(supabase.auth, 'signInWithOtp').mockResolvedValueOnce({
        data: { user: null, session: null },
        error: null,
      });

      await authService.signInWithMagicLink('magic@example.com');
      expect(otpSpy).toHaveBeenCalledWith({
        email: 'magic@example.com',
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    });

    it('throws error when signInWithOtp fails', async () => {
      vi.spyOn(supabase.auth, 'signInWithOtp').mockResolvedValueOnce({
        data: { user: null, session: null },
        error: new Error('OTP failed') as any,
      });

      await expect(authService.signInWithMagicLink('magic@example.com')).rejects.toThrow(
        'OTP failed',
      );
    });
  });

  describe('signOut', () => {
    it('signs out and clears current user', async () => {
      vi.spyOn(supabase.auth, 'signOut').mockResolvedValueOnce({
        error: null,
      });

      await authService.signOut();
      expect(authService.getUser()).toBeNull();
    });

    it('throws if signOut returns error', async () => {
      vi.spyOn(supabase.auth, 'signOut').mockResolvedValueOnce({
        error: new Error('Signout failed') as any,
      });

      await expect(authService.signOut()).rejects.toThrow('Signout failed');
    });
  });

  describe('resetPassword', () => {
    it('calls resetPasswordForEmail with redirect', async () => {
      const resetSpy = vi.spyOn(supabase.auth, 'resetPasswordForEmail').mockResolvedValueOnce({
        data: {} as any,
        error: null,
      });

      await authService.resetPassword('reset@example.com');
      expect(resetSpy).toHaveBeenCalledWith('reset@example.com', {
        redirectTo: `${window.location.origin}/reset-password`,
      });
    });

    it('throws error when resetPassword fails', async () => {
      vi.spyOn(supabase.auth, 'resetPasswordForEmail').mockResolvedValueOnce({
        data: {} as any,
        error: new Error('Reset failed') as any,
      });

      await expect(authService.resetPassword('reset@example.com')).rejects.toThrow(
        'Reset failed',
      );
    });
  });
});

