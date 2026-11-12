import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient, type ProjectResponse } from '../services/apiClient';
import { apiErrorMessage } from '../lib/errorMessage';

export type LoadStatus = 'loading' | 'success' | 'error';

/** Loads the signed-in user's projects and keeps the list in sync after deletes. */
export function useProjects() {
  const { t } = useTranslation();
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
      .getProjects()
      .then((response) => {
        if (!active) return;
        setItems(response.items);
        setTotal(response.total);
        setStatus('success');
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setStatus('error');
        setError(apiErrorMessage(cause, t('errors.loadProjects')));
      });

    return () => {
      active = false;
    };
  }, [reloadKey, t]);

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
  const { t } = useTranslation();
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
      setError(t('errors.projectNotFound'));
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
        setError(apiErrorMessage(cause, t('errors.loadProject')));
      });

    return () => {
      active = false;
    };
  }, [projectId, reloadKey, t]);

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  const remove = useCallback(async (id: string) => {
    await apiClient.deleteProject(id);
  }, []);

  return { project, status, error, reload, remove };
}
