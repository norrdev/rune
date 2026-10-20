import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Profile } from './Profile';
import { authStore } from '../stores/authStore';
import { visitedRunestonesStore } from '../stores/visitedRunestonesStore';
import { runestonesCache } from '../services/Cache/runestonesCache';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Profile route', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    authStore.setUser(null);
    authStore.setLoading(false);
    visitedRunestonesStore.setLoading(false);
    visitedRunestonesStore.setDetailsLoading(false);
    visitedRunestonesStore.setError(null);
    visitedRunestonesStore.setDetailsError(null);
  });

  it('renders Not Logged In message when no user is signed in', () => {
    render(React.createElement(MemoryRouter, null, React.createElement(Profile)));
    expect(screen.getByText('Please log in to view your profile and visited runestones.')).toBeInTheDocument();
  });

  it('renders Email Confirmation Required when user email is not confirmed', () => {
    authStore.setUser({
      id: 'u1',
      email: 'unconfirmed@example.com',
    } as any);

    render(React.createElement(MemoryRouter, null, React.createElement(Profile)));
    expect(screen.getByText('Email Confirmation Required')).toBeInTheDocument();
  });

  it('renders profile with user stats and GPX download buttons when user is confirmed', async () => {
    authStore.setUser({
      id: 'u1',
      email: 'dennis@example.com',
      created_at: '2026-01-01T00:00:00Z',
      email_confirmed_at: '2026-01-01T00:00:00Z',
    } as any);

    render(React.createElement(MemoryRouter, null, React.createElement(Profile)));

    await waitFor(() => {
      expect(screen.getByText('dennis@example.com')).toBeInTheDocument();
    });

    expect(screen.getByText('Adventure Progress')).toBeInTheDocument();
    expect(screen.getByText('Export GPX Data')).toBeInTheDocument();
    expect(screen.getByText('Download All Runestones GPX')).toBeInTheDocument();
  });

  it('handles sign out button click', async () => {
    authStore.setUser({
      id: 'u1',
      email: 'dennis@example.com',
      email_confirmed_at: '2026-01-01T00:00:00Z',
    } as any);
    vi.spyOn(authStore, 'signOut').mockResolvedValue(undefined);

    render(React.createElement(MemoryRouter, null, React.createElement(Profile)));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument();
    });

    const signOutBtn = screen.getByRole('button', { name: 'Sign Out' });
    fireEvent.click(signOutBtn);

    await waitFor(() => {
      expect(authStore.signOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('handles account deletion confirmation', async () => {
    authStore.setUser({
      id: 'u1',
      email: 'dennis@example.com',
      email_confirmed_at: '2026-01-01T00:00:00Z',
    } as any);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(authStore, 'deleteUser').mockResolvedValue(undefined);

    render(React.createElement(MemoryRouter, null, React.createElement(Profile)));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Delete Account' })).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole('button', { name: 'Delete Account' });
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();
    expect(authStore.deleteUser).toHaveBeenCalled();
  });

  it('handles GPX export of all runestones', async () => {
    authStore.setUser({
      id: 'u1',
      email: 'dennis@example.com',
      email_confirmed_at: '2026-01-01T00:00:00Z',
    } as any);
    vi.spyOn(runestonesCache, 'getAllRunestones').mockResolvedValue([
      {
        id: 1,
        signature_text: 'U 1',
        found_location: 'Location',
        parish: 'Parish',
        district: '',
        municipality: '',
        current_location: '',
        material: '',
        rune_type: '',
        dating: '',
        style: '',
        carver: '',
        latitude: 59.4,
        longitude: 18.0,
        lost: false,
        ornamental: false,
        recent: false,
      },
    ]);

    render(React.createElement(MemoryRouter, null, React.createElement(Profile)));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Download All Runestones GPX' })).toBeInTheDocument();
    });

    const downloadAllBtn = screen.getByRole('button', { name: 'Download All Runestones GPX' });
    fireEvent.click(downloadAllBtn);

    await waitFor(() => {
      expect(runestonesCache.getAllRunestones).toHaveBeenCalled();
    });
  });
});

