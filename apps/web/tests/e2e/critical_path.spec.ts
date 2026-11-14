import { expect, test } from '@playwright/test';

/**
 * Critical path: sign in -> projects dashboard -> estimate wizard -> results.
 *
 * The dev server runs with VITE_USE_MOCK=true, so the API is served by the
 * in-browser mock client and no backend is needed. The PDF button is asserted
 * for presence only: generation needs the real API and is covered by unit
 * tests, not by this mock-mode journey.
 */
test.describe('BuildSmart critical path', () => {
  test('login, open the projects dashboard, submit the wizard and reach results', async ({
    page,
  }) => {
    // 1. Login (mock mode prefills demo credentials).
    await page.goto('/login');
    await expect(
      page.getByRole('heading', { name: 'Welcome back.' })
    ).toBeVisible();
    await page.getByRole('button', { name: /sign in to notebook/i }).click();

    // 2. Projects dashboard: the signed-in landing page.
    await expect(page).toHaveURL(/\/app\/projects$/);
    await expect(
      page.getByRole('heading', { name: 'Every idea, kept in one place.' })
    ).toBeVisible();
    const seededProject = page.getByRole('heading', { name: 'Deshmukh residence' });
    await expect(seededProject).toBeVisible();

    // 3. Wizard step 1: project details.
    await page.getByRole('link', { name: 'Start a new estimate' }).first().click();
    await expect(page).toHaveURL(/\/app\/new$/);
    await expect(
      page.getByRole('heading', { name: 'Set up your project.' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Home size and site setup' })
    ).toBeVisible();

    await page.locator('#zoneId').selectOption({ index: 1 });
    await page.getByRole('button', { name: /continue to preferences/i }).click();

    // 4. Wizard step 2: construction preferences (defaults are valid).
    await expect(
      page.getByRole('heading', { name: 'Quality and material specifications' })
    ).toBeVisible();
    await expect(page.locator('#structuralSystem')).toHaveValue('rcc_framed');
    await page.getByRole('button', { name: /calculate estimate/i }).click();

    // 5. Results page renders the estimate returned by the mock API.
    await expect(page).toHaveURL(/\/app\/estimates\/[^/]+$/);
    await expect(
      page.getByRole('heading', { name: 'Your home, in numbers.' })
    ).toBeVisible();
    await expect(page.getByText(/mock \/ stub data/i).first()).toBeVisible();

    // 6. The only PDF action is the API-backed download button.
    const downloadButton = page.getByRole('button', { name: 'Download PDF' });
    await expect(downloadButton).toBeVisible();
    await expect(downloadButton).toBeEnabled();
    await expect(page.getByRole('link', { name: /PDF preview/i })).toHaveCount(0);
  });

  test('redirects unauthenticated visitor to login and handles real logout', async ({
    page,
  }) => {
    // 1. Visiting /app directly while unauthenticated redirects to /login
    await page.goto('/app');
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole('heading', { name: 'Welcome back.' })
    ).toBeVisible();

    // 2. Logging in returns the visitor to the requested protected area (/app)
    await page.getByRole('button', { name: /sign in to notebook/i }).click();
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByText('Aniket Deshmukh', { exact: true })).toBeVisible();

    // 3. Clicking "Log out" clears session and redirects to /login
    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
