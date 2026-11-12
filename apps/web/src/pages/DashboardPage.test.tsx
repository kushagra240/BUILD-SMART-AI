import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';
import { AuthProvider } from '../auth/AuthProvider';
import { apiClient, ApiError } from '../services/apiClient';

const project = {
  id: '22222222-2222-2222-2222-222222222222',
  user_id: '11111111-1111-1111-1111-111111111111',
  name: 'Deshmukh residence',
  notes: 'Baner, Pune · G+1',
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-07T11:42:00Z',
};

function renderDashboard() {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </AuthProvider>
  );
}

describe('DashboardPage projects', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads and displays the real project list', async () => {
    vi.spyOn(apiClient, 'getProjects').mockResolvedValue({ items: [project], total: 1 });

    renderDashboard();

    expect(await screen.findByRole('heading', { name: 'Deshmukh residence' })).toBeInTheDocument();
    expect(screen.getAllByText('Baner, Pune · G+1').length).toBeGreaterThan(0);
    expect(screen.getByText('01')).toBeInTheDocument();
  });

  it('shows an error and retries loading', async () => {
    const listSpy = vi
      .spyOn(apiClient, 'getProjects')
      .mockRejectedValueOnce(new ApiError(500, 'INTERNAL_SERVER_ERROR', 'Server unavailable'))
      .mockResolvedValueOnce({ items: [], total: 0 });

    renderDashboard();

    expect(await screen.findByRole('alert')).toHaveTextContent('Server unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('No saved projects yet.')).toBeInTheDocument();
    expect(listSpy).toHaveBeenCalledTimes(2);
  });

  it('deletes a project after confirmation and updates the list', async () => {
    vi.spyOn(apiClient, 'getProjects').mockResolvedValue({ items: [project], total: 1 });
    const deleteSpy = vi.spyOn(apiClient, 'deleteProject').mockResolvedValue();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderDashboard();

    await screen.findByRole('heading', { name: 'Deshmukh residence' });
    fireEvent.click(screen.getAllByRole('button', { name: `Delete ${project.name}` })[0]);

    expect(await screen.findByText('No saved projects yet.')).toBeInTheDocument();
    expect(deleteSpy).toHaveBeenCalledWith(project.id);
  });

  it('does not delete when the confirmation is cancelled', async () => {
    vi.spyOn(apiClient, 'getProjects').mockResolvedValue({ items: [project], total: 1 });
    const deleteSpy = vi.spyOn(apiClient, 'deleteProject').mockResolvedValue();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderDashboard();

    await screen.findByRole('heading', { name: 'Deshmukh residence' });
    fireEvent.click(screen.getAllByRole('button', { name: `Delete ${project.name}` })[0]);

    await waitFor(() => {
      expect(deleteSpy).not.toHaveBeenCalled();
    });
    expect(screen.getByRole('heading', { name: 'Deshmukh residence' })).toBeInTheDocument();
  });
});
