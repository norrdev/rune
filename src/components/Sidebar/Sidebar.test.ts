import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { authStore } from '../../stores/authStore';
import { visitedRunestonesStore } from '../../stores/visitedRunestonesStore';

describe('Sidebar', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    authStore.setUser(null);
    visitedRunestonesStore.clearVisitedRunestones();
    // Default desktop width
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
  });

  it('renders sidebar title, map legend, and footer links', () => {
    render(
      React.createElement(MemoryRouter, null, React.createElement(Sidebar)),
    );

    expect(screen.getByText('Runestone Safari')).toBeInTheDocument();
    expect(screen.getByText('Explore Swedish Runestones')).toBeInTheDocument();
    expect(screen.getByText('Map Legend')).toBeInTheDocument();
    expect(screen.getByText('< 100 runestones')).toBeInTheDocument();
    expect(screen.getByText('Visited stone')).toBeInTheDocument();

    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Privacy')).toBeInTheDocument();
    expect(screen.getByText('License')).toBeInTheDocument();
    expect(screen.getByText('Changelog')).toBeInTheDocument();
  });

  it('shows user progress when user is logged in', () => {
    authStore.setUser({ id: 'u1', email_confirmed_at: '2026-01-01' } as any);
    visitedRunestonesStore.addVisitedRunestone(1);
    visitedRunestonesStore.addVisitedRunestone(2);

    render(
      React.createElement(MemoryRouter, null, React.createElement(Sidebar)),
    );

    expect(screen.getByText('Your Progress')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('visited')).toBeInTheDocument();
  });

  it('shows account controls when user is logged in and confirmed', () => {
    authStore.setUser({
      id: 'u1',
      email: 'dennis@example.com',
      email_confirmed_at: '2026-01-01',
    } as any);

    render(
      React.createElement(MemoryRouter, null, React.createElement(Sidebar)),
    );

    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('dennis@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument();
  });

  it('handles mobile overlay click to close sidebar', () => {
    Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });
    const onClose = vi.fn();

    render(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(Sidebar, { visible: true, onClose }),
      ),
    );

    const overlay = screen.getByLabelText('Close Sidebar');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });
});

