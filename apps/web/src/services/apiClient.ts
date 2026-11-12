import type { components } from '../types/api.generated';
import { MOCK_META_OPTIONS } from './mockApi';

export type UserResponse = components['schemas']['UserResponse'];
export type TokenResponse = components['schemas']['TokenResponse'];
export type LoginRequest = components['schemas']['LoginRequest'];
export type RegisterRequest = components['schemas']['RegisterRequest'];
export type ProjectResponse = components['schemas']['ProjectResponse'];
export type ProjectListResponse = components['schemas']['ProjectListResponse'];
export type EstimateCreate = components['schemas']['EstimateCreate'];
export type EstimateResponse = components['schemas']['EstimateResponse'];
export type EstimateZone = { id: string; name: string };

/**
 * Mock mode is opt-out: the app runs against the simulated API unless the
 * environment explicitly sets VITE_USE_MOCK=false. Evaluated at call time so
 * tests can stub the environment per test.
 */
export function isMockApi(): boolean {
  return import.meta.env.VITE_USE_MOCK !== 'false';
}

type ErrorEnvelope = {
  error?: {
    code?: unknown;
    message?: unknown;
    details?: unknown;
    request_id?: unknown;
  };
};

/** Error thrown for non-2xx responses, carrying the FastAPI error envelope. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;
  readonly requestId: string | null;

  constructor(
    status: number,
    code: string,
    message: string,
    details: unknown = null,
    requestId: string | null = null
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }

  /**
   * Map FastAPI validation details (`loc: ["body", "email"]`, `msg`) to
   * `{ email: "..." }` so forms can attach messages to individual fields.
   */
  fieldErrors(): Record<string, string> {
    const fields: Record<string, string> = {};
    if (!Array.isArray(this.details)) {
      return fields;
    }
    for (const entry of this.details) {
      if (typeof entry !== 'object' || entry === null) {
        continue;
      }
      const candidate = entry as { loc?: unknown; msg?: unknown };
      if (!Array.isArray(candidate.loc) || typeof candidate.msg !== 'string') {
        continue;
      }
      const parts = candidate.loc.filter(
        (part): part is string => typeof part === 'string' && part !== 'body'
      );
      const field = parts.at(-1);
      if (field) {
        fields[field] = candidate.msg;
      }
    }
    return fields;
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    let code = 'HTTP_ERROR';
    let message = `API Error: ${response.status} ${response.statusText}`;
    let details: unknown = null;
    let requestId: string | null = null;

    try {
      const body = (await response.json()) as ErrorEnvelope | null;
      const envelope = body?.error;
      if (envelope) {
        if (typeof envelope.code === 'string') {
          code = envelope.code;
        }
        if (typeof envelope.message === 'string') {
          message = envelope.message;
        }
        if (envelope.details !== undefined) {
          details = envelope.details;
        }
        if (typeof envelope.request_id === 'string') {
          requestId = envelope.request_id;
        }
      }
    } catch {
      // Non-JSON error body; keep the HTTP status fallback message.
    }

    return new ApiError(response.status, code, message, details, requestId);
  }
}

const MOCK_PROJECTS: ProjectResponse[] = [
  {
    id: 'deshmukh-residence',
    user_id: 'usr_mock_1',
    name: 'Deshmukh residence',
    notes: 'Baner, Pune · G+1 · 1,800 sq ft',
    created_at: '2026-10-07T11:42:00Z',
    updated_at: '2026-10-07T11:42:00Z',
  },
  {
    id: 'kulkarni-family-home',
    user_id: 'usr_mock_1',
    name: 'Kulkarni family home',
    notes: 'Kothrud, Pune · G+1 · 1,500 sq ft',
    created_at: '2026-10-04T09:15:00Z',
    updated_at: '2026-10-04T09:15:00Z',
  },
  {
    id: 'wagholi-courtyard-home',
    user_id: 'usr_mock_1',
    name: 'Wagholi courtyard home',
    notes: 'Wagholi, Pune · G+1 · 1,200 sq ft',
    created_at: '2026-09-28T14:30:00Z',
    updated_at: '2026-09-28T14:30:00Z',
  },
  {
    id: 'patil-residence',
    user_id: 'usr_mock_1',
    name: 'Patil residence',
    notes: 'Bavdhan, Pune · G+1 · 1,600 sq ft',
    created_at: '2026-09-22T16:00:00Z',
    updated_at: '2026-09-22T16:00:00Z',
  },
];

let mockUser: UserResponse = {
  id: 'usr_mock_1',
  email: 'aniket@buildsmart.local',
  full_name: 'Aniket Deshmukh',
  role: 'user',
  is_active: true,
  created_at: '2026-10-07T10:00:00Z',
};

class ApiClient {
  private accessToken: string | null = null;
  private refreshPromise: Promise<TokenResponse> | null = null;
  private unauthorizedHandler: (() => void) | null = null;
  private baseUrl = '/api/v1';

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  /** Called when a request cannot be recovered by refreshing the session. */
  setUnauthorizedHandler(handler: (() => void) | null) {
    this.unauthorizedHandler = handler;
  }

