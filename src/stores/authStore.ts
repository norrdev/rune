import { makeObservable, observable, computed, action, runInAction } from 'mobx';
import type { User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from '../services/supabase';

class AuthStore {
  user: User | null = null;
  loading: boolean = false;

  constructor() {
    makeObservable(this, {
      user: observable,
      loading: observable,
      setUser: action,
      setLoading: action,
      signIn: action,
      signUp: action,
      signInWithMagicLink: action,
      signOut: action,
      resetPassword: action,
      deleteUser: action,
      isAuthenticated: computed,
      isEmailConfirmed: computed,
      isFullyAuthenticated: computed,
      userId: computed,
      userEmail: computed,
    });
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      runInAction(() => {
        this.setUser(user);
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }

  setUser(user: User | null) {
    this.user = user;
  }

  setLoading(loading: boolean) {
    this.loading = loading;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    runInAction(() => {
      this.setUser(data.user);
    });
    return data;
  }

  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    runInAction(() => {
      this.setUser(data.user);
    });
    return data;
  }

  async signInWithMagicLink(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: Platform.OS === 'web' ? `${window.location.origin}/auth/callback` : Linking.createURL('/auth/callback'),
      },
    });
    if (error) throw error;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    runInAction(() => {
      this.setUser(null);
    });
  }

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: Platform.OS === 'web' ? `${window.location.origin}/reset-password` : Linking.createURL('/reset-password'),
    });
    if (error) throw error;
  }

  async deleteUser() {
    const { error } = await supabase.rpc('delete_user');
    if (error) throw error;
    runInAction(() => {
      this.setUser(null);
    });
  }

  get isAuthenticated() {
    return this.user !== null;
  }

  get isEmailConfirmed() {
    return this.user?.email_confirmed_at !== undefined;
  }

  get isFullyAuthenticated() {
    return this.isAuthenticated && this.isEmailConfirmed;
  }

  get userId() {
    return this.user?.id;
  }

  get userEmail() {
    return this.user?.email;
  }
}

// Create and export a singleton instance
export const authStore = new AuthStore();

// Set up Supabase auth state listener
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    runInAction(() => {
      authStore.setUser(session?.user ?? null);
    });
  } else if (event === 'SIGNED_OUT') {
    runInAction(() => {
      authStore.setUser(null);
    });
  }
});
