import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SavedProjectsPage } from './SavedProjectsPage';
import { apiClient, ApiError } from '../services/apiClient';

const projects = [
  {
    id: '22222222-2222-2222-2222-222222222222',
    user_id: '11111111-1111-1111-1111-111111111111',
    name: 'Deshmukh residence',
    notes: 'Baner, Pune',
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-07T11:42:00Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    user_id: '11111111-1111-1111-1111-111111111111',
    name: 'Kulkarni family home',
    notes: 'Kothrud, Pune',
    created_at: '2026-10-02T10:00:00Z',
    updated_at: '2026-10-04T09:15:00Z',
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <SavedProjectsPage />
    </MemoryRouter>
  );
}

describe('SavedProjectsPage projects', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads projects and filters by name or notes', async () => {
    vi.spyOn(apiClient, 'getProjects').mockResolvedValue({ items: projects, total: 2 });

    renderPage();

    expect(await screen.findByText('Deshmukh residence')).toBeInTheDocument();
    expect(screen.getByText('Kulkarni family home')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search projects by name or notes'), {
      target: { value: 'kothrud' },
    });

    expect(screen.queryByText('Deshmukh residence')).not.toBeInTheDocument();
    expect(screen.getByText('Kulkarni family home')).toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 2 saved projects')).toBeInTheDocument();
  });

  it('shows the API error and retries', async () => {
    const listSpy = vi
      .spyOn(apiClient, 'getProjects')
      .mockRejectedValueOnce(new ApiError(500, 'INTERNAL_SERVER_ERROR', 'Project service down'))
      .mockResolvedValueOnce({ items: [], total: 0 });

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Project service down');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('No saved projects yet.')).toBeInTheDocument();
    expect(listSpy).toHaveBeenCalledTimes(2);
  });

  it('deletes a project after confirmation', async () => {
    vi.spyOn(apiClient, 'getProjects').mockResolvedValue({ items: projects, total: 2 });
    const deleteSpy = vi.spyOn(apiClient, 'deleteProject').mockResolvedValue();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderPage();

    await screen.findByText('Deshmukh residence');
    fireEvent.click(screen.getByRole('button', { name: 'Delete Deshmukh residence' }));

    await waitFor(() => {
      expect(screen.queryByText('Deshmukh residence')).not.toBeInTheDocument();
    });
    expect(deleteSpy).toHaveBeenCalledWith(projects[0].id);
    expect(screen.getByText('Showing 1 of 1 saved projects')).toBeInTheDocument();
  });

  it('renders each project as a card that links to its detail page', async () => {
    vi.spyOn(apiClient, 'getProjects').mockResolvedValue({ items: projects, total: 2 });

    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Deshmukh residence' })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Deshmukh residence' })).toHaveAttribute(
      'href',
      `/app/projects/${projects[0].id}`
    );
  });

  it('shows an empty state when the user has no projects', async () => {
    vi.spyOn(apiClient, 'getProjects').mockResolvedValue({ items: [], total: 0 });

    renderPage();

    expect(await screen.findByText('No saved projects yet.')).toBeInTheDocument();
  });

  it('keeps the row and reports a failed delete', async () => {
    vi.spyOn(apiClient, 'getProjects').mockResolvedValue({ items: projects, total: 2 });
    vi.spyOn(apiClient, 'deleteProject').mockRejectedValue(
      new ApiError(500, 'INTERNAL_SERVER_ERROR', 'Delete failed')
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderPage();

    await screen.findByText('Deshmukh residence');
    fireEvent.click(screen.getByRole('button', { name: 'Delete Deshmukh residence' }));

    expect(await screen.findByText('Delete failed')).toBeInTheDocument();
    expect(screen.getByText('Deshmukh residence')).toBeInTheDocument();
  });
});
