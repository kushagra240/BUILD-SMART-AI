import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';
import { apiClient } from '../services/apiClient';

const user = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'owner@example.com',
  full_name: 'Owner Example',
  role: 'user',
  is_active: true,
  created_at: '2026-11-01T10:00:00Z',
};

function Probe() {
  const { status, user: currentUser, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{currentUser?.full_name ?? 'none'}</span>
      <button
        type="button"
        onClick={() => void login({ email: user.email, password: 'longpassword1' })}
      >
        login
      </button>
      <button type="button" onClick={() => void logout()}>
        logout
      </button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    apiClient.setAccessToken(null);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('starts unauthenticated when no refresh cookie session exists, then logs in', async () => {
    vi.spyOn(apiClient, 'refresh').mockRejectedValue(new Error('no session'));
    const loginSpy = vi.spyOn(apiClient, 'login').mockResolvedValue({
      access_token: 'access-1',
      token_type: 'bearer',
      expires_in: 900,
    });
    vi.spyOn(apiClient, 'getMe').mockResolvedValue(user);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated');
    });

    fireEvent.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
    });
    expect(screen.getByTestId('user')).toHaveTextContent('Owner Example');
    expect(loginSpy).toHaveBeenCalledWith({
      email: user.email,
      password: 'longpassword1',
    });
  });

  it('restores the session on boot and clears it on logout', async () => {
    vi.spyOn(apiClient, 'refresh').mockResolvedValue({
      access_token: 'access-1',
      token_type: 'bearer',
      expires_in: 900,
    });
    vi.spyOn(apiClient, 'getMe').mockResolvedValue(user);
    const logoutSpy = vi.spyOn(apiClient, 'logout').mockResolvedValue({
      message: 'Logged out successfully',
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
    });

    fireEvent.click(screen.getByRole('button', { name: 'logout' }));

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated');
    });
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(logoutSpy).toHaveBeenCalledTimes(1);
  });
});
