import { describe, it, expect, vi } from 'vitest';
import { supabase } from './supabase';

describe('supabase service', () => {
  it('exports a configured supabase client instance', () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
    expect(typeof supabase.rpc).toBe('function');
    expect(typeof supabase.from).toBe('function');
  });

  it('provides singleton client', async () => {
    const { supabase: supabase2 } = await import('./supabase');
    expect(supabase).toBe(supabase2);
  });
});

