import { expect, test, type Page, type Route } from '@playwright/test';
import type { components } from '../../src/types/api.generated';
import type { EstimateResponse } from '../../src/types/estimate';

/**
 * Critical path: sign in -> dashboard -> saved estimate / wizard -> results.
 *
 * The app runs in live-API mode (`isMockApi()` is always false), so every
 * backend call is stubbed at the browser network layer below. The fixtures are
 * deliberately obvious placeholders; they are not market data.
 */

type MetaOptionsResponse = components['schemas']['MetaOptionsResponse'];
type ProjectResponse = components['schemas']['ProjectResponse'];
type UserResponse = components['schemas']['UserResponse'];

const USER: UserResponse = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'e2e@buildsmart.local',
  full_name: 'E2E Test Owner',
  role: 'user',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
};

const PASSWORD = 'e2e-password-123';

const SEEDED_PROJECT: ProjectResponse = {
  id: '00000000-0000-4000-8000-000000000002',
  user_id: USER.id,
  name: 'E2E Test Residence',
  notes: 'Baner, Pune',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
};

const CREATED_PROJECT_ID = '00000000-0000-4000-8000-000000000003';
const ESTIMATE_ID = '00000000-0000-4000-8000-000000000004';

const TOKEN = {
  access_token: 'e2e-access-token',
  token_type: 'bearer',
  expires_in: 900,
};

const META_OPTIONS: MetaOptionsResponse = {
  zones: [
    { id: 'ZN-PMC', name: 'Pune Municipal Corporation (PMC)' },
    { id: 'ZN-PCMC', name: 'Pimpri-Chinchwad (PCMC)' },
  ],
  quality_tiers: [
    { id: 'economy', name: 'Economy' },
    { id: 'standard', name: 'Standard' },
    { id: 'premium', name: 'Premium' },
  ],
  construction_types: [
    { id: 'rcc_framed', name: 'RCC Framed Structure' },
    { id: 'load_bearing', name: 'Load Bearing Masonry' },
  ],
};

/** Round placeholders that sum to the round p50 total. */
const BREAKDOWN: EstimateResponse['breakdown'] = [
  { category: 'Foundation', amount: 550_000, share_pct: 11 },
  { category: 'Structure', amount: 1_400_000, share_pct: 28 },
  { category: 'Masonry', amount: 550_000, share_pct: 11 },
  { category: 'Roofing', amount: 250_000, share_pct: 5 },
  { category: 'Flooring', amount: 500_000, share_pct: 10 },
  { category: 'Plumbing', amount: 350_000, share_pct: 7 },
  { category: 'Electrical', amount: 350_000, share_pct: 7 },
  { category: 'Finishing', amount: 500_000, share_pct: 10 },
  { category: 'Labour', amount: 550_000, share_pct: 11 },
];

function estimateForProject(projectId: string): EstimateResponse {
  return {
    id: ESTIMATE_ID,
    project_id: projectId,
    total: { p50: 5_000_000, p10: 4_500_000, p90: 5_500_000, currency: 'INR' },
    confidence: {
      label: 'Low',
      reason: 'E2E fixture confidence label; not a measured accuracy figure.',
    },
    breakdown: BREAKDOWN,
    materials: [
      {
        category: 'Cement',
        primary: { material: 'E2E fixture material A' },
        alternative: { material: 'E2E fixture material B' },
        reason: 'E2E fixture only.',
        image_url: null,
      },
    ],
    material_characteristics: [],
    budget: { status: 'not_provided', gap_inr: 0 },
    drivers: [{ label: 'E2E fixture driver', impact_pct: 0 }],
    model: { version: 'e2e-fixture', data_version: 'e2e-fixture' },
    disclaimer: 'E2E fixture only. Not a construction quotation.',
    inputs: {
      built_up_area_sqft: 1800,
      floors: 2,
      bedrooms: 3,
      bathrooms: 3,
      zone_id: 'ZN-PMC',
      quality_tier: 'standard',
      construction_type: 'rcc_framed',
      plot_area_sqft: 1200,
      budget_inr: null,
    },
    is_mock: true,
    created_at: '2026-01-01T00:00:00Z',
  };
}

/**
 * Installs browser-level API stubs. `authenticated` mirrors the HttpOnly
 * refresh cookie: it starts false, flips on login and clears on logout.
 */
