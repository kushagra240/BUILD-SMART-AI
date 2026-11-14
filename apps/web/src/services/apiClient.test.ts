import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient, ApiError } from './apiClient';
import { ESTIMATE_CATEGORIES } from '../domain/estimateCategories';

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

const project = {
  id: '22222222-2222-2222-2222-222222222222',
  user_id: user.id,
  name: 'Test residence',
  notes: 'Baner, Pune',
  created_at: '2026-11-01T10:00:00Z',
  updated_at: '2026-11-02T10:00:00Z',
};

describe('apiClient projects wiring', () => {
  beforeEach(() => {
    apiClient.setAccessToken('access-1');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('gets projects from the real endpoint with the bearer token', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    const fetchMock = vi.fn(async () => jsonResponse({ items: [project], total: 1 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.getProjects()).resolves.toMatchObject({
      total: 1,
      items: [{ name: project.name }],
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/v1/projects');
    expect(init.method).toBe('GET');
    expect(init.credentials).toBe('include');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer access-1' });
  });

  it('keeps listProjects as a delegating alias for getProjects', async () => {
    const getSpy = vi
      .spyOn(apiClient, 'getProjects')
      .mockResolvedValue({ items: [project], total: 1 });

    await expect(apiClient.listProjects()).resolves.toMatchObject({ total: 1 });
    expect(getSpy).toHaveBeenCalledTimes(1);
  });

  it('deletes a project with DELETE and accepts an empty 204 response', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    const fetchMock = vi.fn(async () => jsonResponse(null, 204));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.deleteProject(project.id)).resolves.toBeUndefined();

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`/api/v1/projects/${project.id}`);
    expect(init.method).toBe('DELETE');
  });

  it('raises an ApiError when deleting a missing project', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    const fetchMock = vi.fn(async () =>
      jsonResponse(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Project not found',
            details: null,
            request_id: 'req-3',
          },
        },
        404
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.deleteProject(project.id)).rejects.toMatchObject({
      status: 404,
      message: 'Project not found',
    });
  });

  it('deletes mock projects locally and returns 404 for unknown ids', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'true');
    const created = await apiClient.createProject({
      name: 'Temp mock project',
      notes: 'To be deleted',
    });

    await apiClient.deleteProject(created.id);
    const remaining = await apiClient.listProjects();
    expect(remaining.items.some((item) => item.id === created.id)).toBe(false);

    await expect(apiClient.getProject(created.id)).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe('apiClient estimate wiring', () => {
  const inputs = {
    built_up_area_sqft: 1800,
    floors: 2,
    bedrooms: 3,
    bathrooms: 3,
    zone_id: 'zone-west',
    quality_tier: 'standard' as const,
    construction_type: 'rcc_framed' as const,
    plot_area_sqft: 1200,
  };

  beforeEach(() => {
    apiClient.setAccessToken('access-1');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('loads zone options from /meta/options', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        zones: [
          { id: 'zone-west', name: 'West Pune' },
          { id: 'zone-east', name: 'East Pune' },
        ],
        quality_tiers: [],
        construction_types: [],
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.getEstimateZones()).resolves.toEqual([
      { id: 'zone-west', name: 'West Pune' },
      { id: 'zone-east', name: 'East Pune' },
    ]);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/v1/meta/options');
    expect(init.method).toBe('GET');
  });

  it('rejects unknown option ids from /meta/options instead of guessing', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          zones: [],
          quality_tiers: [{ id: 'luxury', name: 'Luxury' }],
          construction_types: [],
        })
      )
    );

    await expect(apiClient.getMetaOptions()).rejects.toThrow(/unknown quality tier/);
  });

  it('serves the mock estimate through the single canonical category list', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'true');
    vi.stubGlobal('fetch', vi.fn());

    const estimate = await apiClient.createEstimate(project.id, {
      ...inputs,
      zone_id: 'pune_west',
    });

    expect(estimate.breakdown.map((row) => row.category)).toEqual(
      ESTIMATE_CATEGORIES.map((category) => category.value)
    );
    expect(estimate.breakdown.reduce((sum, row) => sum + row.share_pct, 0)).toBe(100);
  });

  it('posts the estimate payload to the project estimate endpoint', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    const fetchMock = vi.fn(async () =>
      jsonResponse({ id: 'estimate-1', project_id: project.id, is_mock: true }, 201)
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.createEstimate(project.id, inputs)).resolves.toMatchObject({
      id: 'estimate-1',
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`/api/v1/projects/${project.id}/estimates`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual(inputs);
  });

  it('surfaces 422 validation details on the estimate request', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    const fetchMock = vi.fn(async () =>
      jsonResponse(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request payload validation failed',
            details: [
              {
                loc: ['body', 'bedrooms'],
                msg: 'Input should be less than or equal to 20',
                type: 'less_than_equal',
              },
            ],
            request_id: 'req-9',
          },
        },
        422
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const error = await apiClient.createEstimate(project.id, inputs).catch((cause) => cause);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(error.fieldErrors()).toEqual({
      bedrooms: 'Input should be less than or equal to 20',
    });
  });

  it('returns mock zones without a network call in mock mode', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'true');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const zones = await apiClient.getEstimateZones();
    expect(zones.some((zone) => zone.id === 'pune_west')).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps UI zone identifiers to regulatory backend rates zone codes in outgoing request', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    const fetchMock = vi.fn(async () =>
      jsonResponse({ id: 'estimate-2', project_id: project.id, is_mock: false }, 200)
    );
    vi.stubGlobal('fetch', fetchMock);

    await apiClient.createEstimate(project.id, {
      ...inputs,
      zone_id: 'pune_west',
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`/api/v1/projects/${project.id}/estimates`);
    const sentBody = JSON.parse(String(init.body));
    expect(sentBody.zone_id).toBe('ZN-PMC');
  });
});

