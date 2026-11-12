import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, ChevronRight, FolderOpen, Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SampleDataBadge } from '../components/common/SampleDataBadge';
import { ErrorState, LoadingState } from '../components/common/AsyncState';
import { DeleteProjectButton } from '../components/projects/DeleteProjectButton';
import { useAuth } from '../auth/useAuth';
import { useProjects } from '../hooks/useProjects';
import { isMockApi } from '../services/apiClient';
import { formatDate, formatDateTime } from '../lib/formatters';

function projectReference(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export function DashboardPage() {
  const { user } = useAuth();
  const { items, total, status, error, reload, remove } = useProjects();
  const [actionError, setActionError] = useState<string | null>(null);
  const mock = isMockApi();
  const latest = items[0] ?? null;
  const { t } = useTranslation();

  const handleDelete = async (projectId: string) => {
    setActionError(null);
    await remove(projectId);
  };

  return (
    <div className="min-h-screen bg-paper text-ink pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* Top Header & CTA */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-ink/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-brick font-semibold">
                {t('dashboard.kicker')}
              </span>
              {mock && <SampleDataBadge text={t('common.sampleData')} />}
            </div>
            <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-ink tracking-tight">
              {t('dashboard.title')}
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft font-sans">
              {user
                ? t('dashboard.welcome', { name: user.full_name })
                : t('dashboard.welcomePlain')}
            </p>
          </div>

          <Link
            to="/app/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-brick hover:bg-brick-hover text-paper text-sm font-medium shadow-subtle transition-colors whitespace-nowrap focus-ring"
          >
            <Plus className="w-4 h-4" />
            <span>{t('projects.startNewEstimate')}</span>
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

        {status === 'loading' && <LoadingState label={t('dashboard.loading')} />}

        {status === 'error' && (
          <ErrorState
            message={error ?? t('dashboard.errors.load')}
            onRetry={reload}
          />
        )}

        {status === 'success' && (
          <>
            {latest ? (
              <div className="bg-paper-deep/60 border border-ink/14 rounded-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12 shadow-card">
                {/* Left Details */}
                <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                      <span className="text-[11px] uppercase tracking-wider text-ink-soft font-semibold">
                        {t('dashboard.latest.label')}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-clay border border-ink/14 text-[11px] text-ink">
                        {projectReference(latest.id)}
                      </span>
                    </div>

                    <h2 className="font-headline text-2xl sm:text-3xl font-bold text-ink">
                      {latest.name}
                    </h2>
                    <p className="text-xs text-ink-soft">
                      {latest.notes || t('dashboard.latest.noNotes')}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-b border-ink/10 py-4 text-xs">
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-ink-soft">
                        {t('dashboard.latest.created')}
                      </div>
                      <div className="mt-0.5 font-medium text-ink">
                        {formatDate(latest.created_at)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-ink-soft">
                        {t('dashboard.latest.updated')}
                      </div>
                      <div className="mt-0.5 font-medium text-ink">
                        {formatDateTime(latest.updated_at)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-ink-soft">
                        {t('dashboard.latest.estimate')}
                      </div>
                      <div className="mt-0.5 font-medium text-ink-soft">
                        {t('dashboard.latest.notCalculated')}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      to={`/app/projects/${latest.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brick hover:bg-brick-hover text-paper text-xs font-medium shadow-subtle transition-colors focus-ring"
                    >
                      <span>{t('dashboard.latest.open')}</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                    <DeleteProjectButton
                      projectId={latest.id}
                      projectName={latest.name}
                      onDelete={handleDelete}
                      onError={setActionError}
                    />
                  </div>
                </div>

                {/* Right Image / Architectural Vignette */}
                <div className="lg:col-span-5 bg-clay/40 border-t lg:border-t-0 lg:border-l border-ink/14 flex flex-col justify-between p-6">
                  <div className="w-full h-48 sm:h-56 rounded-md overflow-hidden bg-forest/5 border border-ink/14 flex flex-col items-center justify-center p-4 relative">
                    <svg
                      viewBox="0 0 240 140"
                      className="w-full h-full max-h-48 text-forest"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="210" cy="30" r="14" fill="#D9A441" fillOpacity="0.25" stroke="#D9A441" strokeWidth="1" />
                      <path d="M190 85 C190 70, 210 65, 215 75 C220 65, 235 70, 235 85 Z" fill="#1F4D45" fillOpacity="0.15" stroke="none" />
                      <rect x="25" y="45" width="165" height="75" fill="#E8DCC7" fillOpacity="0.6" stroke="#1F2421" strokeOpacity="0.4" />
                      <polygon points="15,45 110,25 200,45" fill="#B4472B" fillOpacity="0.15" stroke="#B4472B" strokeWidth="1.5" />
                      <rect x="35" y="55" width="60" height="25" fill="#FFFFFF" stroke="#1F4D45" strokeOpacity="0.5" />
                      <line x1="35" y1="70" x2="95" y2="70" stroke="#1F4D45" strokeOpacity="0.3" strokeDasharray="2 2" />
                      <rect x="110" y="80" width="30" height="40" fill="#B4472B" fillOpacity="0.2" stroke="#B4472B" />
                      <rect x="148" y="80" width="32" height="25" fill="#FFFFFF" stroke="#1F4D45" strokeOpacity="0.5" />
                      <line x1="10" y1="120" x2="230" y2="120" stroke="#1F2421" strokeOpacity="0.3" />
                      <circle cx="30" cy="115" r="5" fill="#3F7D4E" fillOpacity="0.3" stroke="#3F7D4E" />
                      <circle cx="195" cy="115" r="7" fill="#3F7D4E" fillOpacity="0.3" stroke="#3F7D4E" />
                    </svg>
                  </div>
                  <p className="text-[11px] text-ink-soft text-center pt-2 font-sans italic">
                    {t('dashboard.latest.imageCaption')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-paper-deep/50 border border-ink/14 rounded-lg p-8 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-clay border border-ink/14 text-ink-soft">
                  <FolderOpen className="w-6 h-6 stroke-[1.5]" aria-hidden="true" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h2 className="font-headline text-xl font-bold text-ink">
                    {t('dashboard.empty.title')}
                  </h2>
                  <p className="text-xs text-ink-soft">{t('dashboard.empty.body')}</p>
                </div>
                <Link
                  to="/app/new"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brick hover:bg-brick-hover text-paper text-xs font-medium shadow-subtle transition-colors focus-ring"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t('projects.startNewEstimate')}</span>
                </Link>
              </div>
            )}

            {/* Summary Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 space-y-1">
                <div className="text-[11px] font-mono uppercase tracking-wider text-ink-soft">
                  {t('dashboard.cards.projects')}
                </div>
                <div className="font-headline text-3xl sm:text-4xl font-bold text-ink">
                  {String(total).padStart(2, '0')}
                </div>
                <p className="text-xs text-ink-soft">
                  {t('dashboard.cards.projectsCount', { count: total })}
                </p>
              </div>

              <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 space-y-1">
                <div className="text-[11px] font-mono uppercase tracking-wider text-ink-soft">
                  {t('dashboard.cards.latest')}
                </div>
                <div className="font-headline text-xl sm:text-2xl font-bold text-forest truncate">
                  {latest ? latest.name : t('dashboard.cards.noneYet')}
                </div>
                <p className="text-xs text-ink-soft">
                  {latest
                    ? t('dashboard.cards.updated', { date: formatDate(latest.updated_at) })
                    : t('dashboard.cards.createPrompt')}
                </p>
              </div>

              <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 space-y-1">
                <div className="text-[11px] font-mono uppercase tracking-wider text-ink-soft">
                  {t('dashboard.cards.dataSource')}
                </div>
                <div className="font-headline text-xl sm:text-2xl font-bold text-ink">
                  {mock ? t('dashboard.cards.mockApi') : t('dashboard.cards.liveApi')}
                </div>
                <p className="text-xs text-ink-soft">
                  {mock ? t('dashboard.cards.mockNote') : t('dashboard.cards.liveNote')}
                </p>
              </div>
            </div>

            {/* Recent Projects + Guidance */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-5">
                <div className="flex items-center justify-between border-b border-ink/14 pb-2">
                  <h2 className="font-headline text-xl font-bold text-ink">
                    {t('dashboard.recent.title')}
                  </h2>
                  <Link
                    to="/app/projects"
                    className="text-xs font-medium text-brick hover:underline inline-flex items-center gap-1"
                  >
                    <span>{t('dashboard.recent.viewAll')}</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>

                {items.length > 0 ? (
                  <div className="border border-ink/14 rounded-lg overflow-hidden divide-y divide-ink/10 bg-paper">
                    {items.slice(0, 3).map((project) => (
                      <div
                        key={project.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-paper-deep/40 transition-colors"
                      >
                        <Link
                          to={`/app/projects/${project.id}`}
                          className="space-y-0.5 group rounded focus-ring"
                        >
                          <div className="font-medium text-sm text-ink group-hover:text-brick transition-colors">
                            {project.name}
                          </div>
                          <div className="text-xs text-ink-soft">
                            {project.notes || t('projects.noNotes')}
                          </div>
                        </Link>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-mono text-ink-soft">
                            {formatDate(project.updated_at)}
                          </span>
                          <DeleteProjectButton
                            projectId={project.id}
                            projectName={project.name}
                            onDelete={handleDelete}
                            onError={setActionError}
                          />
                          <Link
                            to={`/app/projects/${project.id}`}
                            aria-label={t('projects.openProject', { name: project.name })}
                            className="text-ink-soft hover:text-ink transition-colors focus-ring rounded"
                          >
                            <ChevronRight className="w-4 h-4" aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-ink-soft">{t('dashboard.recent.empty')}</p>
                )}

                <div className="bg-paper-deep/50 border border-ink/14 rounded-lg p-4 flex gap-3 items-start text-xs text-ink-soft">
                  <Lightbulb className="w-4 h-4 text-ochre flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="leading-relaxed">
                    <strong className="text-ink">{t('dashboard.tip.title')}</strong>{' '}
                    {t('dashboard.tip.body')}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-4">
                <div className="bg-clay/50 border border-ink/14 rounded-lg p-5 space-y-3">
                  <h3 className="font-headline text-lg font-bold text-ink">
                    {t('dashboard.side.title')}
                  </h3>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    {t('dashboard.side.body')}
                  </p>
                  <p className="text-[11px] text-ink-soft leading-relaxed border-t border-ink/10 pt-2">
                    {t('dashboard.side.note')}
                  </p>
                  <Link
                    to="/materials"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-brick hover:underline pt-1"
                  >
                    <span>{t('dashboard.side.link')}</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
