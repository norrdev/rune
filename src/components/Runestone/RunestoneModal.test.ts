import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RunestoneModal } from './RunestoneModal';
import { authStore } from '../../stores/authStore';
import { visitedRunestonesStore } from '../../stores/visitedRunestonesStore';
import type { Runestone } from '../../types';

describe('RunestoneModal', () => {
  const sampleStone: Runestone = {
    id: 1,
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
    ornamental: true,
    recent: false,
    slug: 'U_160',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    authStore.setUser(null);
    visitedRunestonesStore.clearVisitedRunestones();
  });

  it('renders nothing when isOpen is false or runestone is null', () => {
    const { container: c1 } = render(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(RunestoneModal, {
          isOpen: false,
          runestone: sampleStone,
          onClose: vi.fn(),
        }),
      ),
    );
    expect(c1).toBeEmptyDOMElement();

    const { container: c2 } = render(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(RunestoneModal, {
          isOpen: true,
          runestone: null,
          onClose: vi.fn(),
        }),
      ),
    );
    expect(c2).toBeEmptyDOMElement();
  });

  it('renders runestone details when open', () => {
    render(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(RunestoneModal, {
          isOpen: true,
          runestone: sampleStone,
          onClose: vi.fn(),
        }),
      ),
    );

    expect(screen.getByText('U 160')).toBeInTheDocument();
    expect(screen.getByText('Risbyle')).toBeInTheDocument();
    expect(screen.getAllByText('Täby').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Ulv i Borresta')).toBeInTheDocument();
    expect(screen.getByText('In memory of Ulf')).toBeInTheDocument();
    expect(screen.getByText('Till minne av Ulf')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(RunestoneModal, {
          isOpen: true,
          runestone: sampleStone,
          onClose,
        }),
      ),
    );

    const closeBtn = screen.getByLabelText('Close');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('shows mark as visited button and handles visit toggle when user is logged in', async () => {
    authStore.setUser({ id: 'u1', email_confirmed_at: '2026-01-01' } as any);
    const onVisitedChange = vi.fn();
    vi.spyOn(visitedRunestonesStore, 'markAsVisited').mockResolvedValue(true);

    render(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(RunestoneModal, {
          isOpen: true,
          runestone: sampleStone,
          onClose: vi.fn(),
          onVisitedStatusChange: onVisitedChange,
        }),
      ),
    );

    const markBtn = screen.getByText('Mark as Visited');
    expect(markBtn).toBeInTheDocument();

    fireEvent.click(markBtn);

    await waitFor(() => {
      expect(visitedRunestonesStore.markAsVisited).toHaveBeenCalledWith(sampleStone.id);
      expect(onVisitedChange).toHaveBeenCalled();
    });
  });
});
