import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Component', () => {
  it('renders the header heading', () => {
    render(<App />);
    expect(screen.getByText('BuildSmart AI')).toBeInTheDocument();
  });
});
