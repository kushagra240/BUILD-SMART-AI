import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from './context';
import { RequireAuth } from './RequireAuth';

const baseValue: AuthContextValue = {
  status: 'unauthenticated',
  user: null,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
};

function renderGuarded(value: AuthContextValue) {
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={['/app/projects']}>
        <Routes>
          <Route path="/login" element={<div>login screen</div>} />
          <Route element={<RequireAuth />}>
            <Route path="/app/projects" element={<div>private projects</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('RequireAuth', () => {
  it('redirects unauthenticated visitors to the login screen', () => {
    renderGuarded(baseValue);
    expect(screen.getByText('login screen')).toBeInTheDocument();
    expect(screen.queryByText('private projects')).not.toBeInTheDocument();
  });

  it('renders the guarded route for authenticated users', () => {
    renderGuarded({
      ...baseValue,
      status: 'authenticated',
      user: {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'owner@example.com',
        full_name: 'Owner Example',
        role: 'user',
        is_active: true,
        created_at: '2026-11-01T10:00:00Z',
      },
    });
    expect(screen.getByText('private projects')).toBeInTheDocument();
  });

  it('shows a status message while the session is bootstrapping', () => {
    renderGuarded({ ...baseValue, status: 'loading' });
    expect(screen.getByRole('status')).toHaveTextContent('Checking your session');
  });
});
