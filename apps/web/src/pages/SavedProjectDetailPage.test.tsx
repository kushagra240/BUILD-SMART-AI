import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SavedProjectDetailPage } from './SavedProjectDetailPage';
import { apiClient, ApiError } from '../services/apiClient';

const project = {
  id: '22222222-2222-2222-2222-222222222222',
  user_id: '11111111-1111-1111-1111-111111111111',
  name: 'Deshmukh residence',
  notes: 'Corner plot near Baner hill. Confirm setbacks with architect.',
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-07T11:42:00Z',
};

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={[`/app/projects/${project.id}`]}>
      <Routes>
        <Route path="/app/projects" element={<div>projects index</div>} />
        <Route path="/app/projects/:id" element={<SavedProjectDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('SavedProjectDetailPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads the project by id and shows its notes', async () => {
    const getSpy = vi.spyOn(apiClient, 'getProject').mockResolvedValue(project);

    renderDetail();

    expect(await screen.findByRole('heading', { name: project.name })).toBeInTheDocument();
    expect(screen.getByText(project.notes)).toBeInTheDocument();
    expect(screen.getByText(/No estimate has been generated/i)).toBeInTheDocument();
    expect(getSpy).toHaveBeenCalledWith(project.id);
  });

  it('shows a failure state when the project cannot be loaded', async () => {
    vi.spyOn(apiClient, 'getProject').mockRejectedValue(
      new ApiError(404, 'NOT_FOUND', 'Project not found')
    );

    renderDetail();

    expect(await screen.findByRole('alert')).toHaveTextContent('Project not found');
    expect(screen.getByRole('link', { name: /Back to saved projects/i })).toBeInTheDocument();
  });

  it('deletes the project and returns to the list', async () => {
    vi.spyOn(apiClient, 'getProject').mockResolvedValue(project);
    const deleteSpy = vi.spyOn(apiClient, 'deleteProject').mockResolvedValue();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderDetail();

    await screen.findByRole('heading', { name: project.name });
    fireEvent.click(screen.getByRole('button', { name: `Delete ${project.name}` }));

    await waitFor(() => {
      expect(screen.getByText('projects index')).toBeInTheDocument();
    });
    expect(deleteSpy).toHaveBeenCalledWith(project.id);
  });
});
