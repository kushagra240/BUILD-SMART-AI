import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, ChevronRight, FolderX } from 'lucide-react';
import { SampleDataBadge } from '../components/common/SampleDataBadge';
import { ErrorState, LoadingState } from '../components/common/AsyncState';
import { DeleteProjectButton } from '../components/projects/DeleteProjectButton';
import { useProjects } from '../hooks/useProjects';
import { isMockApi } from '../services/apiClient';
import { formatDate, formatDateTime } from '../lib/formatters';

export function SavedProjectsPage() {
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const { items, total, status, error, reload, remove } = useProjects();
  const mock = isMockApi();

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

  return (
    <div className="min-h-screen bg-paper text-ink pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
        {/* Header & CTA */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-ink/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-brick font-semibold">
                YOUR BUILDING NOTEBOOK / {String(total).padStart(2, '0')} PROJECTS
              </span>
              {mock && <SampleDataBadge text="Sample data" />}
            </div>
            <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-ink tracking-tight">
              Every idea, kept in one place.
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft font-sans">
              Return to your projects, review your notes and keep a record as plans take shape.
            </p>
          </div>

          <Link
            to="/app/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-brick hover:bg-brick-hover text-paper text-sm font-medium shadow-subtle transition-colors whitespace-nowrap focus-ring"
          >
            <Plus className="w-4 h-4" />
            <span>Start a new estimate</span>
          </Link>
        </div>

        {actionError && (
          <div
            role="alert"
            className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-xs text-error"
          >
            {actionError}
          </div>
        )}

        {status === 'loading' && <LoadingState label="Loading your saved projects…" />}

        {status === 'error' && (
          <ErrorState message={error ?? 'Could not load your projects'} onRetry={reload} />
        )}

        {status === 'success' && (
          <>
            {/* Search Bar */}
            <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-3 sm:p-4">
              <div className="relative max-w-md">
                <Search
                  className="w-4 h-4 text-ink-soft absolute left-3 top-2.5 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  aria-label="Search projects by name or notes"
                  placeholder="Search by name or notes"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-paper border border-ink/14 rounded-md text-xs text-ink placeholder:text-ink-soft focus-ring font-sans"
                />
              </div>
            </div>

            {/* Projects grid or Empty State */}
            {filtered.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((project) => {
                    const nameId = `project-name-${project.id}`;
                    return (
                      <article
                        key={project.id}
                        aria-labelledby={nameId}
                        className="group flex flex-col justify-between rounded-lg border border-ink/14 bg-paper p-4 shadow-card transition-colors hover:border-brick/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <h2
                              id={nameId}
                              className="break-words font-headline text-sm font-semibold text-ink"
                            >
                              <Link
                                to={`/app/projects/${project.id}`}
                                className="rounded transition-colors group-hover:text-brick focus-ring"
                              >
                                {project.name}
                              </Link>
                            </h2>
                            <p className="line-clamp-2 break-words text-xs text-ink-soft">
                              {project.notes || 'No notes added'}
                            </p>
                          </div>
                          <Link
                            to={`/app/projects/${project.id}`}
                            className="inline-flex shrink-0 items-center justify-center rounded p-1.5 text-ink-soft transition-colors hover:bg-paper-deep hover:text-brick focus-ring"
                            aria-label={`Open ${project.name}`}
                          >
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        </div>

                        <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-ink/10 pt-3">
                          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] text-ink-soft">
                            <div>
                              <dt className="uppercase tracking-wider">Created</dt>
                              <dd className="text-ink">{formatDate(project.created_at)}</dd>
                            </div>
                            <div>
                              <dt className="uppercase tracking-wider">Updated</dt>
                              <dd className="text-ink">{formatDateTime(project.updated_at)}</dd>
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

                {/* Results footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink/14 bg-paper-deep/40 px-4 py-2.5 font-mono text-xs text-ink-soft">
                  <span>
                    Showing {filtered.length} of {total} saved projects
                  </span>
                  {query !== '' && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="rounded text-brick hover:underline focus-ring"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-paper-deep/50 border border-ink/14 rounded-lg p-8 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-clay border border-ink/14 text-ink-soft">
                  <FolderX className="w-6 h-6 stroke-[1.5]" aria-hidden="true" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  {query !== '' ? (
                    <>
                      <h2 className="font-headline text-lg font-bold text-ink">
                        No projects match “{search}”.
                      </h2>
                      <p className="text-xs text-ink-soft">
                        Try another name or piece of notes, or clear your search.
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="font-headline text-lg font-bold text-ink">
                        No saved projects yet.
                      </h2>
                      <p className="text-xs text-ink-soft">
                        Start an estimate to create your first project. It will appear here once saved.
                      </p>
                    </>
                  )}
                </div>
                {query !== '' ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="px-4 py-2 rounded-md bg-paper border border-ink/14 text-xs font-medium text-ink hover:bg-paper-deep transition-colors focus-ring"
                  >
                    Clear search
                  </button>
                ) : (
                  <Link
                    to="/app/new"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brick hover:bg-brick-hover text-paper text-xs font-medium shadow-subtle transition-colors focus-ring"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Start a new estimate</span>
                  </Link>
                )}
              </div>
            )}
          </>
        )}

        {hasProjects && (
          <div className="bg-clay/40 border border-ink/14 rounded-lg p-4 text-xs text-ink-soft leading-relaxed space-y-1">
            <strong className="text-ink font-sans">
              Your estimates are planning records, not quotations:
            </strong>{' '}
            Amounts use the area and quality selected when saved. Review assumptions and obtain fresh local quotations before making decisions.
          </div>
        )}
      </div>
    </div>
  );
}
