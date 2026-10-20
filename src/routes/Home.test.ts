import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

vi.mock('../components/Map/MapComponent', () => ({
  MapComponent: () => React.createElement('div', { 'data-testid': 'mock-map' }, 'Mock Map'),
}));

describe('Home route', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders map component on desktop', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });

    render(React.createElement(MemoryRouter, null, React.createElement(Home)));

    expect(screen.getByTestId('mock-map')).toBeInTheDocument();
    expect(screen.getByText('Runestone Safari')).toBeInTheDocument();
  });

  it('shows mobile hamburger menu button on mobile screen and toggles sidebar', () => {
    Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });

    render(React.createElement(MemoryRouter, null, React.createElement(Home)));

    const menuBtn = screen.getByLabelText('Open Menu');
    expect(menuBtn).toBeInTheDocument();

    fireEvent.click(menuBtn);
    expect(screen.getByText('Runestone Safari')).toBeInTheDocument();
  });
});

