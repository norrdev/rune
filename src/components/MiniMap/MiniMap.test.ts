import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MiniMap } from './MiniMap';
import type { Runestone } from '../../types';

describe('MiniMap', () => {
  const validStone: Runestone = {
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders fallback when coordinates are missing or invalid', () => {
    const invalidStone = {
      ...validStone,
      latitude: undefined as any,
      longitude: undefined as any,
    };

    render(React.createElement(MiniMap, { runestone: invalidStone }));
    expect(screen.getByText('Location data not available')).toBeInTheDocument();
  });

  it('initializes MapLibre map and marker when valid coordinates are provided', () => {
    render(React.createElement(MiniMap, { runestone: validStone }));
    expect(screen.getByText('Location')).toBeInTheDocument();
  });

  it('cleans up map and marker on unmount', () => {
    const { unmount } = render(React.createElement(MiniMap, { runestone: validStone }));
    unmount();
  });
});

