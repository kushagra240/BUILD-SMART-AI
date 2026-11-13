import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronRight,
  FolderOpen,
  Lightbulb,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
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

/** Decorative blueprint vignette for the latest-project panel. */
function Blueprint() {
  return (
    <svg
      viewBox="0 0 320 220"
      className="h-full w-full"
      fill="none"
      stroke="#8FA8F5"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M20 190h280" strokeOpacity="0.35" strokeDasharray="4 5" />
      <path d="M46 190V86l114-38 114 38v104" strokeOpacity="0.9" />
      <path d="M46 86h228" strokeOpacity="0.55" strokeDasharray="5 4" />
      <path d="M46 138h228" strokeOpacity="0.55" strokeDasharray="5 4" />
      <rect x="70" y="100" width="42" height="26" strokeOpacity="0.7" />
      <rect x="70" y="152" width="42" height="26" strokeOpacity="0.7" />
      <rect x="139" y="100" width="42" height="26" strokeOpacity="0.7" />
      <rect x="208" y="100" width="42" height="26" strokeOpacity="0.7" />
      <rect x="208" y="152" width="42" height="26" strokeOpacity="0.7" />
      <rect x="139" y="150" width="34" height="40" strokeOpacity="0.9" />
      <path d="M156 190v-22" strokeOpacity="0.45" />
      <path d="M14 86h18M14 138h18M14 190h18" strokeOpacity="0.5" />
      <circle cx="286" cy="56" r="14" strokeOpacity="0.5" />
      <path d="M280 56h12M286 50v12" strokeOpacity="0.5" />
    </svg>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { items, total, status, error, reload, remove } = useProjects();
  const [actionError, setActionError] = useState<string | null>(null);
  const mock = isMockApi();
  const latest = items[0] ?? null;
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  const handleDelete = async (projectId: string) => {
    setActionError(null);
    await remove(projectId);
  };

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
        {/* Page header */}
        <motion.header
          variants={itemVariants}
          className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"
        >
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow text-accent">{t('dashboard.kicker')}</span>
              {mock && <SampleDataBadge text={t('common.sampleData')} />}
            </div>
            <h1 className="text-3xl font-extrabold leading-[1.05] tracking-[-0.055em] text-ink sm:text-4xl lg:text-5xl">
              {t('dashboard.title')}
            </h1>
            <p className="text-sm leading-6 text-ink-soft">
              {user
                ? t('dashboard.welcome', { name: user.full_name })
                : t('dashboard.welcomePlain')}
            </p>
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

        {status === 'loading' && <LoadingState label={t('dashboard.loading')} />}

        {status === 'error' && (
          <ErrorState message={error ?? t('dashboard.errors.load')} onRetry={reload} />
        )}

        {status === 'success' && (
          <>
            {latest ? (
              <motion.section
                variants={itemVariants}
                className="surface-card grid grid-cols-1 overflow-hidden lg:grid-cols-12"
              >
                <div className="flex flex-col justify-between gap-6 p-6 sm:p-8 lg:col-span-7">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="eyebrow">{t('dashboard.latest.label')}</span>
                      <span className="rounded-md bg-paper-deep px-2 py-1 text-[10px] font-bold tracking-[0.06em] text-ink-soft">
                        {projectReference(latest.id)}
                      </span>
                    </div>

                    <h2 className="text-2xl font-extrabold tracking-[-0.045em] text-ink sm:text-3xl">
                      {latest.name}
                    </h2>
                    <p className="text-sm leading-6 text-ink-soft">
                      {latest.notes || t('dashboard.latest.noNotes')}
                    </p>
                  </div>

                  <dl className="grid grid-cols-1 gap-4 border-y border-line-soft py-4 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="eyebrow">{t('dashboard.latest.created')}</dt>
                      <dd className="mt-1 font-semibold text-ink">
                        {formatDate(latest.created_at)}
                      </dd>
                    </div>
                    <div>
                      <dt className="eyebrow">{t('dashboard.latest.updated')}</dt>
                      <dd className="mt-1 font-semibold text-ink">
                        {formatDateTime(latest.updated_at)}
                      </dd>
                    </div>
                    <div>
                      <dt className="eyebrow">{t('dashboard.latest.estimate')}</dt>
                      <dd className="mt-1 font-semibold text-ink-soft">
                        {t('dashboard.latest.notCalculated')}
                      </dd>
                    </div>
                  </dl>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link to={`/app/projects/${latest.id}`} className="btn-primary h-10 px-4 text-xs">
                      <span>{t('dashboard.latest.open')}</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                    <DeleteProjectButton
                      projectId={latest.id}
                      projectName={latest.name}
                      onDelete={handleDelete}
                      onError={setActionError}
                    />
                  </div>
                </div>

                <div className="relative flex flex-col justify-between overflow-hidden bg-night p-6 lg:col-span-5">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-70"
                    style={{
                      background:
                        'radial-gradient(circle at 78% 12%, rgba(49,94,251,0.35), transparent 42%)',
                    }}
                    aria-hidden="true"
                  />
                  <div className="relative flex flex-1 items-center justify-center py-4">
                    <div className="h-44 w-full max-w-[300px]">
                      <Blueprint />
                    </div>
                  </div>
                  <p className="relative text-[11px] leading-5 text-white/55">
                    {t('dashboard.latest.imageCaption')}
                  </p>
                </div>
              </motion.section>
            ) : (
              <motion.section
                variants={itemVariants}
                className="surface-card flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-accent-soft text-accent">
                    <FolderOpen className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold tracking-[-0.03em] text-ink">
                      {t('dashboard.empty.title')}
                    </h2>
                    <p className="max-w-md text-sm leading-6 text-ink-soft">
                      {t('dashboard.empty.body')}
                    </p>
                  </div>
                </div>
                <Link to="/app/new" className="btn-primary h-10 px-4 text-xs">
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t('projects.startNewEstimate')}</span>
                </Link>
              </motion.section>
            )}

            {/* Summary cards */}
            <motion.section
              variants={itemVariants}
              className="grid grid-cols-1 gap-4 md:grid-cols-3"
            >
              <div className="surface-card-interactive p-5">
                <p className="eyebrow">{t('dashboard.cards.projects')}</p>
                <p className="mt-3 text-3xl font-extrabold tracking-[-0.05em] text-ink">
                  {String(total).padStart(2, '0')}
                </p>
                <p className="mt-2 text-xs leading-5 text-ink-soft">
                  {t('dashboard.cards.projectsCount', { count: total })}
                </p>
              </div>

              <div className="surface-card-interactive p-5">
                <p className="eyebrow">{t('dashboard.cards.latest')}</p>
                <p className="mt-3 truncate text-xl font-extrabold tracking-[-0.04em] text-ink">
                  {latest ? latest.name : t('dashboard.cards.noneYet')}
                </p>
                <p className="mt-2 text-xs leading-5 text-ink-soft">
                  {latest
                    ? t('dashboard.cards.updated', { date: formatDate(latest.updated_at) })
                    : t('dashboard.cards.createPrompt')}
                </p>
              </div>

              <div className="surface-card-interactive p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="eyebrow">{t('dashboard.cards.dataSource')}</p>
                  <ShieldCheck className="h-4 w-4 flex-none text-accent" aria-hidden="true" />
                </div>
                <p className="mt-3 text-xl font-extrabold tracking-[-0.04em] text-ink">
                  {mock ? t('dashboard.cards.mockApi') : t('dashboard.cards.liveApi')}
                </p>
                <p className="mt-2 text-xs leading-5 text-ink-soft">
                  {mock ? t('dashboard.cards.mockNote') : t('dashboard.cards.liveNote')}
                </p>
              </div>
            </motion.section>

            {/* Recent projects + guidance */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12"
            >
              <section className="space-y-4 lg:col-span-8">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="section-title">{t('dashboard.recent.title')}</h2>
                  <Link
                    to="/app/projects"
                    className="inline-flex items-center gap-1 rounded text-xs font-bold text-accent hover:underline focus-ring"
                  >
                    <span>{t('dashboard.recent.viewAll')}</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>

                {items.length > 0 ? (
                  <div className="surface-card divide-y divide-line-soft overflow-hidden">
                    {items.slice(0, 3).map((project) => (
                      <div
                        key={project.id}
                        className="flex flex-col justify-between gap-3 px-5 py-4 transition-colors hover:bg-paper-deep/40 sm:flex-row sm:items-center"
                      >
                        <Link
                          to={`/app/projects/${project.id}`}
                          className="group space-y-0.5 rounded focus-ring"
                        >
                          <div className="text-sm font-semibold text-ink transition-colors group-hover:text-accent">
                            {project.name}
                          </div>
                          <div className="text-xs text-ink-soft">
                            {project.notes || t('projects.noNotes')}
                          </div>
                        </Link>
                        <div className="flex items-center gap-4">
                          <span className="text-[11px] font-medium text-ink-soft">
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
                            className="rounded text-ink-soft transition-colors hover:text-accent focus-ring"
                          >
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="surface-card px-5 py-4 text-sm text-ink-soft">
                    {t('dashboard.recent.empty')}
                  </p>
                )}

                <div className="flex items-start gap-3 rounded-xl bg-accent-soft/70 px-5 py-4 text-xs leading-6 text-ink-soft">
                  <Lightbulb className="mt-0.5 h-4 w-4 flex-none text-accent" aria-hidden="true" />
                  <p>
                    <strong className="font-bold text-ink">{t('dashboard.tip.title')}</strong>{' '}
                    {t('dashboard.tip.body')}
                  </p>
                </div>
              </section>

              <aside className="lg:col-span-4">
                <div className="surface-card p-6">
                  <h2 className="section-title">{t('dashboard.side.title')}</h2>
                  <p className="mt-3 text-sm leading-6 text-ink-soft">{t('dashboard.side.body')}</p>
                  <p className="mt-4 border-t border-line-soft pt-4 text-[11px] leading-5 text-ink-soft">
                    {t('dashboard.side.note')}
                  </p>
                  <Link
                    to="/materials"
                    className="mt-4 inline-flex items-center gap-1.5 rounded text-xs font-bold text-accent hover:underline focus-ring"
                  >
                    <span>{t('dashboard.side.link')}</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </aside>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
