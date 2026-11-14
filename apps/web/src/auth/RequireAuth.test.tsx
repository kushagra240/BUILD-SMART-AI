import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
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

function LoginProbe() {
  const location = useLocation();
  const from = (
    location.state as { from?: { pathname?: string; search?: string } } | null
  )?.from;
  return <div>{`login screen from ${from?.pathname ?? ''}${from?.search ?? ''}`}</div>;
}

function renderGuarded(value: AuthContextValue, initialEntries = ['/app/projects']) {
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<LoginProbe />} />
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
    expect(screen.getByText('login screen from /app/projects')).toBeInTheDocument();
    expect(screen.queryByText('private projects')).not.toBeInTheDocument();
  });

  it('preserves the attempted URL so login can return the user there', () => {
    renderGuarded(baseValue, ['/app/projects?tab=saved']);
    expect(
      screen.getByText('login screen from /app/projects?tab=saved')
    ).toBeInTheDocument();
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
