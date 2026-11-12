import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';
import { ApiError } from '../services/apiClient';

const auth = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({
    status: 'unauthenticated',
    user: null,
    login: auth.login,
    register: auth.register,
    logout: auth.logout,
  }),
}));

function renderLogin() {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

describe('LoginPage API errors', () => {
  beforeEach(() => {
    auth.login.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('attaches backend validation details to the matching field', async () => {
    auth.login.mockRejectedValueOnce(
      new ApiError(
        422,
        'VALIDATION_ERROR',
        'Request payload validation failed',
        [
          {
            loc: ['body', 'email'],
            msg: 'value is not a valid email address',
            type: 'value_error',
          },
        ],
        'req-1'
      )
    );

    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /sign in to notebook/i }));

    expect(await screen.findByText('value is not a valid email address')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the backend message when there are no field-level details', async () => {
    auth.login.mockRejectedValueOnce(
      new ApiError(401, 'UNAUTHORIZED', 'Invalid email or password', null, 'req-2')
    );

    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /sign in to notebook/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });

  it('lands on the projects dashboard after a successful sign in', async () => {
    auth.login.mockResolvedValueOnce({ id: 'usr_mock_1' });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app" element={<div>Overview page</div>} />
          <Route path="/app/projects" element={<div>Projects dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /sign in to notebook/i }));

    expect(await screen.findByText('Projects dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Overview page')).not.toBeInTheDocument();
  });

  it('does not prefill credentials when the real API is enabled', () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');

    renderLogin();

    expect(screen.getByLabelText('Email address')).toHaveValue('');
    expect(screen.getByLabelText('Password')).toHaveValue('');
  });
});
