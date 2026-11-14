import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, FileText, Info, Plus } from 'lucide-react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { HouseSchematic } from '../components/common/HouseSchematic';
import { ErrorState, LoadingState } from '../components/common/AsyncState';
import { DeleteProjectButton } from '../components/projects/DeleteProjectButton';
import { useProject } from '../hooks/useProjects';
import { formatDate, formatDateTime } from '../lib/formatters';

export function SavedProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { project, status, error, reload, remove } = useProject(id);
  const [actionError, setActionError] = useState<string | null>(null);
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  const handleDelete = async (projectId: string) => {
    setActionError(null);
    await remove(projectId);
    navigate('/app/projects', { replace: true });
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

  if (status === 'loading') {
    return (
      <div className="app-surface min-h-screen pb-16 pt-6 text-ink">
        <div className="mx-auto max-w-shell px-4 sm:px-6 lg:px-8">
          <LoadingState label={t('projectDetail.loading')} />
        </div>
      </div>
    );
  }

  if (status === 'error' || !project) {
    return (
      <div className="app-surface min-h-screen pb-16 pt-6 text-ink">
        <div className="mx-auto max-w-2xl space-y-5 px-4 sm:px-6 lg:px-8">
          <ErrorState message={error ?? t('errors.projectNotFound')} onRetry={reload} />
          <Link
            to="/app/projects"
            className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-accent hover:underline focus-ring"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('projectDetail.backToProjects')}</span>
          </Link>
        </div>
      </div>
    );
  }

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
                {t('projectDetail.kicker', { id: project.id.slice(0, 8).toUpperCase() })}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold leading-[1.05] tracking-[-0.055em] text-ink sm:text-4xl lg:text-5xl">
              {project.name}
            </h1>
            <p className="text-sm leading-6 text-ink-soft">
              {t('projectDetail.createdUpdated', {
                created: formatDate(project.created_at),
                updated: formatDateTime(project.updated_at),
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to="/app/projects" className="btn-ghost h-10 px-3.5 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('projectDetail.allProjects')}</span>
            </Link>
            <Link to="/app/new" className="btn-primary h-10 px-4 text-xs">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('projects.startNewEstimate')}</span>
            </Link>
            <DeleteProjectButton
              projectId={project.id}
              projectName={project.name}
              onDelete={handleDelete}
              onError={setActionError}
              variant="button"
            />
          </div>
        </motion.header>

        {actionError && (
          <div
            role="alert"
            className="rounded-xl border border-error/25 bg-error/5 px-5 py-3 text-sm text-error"
          >
            {actionError}
          </div>
        )}

        {/* Record */}
        <motion.section variants={itemVariants} className="surface-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="eyebrow">{t('projectDetail.record')}</span>
            <span className="rounded-md bg-paper-deep px-2 py-1 text-[10px] font-bold tracking-[0.06em] text-ink-soft">
              {project.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 border-y border-line-soft py-5 md:grid-cols-12">
            <div className="space-y-1 md:col-span-5">
              <div className="eyebrow">{t('projectDetail.projectName')}</div>
              <div className="text-2xl font-extrabold tracking-[-0.04em] text-ink">
                {project.name}
              </div>
            </div>

            <div className="space-y-1 md:col-span-4">
              <div className="eyebrow">{t('projectDetail.created')}</div>
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <CalendarDays className="h-4 w-4 text-accent" aria-hidden="true" />
                <span>{formatDate(project.created_at)}</span>
              </div>
            </div>

            <div className="space-y-1 md:col-span-3">
              <div className="eyebrow">{t('projectDetail.lastUpdated')}</div>
              <div className="text-sm font-semibold text-ink">
                {formatDateTime(project.updated_at)}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-1">
            <div className="eyebrow">{t('projectDetail.notes')}</div>
            <p className="whitespace-pre-wrap text-sm leading-6 text-ink">
              {project.notes || t('projectDetail.noNotes')}
            </p>
          </div>
        </motion.section>

        {/* Estimate + guidance */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12"
        >
          <div className="space-y-5 lg:col-span-8">
            <section className="surface-card overflow-hidden">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line-soft px-6 py-5">
                <h2 className="section-title">{t('projectDetail.costEstimate')}</h2>
                <span className="text-[11px] font-semibold text-ink-soft">
                  {t('projectDetail.notCalculated')}
                </span>
              </div>

              <div className="relative overflow-hidden bg-night p-6 text-white sm:p-8">
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(circle at 82% 8%, rgba(49,94,251,0.34), transparent 45%)',
                  }}
                  aria-hidden="true"
                />
                <div className="relative space-y-4">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-white">
                    <FileText className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold tracking-[-0.04em] text-white">
                      {t('projectDetail.noEstimateTitle')}
                    </h3>
                    <p className="max-w-lg text-sm leading-6 text-white/60">
                      {t('projectDetail.noEstimateBody')}
                    </p>
                  </div>
                  <Link to="/app/new" className="btn-primary bg-accent hover:bg-accent-hover">
                    <span>{t('projects.startNewEstimate')}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </section>

            <div className="flex items-start gap-3 rounded-xl bg-accent-soft/70 px-5 py-4 text-xs leading-6 text-ink-soft">
              <Info className="mt-0.5 h-4 w-4 flex-none text-accent" aria-hidden="true" />
              <p>
                <strong className="font-bold text-ink">{t('projectDetail.recordNoteTitle')}</strong>{' '}
                {t('projectDetail.recordNoteBody')}
              </p>
            </div>
          </div>

          <div className="space-y-5 lg:col-span-4">
            <section className="surface-card p-5">
              <HouseSchematic showFloorTable={false} />
              <p className="mt-3 border-t border-line-soft pt-3 text-[11px] leading-5 text-ink-soft">
                {t('projectDetail.schematicNote')}
              </p>
            </section>

            <section className="surface-card p-5 text-xs leading-6 text-ink-soft">
              <h2 className="section-title">{t('projectDetail.scopeTitle')}</h2>
              <p className="mt-2">{t('projectDetail.scopeBody')}</p>
              <p className="mt-3 border-t border-line-soft pt-3 text-[11px]">
                {t('projectDetail.scopeExcluded')}
              </p>
            </section>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
