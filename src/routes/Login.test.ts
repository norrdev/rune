import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Login } from './Login';
import { authStore } from '../stores/authStore';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login route', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    authStore.setUser(null);
  });

  it('renders login form with inputs and submit button', () => {
    render(React.createElement(MemoryRouter, null, React.createElement(Login)));

    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('submits sign in and navigates to profile', async () => {
    vi.spyOn(authStore, 'signIn').mockResolvedValue({ user: {} } as any);

    render(React.createElement(MemoryRouter, null, React.createElement(Login)));

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitBtn = screen.getByRole('button', { name: 'Sign In' });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'secret' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authStore.signIn).toHaveBeenCalledWith('user@example.com', 'secret');
      expect(mockNavigate).toHaveBeenCalledWith('/profile', { replace: true });
    });
  });

  it('toggles to sign up form and creates account', async () => {
    vi.spyOn(authStore, 'signUp').mockResolvedValue({ user: {} } as any);

    render(React.createElement(MemoryRouter, null, React.createElement(Login)));

    fireEvent.click(screen.getByText('Need an account? Sign Up'));
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitBtn = screen.getByRole('button', { name: 'Sign Up' });

    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authStore.signUp).toHaveBeenCalledWith('new@example.com', 'password123');
    });
  });

  it('switches to reset password view and submits', async () => {
    vi.spyOn(authStore, 'resetPassword').mockResolvedValue(undefined);

    render(React.createElement(MemoryRouter, null, React.createElement(Login)));

    fireEvent.click(screen.getByText('Forgot password?'));
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText('Enter your email');
    fireEvent.change(emailInput, { target: { value: 'reset@example.com' } });

    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() => {
      expect(authStore.resetPassword).toHaveBeenCalledWith('reset@example.com');
    });
  });

  it('switches to magic link view and submits', async () => {
    vi.spyOn(authStore, 'signInWithMagicLink').mockResolvedValue(undefined);

    render(React.createElement(MemoryRouter, null, React.createElement(Login)));

    fireEvent.click(screen.getByText('Sign in with Magic Link'));
    expect(screen.getByRole('button', { name: 'Send Magic Link' })).toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText('Enter your email');
    fireEvent.change(emailInput, { target: { value: 'magic@example.com' } });

    fireEvent.click(screen.getByRole('button', { name: 'Send Magic Link' }));

    await waitFor(() => {
      expect(authStore.signInWithMagicLink).toHaveBeenCalledWith('magic@example.com');
    });
  });
});

