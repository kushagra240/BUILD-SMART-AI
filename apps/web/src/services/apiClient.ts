import type { components } from '../types/api.generated';

export type UserResponse = components['schemas']['UserResponse'];
export type TokenResponse = components['schemas']['TokenResponse'];
export type ProjectResponse = components['schemas']['ProjectResponse'];
export type ProjectListResponse = components['schemas']['ProjectListResponse'];
export type EstimateCreate = components['schemas']['EstimateCreate'];
export type EstimateResponse = components['schemas']['EstimateResponse'];

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
    return this.request<UserResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async login(req: components['schemas']['LoginRequest']): Promise<TokenResponse> {
    const res = await this.request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(req),
    });
    this.setAccessToken(res.access_token);
    return res;
  }

  async logout(): Promise<{ message: string }> {
    const res = await this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
    this.setAccessToken(null);
    return res;
  }

  async getMe(): Promise<UserResponse> {
    return this.request<UserResponse>('/auth/me', {
      method: 'GET',
    });
  }

  // Projects flows
  async listProjects(): Promise<ProjectListResponse> {
    return this.request<ProjectListResponse>('/projects', {
      method: 'GET',
    });
  }

  async createProject(req: components['schemas']['ProjectCreate']): Promise<ProjectResponse> {
    return this.request<ProjectResponse>('/projects', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async getProject(projectId: string): Promise<ProjectResponse> {
    return this.request<ProjectResponse>(`/projects/${projectId}`, {
      method: 'GET',
    });
  }

  // Estimate flows
  async createEstimate(projectId: string, req: EstimateCreate): Promise<EstimateResponse> {
    return this.request<EstimateResponse>(`/projects/${projectId}/estimates`, {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async getEstimate(estimateId: string): Promise<EstimateResponse> {
    return this.request<EstimateResponse>(`/estimates/${estimateId}`, {
      method: 'GET',
    });
  }
}

export const apiClient = new ApiClient();
