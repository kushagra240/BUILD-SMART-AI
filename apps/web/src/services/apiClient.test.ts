import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient, ApiError } from './apiClient';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    json: async () => body,
  } as unknown as Response;
}

const user = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'owner@example.com',
  full_name: 'Owner Example',
  role: 'user',
  is_active: true,
  created_at: '2026-11-01T10:00:00Z',
};

const validationError = {
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Request payload validation failed',
    details: [
      {
        loc: ['body', 'email'],
        msg: 'value is not a valid email address',
        type: 'value_error',
      },
    ],
    request_id: 'req-1',
  },
};

const unauthorizedError = {
  error: {
    code: 'UNAUTHORIZED',
    message: 'Invalid or expired access token',
    details: null,
    request_id: 'req-2',
  },
};

describe('apiClient auth wiring', () => {
  beforeEach(() => {
    apiClient.setAccessToken(null);
    apiClient.setUnauthorizedHandler(null);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('posts real login credentials and stores the access token', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    const fetchMock = vi.fn(async () =>
      jsonResponse({ access_token: 'access-1', token_type: 'bearer', expires_in: 900 })
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await apiClient.login({
      email: 'owner@example.com',
      password: 'longpassword1',
    });

    expect(result.access_token).toBe('access-1');
    expect(apiClient.getAccessToken()).toBe('access-1');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/v1/auth/login');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(init.body).toBe(
      JSON.stringify({ email: 'owner@example.com', password: 'longpassword1' })
    );
  });

  it('sends the bearer token when fetching the current user', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    apiClient.setAccessToken('access-1');
    const fetchMock = vi.fn(async () => jsonResponse(user));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.getMe()).resolves.toMatchObject({ email: user.email });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/v1/auth/me');
    expect(init.method).toBe('GET');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer access-1' });
  });

  it('parses the FastAPI error envelope and maps field errors', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    const fetchMock = vi.fn(async () => jsonResponse(validationError, 422));
    vi.stubGlobal('fetch', fetchMock);

    const caught = await apiClient
      .login({ email: 'owner@example.com', password: 'longpassword1' })
      .catch((error: unknown) => error);

    expect(caught).toBeInstanceOf(ApiError);
    const apiError = caught as ApiError;
    expect(apiError.status).toBe(422);
    expect(apiError.code).toBe('VALIDATION_ERROR');
    expect(apiError.message).toBe('Request payload validation failed');
    expect(apiError.requestId).toBe('req-1');
    expect(apiError.fieldErrors()).toEqual({
      email: 'value is not a valid email address',
    });
  });

  it('does not attempt a token refresh when login itself returns 401', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    const fetchMock = vi.fn(async () => jsonResponse(unauthorizedError, 401));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      apiClient.login({ email: 'owner@example.com', password: 'wrongpassword' })
    ).rejects.toMatchObject({ status: 401 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/v1/auth/login');
  });

  it('refreshes once and retries a 401 request', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    apiClient.setAccessToken('expired-token');
    let meCalls = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/v1/auth/me') {
        meCalls += 1;
        return meCalls === 1 ? jsonResponse(unauthorizedError, 401) : jsonResponse(user);
      }
      if (url === '/api/v1/auth/refresh') {
        return jsonResponse({ access_token: 'fresh-token', token_type: 'bearer', expires_in: 900 });
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.getMe()).resolves.toMatchObject({ email: user.email });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const refreshUrl = (fetchMock.mock.calls[1] as unknown as [string, RequestInit])[0];
    expect(refreshUrl).toBe('/api/v1/auth/refresh');
    expect(apiClient.getAccessToken()).toBe('fresh-token');
  });

  it('shares one refresh request across concurrent 401 responses', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    let meCalls = 0;
    let refreshCalls = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/v1/auth/me') {
        meCalls += 1;
        return meCalls <= 2 ? jsonResponse(unauthorizedError, 401) : jsonResponse(user);
      }
      if (url === '/api/v1/auth/refresh') {
        refreshCalls += 1;
        return jsonResponse({ access_token: 'fresh-token', token_type: 'bearer', expires_in: 900 });
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const [first, second] = await Promise.all([apiClient.getMe(), apiClient.getMe()]);

    expect(first.email).toBe(user.email);
    expect(second.email).toBe(user.email);
    expect(refreshCalls).toBe(1);
    expect(meCalls).toBe(4);
  });

  it('clears the session and notifies when refresh fails', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    apiClient.setAccessToken('expired-token');
    const onUnauthorized = vi.fn();
    apiClient.setUnauthorizedHandler(onUnauthorized);
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/v1/auth/me') {
        return jsonResponse(unauthorizedError, 401);
      }
      if (url === '/api/v1/auth/refresh') {
        return jsonResponse(unauthorizedError, 401);
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.getMe()).rejects.toMatchObject({ status: 401 });

    expect(apiClient.getAccessToken()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('keeps working in mock mode without any network calls', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'true');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const token = await apiClient.login({
      email: 'demo@example.com',
      password: 'password12345',
    });
    const me = await apiClient.getMe();

    expect(token.access_token).toBe('mock_jwt_token_for_demo');
    expect(me.email).toBe('demo@example.com');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
