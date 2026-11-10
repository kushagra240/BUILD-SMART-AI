import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
      primary: { name: '[MOCK] Placeholder Cement A', unit_rate_inr: 100 },
      alternative: { name: '[MOCK] Placeholder Cement B', unit_rate_inr: 100 },
      reason: '[MOCK STUB] synthetic data, not validated',
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
    expect(screen.getByText('Foundation')).toBeInTheDocument();
    expect(screen.getByText(/Mock \/ stub data:/i)).toBeInTheDocument();
    expect(screen.getByTestId('sample-data-badge')).toHaveTextContent('Mock / stub data');
    expect(screen.getByText(/Stub estimate for tests/)).toBeInTheDocument();
    expect(screen.queryByText(/BS-2026-004/)).not.toBeInTheDocument();
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
});
