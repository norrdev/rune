import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

vi.mock('./routes/Home', () => ({
  default: () => React.createElement('div', { 'data-testid': 'home-page' }, 'Home Page'),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, 'Test', '/');
  });

  it('renders without crashing and mounts home route by default', () => {
    render(React.createElement(App));
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });
});

