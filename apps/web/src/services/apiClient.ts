import type { components } from '../types/api.generated';
import type { ConstructionType, MetaOptions, QualityTier } from '../types/estimate';
import { isUuid } from '../lib/ids';

export type UserResponse = components['schemas']['UserResponse'];
export type TokenResponse = components['schemas']['TokenResponse'];
export type LoginRequest = components['schemas']['LoginRequest'];
export type RegisterRequest = components['schemas']['RegisterRequest'];
export type ProjectResponse = components['schemas']['ProjectResponse'];
export type ProjectListResponse = components['schemas']['ProjectListResponse'];
export type EstimateCreate = components['schemas']['EstimateCreate'];
export type EstimateResponse = components['schemas']['EstimateResponse'];
export type MaterialCharacteristicResponse =
  components['schemas']['MaterialCharacteristicResponse'];
export type EstimateZone = { id: string; name: string };

/**
 * The backend `/meta/options` contract types option ids as free strings. The
 * wizard can only submit the frozen `EstimateCreate` unions, so an unexpected
 * id is an explicit error rather than something silently dropped or guessed.
 */
function asQualityTier(id: string): QualityTier {
  if (id === 'economy' || id === 'standard' || id === 'premium') {
    return id;
  }
  throw new Error(`/meta/options returned an unknown quality tier: "${id}"`);
}

function asConstructionType(id: string): ConstructionType {
  if (id === 'rcc_framed' || id === 'load_bearing') {
    return id;
  }
  throw new Error(`/meta/options returned an unknown construction type: "${id}"`);
}

/**
 * Maps high-level UI location zones to the regulatory SSR rate zones used by
 * the backend bottom-up estimation engine (`rates.zone`).
 */
export const ZONE_ID_MAP: Record<string, string> = {
  pune_central: 'ZN-PMC',
  pune_east: 'ZN-PMC',
  pune_west: 'ZN-PMC',
  pcmc: 'ZN-PCMC',
  pune_south_peripheral: 'ZN-PMC',
};

export function mapZoneToRatesZone(zoneId: string): string {
  return ZONE_ID_MAP[zoneId] || zoneId;
}

const API_PATH = '/api/v1';

/** Hosts served by the Vite dev proxy / same-origin deployment. */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '0.0.0.0']);

/**
 * Normalise a configured API base URL.
 *
 * Deployment incident this guards against: the hosting env var was pasted from a
 * chat as a markdown link, `[https://host](https://host)`, so every request became
 * a relative path answered by the static host (404/405) instead of reaching FastAPI.
 */
