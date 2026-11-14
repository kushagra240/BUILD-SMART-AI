import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResultsPage } from './ResultsPage';
import { apiClient, ApiError, type EstimateResponse } from '../services/apiClient';

const estimate: EstimateResponse = {
  id: '11111111-1111-1111-1111-111111111111',
  project_id: '22222222-2222-2222-2222-222222222222',
  total: { p50: 3600000, p10: 2880000, p90: 4320000, currency: 'INR' },
  confidence: { label: 'Medium', reason: 'Stub estimate for tests' },
  breakdown: [
    { category: 'Foundation', amount: 432000, share_pct: 12 },
    { category: 'Structure', amount: 900000, share_pct: 25 },
    { category: 'Labour', amount: 288000, share_pct: 8 },
  ],
  materials: [
    {
      category: 'cement',
      primary: { name: 'OPC 43 Grade Cement', unit_rate_inr: 400 },
      alternative: { name: 'PPC Blended Cement', unit_rate_inr: 350 },
      reason: 'Selected for structural RCC work.',
    },
  ],
  budget: { status: 'not_provided', gap_inr: 0 },
  drivers: [
    { label: 'Built-up Area', impact_pct: 30 },
    { label: 'Floors Count (2)', impact_pct: 20 },
  ],
  model: { version: 'DEV-MOCK-v0.0', data_version: 'DEV-SYNTHETIC-v0.0' },
  disclaimer: '[MOCK STUB] Test disclaimer text',
  inputs: {
    built_up_area_sqft: 1800,
    floors: 2,
    bedrooms: 3,
    bathrooms: 3,
    zone_id: 'pune_west',
    quality_tier: 'standard',
    construction_type: 'rcc_framed',
    plot_area_sqft: 1200,
  },
  is_mock: true,
  created_at: '2026-11-10T10:00:00Z',
};

type RenderOptions = {
  path?: string;
  state?: unknown;
};

