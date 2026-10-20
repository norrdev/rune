import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { RunestoneMedia } from './RunestoneMedia';
import type { Runestone } from '../../../types';

describe('RunestoneMedia', () => {
  const baseStone: Runestone = {
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
    latitude: 59.1,
    longitude: 18.1,
    lost: false,
    ornamental: false,
    recent: false,
  };

  it('renders nothing when direct_url is missing', () => {
    const { container } = render(
      React.createElement(RunestoneMedia, { runestone: baseStone }),
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders image when direct_url is provided without link_url', () => {
    const stoneWithImage: Runestone = {
      ...baseStone,
      direct_url: 'https://example.com/stone.jpg',
    };

    render(React.createElement(RunestoneMedia, { runestone: stoneWithImage }));

    expect(screen.getByText('Media')).toBeInTheDocument();
    const img = screen.getByAltText('Runestone U 1');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/stone.jpg');
    expect(img.closest('a')).toBeNull();
  });

  it('renders linked image when both direct_url and link_url are provided', () => {
    const stoneWithLink: Runestone = {
      ...baseStone,
      direct_url: 'https://example.com/stone.jpg',
      link_url: 'https://example.com/stone-page',
    };

    render(React.createElement(RunestoneMedia, { runestone: stoneWithLink }));

    const img = screen.getByAltText('Runestone U 1');
    const link = img.closest('a');
    expect(link).toHaveAttribute('href', 'https://example.com/stone-page');
    expect(link).toHaveAttribute('target', '_blank');
  });
});

