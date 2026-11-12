import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WizardPage } from './WizardPage';
import { apiClient, ApiError, type EstimateResponse } from '../services/apiClient';

const project = {
  id: 'project-1',
  user_id: '11111111-1111-1111-1111-111111111111',
  name: 'Deshmukh residence',
  notes: 'Baner, Pune',
  created_at: '2026-11-10T10:00:00Z',
  updated_at: '2026-11-10T10:00:00Z',
};

const estimateInputs = {
  built_up_area_sqft: 1800,
  floors: 2,
  bedrooms: 3,
  bathrooms: 3,
  zone_id: 'zone-west',
  quality_tier: 'standard' as const,
  construction_type: 'rcc_framed' as const,
  plot_area_sqft: 1200,
};

const estimate: EstimateResponse = {
  id: 'estimate-1',
  project_id: project.id,
  total: { p50: 3600000, p10: 3200000, p90: 4000000, currency: 'INR' },
  confidence: { label: 'Low', reason: 'Stub estimate' },
  breakdown: [],
  materials: [],
  budget: { status: 'not_provided', gap_inr: 0 },
  drivers: [],
  model: { version: 'v0.1-stub', data_version: 'stub' },
  disclaimer: 'Stub estimate',
  inputs: estimateInputs,
  is_mock: true,
  created_at: '2026-11-10T10:00:00Z',
};

function renderWizard() {
  return render(
    <MemoryRouter initialEntries={['/app/new']}>
      <Routes>
        <Route path="/app/new" element={<WizardPage />} />
        <Route path="/app/estimates/:id" element={<div>estimate result page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

async function advanceToStep2() {
  await waitFor(() => {
    expect(screen.getByLabelText(/Location zone/)).toHaveTextContent('West Pune');
  });
  fireEvent.change(screen.getByLabelText(/Location zone/), {
    target: { value: 'zone-west' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Continue to preferences/ }));
  await screen.findByRole('button', { name: /Calculate estimate/ });
}

describe('WizardPage estimate wiring', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    vi.spyOn(apiClient, 'getEstimateZones').mockResolvedValue([
      { id: 'zone-west', name: 'West Pune' },
    ]);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('creates a project and posts the real estimate payload', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    const createProjectSpy = vi.spyOn(apiClient, 'createProject').mockResolvedValue(project);
    const createEstimateSpy = vi.spyOn(apiClient, 'createEstimate').mockResolvedValue(estimate);

    renderWizard();
    await advanceToStep2();
    fireEvent.click(screen.getByRole('button', { name: /Calculate estimate/ }));

    expect(await screen.findByText('estimate result page')).toBeInTheDocument();
    expect(createProjectSpy).toHaveBeenCalledWith({
      name: 'Deshmukh residence',
      notes: expect.stringContaining('Baner'),
    });
    expect(createEstimateSpy).toHaveBeenCalledWith(project.id, {
      built_up_area_sqft: 1800,
      floors: 2,
      bedrooms: 3,
      bathrooms: 3,
      zone_id: 'zone-west',
      quality_tier: 'standard',
      construction_type: 'rcc_framed',
      plot_area_sqft: 1200,
    });
  });

  it('shows a loading state while the request is pending', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    vi.spyOn(apiClient, 'createProject').mockResolvedValue(project);
    vi.spyOn(apiClient, 'createEstimate').mockImplementation(
      () => new Promise<EstimateResponse>(() => {})
    );

    renderWizard();
    await advanceToStep2();
    fireEvent.click(screen.getByRole('button', { name: /Calculate estimate/ }));

    const pending = await screen.findByRole('button', { name: 'Calculating...' });
    expect(pending).toBeDisabled();
    expect(pending).toHaveAttribute('aria-busy', 'true');
  });

  it('shows a 422 error and its field details without navigating', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    vi.spyOn(apiClient, 'createProject').mockResolvedValue(project);
    vi.spyOn(apiClient, 'createEstimate').mockRejectedValue(
      new ApiError(422, 'VALIDATION_ERROR', 'Request payload validation failed', [
        {
          loc: ['body', 'bedrooms'],
          msg: 'Input should be less than or equal to 20',
          type: 'less_than_equal',
        },
      ])
    );

    renderWizard();
    await advanceToStep2();
    fireEvent.click(screen.getByRole('button', { name: /Calculate estimate/ }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Request payload validation failed');
    expect(alert).toHaveTextContent('bedrooms');
    expect(alert).toHaveTextContent('Input should be less than or equal to 20');
    expect(screen.queryByText('estimate result page')).not.toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Calculate estimate/ })).toBeEnabled();
  });

  it('reuses the created project when the user retries', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    const createProjectSpy = vi.spyOn(apiClient, 'createProject').mockResolvedValue(project);
    const createEstimateSpy = vi
      .spyOn(apiClient, 'createEstimate')
      .mockRejectedValueOnce(
        new ApiError(500, 'INTERNAL_SERVER_ERROR', 'Estimate service unavailable')
      )
      .mockResolvedValueOnce(estimate);

    renderWizard();
    await advanceToStep2();
    fireEvent.click(screen.getByRole('button', { name: /Calculate estimate/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Estimate service unavailable');
    fireEvent.click(screen.getByRole('button', { name: /Calculate estimate/ }));

    expect(await screen.findByText('estimate result page')).toBeInTheDocument();
    expect(createProjectSpy).toHaveBeenCalledTimes(1);
    expect(createEstimateSpy).toHaveBeenCalledTimes(2);
    expect(createEstimateSpy).toHaveBeenNthCalledWith(2, project.id, expect.any(Object));
  });

  it('keeps the in-browser mock flow without touching the real API in mock mode', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'true');
    const createProjectSpy = vi.spyOn(apiClient, 'createProject');
    const createEstimateSpy = vi.spyOn(apiClient, 'createEstimate');

    renderWizard();
    await advanceToStep2();
    fireEvent.click(screen.getByRole('button', { name: /Calculate estimate/ }));

    expect(await screen.findByText('estimate result page')).toBeInTheDocument();
    expect(createProjectSpy).not.toHaveBeenCalled();
    expect(createEstimateSpy).not.toHaveBeenCalled();
  });

  it('shows an error when the zone options cannot be loaded and retries', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    const zonesSpy = vi
      .spyOn(apiClient, 'getEstimateZones')
      .mockRejectedValueOnce(new ApiError(500, 'INTERNAL_SERVER_ERROR', 'Options unavailable'))
      .mockResolvedValueOnce([{ id: 'zone-west', name: 'West Pune' }]);

    renderWizard();

    expect(await screen.findByRole('alert')).toHaveTextContent('Options unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Location zone/)).toHaveTextContent('West Pune');
    });
    expect(zonesSpy).toHaveBeenCalledTimes(2);
  });
});
