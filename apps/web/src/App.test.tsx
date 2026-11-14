import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Component', () => {
  it('renders landing page heading and primary call to action', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { level: 1 })
    ).toHaveTextContent(/Intelligent Construction Cost Estimation/i);
    expect(screen.getByText(/Start 4-Step Estimate Wizard/i)).toBeInTheDocument();
    expect(screen.queryByTestId('sample-data-badge')).not.toBeInTheDocument();
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
