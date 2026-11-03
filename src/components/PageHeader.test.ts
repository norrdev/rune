import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PageHeader } from './PageHeader';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('PageHeader', () => {
  it('renders the header title', () => {
    render(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(PageHeader, { title: 'Explore Runestones' }),
      ),
    );

    expect(screen.getByText('Explore Runestones')).toBeInTheDocument();
  });

  it('navigates back when there is in-app history', () => {
    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/', { pathname: '/about', key: 'prev-entry' }], initialIndex: 1 },
        React.createElement(PageHeader, { title: 'Title' }),
      ),
    );

    const backButton = screen.getByLabelText('Go Back');
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('navigates to root when the page is the first entry of the app history', () => {
    // Browser history may still contain other sites; going back would leave the app
    Object.defineProperty(window.history, 'length', { value: 3, configurable: true });

    render(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(PageHeader, { title: 'Title' }),
      ),
    );

    const backButton = screen.getByLabelText('Go Back');
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});

