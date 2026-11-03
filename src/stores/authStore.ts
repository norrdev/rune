import { makeObservable, observable, computed, action, runInAction } from 'mobx';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

const PUBLIC_SITE_URL = 'https://runestonesafari.com';

// Auth emails must link to the web app: in Tauri builds the origin is the app's
// internal scheme (tauri://localhost, http://tauri.localhost), unreachable from a mail client.
export const getAuthRedirectBase = (): string => {
  const { protocol, hostname, origin } = window.location;
  const isWebOrigin =
    (protocol === 'http:' || protocol === 'https:') && !hostname.endsWith('tauri.localhost');
  return isWebOrigin ? origin : PUBLIC_SITE_URL;
};

class AuthStore {
  user: User | null = null;
  // True until the initial session check resolves, so pages don't flash a logged-out state.
  loading: boolean = true;

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
      updatePassword: action,
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
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
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
        emailRedirectTo: `${getAuthRedirectBase()}/auth/callback`,
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
      redirectTo: `${getAuthRedirectBase()}/reset-password`,
    });
    if (error) throw error;
  }

  async updatePassword(password: string) {
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    runInAction(() => {
      this.setUser(data.user);
    });
  }

  async deleteUser() {
    const { error } = await supabase.rpc('delete_user');
    if (error) throw error;
    // Session is gone server-side after delete_user; sign out locally to drop tokens.
    await supabase.auth.signOut().catch(() => {});
    runInAction(() => {
      this.setUser(null);
    });
  }

  get isAuthenticated() {
    return this.user !== null;
  }

  get isEmailConfirmed() {
    return !!this.user?.email_confirmed_at;
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
  if (
    event === 'SIGNED_IN' ||
    event === 'TOKEN_REFRESHED' ||
    event === 'USER_UPDATED' ||
    event === 'PASSWORD_RECOVERY' ||
    event === 'INITIAL_SESSION'
  ) {
    runInAction(() => {
      authStore.setUser(session?.user ?? null);
    });
  } else if (event === 'SIGNED_OUT') {
    runInAction(() => {
      authStore.setUser(null);
    });
  }
});
