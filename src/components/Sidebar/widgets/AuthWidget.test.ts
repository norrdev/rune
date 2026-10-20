import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthWidget } from './AuthWidget';
import { authStore } from '../../../stores/authStore';

describe('AuthWidget', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    authStore.setUser(null);
    authStore.setLoading(false);
  });

  it('renders loading state when authStore.loading is true', () => {
    authStore.setLoading(true);
    render(
      React.createElement(MemoryRouter, null, React.createElement(AuthWidget)),
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders unconfirmed user state', () => {
    authStore.setUser({
      id: 'u1',
      email: 'unconfirmed@example.com',
    } as any);

    render(
      React.createElement(MemoryRouter, null, React.createElement(AuthWidget)),
    );

    expect(screen.getByText('Email confirmation required')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument();
  });

  it('renders signed in user state with profile link', () => {
    authStore.setUser({
      id: 'u1',
      email: 'confirmed@example.com',
      email_confirmed_at: '2026-01-01',
    } as any);

    render(
      React.createElement(MemoryRouter, null, React.createElement(AuthWidget)),
    );

    expect(screen.getByText('View Profile')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument();
  });

  it('handles sign in form submission', async () => {
    vi.spyOn(authStore, 'signIn').mockResolvedValue({ user: {} } as any);

    render(
      React.createElement(MemoryRouter, null, React.createElement(AuthWidget)),
    );

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitBtn = screen.getByRole('button', { name: 'Sign In' });

    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'pass123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authStore.signIn).toHaveBeenCalledWith('user@test.com', 'pass123');
    });
  });

  it('toggles between sign in and sign up', () => {
    render(
      React.createElement(MemoryRouter, null, React.createElement(AuthWidget)),
    );

    const toggleBtn = screen.getByText('Need an account? Sign Up');
    fireEvent.click(toggleBtn);

    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
    expect(screen.getByText('Already have an account? Sign In')).toBeInTheDocument();
  });

  it('switches to forgot password and back', () => {
    render(
      React.createElement(MemoryRouter, null, React.createElement(AuthWidget)),
    );

    fireEvent.click(screen.getByText('Forgot password?'));
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument();

    fireEvent.click(screen.getByText('Back to Sign In'));
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('switches to magic link mode and back', () => {
    render(
      React.createElement(MemoryRouter, null, React.createElement(AuthWidget)),
    );

    fireEvent.click(screen.getByText('Sign in with Magic Link'));
    expect(screen.getByRole('button', { name: 'Send Magic Link' })).toBeInTheDocument();

    fireEvent.click(screen.getByText('Back to Sign In'));
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });
});

