import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { About, License, Changelog, Privacy } from './StaticPages';

describe('StaticPages routes', () => {
  it('renders About page with title and content', () => {
    render(React.createElement(MemoryRouter, null, React.createElement(About)));
    expect(screen.getByRole('heading', { name: 'About' })).toBeInTheDocument();
  });

  it('renders License page with title and content', () => {
    render(React.createElement(MemoryRouter, null, React.createElement(License)));
    expect(screen.getByRole('heading', { name: 'License' })).toBeInTheDocument();
  });

  it('renders Changelog page with title and content', () => {
    render(React.createElement(MemoryRouter, null, React.createElement(Changelog)));
    expect(screen.getAllByRole('heading', { name: 'Changelog' }).length).toBeGreaterThanOrEqual(1);
  });

  it('renders Privacy policy page with sections and contact link', () => {
    render(React.createElement(MemoryRouter, null, React.createElement(Privacy)));
    expect(screen.getAllByText('Privacy Policy').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Information We Collect')).toBeInTheDocument();
    expect(screen.getByText('How We Use Your Information')).toBeInTheDocument();
    expect(screen.getByText('privacy.runestonesafari.1atjf@simplelogin.com')).toBeInTheDocument();
  });
});