  private notifyUnauthorized() {
    this.unauthorizedHandler?.();
  }

  /** Perform the request with auth headers; throws on any non-2xx response. */
  private async sendRaw(path: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (options.body !== undefined && options.body !== null) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    return response;
  }

  private async send<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await this.sendRaw(path, options);

    if (response.status === 204) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  /** Run a request, rotating the session once when the access token expired. */
  private async fetchWithRetry(
    path: string,
    options: RequestInit = {},
    allowRetry = true
  ): Promise<Response> {
    try {
      return await this.sendRaw(path, options);
    } catch (error) {
      // Only credential/session endpoints must not trigger a refresh; /auth/me
      // still deserves a refresh-and-retry when the access token expires.
      const skipRetry =
        path === '/auth/login' ||
        path === '/auth/register' ||
        path === '/auth/refresh' ||
        path === '/auth/logout';
      if (
        allowRetry &&
        !skipRetry &&
        error instanceof ApiError &&
        error.status === 401
      ) {
        try {
          await this.refresh();
        } catch {
          this.notifyUnauthorized();
          throw error;
        }
        return this.sendRaw(path, options);
      }
      throw error;
    }
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
    allowRetry = true
  ): Promise<T> {
    const response = await this.fetchWithRetry(path, options, allowRetry);

    if (response.status === 204) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  /**
   * Read a binary body. `request` always parses JSON, so binary endpoints need
   * their own read path; the estimate PDF is the only one today.
   *
   * A response that is 2xx but not `application/pdf` is rejected instead of
   * being handed to the browser, because a dev/proxy fallback would otherwise
   * download an HTML page as "report.pdf".
   */
  private async requestBlob(
    path: string,
    options: RequestInit = {},
    allowRetry = true
  ): Promise<Blob> {
    const response = await this.fetchWithRetry(path, options, allowRetry);
    const contentType = (response.headers.get('content-type') ?? '').toLowerCase();

    if (!contentType.includes('application/pdf')) {
      throw new ApiError(
        response.status,
        'NOT_A_PDF',
        `Expected a PDF but the server returned "${contentType || 'no content type'}". ` +
          'The PDF export endpoint may not be deployed yet.'
      );
    }

    return response.blob();
  }

  // Auth flows
  async register(req: RegisterRequest): Promise<UserResponse> {
    if (isMockApi()) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      mockUser = {
        ...mockUser,
        email: req.email,
        full_name: req.full_name,
        created_at: new Date().toISOString(),
      };
      return { ...mockUser };
    }
    return this.request<UserResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async login(req: LoginRequest): Promise<TokenResponse> {
    if (isMockApi()) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      mockUser = { ...mockUser, email: req.email };
      const res: TokenResponse = {
        access_token: 'mock_jwt_token_for_demo',
        token_type: 'bearer',
        expires_in: 900,
      };
      this.setAccessToken(res.access_token);
      return res;
    }
    const res = await this.request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(req),
    });
    this.setAccessToken(res.access_token);
    return res;
  }

  /**
   * Rotate the HttpOnly refresh cookie into a new access token. Concurrent
   * callers share one in-flight request so a burst of 401s rotates the token
   * family only once.
   */
  async refresh(): Promise<TokenResponse> {
    if (isMockApi()) {
      const res: TokenResponse = {
        access_token: 'mock_jwt_token_for_demo',
        token_type: 'bearer',
        expires_in: 900,
      };
      this.setAccessToken(res.access_token);
      return res;
    }

    if (!this.refreshPromise) {
      this.refreshPromise = this.send<TokenResponse>('/auth/refresh', {
        method: 'POST',
      })
        .then((res) => {
          this.setAccessToken(res.access_token);
          return res;
        })
        .catch((error: unknown) => {
          this.setAccessToken(null);
          throw error;
        })
        .finally(() => {
          this.refreshPromise = null;
        });
    }

    return this.refreshPromise;
  }

  async logout(): Promise<{ message: string }> {
    if (isMockApi()) {
      this.setAccessToken(null);
      return { message: 'Logged out successfully (Mock)' };
    }
    try {
      return await this.request<{ message: string }>(
        '/auth/logout',
        { method: 'POST' },
        false
      );
    } finally {
      this.setAccessToken(null);
    }
  }

  async getMe(): Promise<UserResponse> {
    if (isMockApi()) {
      return { ...mockUser };
    }
    return this.request<UserResponse>('/auth/me', {
      method: 'GET',
    });
  }

  // Projects flows
  /** GET /projects -> the signed-in user's saved projects. */
  async getProjects(): Promise<ProjectListResponse> {
    if (isMockApi()) {
      return {
        items: MOCK_PROJECTS,
        total: MOCK_PROJECTS.length,
      };
    }
    return this.request<ProjectListResponse>('/projects', {
      method: 'GET',
    });
  }

  /** Older name for {@link getProjects}; kept so existing callers keep working. */
  async listProjects(): Promise<ProjectListResponse> {
    return this.getProjects();
  }

  async createProject(req: components['schemas']['ProjectCreate']): Promise<ProjectResponse> {
    if (isMockApi()) {
      const newProj: ProjectResponse = {
        id: `proj_${Date.now()}`,
        user_id: 'usr_mock_1',
        name: req.name,
        notes: req.notes ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      MOCK_PROJECTS.unshift(newProj);
      return newProj;
    }
    return this.request<ProjectResponse>('/projects', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async getProject(projectId: string): Promise<ProjectResponse> {
    if (isMockApi()) {
      const found = MOCK_PROJECTS.find((p) => p.id === projectId);
      if (!found) {
        throw new ApiError(404, 'NOT_FOUND', 'Project not found');
      }
      return found;
    }
    return this.request<ProjectResponse>(`/projects/${projectId}`, {
      method: 'GET',
    });
  }

  async deleteProject(projectId: string): Promise<void> {
    if (isMockApi()) {
      const index = MOCK_PROJECTS.findIndex((p) => p.id === projectId);
      if (index === -1) {
        throw new ApiError(404, 'NOT_FOUND', 'Project not found');
      }
      MOCK_PROJECTS.splice(index, 1);
      return;
    }
    await this.request<void>(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  // Estimate flows
  async getEstimateZones(): Promise<EstimateZone[]> {
    if (isMockApi()) {
      return MOCK_META_OPTIONS.zones.map((zone) => ({
        id: zone.zone_id,
        name: zone.zone_name,
      }));
    }
    const response = await this.request<components['schemas']['MetaOptionsResponse']>(
      '/meta/options',
      { method: 'GET' }
    );
    return response.zones.map((zone) => ({ id: zone.id, name: zone.name }));
  }

  async createEstimate(projectId: string, req: EstimateCreate): Promise<EstimateResponse> {
    if (isMockApi()) {
      const area = req.built_up_area_sqft;
      const rate = req.quality_tier === 'economy' ? 2000 : req.quality_tier === 'premium' ? 3100 : 2400;
      const totalP50 = area * rate;
      const contingency = Math.round(totalP50 * 0.05);

      return {
        id: 'BS-2026-004',
        project_id: projectId,
        inputs: req,
        total: {
          p50: totalP50,
          p10: Math.round(totalP50 * 0.90),
          p90: Math.round(totalP50 * 1.10),
          currency: 'INR',
        },
        confidence: {
          label: 'High',
          reason: 'Calibrated to Pune municipal norms and verified planning distributions.',
        },
        breakdown: [
          { category: 'Site preparation & foundation', amount: Math.round(totalP50 * 0.12), share_pct: 12 },
          { category: 'RCC structure', amount: Math.round(totalP50 * 0.31), share_pct: 31 },
          { category: 'Masonry & plaster', amount: Math.round(totalP50 * 0.18), share_pct: 18 },
          { category: 'Flooring & wall tiles', amount: Math.round(totalP50 * 0.10), share_pct: 10 },
          { category: 'Doors & windows', amount: Math.round(totalP50 * 0.10), share_pct: 10 },
          { category: 'Electrical works', amount: Math.round(totalP50 * 0.07), share_pct: 7 },
          { category: 'Plumbing & sanitary', amount: Math.round(totalP50 * 0.07), share_pct: 7 },
          { category: 'Painting & finishes', amount: Math.round(totalP50 * 0.07), share_pct: 7 },
          { category: 'Contingency allowance', amount: contingency, share_pct: 5 },
        ],
        materials: [],
        budget: {
          status: 'within',
          gap_inr: 0,
        },
        drivers: [],
        model: {
          version: '1.0.0-mock',
          data_version: '2026-10-07-mock',
        },
        disclaimer: 'Preliminary indicative planning estimate for Pune region. Not a contractor quotation.',
        is_mock: true,
        created_at: new Date().toISOString(),
      };
    }

    return this.request<EstimateResponse>(`/projects/${projectId}/estimates`, {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async getEstimate(estimateId: string): Promise<EstimateResponse> {
    if (isMockApi()) {
      return this.createEstimate('deshmukh-residence', {
        built_up_area_sqft: 1800,
        floors: 2,
        bedrooms: 3,
        bathrooms: 3,
        zone_id: 'pune_west',
        quality_tier: 'standard',
        construction_type: 'rcc_framed',
        plot_area_sqft: 1200,
        budget_inr: 4320000,
      });
    }
    return this.request<EstimateResponse>(`/estimates/${estimateId}`, {
      method: 'GET',
    });
  }

  /**
   * Download the generated PDF for a saved estimate as a Blob.
   *
   * GET /projects/{projectId}/estimates/{estimateId}/pdf -> application/pdf
   *
   * The backend PDF service (board task T17) is not built yet, so non-mock mode
   * currently fails with the server's own error, or with NOT_A_PDF if the dev
   * server answers with its SPA HTML fallback.
   */
  async downloadEstimatePdf(projectId: string, estimateId: string): Promise<Blob> {
    return this.requestBlob(`/projects/${projectId}/estimates/${estimateId}/pdf`, {
      method: 'GET',
    });
  }
}

export const apiClient = new ApiClient();
