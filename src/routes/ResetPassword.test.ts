import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ResetPassword } from './ResetPassword';
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
  render(React.createElement(MemoryRouter, null, React.createElement(ResetPassword)));

const fillForm = (password: string, confirmation: string) => {
  fireEvent.change(screen.getByPlaceholderText('New password'), { target: { value: password } });
  fireEvent.change(screen.getByPlaceholderText('Confirm new password'), {
    target: { value: confirmation },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Set New Password' }));
};

describe('ResetPassword route', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockClear();
    authStore.setUser(null);
    window.history.replaceState(null, '', '/reset-password');
  });

  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('waits for the recovery session before showing the form', () => {
    renderPage();
    expect(screen.getByText('Verifying reset link...')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('New password')).not.toBeInTheDocument();
  });

  it('shows the error Supabase put in the URL', () => {
    window.history.replaceState(null, '', '/reset-password#error=access_denied&error_code=otp_expired');
    renderPage();
    expect(screen.getByText('Reset link failed')).toBeInTheDocument();
  });

  it('validates the new password', () => {
    authStore.setUser({ id: 'u1' } as any);
    const updateSpy = vi.spyOn(authStore, 'updatePassword');
    renderPage();

    fillForm('123', '123');
    expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();

    fillForm('secret-1', 'secret-2');
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('updates the password and forwards to the profile', async () => {
    authStore.setUser({ id: 'u1' } as any);
    vi.spyOn(authStore, 'updatePassword').mockResolvedValue(undefined);
    renderPage();

    fillForm('new-secret', 'new-secret');

    await waitFor(() => {
      expect(authStore.updatePassword).toHaveBeenCalledWith('new-secret');
      expect(mockNavigate).toHaveBeenCalledWith('/profile', { replace: true });
    });
  });

  it('shows the error when the update fails', async () => {
    authStore.setUser({ id: 'u1' } as any);
    vi.spyOn(authStore, 'updatePassword').mockRejectedValue(new Error('Weak password'));
    renderPage();

    fillForm('new-secret', 'new-secret');

    expect(await screen.findByText('Weak password')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
