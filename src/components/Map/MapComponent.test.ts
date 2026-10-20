import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MapComponent } from './MapComponent';
import { mapStore } from '../../stores/mapStore';

describe('MapComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mapStore.setLoading(false);
    mapStore.setError(null);
    mapStore.setRunestones([]);
  });

  it('initializes map on mount and provides control buttons', () => {
    render(
      React.createElement(MemoryRouter, null, React.createElement(MapComponent)),
    );

    expect(screen.getByTitle('Go to my location')).toBeInTheDocument();
    expect(screen.getByTitle('Reset map orientation')).toBeInTheDocument();
  });

  it('triggers getCurrentLocation when location button is clicked', () => {
    const locSpy = vi.spyOn(mapStore, 'getCurrentLocation').mockImplementation(async () => {});

    render(
      React.createElement(MemoryRouter, null, React.createElement(MapComponent)),
    );

    const locButton = screen.getByTitle('Go to my location');
    fireEvent.click(locButton);
    expect(locSpy).toHaveBeenCalled();
  });

  it('triggers resetBearing when compass button is clicked', () => {
    const bearingSpy = vi.spyOn(mapStore, 'resetBearing');

    render(
      React.createElement(MemoryRouter, null, React.createElement(MapComponent)),
    );

    const compassButton = screen.getByTitle('Reset map orientation');
    fireEvent.click(compassButton);
    expect(bearingSpy).toHaveBeenCalled();
  });

  it('displays loading indicator when loading is true', () => {
    mapStore.setLoading(true);

    render(
      React.createElement(MemoryRouter, null, React.createElement(MapComponent)),
    );

    expect(screen.getByText('Loading runestones...')).toBeInTheDocument();
  });

  it('displays error message and handles retry button', () => {
    mapStore.setError('Failed network connection');
    const loadSpy = vi.spyOn(mapStore, 'loadRunestones').mockImplementation(async () => {});

    render(
      React.createElement(MemoryRouter, null, React.createElement(MapComponent)),
    );

    expect(screen.getByText('Failed network connection')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: 'Retry' });
    fireEvent.click(retryBtn);
    expect(loadSpy).toHaveBeenCalled();
  });

  it('displays no runestones message when empty and not loading', () => {
    mapStore.setLoading(false);
    mapStore.setError(null);
    mapStore.setRunestones([]);

    render(
      React.createElement(MemoryRouter, null, React.createElement(MapComponent)),
    );

    expect(screen.getByText('No runestones found')).toBeInTheDocument();
  });
});

