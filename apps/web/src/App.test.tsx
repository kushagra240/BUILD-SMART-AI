import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Component', () => {
  it('renders the landing page without the app shell chrome', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Know what your home/i);
    expect(screen.getByRole('button', { name: /Build your estimate/i })).toBeInTheDocument();
    // The landing ships its own floating header; the global product nav must
    // not be stacked above it.
    expect(screen.queryByRole('navigation', { name: /sub navigation/i })).not.toBeInTheDocument();
  });

  it('falls through to the not-found page for the removed /pdf route', () => {
    window.history.pushState({}, '', '/pdf');
    try {
      render(<App />);
      expect(
        screen.getByRole('heading', { name: /Page not found in your notebook/i })
      ).toBeInTheDocument();
    } finally {
      window.history.pushState({}, '', '/');
    }
  });
});
