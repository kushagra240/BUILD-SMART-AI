import type { components } from '../types/api.generated';

export type UserResponse = components['schemas']['UserResponse'];
export type TokenResponse = components['schemas']['TokenResponse'];
export type ProjectResponse = components['schemas']['ProjectResponse'];
export type ProjectListResponse = components['schemas']['ProjectListResponse'];
export type EstimateCreate = components['schemas']['EstimateCreate'];
export type EstimateResponse = components['schemas']['EstimateResponse'];

// Default to mock mode unless explicitly set to 'false'
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

const MOCK_PROJECTS: ProjectResponse[] = [
  {
    id: 'deshmukh-residence',
    user_id: 'usr_mock_1',
    name: 'Deshmukh residence',
    zone_id: 'pune_west',
    built_up_area_sqft: 1800,
    floors: 2,
    bedrooms: 3,
    bathrooms: 3,
    quality_tier: 'standard',
    construction_type: 'rcc_framed',
    plot_area_sqft: 1200,
    budget_inr: 4320000,
    created_at: '2026-10-07T11:42:00Z',
    updated_at: '2026-10-07T11:42:00Z',
  },
  {
    id: 'kulkarni-family-home',
    user_id: 'usr_mock_1',
    name: 'Kulkarni family home',
    zone_id: 'pune_west',
    built_up_area_sqft: 1500,
    floors: 2,
    bedrooms: 3,
    bathrooms: 2,
    quality_tier: 'standard',
    construction_type: 'rcc_framed',
    plot_area_sqft: 1000,
    budget_inr: 3600000,
    created_at: '2026-10-04T09:15:00Z',
    updated_at: '2026-10-04T09:15:00Z',
  },
  {
    id: 'wagholi-courtyard-home',
    user_id: 'usr_mock_1',
    name: 'Wagholi courtyard home',
    zone_id: 'pune_east',
    built_up_area_sqft: 1200,
    floors: 2,
    bedrooms: 2,
    bathrooms: 2,
    quality_tier: 'economy',
    construction_type: 'rcc_framed',
    plot_area_sqft: 900,
    budget_inr: 2400000,
    created_at: '2026-09-28T14:30:00Z',
    updated_at: '2026-09-28T14:30:00Z',
  },
  {
    id: 'patil-residence',
    user_id: 'usr_mock_1',
    name: 'Patil residence',
    zone_id: 'pune_west',
    built_up_area_sqft: 1600,
    floors: 2,
    bedrooms: 4,
    bathrooms: 3,
    quality_tier: 'premium',
    construction_type: 'rcc_framed',
    plot_area_sqft: 1400,
    budget_inr: 4960000,
    created_at: '2026-09-22T16:00:00Z',
    updated_at: '2026-09-22T16:00:00Z',
  },
];

