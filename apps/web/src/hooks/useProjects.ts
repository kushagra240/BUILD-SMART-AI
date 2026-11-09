import { useCallback, useEffect, useState } from 'react';
import { apiClient, type ProjectResponse } from '../services/apiClient';
import { apiErrorMessage } from '../lib/errorMessage';

export type LoadStatus = 'loading' | 'success' | 'error';

/** Loads the signed-in user's projects and keeps the list in sync after deletes. */
export function useProjects() {
  const [items, setItems] = useState<ProjectResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    setError(null);

    apiClient
      .listProjects()
      .then((response) => {
        if (!active) return;
        setItems(response.items);
        setTotal(response.total);
        setStatus('success');
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setStatus('error');
        setError(apiErrorMessage(cause, 'Could not load your projects'));
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  const remove = useCallback(async (projectId: string) => {
    await apiClient.deleteProject(projectId);
    setItems((previous) => previous.filter((project) => project.id !== projectId));
    setTotal((previous) => Math.max(0, previous - 1));
  }, []);

  return { items, total, status, error, reload, remove };
}

/** Loads a single project by id and exposes a delete that reports failures to the caller. */
export function useProject(projectId: string | undefined) {
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    setError(null);
    setProject(null);

    if (!projectId) {
      setStatus('error');
      setError('Project not found');
      return () => {
        active = false;
      };
    }

    apiClient
      .getProject(projectId)
      .then((response) => {
        if (!active) return;
        setProject(response);
        setStatus('success');
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setStatus('error');
        setError(apiErrorMessage(cause, 'Could not load this project'));
      });

    return () => {
      active = false;
    };
  }, [projectId, reloadKey]);

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  const remove = useCallback(async (id: string) => {
    await apiClient.deleteProject(id);
  }, []);

  return { project, status, error, reload, remove };
}
