import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LandingPage } from './LandingPage';

function renderLanding() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<h1>Login route</h1>} />
        <Route path="/app/new" element={<h1>Wizard route</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('LandingPage', () => {
  it('shows the reference hero copy and the live planner default', () => {
    renderLanding();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /Know what your home\s*will cost\. Before you build\./
    );
    // The same figure is shown in the hero sample card and in the planner.
    expect(screen.getAllByText('₹43,20,000')).toHaveLength(2);
  });

  it('recalculates the indicative cost from area and quality', () => {
    renderLanding();

    fireEvent.change(screen.getByRole('slider', { name: /Built-up area/i }), {
      target: { value: '2400' },
    });
    expect(screen.getByText('₹57,60,000')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Premium/i }));
    expect(screen.getByText('₹74,40,000')).toBeInTheDocument();
  });

  it('opens the estimate dialog and dismisses it with Escape', () => {
    renderLanding();

    fireEvent.click(screen.getByRole('button', { name: /Create detailed estimate/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('continues from the dialog into the wizard', () => {
    renderLanding();

    fireEvent.click(screen.getByRole('button', { name: /Create detailed estimate/i }));
    fireEvent.click(screen.getByRole('button', { name: /Continue to project details/i }));

    expect(screen.getByRole('heading', { name: 'Wizard route' })).toBeInTheDocument();
  });

  it('routes the header login button to the login screen', () => {
    renderLanding();

    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByRole('heading', { name: 'Login route' })).toBeInTheDocument();
  });
});