class ApiClient {
  private accessToken: string | null = null;
  private baseUrl = '/api/v1';

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson.error?.message) {
          errorMessage = errJson.error.message;
        } else if (errJson.detail) {
          errorMessage = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch {
        // ignore json parse error
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  // Auth flows
  async register(req: components['schemas']['RegisterRequest']): Promise<UserResponse> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 150));
      return {
        id: 'usr_mock_1',
        email: req.email,
        full_name: req.full_name,
        is_active: true,
        created_at: new Date().toISOString(),
      };
    }
    return this.request<UserResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async login(req: components['schemas']['LoginRequest']): Promise<TokenResponse> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 150));
      const res: TokenResponse = {
        access_token: 'mock_jwt_token_for_demo',
        token_type: 'bearer',
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

  async logout(): Promise<{ message: string }> {
    if (USE_MOCK) {
      this.setAccessToken(null);
      return { message: 'Logged out successfully (Mock)' };
    }
    const res = await this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
    this.setAccessToken(null);
    return res;
  }

  async getMe(): Promise<UserResponse> {
    if (USE_MOCK) {
      return {
        id: 'usr_mock_1',
        email: 'aniket@buildsmart.local',
        full_name: 'Aniket Deshmukh',
        is_active: true,
        created_at: '2026-10-07T10:00:00Z',
      };
    }
    return this.request<UserResponse>('/auth/me', {
      method: 'GET',
    });
  }

  // Projects flows
  async listProjects(): Promise<ProjectListResponse> {
    if (USE_MOCK) {
      return {
        items: MOCK_PROJECTS,
        total: MOCK_PROJECTS.length,
        page: 1,
        page_size: 10,
        pages: 1,
      };
    }
    return this.request<ProjectListResponse>('/projects', {
      method: 'GET',
    });
  }

  async createProject(req: components['schemas']['ProjectCreate']): Promise<ProjectResponse> {
    if (USE_MOCK) {
      const newProj: ProjectResponse = {
        id: `proj_${Date.now()}`,
        user_id: 'usr_mock_1',
        name: req.name,
        zone_id: req.zone_id,
        built_up_area_sqft: req.built_up_area_sqft,
        floors: req.floors,
        bedrooms: req.bedrooms,
        bathrooms: req.bathrooms,
        quality_tier: req.quality_tier,
        construction_type: req.construction_type,
        plot_area_sqft: req.plot_area_sqft ?? null,
        budget_inr: req.budget_inr ?? null,
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
    if (USE_MOCK) {
      const found = MOCK_PROJECTS.find((p) => p.id === projectId) || MOCK_PROJECTS[0];
      return found;
    }
    return this.request<ProjectResponse>(`/projects/${projectId}`, {
      method: 'GET',
    });
  }

  // Estimate flows
  async createEstimate(projectId: string, req: EstimateCreate): Promise<EstimateResponse> {
    if (USE_MOCK) {
      // Mock calculation returning round values per prompt specifications
      const proj = MOCK_PROJECTS.find((p) => p.id === projectId) || MOCK_PROJECTS[0];
      const area = proj.built_up_area_sqft;
      const rate = proj.quality_tier === 'economy' ? 2000 : proj.quality_tier === 'premium' ? 3100 : 2400;
      const totalP50 = area * rate;
      const contingency = Math.round(totalP50 * 0.05);

      return {
        id: 'BS-2026-004',
        inputs: {
          built_up_area_sqft: area,
          floors: proj.floors,
          bedrooms: proj.bedrooms,
          bathrooms: proj.bathrooms,
          zone_id: proj.zone_id,
          quality_tier: proj.quality_tier,
          construction_type: proj.construction_type,
          plot_area_sqft: proj.plot_area_sqft,
          budget_inr: proj.budget_inr,
        },
        total: {
          p50: totalP50,
          p10: Math.round(totalP50 * 0.90),
          p90: Math.round(totalP50 * 1.10),
          cost_per_sqft: rate,
          currency: 'INR',
        },
        confidence: {
          label: 'High',
          reason: 'Calibrated to Pune municipal norms and verified planning distributions.',
        },
        breakdown: [
          { category: 'Site preparation & foundation', amount: Math.round(totalP50 * 0.12), share_pct: 12, p10: Math.round(totalP50 * 0.12 * 0.9), p90: Math.round(totalP50 * 0.12 * 1.1) },
          { category: 'RCC structure', amount: Math.round(totalP50 * 0.31), share_pct: 31, p10: Math.round(totalP50 * 0.31 * 0.9), p90: Math.round(totalP50 * 0.31 * 1.1) },
          { category: 'Masonry & plaster', amount: Math.round(totalP50 * 0.18), share_pct: 18, p10: Math.round(totalP50 * 0.18 * 0.9), p90: Math.round(totalP50 * 0.18 * 1.1) },
          { category: 'Flooring & wall tiles', amount: Math.round(totalP50 * 0.10), share_pct: 10, p10: Math.round(totalP50 * 0.10 * 0.9), p90: Math.round(totalP50 * 0.10 * 1.1) },
          { category: 'Doors & windows', amount: Math.round(totalP50 * 0.10), share_pct: 10, p10: Math.round(totalP50 * 0.10 * 0.9), p90: Math.round(totalP50 * 0.10 * 1.1) },
          { category: 'Electrical works', amount: Math.round(totalP50 * 0.07), share_pct: 7, p10: Math.round(totalP50 * 0.07 * 0.9), p90: Math.round(totalP50 * 0.07 * 1.1) },
          { category: 'Plumbing & sanitary', amount: Math.round(totalP50 * 0.07), share_pct: 7, p10: Math.round(totalP50 * 0.07 * 0.9), p90: Math.round(totalP50 * 0.07 * 1.1) },
          { category: 'Painting & finishes', amount: Math.round(totalP50 * 0.07), share_pct: 7, p10: Math.round(totalP50 * 0.07 * 0.9), p90: Math.round(totalP50 * 0.07 * 1.1) },
          { category: 'Contingency allowance', amount: contingency, share_pct: 5, p10: Math.round(contingency * 0.9), p90: Math.round(contingency * 1.1) },
        ],
        materials: [],
        budget: {
          status: 'within',
          gap_inr: 0,
          gap_pct: 0,
          message: 'Budget comfortably accommodates planned construction tier.',
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
    if (USE_MOCK) {
      return this.createEstimate('deshmukh-residence', {
        construction_type: 'rcc_framed',
        quality_tier: 'standard',
        notes: null,
      });
    }
    return this.request<EstimateResponse>(`/estimates/${estimateId}`, {
      method: 'GET',
    });
  }
}

export const apiClient = new ApiClient();
