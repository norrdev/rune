import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  loading: boolean;
}

class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private loading: boolean = true;

  private constructor() {
    // Initialize auth state
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      this.currentUser = user;
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      this.loading = false;
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async signIn(email: string, password: string, captchaToken: string | null) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        captchaToken: captchaToken || undefined,
      },
    });
    if (error) throw error;
    this.currentUser = data.user;
    return data;
  }

  public async signUp(email: string, password: string, captchaToken: string | null) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        captchaToken: captchaToken || undefined,
      },
    });
    if (error) throw error;
    this.currentUser = data.user;
    return data;
  }

  public async signInWithMagicLink(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  }

  public async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    this.currentUser = null;
  }

  public async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }

  public getUser(): User | null {
    return this.currentUser;
  }

  public isLoading(): boolean {
    return this.loading;
  }
}

export const authService = AuthService.getInstance();
