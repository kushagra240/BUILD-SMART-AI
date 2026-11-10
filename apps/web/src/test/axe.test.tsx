import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
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

describe('Accessibility Checks (WCAG 2.1 AA)', () => {
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
