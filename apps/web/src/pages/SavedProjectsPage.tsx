import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FolderX, Plus, Search } from 'lucide-react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ErrorState, LoadingState } from '../components/common/AsyncState';
import { DeleteProjectButton } from '../components/projects/DeleteProjectButton';
import { useProjects } from '../hooks/useProjects';
import { formatDate, formatDateTime } from '../lib/formatters';

export function SavedProjectsPage() {
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const { items, total, status, error, reload, remove } = useProjects();
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  const query = search.trim().toLowerCase();
  const filtered = items.filter((project) => {
    if (query === '') return true;
    return (
      project.name.toLowerCase().includes(query) ||
      (project.notes ?? '').toLowerCase().includes(query)
    );
  });

  const handleDelete = async (projectId: string) => {
    setActionError(null);
    await remove(projectId);
  };

  const hasProjects = items.length > 0;

  const containerVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.1 } },
  };
  const itemVariants: Variants = reduceMotion
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
      };

  return (
    <div className="app-surface min-h-screen pb-16 pt-6 text-ink">
      <motion.div
        className="mx-auto max-w-shell space-y-6 px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.header
          variants={itemVariants}
          className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"
        >
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow text-accent">
                {t('projects.kicker', {
                  projectCount: String(total).padStart(2, '0'),
                })}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold leading-[1.05] tracking-[-0.055em] text-ink sm:text-4xl lg:text-5xl">
              {t('projects.title')}
            </h1>
            <p className="text-sm leading-6 text-ink-soft">{t('projects.subtitle')}</p>
          </div>

          <Link to="/app/new" className="btn-primary shrink-0">
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{t('projects.startNewEstimate')}</span>
          </Link>
        </motion.header>

        {actionError && (
          <div
            role="alert"
            className="rounded-xl border border-error/25 bg-error/5 px-5 py-3 text-sm text-error"
          >
            {actionError}
          </div>
        )}

        {status === 'loading' && <LoadingState label={t('projects.loading')} />}

        {status === 'error' && (
          <ErrorState message={error ?? t('projects.loadError')} onRetry={reload} />
        )}

        {status === 'success' && (
          <>
            {/* Search */}
            <motion.div variants={itemVariants} className="surface-card p-3 sm:p-4">
              <div className="relative max-w-md">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  aria-label={t('projects.searchLabel')}
                  placeholder={t('projects.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="field-input h-11 pl-10"
                />
              </div>
            </motion.div>

            {filtered.length > 0 ? (
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((project) => {
                    const nameId = `project-name-${project.id}`;
                    return (
                      <article
                        key={project.id}
                        aria-labelledby={nameId}
                        className="surface-card-interactive flex flex-col justify-between p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1.5">
                            <h2
                              id={nameId}
                              className="break-words text-base font-extrabold tracking-[-0.03em] text-ink"
                            >
                              <Link
                                to={`/app/projects/${project.id}`}
                                className="rounded transition-colors hover:text-accent focus-ring"
                              >
                                {project.name}
                              </Link>
                            </h2>
                            <p className="line-clamp-2 break-words text-xs leading-5 text-ink-soft">
                              {project.notes || t('projects.noNotes')}
                            </p>
                          </div>
                          <Link
                            to={`/app/projects/${project.id}`}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-paper-deep text-ink-soft transition-colors hover:bg-accent hover:text-white focus-ring"
                            aria-label={t('projects.openProject', { name: project.name })}
                          >
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        </div>

                        <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-line-soft pt-4">
                          <dl className="grid grid-cols-2 gap-x-5 gap-y-2 text-[11px]">
                            <div>
                              <dt className="eyebrow">{t('projects.created')}</dt>
                              <dd className="mt-0.5 font-semibold text-ink">
                                {formatDate(project.created_at)}
                              </dd>
                            </div>
                            <div>
                              <dt className="eyebrow">{t('projects.updated')}</dt>
                              <dd className="mt-0.5 font-semibold text-ink">
                                {formatDateTime(project.updated_at)}
                              </dd>
                            </div>
                          </dl>
                          <DeleteProjectButton
                            projectId={project.id}
                            projectName={project.name}
                            onDelete={handleDelete}
                            onError={setActionError}
                            variant="button"
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-panel px-5 py-3 text-[11px] font-semibold text-ink-soft">
                  <span>{t('projects.showing', { shown: filtered.length, total })}</span>
                  {query !== '' && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="rounded text-accent hover:underline focus-ring"
                    >
                      {t('projects.clearSearch')}
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                variants={itemVariants}
                className="surface-card flex flex-col items-center gap-4 p-10 text-center"
              >
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-accent">
                  <FolderX className="h-6 w-6" aria-hidden="true" />
                </span>
                <div className="max-w-sm space-y-1.5">
                  {query !== '' ? (
                    <>
                      <h2 className="text-lg font-bold tracking-[-0.03em] text-ink">
                        {t('projects.noMatchesTitle', { query: search })}
                      </h2>
                      <p className="text-sm leading-6 text-ink-soft">
                        {t('projects.noMatchesBody')}
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-lg font-bold tracking-[-0.03em] text-ink">
                        {t('projects.emptyTitle')}
                      </h2>
                      <p className="text-sm leading-6 text-ink-soft">{t('projects.emptyBody')}</p>
                    </>
                  )}
                </div>
                {query !== '' ? (
                  <button type="button" onClick={() => setSearch('')} className="btn-ghost h-10">
                    {t('projects.clearSearch')}
                  </button>
                ) : (
                  <Link to="/app/new" className="btn-primary h-10 px-4 text-xs">
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t('projects.startNewEstimate')}</span>
                  </Link>
                )}
              </motion.div>
            )}
          </>
        )}

        {hasProjects && (
          <motion.div
            variants={itemVariants}
            className="flex items-start gap-3 rounded-xl bg-accent-soft/70 px-5 py-4 text-xs leading-6 text-ink-soft"
          >
            <span
              className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-accent"
              aria-hidden="true"
            />
            <p>
              <strong className="font-bold text-ink">{t('projects.disclaimerTitle')}</strong>{' '}
              {t('projects.disclaimerBody')}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
