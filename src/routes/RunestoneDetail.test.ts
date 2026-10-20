import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RunestoneDetail } from './RunestoneDetail';
import { runestoneDetailStore } from '../stores/runestoneDetailStore';
import { runestonesCache } from '../services/Cache/runestonesCache';
import { authStore } from '../stores/authStore';
import { visitedRunestonesStore } from '../stores/visitedRunestonesStore';
import type { Runestone } from '../types';

vi.mock('../components/MiniMap/MiniMap', () => ({
  MiniMap: () => React.createElement('div', { 'data-testid': 'mock-minimap' }, 'MiniMap'),
}));

describe('RunestoneDetail route', () => {
  const sampleStone: Runestone = {
    id: 160,
    signature_text: 'U 160',
    found_location: 'Risbyle',
    parish: 'Täby',
    district: 'Danderyd',
    municipality: 'Täby',
    current_location: 'Risbyle',
    material: 'Granite',
    material_type: 'Granite',
    rune_type: 'Runestone',
    dating: 'Viking Age',
    style: 'Pr2',
    carver: 'Ulv i Borresta',
    latitude: 59.4891,
    longitude: 18.0673,
    english_translation: 'In memory of Ulf',
    swedish_translation: 'Till minne av Ulf',
    norse_text: 'Norse text',
    transliteration: 'Translit',
    lost: false,
    ornamental: false,
    recent: false,
    slug: 'U_160',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    authStore.setUser(null);
    runestoneDetailStore.clear();
  });

  it('renders loading state initially', () => {
    vi.spyOn(runestonesCache, 'getRunestoneBySlug').mockReturnValue(new Promise(() => {}));

    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/runestones/U_160'] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, { path: '/runestones/:slug', element: React.createElement(RunestoneDetail) }),
        ),
      ),
    );

    expect(screen.getByText('Loading runestone...')).toBeInTheDocument();
  });

  it('renders error state when runestone is not found', async () => {
    vi.spyOn(runestonesCache, 'getRunestoneBySlug').mockResolvedValue(null);

    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/runestones/invalid'] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, { path: '/runestones/:slug', element: React.createElement(RunestoneDetail) }),
        ),
      ),
    );

    await waitFor(() => {
      expect(screen.getByText('Runestone Not Found')).toBeInTheDocument();
    });
    expect(screen.getByText('← Back to Map')).toBeInTheDocument();
  });

  it('renders runestone details correctly when loaded', async () => {
    vi.spyOn(runestonesCache, 'getRunestoneBySlug').mockResolvedValue(sampleStone);

    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/runestones/U_160'] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, { path: '/runestones/:slug', element: React.createElement(RunestoneDetail) }),
        ),
      ),
    );

    await waitFor(() => {
      expect(screen.getByText('Location Details')).toBeInTheDocument();
    });

    expect(screen.getByText('Risbyle')).toBeInTheDocument();
    expect(screen.getAllByText('Täby').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Ulv i Borresta')).toBeInTheDocument();
    expect(screen.getByText('In memory of Ulf')).toBeInTheDocument();
    expect(screen.getByText('Till minne av Ulf')).toBeInTheDocument();
    expect(screen.getByTestId('mock-minimap')).toBeInTheDocument();
  });

  it('handles mark as visited toggle button', async () => {
    authStore.setUser({ id: 'u1', email_confirmed_at: '2026-01-01' } as any);
    vi.spyOn(runestonesCache, 'getRunestoneBySlug').mockResolvedValue(sampleStone);
    vi.spyOn(visitedRunestonesStore, 'markAsVisited').mockResolvedValue(true);

    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/runestones/U_160'] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, { path: '/runestones/:slug', element: React.createElement(RunestoneDetail) }),
        ),
      ),
    );

    await waitFor(() => {
      expect(screen.getByText('Mark as visited')).toBeInTheDocument();
    });

    const markBtn = screen.getByText('Mark as visited');
    fireEvent.click(markBtn);

    await waitFor(() => {
      expect(visitedRunestonesStore.markAsVisited).toHaveBeenCalledWith(sampleStone.id);
    });
  });
});
