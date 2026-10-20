import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchWidget } from './SearchWidget';
import { searchStore } from '../../../stores/searchStore';
import { runestonesCache } from '../../../services/Cache/runestonesCache';
import type { Runestone } from '../../../types';

describe('SearchWidget', () => {
  const sampleResult: Runestone = {
    id: 1,
    signature_text: 'U 160',
    found_location: 'Risbyle',
    parish: 'Täby',
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
    vi.restoreAllMocks();
    searchStore.clearSearch();
  });

  it('renders search input and button', () => {
    render(React.createElement(SearchWidget));
    expect(screen.getByPlaceholderText('Search runestones...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  it('triggers performSearch on input change and click', async () => {
    vi.spyOn(runestonesCache, 'searchRunestones').mockResolvedValue([]);
    const searchSpy = vi.spyOn(searchStore, 'performSearch');

    render(React.createElement(SearchWidget));
    const input = screen.getByPlaceholderText('Search runestones...');

    fireEvent.change(input, { target: { value: 'Risbyle' } });
    expect(searchSpy).toHaveBeenCalledWith('Risbyle');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
    });

    const button = screen.getByRole('button', { name: 'Search' });
    fireEvent.click(button);
    expect(searchSpy).toHaveBeenCalledWith('Risbyle');
  });

  it('clears search when input is emptied', () => {
    const clearSpy = vi.spyOn(searchStore, 'clearSearch');

    render(React.createElement(SearchWidget));
    const input = screen.getByPlaceholderText('Search runestones...');

    fireEvent.change(input, { target: { value: 'something' } });
    fireEvent.change(input, { target: { value: '' } });
    expect(clearSpy).toHaveBeenCalled();
  });

  it('renders search results and handles selection', () => {
    const onClose = vi.fn();
    searchStore.setHasSearched(true);
    searchStore.setSearchResults([sampleResult]);

    render(React.createElement(SearchWidget, { onClose }));

    expect(screen.getByText('Found 1 result')).toBeInTheDocument();
    const resultButton = screen.getByText('U 160');
    expect(resultButton).toBeInTheDocument();

    fireEvent.click(resultButton);
    expect(searchStore.selectedRunestone).toEqual(sampleResult);
  });

  it('displays no results message when search returns empty', () => {
    searchStore.setHasSearched(true);
    searchStore.setSearchResults([]);

    render(React.createElement(SearchWidget));
    expect(screen.getByText('No runestones found')).toBeInTheDocument();
  });
});