function renderResults({ path = `/app/estimates/${estimate.id}`, state }: RenderOptions = {}) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state }]}>
      <Routes>
        <Route path="/app" element={<div>dashboard page</div>} />
        <Route path="/app/estimates" element={<ResultsPage />} />
        <Route path="/app/estimates/:id" element={<ResultsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ResultsPage contract rendering', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a navigation-state estimate with a clear mock warning', () => {
    renderResults({
      state: { estimate, projectName: 'Deshmukh residence', locality: 'Baner, Pune' },
    });

    expect(screen.getByRole('heading', { name: 'Your home, in numbers.' })).toBeInTheDocument();
    expect(screen.getByText(/Deshmukh residence · estimate/i)).toBeInTheDocument();
    // The total is rendered in the KPI block and in the breakdown total row.
    expect(screen.getAllByText(/36,00,000/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Foundation').length).toBeGreaterThanOrEqual(1);
    // The legend is derived from the breakdown, not a static grouping.
    expect(screen.queryByText('Finishes')).not.toBeInTheDocument();
    expect(screen.queryByText('Buffer')).not.toBeInTheDocument();
    expect(screen.getAllByText('12%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Mock \/ stub data:/i)).toBeInTheDocument();
    expect(screen.getByTestId('sample-data-badge')).toHaveTextContent('Mock / stub data');
    expect(screen.getByText(/Stub estimate for tests/)).toBeInTheDocument();
    expect(screen.queryByText(/BS-2026-004/)).not.toBeInTheDocument();
  });

  it('gives every cost category its own colour in the breakdown', () => {
    const { container } = renderResults({ state: { estimate } });

    expect(screen.getByTestId('budget-donut')).toBeInTheDocument();

    // The API sends capitalised labels while the palette is keyed by the
    // lowercase contract values; a mismatch would paint every slice the same.
    const colors = Array.from(container.querySelectorAll('[data-testid="category-dot"]')).map(
      (dot) => (dot as HTMLElement).style.backgroundColor
    );

    expect(colors).toHaveLength(estimate.breakdown.length);
    expect(new Set(colors).size).toBe(estimate.breakdown.length);
  });

  it('does not show the mock warning for a non-mock estimate', () => {
    renderResults({
      state: { estimate: { ...estimate, is_mock: false } },
    });

    expect(screen.getByRole('heading', { name: 'Your home, in numbers.' })).toBeInTheDocument();
    expect(screen.queryByText(/Mock \/ stub data/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('sample-data-badge')).not.toBeInTheDocument();
  });

  it('fetches the estimate by URL id when navigation state is missing', async () => {
    const getSpy = vi.spyOn(apiClient, 'getEstimate').mockResolvedValue(estimate);

    renderResults();

    expect(await screen.findByRole('heading', { name: 'Your home, in numbers.' })).toBeInTheDocument();
    expect(getSpy).toHaveBeenCalledWith(estimate.id);
    expect(screen.getByText(/Mock \/ stub data:/i)).toBeInTheDocument();
  });

  it('ignores invalid navigation state and fetches the estimate instead', async () => {
    const getSpy = vi.spyOn(apiClient, 'getEstimate').mockResolvedValue(estimate);

    renderResults({ state: { estimate: { id: 'not-a-full-estimate' } } });

    expect(await screen.findByRole('heading', { name: 'Your home, in numbers.' })).toBeInTheDocument();
    expect(getSpy).toHaveBeenCalledWith(estimate.id);
  });

  it('shows a failure state and retries the fetch', async () => {
    const getSpy = vi
      .spyOn(apiClient, 'getEstimate')
      .mockRejectedValueOnce(new ApiError(404, 'NOT_FOUND', 'Estimate not found'))
      .mockResolvedValueOnce(estimate);

    renderResults();

    expect(await screen.findByRole('alert')).toHaveTextContent('Estimate not found');
    expect(screen.getByRole('link', { name: 'Back to dashboard' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { name: 'Your home, in numbers.' })).toBeInTheDocument();
    expect(getSpy).toHaveBeenCalledTimes(2);
  });

  it('redirects to the dashboard when there is no id and no valid state', () => {
    renderResults({ path: '/app/estimates' });

    expect(screen.getByText('dashboard page')).toBeInTheDocument();
  });

  it('renders a surplus budget gap as being above the estimate', () => {
    renderResults({
      state: { estimate: { ...estimate, budget: { status: 'within', gap_inr: 250000 } } },
    });

    expect(screen.getByText('Above estimate by ₹2,50,000')).toBeInTheDocument();
  });

  it('renders a below-minimum budget as a shortfall, and hides a zero gap amount', () => {
    renderResults({
      state: { estimate: { ...estimate, budget: { status: 'below_minimum', gap_inr: 400000 } } },
    });

    expect(screen.getByText(/Below Minimum · short by ₹4,00,000/)).toBeInTheDocument();
  });

  it('does not invent a budget gap when the stored estimate returns zero', () => {
    renderResults({
      state: { estimate: { ...estimate, budget: { status: 'tight', gap_inr: 0 } } },
    });

    expect(screen.getByText('Tight')).toBeInTheDocument();
    expect(screen.queryByText(/short by/)).not.toBeInTheDocument();
  });
  it('no longer links to the removed PDF preview route', () => {
    renderResults({ state: { estimate } });

    const staleLinks = screen
      .queryAllByRole('link')
      .filter((link) => link.getAttribute('href') === '/pdf');
    expect(staleLinks).toHaveLength(0);
    expect(screen.queryByText(/PDF preview/i)).not.toBeInTheDocument();
  });

  it('renders one comparison table per material with the keys the API sent', () => {
    renderResults({
      state: {
        estimate: {
          ...estimate,
          materials: [
            {
              category: 'cement',
              primary: { name: 'OPC 53 grade', grade: 'OPC 53', unit_rate_inr: 42000 },
              alternative: { name: 'PPC blend', grade: 'PPC', unit_rate_inr: 39500 },
              reason: 'Chosen for structural work.',
            },
          ],
        },
      },
    });

    expect(screen.getByRole('heading', { name: 'Cement' })).toBeInTheDocument();
    expect(screen.getByText('Chosen for structural work.')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Specification' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Alternative' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Grade' })).toBeInTheDocument();
    expect(screen.getByText('OPC 53 grade')).toBeInTheDocument();
    expect(screen.getByText('PPC blend')).toBeInTheDocument();
    // Numbers use the en-IN formatter, not raw digits.
    expect(screen.getByText('42,000')).toBeInTheDocument();
  });

  it('uses the union of dictionary keys and marks a missing value as not provided', () => {
    renderResults({
      state: {
        estimate: {
          ...estimate,
          materials: [
            {
              category: 'steel',
              primary: { name: 'Fe 500D TMT', grade: 'Fe 500D' },
              alternative: { name: 'Fe 550D TMT' },
              reason: 'Reinforcement steel.',
            },
          ],
        },
      },
    });

    expect(screen.getByRole('rowheader', { name: 'Grade' })).toBeInTheDocument();
    const table = screen.getByRole('table', {
      name: /Steel primary and alternative specification/i,
    });
    expect(within(table).getByText('Not provided')).toBeInTheDocument();
  });

  it('shows dictionary values verbatim instead of rewriting provenance markers', () => {
    renderResults({ state: { estimate } });

    // Values must be rendered exactly as the API sent them; provenance comes
    // from the is_mock badge, never from string rewriting in the view.
    expect(screen.getByText('OPC 43 Grade Cement')).toBeInTheDocument();
    expect(screen.getByText('PPC Blended Cement')).toBeInTheDocument();
    expect(screen.getByTestId('sample-data-badge')).toHaveTextContent('Mock / stub data');
  });

  it('shows an empty state when the estimate has no materials', () => {
    renderResults({ state: { estimate: { ...estimate, materials: [] } } });

    expect(
      screen.getByText('No material recommendations were returned for this estimate.')
    ).toBeInTheDocument();
  });
});

describe('ResultsPage PDF download', () => {
  const objectUrl = 'blob:buildsmart-estimate';
  const createObjectURL = vi.fn(() => objectUrl);
  const revokeObjectURL = vi.fn();
  const clicked: { anchor: HTMLAnchorElement | null } = { anchor: null };

  beforeEach(() => {
    clicked.anchor = null;
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    // jsdom does not implement the object-URL API.
    Object.defineProperty(URL, 'createObjectURL', {
      value: createObjectURL,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: revokeObjectURL,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // The page revokes the object URL on a 0 ms timer, which may fire after the
    // test body finishes, so replace the spies with no-ops instead of deleting.
    Object.defineProperty(URL, 'createObjectURL', {
      value: () => objectUrl,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: () => {},
      configurable: true,
      writable: true,
    });
  });

  it('requests the PDF with the contract ids and starts the browser download', async () => {
    const blob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
    const downloadSpy = vi.spyOn(apiClient, 'downloadEstimatePdf').mockResolvedValue(blob);
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        clicked.anchor = this;
      });

    renderResults({ state: { estimate } });
    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));

    await waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1));

    expect(downloadSpy).toHaveBeenCalledWith(estimate.project_id, estimate.id);
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(clicked.anchor?.download).toBe(
      `buildsmart-estimate-${estimate.id.slice(0, 8).toUpperCase()}.pdf`
    );
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeEnabled();
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith(objectUrl));
  });

  it('shows a busy state until the PDF request resolves', async () => {
    let resolvePdf: (blob: Blob) => void = () => {};
    const pending = new Promise<Blob>((resolve) => {
      resolvePdf = resolve;
    });
    vi.spyOn(apiClient, 'downloadEstimatePdf').mockReturnValue(pending);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    renderResults({ state: { estimate } });
    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));

    const busyButton = await screen.findByRole('button', { name: 'Generating PDF…' });
    expect(busyButton).toBeDisabled();
    expect(busyButton).toHaveAttribute('aria-busy', 'true');

    resolvePdf(new Blob(['%PDF-1.4'], { type: 'application/pdf' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Download PDF' })).toBeEnabled()
    );
  });

  it('keeps the estimate readable and shows the error when the PDF fails', async () => {
    vi.spyOn(apiClient, 'downloadEstimatePdf').mockRejectedValue(
      new ApiError(404, 'NOT_FOUND', 'PDF export is not available yet')
    );
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    renderResults({ state: { estimate } });
    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('PDF export failed');
    expect(alert).toHaveTextContent('PDF export is not available yet');
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeEnabled();
    expect(clickSpy).not.toHaveBeenCalled();
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Your home, in numbers.' })).toBeInTheDocument();
    expect(screen.getAllByText(/36,00,000/).length).toBeGreaterThanOrEqual(2);
  });

  it('clears the error and downloads when the user retries', async () => {
    const blob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
    vi.spyOn(apiClient, 'downloadEstimatePdf')
      .mockRejectedValueOnce(new ApiError(503, 'UNAVAILABLE', 'PDF service warming up'))
      .mockResolvedValueOnce(blob);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    renderResults({ state: { estimate } });
    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('PDF service warming up');

    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));

    await waitFor(() => expect(createObjectURL).toHaveBeenCalledWith(blob));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
