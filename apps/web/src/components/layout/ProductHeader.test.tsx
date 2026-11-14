import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../../auth/context';
import { ProductHeader } from './ProductHeader';

const user = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'owner@example.com',
  full_name: 'Owner Example',
  role: 'user',
  is_active: true,
  created_at: '2026-11-01T10:00:00Z',
};

function renderHeader(value: AuthContextValue) {
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route path="/app" element={<ProductHeader active="projects" />} />
          <Route path="/login" element={<div>login screen</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('ProductHeader logout', () => {
  it('shows the signed-in user and calls the API logout before navigating', async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    renderHeader({
      status: 'authenticated',
      user,
      login: vi.fn(),
      register: vi.fn(),
      logout,
    });

    expect(screen.getByText(user.full_name)).toBeInTheDocument();
    expect(screen.getByText('Project owner')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));

    expect(await screen.findByText('login screen')).toBeInTheDocument();
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('does not invent a user or a logout action when there is no session', () => {
    renderHeader({
      status: 'unauthenticated',
      user: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    expect(screen.queryByText('Owner Example')).not.toBeInTheDocument();
    expect(screen.queryByText('Project owner')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument();
  });
});
