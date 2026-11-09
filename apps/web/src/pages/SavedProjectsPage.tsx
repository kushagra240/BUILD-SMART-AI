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

            {/* Projects Table or Empty State */}
            {filtered.length > 0 ? (
              <div className="border border-ink/14 rounded-lg overflow-hidden bg-paper shadow-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-paper-deep/70 text-ink-soft font-mono uppercase text-[10px] tracking-wider border-b border-ink/14">
                      <tr>
                        <th scope="col" className="py-3 px-4 font-semibold">Project</th>
                        <th scope="col" className="py-3 px-4 font-semibold">Created</th>
                        <th scope="col" className="py-3 px-4 font-semibold">Updated</th>
                        <th scope="col" className="py-3 px-4 text-center font-semibold">Open</th>
                        <th scope="col" className="py-3 px-4 text-center font-semibold">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/10 font-sans">
                      {filtered.map((project) => (
                        <tr
                          key={project.id}
                          className="hover:bg-paper-deep/40 transition-colors group"
                        >
                          <td className="py-3.5 px-4">
                            <Link
                              to={`/app/projects/${project.id}`}
                              className="block focus-ring rounded"
                            >
                              <div className="font-semibold text-sm text-ink group-hover:text-brick transition-colors">
                                {project.name}
                              </div>
                              <div className="text-[11px] text-ink-soft max-w-md truncate">
                                {project.notes || 'No notes added'}
                              </div>
                            </Link>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-ink-soft">
                            {formatDate(project.created_at)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-ink-soft">
                            {formatDateTime(project.updated_at)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Link
                              to={`/app/projects/${project.id}`}
                              className="inline-flex items-center justify-center p-1.5 rounded hover:bg-paper-deep text-ink-soft hover:text-brick transition-colors focus-ring"
                              aria-label={`Open ${project.name}`}
                            >
                              <ChevronRight className="w-4 h-4" aria-hidden="true" />
                            </Link>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <DeleteProjectButton
                              projectId={project.id}
                              projectName={project.name}
                              onDelete={handleDelete}
                              onError={setActionError}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer */}
                <div className="bg-paper-deep/40 border-t border-ink/14 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft font-mono">
                  <span>
                    Showing {filtered.length} of {total} saved projects
                  </span>
                  {query !== '' && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="text-brick hover:underline focus-ring rounded"
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
