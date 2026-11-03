import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthCallback } from './AuthCallback';
import { authStore } from '../stores/authStore';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderPage = () =>
  render(React.createElement(MemoryRouter, null, React.createElement(AuthCallback)));

describe('AuthCallback route', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockClear();
    authStore.setUser(null);
    window.history.replaceState(null, '', '/auth/callback');
  });

  afterEach(() => {
    vi.useRealTimers();
    window.history.replaceState(null, '', '/');
  });

  it('waits for the session, then forwards to the profile', async () => {
    renderPage();
    expect(screen.getByText('Signing you in...')).toBeInTheDocument();

    act(() => {
      authStore.setUser({ id: 'u1', email: 'u@example.com' } as any);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/profile', { replace: true });
    });
  });

  it('shows the error Supabase put in the URL', () => {
    window.history.replaceState(
      null,
      '',
      '/auth/callback#error=access_denied&error_description=Email+link+is+invalid+or+has+expired',
    );
    renderPage();
    expect(screen.getByText('Email link is invalid or has expired')).toBeInTheDocument();
  });

  it('gives up after a timeout when no session arrives', () => {
    vi.useFakeTimers();
    renderPage();
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(screen.getByText('Sign-in link failed')).toBeInTheDocument();
  });
});