async function mockApi(page: Page) {
  let authenticated = false;
  const calls: string[] = [];

  await page.route('**/api/v1/**', async (route: Route) => {
    const request = route.request();
    const method = request.method();
    const path = new URL(request.url()).pathname.replace(/^\/api\/v1/, '');
    calls.push(`${method} ${path}`);

    const json = (status: number, body: unknown) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });

    if (path === '/auth/refresh' && method === 'POST') {
      return authenticated
        ? json(200, TOKEN)
        : json(401, { detail: 'No refresh token' });
    }

    if (path === '/auth/login' && method === 'POST') {
      authenticated = true;
      return json(200, TOKEN);
    }

    if (path === '/auth/me' && method === 'GET') {
      return authenticated ? json(200, USER) : json(401, { detail: 'Not authenticated' });
    }

    if (path === '/auth/logout' && method === 'POST') {
      authenticated = false;
      return json(200, { message: 'Logged out' });
    }

    if (!authenticated) {
      return json(401, { detail: 'Not authenticated' });
    }

    if (path === '/meta/options' && method === 'GET') {
      return json(200, META_OPTIONS);
    }

    if (path === '/meta/material-characteristics' && method === 'GET') {
      return json(200, []);
    }

    if (path === '/projects' && method === 'GET') {
      return json(200, { items: [SEEDED_PROJECT], total: 1 });
    }

    if (path === '/projects' && method === 'POST') {
      const payload = request.postDataJSON() as { name?: string; notes?: string };
      return json(201, {
        ...SEEDED_PROJECT,
        id: CREATED_PROJECT_ID,
        name: payload.name ?? SEEDED_PROJECT.name,
        notes: payload.notes ?? null,
        created_at: '2026-01-03T00:00:00Z',
        updated_at: '2026-01-03T00:00:00Z',
      });
    }

    const projectMatch = path.match(/^\/projects\/([^/]+)$/);
    if (projectMatch && method === 'GET') {
      return json(200, { ...SEEDED_PROJECT, id: projectMatch[1] });
    }

    const latestEstimateMatch = path.match(/^\/projects\/([^/]+)\/estimate$/);
    if (latestEstimateMatch && method === 'GET') {
      return json(200, estimateForProject(latestEstimateMatch[1]));
    }

    const createEstimateMatch = path.match(/^\/projects\/([^/]+)\/estimates$/);
    if (createEstimateMatch && method === 'POST') {
      return json(201, estimateForProject(createEstimateMatch[1]));
    }

    const estimateMatch = path.match(/^\/estimates\/([^/]+)$/);
    if (estimateMatch && method === 'GET') {
      return json(200, estimateForProject(estimateMatch[1]));
    }

    const pdfMatch = path.match(/^\/projects\/([^/]+)\/estimates\/([^/]+)\/pdf$/);
    if (pdfMatch && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: '%PDF-1.4\n%E2E fixture PDF\n%%EOF\n',
      });
    }

    return json(404, { detail: `E2E API stub has no handler for ${method} ${path}` });
  });

  return calls;
}

async function signIn(page: Page) {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
  await page.locator('#email').fill(USER.email);
  await page.locator('#password').fill(PASSWORD);
  await page.getByRole('button', { name: /sign in to notebook/i }).click();
}

test.describe('BuildSmart critical path', () => {
  test('login, open a saved estimate from the dashboard and download the PDF', async ({
    page,
  }) => {
    await mockApi(page);

    // 1. Login lands on the saved-project list.
    await signIn(page);
    await expect(page).toHaveURL(/\/app\/projects$/);
    await expect(
      page.getByRole('heading', { name: 'Every idea, kept in one place.' })
    ).toBeVisible();

    // 2. The dashboard lists the saved project.
    await page.goto('/app');
    await expect(page.getByRole('heading', { name: 'Your estimates' })).toBeVisible();
    await expect(page.getByRole('heading', { name: SEEDED_PROJECT.name })).toBeVisible();

    // 3. A project card opens the estimate on the new project-scoped route.
    await page
      .getByRole('link', { name: new RegExp(SEEDED_PROJECT.name) })
      .first()
      .click();
    await expect(page).toHaveURL(
      new RegExp(`/projects/${SEEDED_PROJECT.id}/estimate$`)
    );
    await expect(
      page.getByRole('heading', { name: 'Your home, in numbers.' })
    ).toBeVisible();

    // 4. The PDF action calls the stubbed API and downloads a PDF.
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^buildsmart-estimate-.+\.pdf$/);
  });

  test('submit the wizard and reach results', async ({ page }) => {
    await mockApi(page);

    await signIn(page);
    await expect(page).toHaveURL(/\/app\/projects$/);

    // 1. Start a new estimate from the saved-project list.
    await page.getByRole('link', { name: 'Start a new estimate' }).first().click();
    await expect(page).toHaveURL(/\/app\/new$/);
    await expect(page.getByRole('heading', { name: 'Set up your project.' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Home size and site setup' })
    ).toBeVisible();

    // 2. Wizard step 1: pick a zone from the live `/meta/options` response.
    await page.locator('#zoneId').selectOption('ZN-PMC');
    await page.getByRole('button', { name: /continue to preferences/i }).click();

    // 3. Wizard step 2: defaults are valid; submit to the API.
    await expect(
      page.getByRole('heading', { name: 'Quality and material specifications' })
    ).toBeVisible();
    await expect(page.locator('#structuralSystem')).toHaveValue('rcc_framed');
    await page.getByRole('button', { name: /calculate estimate/i }).click();

    // 4. Results render the estimate returned by the API stub.
    await expect(page).toHaveURL(new RegExp(`/app/estimates/${ESTIMATE_ID}$`));
    await expect(
      page.getByRole('heading', { name: 'Your home, in numbers.' })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download PDF' })).toBeEnabled();
    await expect(page.getByRole('link', { name: /PDF preview/i })).toHaveCount(0);
  });

  test('redirects unauthenticated visitor to login and handles real logout', async ({
    page,
  }) => {
    await mockApi(page);

    // 1. Visiting /app while unauthenticated redirects to /login.
    await page.goto('/app');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();

    // 2. Logging in returns the visitor to the requested protected area.
    await page.locator('#email').fill(USER.email);
    await page.locator('#password').fill(PASSWORD);
    await page.getByRole('button', { name: /sign in to notebook/i }).click();
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByText(USER.full_name, { exact: true })).toBeVisible();

    // 3. Logging out calls the API, clears the session and returns to /login.
    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/app');
    await expect(page).toHaveURL(/\/login$/);
  });
});
