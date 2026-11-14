import { render, screen } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { MethodologyPage } from '../pages/MethodologyPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { DashboardPage } from '../pages/DashboardPage';
import { SavedProjectsPage } from '../pages/SavedProjectsPage';
import { SavedProjectDetailPage } from '../pages/SavedProjectDetailPage';
import { MaterialsGuidePage } from '../pages/MaterialsGuidePage';
import { AuthProvider } from '../auth/AuthProvider';
import { apiClient } from '../services/apiClient';

const sampleProject = {
  id: '22222222-2222-2222-2222-222222222222',
  user_id: '11111111-1111-1111-1111-111111111111',
  name: 'Deshmukh residence',
  notes: 'Baner, Pune · G+1',
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-07T11:42:00Z',
  latest_estimate: {
    id: 'est-1',
    project_id: '22222222-2222-2222-2222-222222222222',
    total_p50: 4320000,
    created_at: '2026-10-07T11:42:00Z',
  },
};

describe('Accessibility Checks (WCAG 2.1 AA)', () => {
  beforeEach(() => {
    vi.spyOn(apiClient, 'getProjects').mockResolvedValue({ items: [sampleProject], total: 1 });
    vi.spyOn(apiClient, 'listProjects').mockResolvedValue({ items: [sampleProject], total: 1 });
  });
  it('LandingPage has no accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('LoginPage has no accessibility violations', async () => {
    const { container } = render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('RegisterPage has no accessibility violations', async () => {
    const { container } = render(
      <AuthProvider>
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      </AuthProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('DashboardPage has no accessibility violations', async () => {
    const { container } = render(
      <AuthProvider>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </AuthProvider>
    );
    await screen.findByRole('heading', { name: 'Deshmukh residence' });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('SavedProjectsPage has no accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <SavedProjectsPage />
      </MemoryRouter>
    );
    await screen.findByText('Deshmukh residence');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('SavedProjectDetailPage has no accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <SavedProjectDetailPage />
      </MemoryRouter>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('MaterialsGuidePage has no accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <MaterialsGuidePage />
      </MemoryRouter>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('MethodologyPage has no accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <MethodologyPage />
      </MemoryRouter>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('NotFoundPage has no accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