function blobResponse(body: Blob, contentType: string, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    headers: {
      get: (name: string) => (name.toLowerCase() === 'content-type' ? contentType : null),
    },
    blob: async () => body,
  } as unknown as Response;
}

describe('apiClient estimate PDF wiring', () => {
  beforeEach(() => {
    apiClient.setAccessToken('access-1');
    apiClient.setUnauthorizedHandler(null);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('fetches the project estimate PDF as a blob with the bearer token', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    const pdf = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
    const fetchMock = vi.fn(async () => blobResponse(pdf, 'application/pdf'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.downloadEstimatePdf(project.id, 'estimate-1')).resolves.toBe(pdf);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`/api/v1/projects/${project.id}/estimates/estimate-1/pdf`);
    expect(init.method).toBe('GET');
    expect(init.credentials).toBe('include');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer access-1' });
  });

  it('rejects a 2xx HTML response instead of treating it as a PDF', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    const fetchMock = vi.fn(async () => blobResponse(new Blob(['<html>']), 'text/html'));
    vi.stubGlobal('fetch', fetchMock);

    const error = await apiClient
      .downloadEstimatePdf(project.id, 'estimate-1')
      .catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'NOT_A_PDF' });
    expect((error as ApiError).message).toContain('text/html');
  });

  it('surfaces the backend error envelope when the PDF is missing', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    const fetchMock = vi.fn(async () =>
      jsonResponse(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Estimate not found',
            details: null,
            request_id: 'req-pdf',
          },
        },
        404
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.downloadEstimatePdf(project.id, 'missing')).rejects.toMatchObject({
      status: 404,
      message: 'Estimate not found',
    });
  });

  it('refreshes the session once and retries a 401 PDF request', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    apiClient.setAccessToken('expired-token');
    const pdf = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
    let pdfCalls = 0;

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === `/api/v1/projects/${project.id}/estimates/estimate-1/pdf`) {
        pdfCalls += 1;
        return pdfCalls === 1
          ? jsonResponse(unauthorizedError, 401)
          : blobResponse(pdf, 'application/pdf');
      }
      if (url === '/api/v1/auth/refresh') {
        return jsonResponse({ access_token: 'fresh-token', token_type: 'bearer', expires_in: 900 });
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.downloadEstimatePdf(project.id, 'estimate-1')).resolves.toBe(pdf);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(apiClient.getAccessToken()).toBe('fresh-token');
  });
});