function normalizeApiUrl(raw: string | undefined): string {
  let value = (raw ?? '').trim();
  if (!value) return '';

  // Strip wrapping quotes/backticks and surrounding whitespace.
  value = value.replace(/^[`'"]+/, '').replace(/[`'"]+$/, '').trim();

  // Unwrap `[label](target)` and keep the target when it is an absolute URL.
  const markdown = /^\[([^\]]*)\]\(([^)]+)\)$/.exec(value);
  if (markdown) {
    const [, label, target] = markdown;
    value = (/^https?:\/\//i.test(target) ? target : label).trim();
  }

  // Accept a bare host such as `api.example.com` and assume HTTPS.
  if (/^[a-z0-9.-]+\.[a-z]{2,}(:\d+)?(\/.*)?$/i.test(value)) {
    value = `https://${value}`;
  }

  return value;
}

/**
 * Resolve the API base URL ending in `/api/v1`.
 *
 * Anything that is not a usable absolute http(s) URL falls back to the same-origin
 * `/api/v1`, which both the Vite dev proxy and the Vercel rewrite forward to the API.
 */
export function resolveApiUrl(
  raw: string | undefined,
  options: { servedOverHttps?: boolean } = {}
): string {
  const normalized = normalizeApiUrl(raw);
  if (!normalized) return API_PATH;

  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    return API_PATH;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return API_PATH;
  if (LOCAL_HOSTS.has(url.hostname)) return API_PATH;
  // An http:// API on an https:// page is blocked as mixed content.
  if (options.servedOverHttps && url.protocol !== 'https:') return API_PATH;

  const base = `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
  return base.endsWith(API_PATH) ? base : `${base}${API_PATH}`;
}

export const API_URL = resolveApiUrl(import.meta.env.VITE_API_URL, {
  servedOverHttps:
    typeof window !== 'undefined' && window.location?.protocol === 'https:',
});

/**
 * Live mode is permanent: the app runs against the live FastAPI backend.
 * Mock mode is disabled.
 */
export function isMockApi(): boolean {
  return false;
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

/**
 * Fail before the request when an id cannot be a backend UUID, so a legacy demo
 * link produces a clean client-side error instead of a 422 from FastAPI.
 */
function assertUuid(value: string, label: string): void {
  if (!isUuid(value)) {
    throw new ApiError(400, 'INVALID_ID', `"${value}" is not a valid ${label} id.`);
  }
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshPromise: Promise<TokenResponse> | null = null;
  private unauthorizedHandler: (() => void) | null = null;
  private baseUrl = API_URL;

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
          throw error;
        }
        try {
          return await this.sendRaw(path, options);
        } catch (retryError) {
          if (retryError instanceof ApiError && retryError.status === 401) {
            this.setAccessToken(null);
            this.notifyUnauthorized();
          }
          throw retryError;
        }
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
    return this.request<UserResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async login(req: LoginRequest): Promise<TokenResponse> {
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
          this.notifyUnauthorized();
          throw error;
        })
        .finally(() => {
          this.refreshPromise = null;
        });
    }

    return this.refreshPromise;
  }

  async logout(): Promise<{ message: string }> {
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
    return this.request<UserResponse>('/auth/me', {
      method: 'GET',
    });
  }

  // Projects flows
  /** GET /projects -> the signed-in user's saved projects. */
  async getProjects(): Promise<ProjectListResponse> {
    return this.request<ProjectListResponse>('/projects', {
      method: 'GET',
    });
  }

  /** Older name for {@link getProjects}; kept so existing callers keep working. */
  async listProjects(): Promise<ProjectListResponse> {
    return this.getProjects();
  }

  async createProject(req: components['schemas']['ProjectCreate']): Promise<ProjectResponse> {
    return this.request<ProjectResponse>('/projects', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async getProject(projectId: string): Promise<ProjectResponse> {
    assertUuid(projectId, 'project');
    return this.request<ProjectResponse>(`/projects/${projectId}`, {
      method: 'GET',
    });
  }

  async deleteProject(projectId: string): Promise<void> {
    assertUuid(projectId, 'project');
    await this.request<void>(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  // Estimate flows
  /**
   * The options shown by the wizard, served by `/meta/options` exactly as the
   * backend defines it (ids and names only, no rates). Unknown ids are rejected
   * instead of guessed.
   */
  async getMetaOptions(): Promise<MetaOptions> {
    const response = await this.request<components['schemas']['MetaOptionsResponse']>(
      '/meta/options',
      { method: 'GET' }
    );
    return {
      is_mock: false,
      zones: response.zones.map((zone) => ({ id: zone.id, name: zone.name })),
      quality_tiers: response.quality_tiers.map((tier) => ({
        id: asQualityTier(tier.id),
        name: tier.name,
      })),
      construction_types: response.construction_types.map((type) => ({
        id: asConstructionType(type.id),
        name: type.name,
      })),
    };
  }

  /** Zones only, for callers that do not need the rest of the options. */
  async getEstimateZones(): Promise<EstimateZone[]> {
    const meta = await this.getMetaOptions();
    return meta.zones.map((zone) => ({ id: zone.id, name: zone.name }));
  }

  async createEstimate(projectId: string, req: EstimateCreate): Promise<EstimateResponse> {
    assertUuid(projectId, 'project');

    const payload: EstimateCreate = {
      ...req,
      zone_id: mapZoneToRatesZone(req.zone_id),
    };

    return this.request<EstimateResponse>(`/projects/${projectId}/estimates`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * GET /estimates/{id}. The id must be a UUID: legacy demo links such as
   * `/app/estimates/BS-2026-004` are rejected locally instead of being sent to the
   * backend, which would answer 422 and surface a validation error to the user.
   */
  async getEstimate(estimateId: string): Promise<EstimateResponse> {
    assertUuid(estimateId, 'estimate');
    return this.request<EstimateResponse>(`/estimates/${estimateId}`, {
      method: 'GET',
    });
  }

  /**
   * GET /projects/{projectId}/estimate -> retrieve latest estimate for a project.
   */
  async getProjectEstimate(projectId: string): Promise<EstimateResponse> {
    assertUuid(projectId, 'project');
    return this.request<EstimateResponse>(`/projects/${projectId}/estimate`, {
      method: 'GET',
    });
  }

  /**
   * Retrieve scientific material characteristics and site verification checklists.
   *
   * GET /meta/material-characteristics?category={category}
   */
  async getMaterialCharacteristics(
    category?: string
  ): Promise<MaterialCharacteristicResponse[]> {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.request<MaterialCharacteristicResponse[]>(
      `/meta/material-characteristics${query}`,
      { method: 'GET' }
    );
  }

  /**
   * Download the generated PDF for a saved estimate as a Blob.
   *
   * GET /projects/{projectId}/estimates/{estimateId}/pdf -> application/pdf
   *
   * The backend renders this PDF from the saved estimate row (ReportLab), so it
   * reflects the persisted totals, breakdown, inputs and budget. A response that
   * is not `application/pdf` is rejected instead of being saved as a report.
   */
  async downloadEstimatePdf(projectId: string, estimateId: string): Promise<Blob> {
    return this.requestBlob(`/projects/${projectId}/estimates/${estimateId}/pdf`, {
      method: 'GET',
    });
  }
}

export const apiClient = new ApiClient();

