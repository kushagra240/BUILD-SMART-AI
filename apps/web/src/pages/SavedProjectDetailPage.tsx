import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, FileText, Info, Plus } from 'lucide-react';
import { HouseSchematic } from '../components/common/HouseSchematic';
import { SampleDataBadge } from '../components/common/SampleDataBadge';
import { ErrorState, LoadingState } from '../components/common/AsyncState';
import { DeleteProjectButton } from '../components/projects/DeleteProjectButton';
import { useProject } from '../hooks/useProjects';
import { isMockApi } from '../services/apiClient';
import { formatDate, formatDateTime } from '../lib/formatters';

export function SavedProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { project, status, error, reload, remove } = useProject(id);
  const [actionError, setActionError] = useState<string | null>(null);
  const mock = isMockApi();

  const handleDelete = async (projectId: string) => {
    setActionError(null);
    await remove(projectId);
    navigate('/app/projects', { replace: true });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-paper text-ink pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <LoadingState label="Loading project…" />
        </div>
      </div>
    );
  }

  if (status === 'error' || !project) {
    return (
      <div className="min-h-screen bg-paper text-ink pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-5">
          <ErrorState message={error ?? 'Project not found'} onRetry={reload} />
          <Link
            to="/app/projects"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brick hover:underline focus-ring rounded"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to saved projects</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* Header and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-ink/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-brick font-semibold">
                SAVED PROJECTS / {project.id.slice(0, 8).toUpperCase()}
              </span>
              {mock && <SampleDataBadge text="Sample data" />}
            </div>
            <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-ink tracking-tight">
              {project.name}
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft font-sans">
              Created {formatDate(project.created_at)} · Updated {formatDateTime(project.updated_at)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/app/projects"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-paper border border-ink/14 hover:bg-paper-deep text-xs font-medium text-ink transition-colors focus-ring"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-ink-soft" aria-hidden="true" />
              <span>All projects</span>
            </Link>
            <Link
              to="/app/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-brick hover:bg-brick-hover text-paper text-xs font-medium shadow-subtle transition-colors focus-ring"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Start a new estimate</span>
            </Link>
            <DeleteProjectButton
              projectId={project.id}
              projectName={project.name}
              onDelete={handleDelete}
              onError={setActionError}
              variant="button"
            />
          </div>
        </div>

        {actionError && (
          <div
            role="alert"
            className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-xs text-error"
          >
            {actionError}
          </div>
        )}

        {/* Project Record */}
        <div className="bg-paper-deep/50 border border-ink/14 rounded-lg p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-[11px] uppercase tracking-wider text-ink-soft font-semibold">
              PROJECT RECORD
            </span>
            <span className="px-2 py-0.5 rounded bg-clay border border-ink/14 text-[11px] text-ink">
              {project.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider text-ink-soft">
                Project name
              </div>
              <div className="font-headline text-2xl sm:text-3xl font-bold text-ink">
                {project.name}
              </div>
            </div>

            <div className="md:col-span-4 space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider text-ink-soft">
                Created
              </div>
              <div className="flex items-center gap-2 text-sm text-ink">
                <CalendarDays className="w-4 h-4 text-forest" aria-hidden="true" />
                <span>{formatDate(project.created_at)}</span>
              </div>
            </div>

            <div className="md:col-span-3 space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider text-ink-soft">
                Last updated
              </div>
              <div className="text-sm text-ink">{formatDateTime(project.updated_at)}</div>
            </div>
          </div>

          <div className="border-t border-ink/10 pt-4 space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-ink-soft">
              Notes
            </div>
            <p className="text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-wrap">
              {project.notes || 'No notes have been added to this project yet.'}
            </p>
          </div>
        </div>

        {/* Main Grid: Estimate placeholder + guidance */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-ink/14 pb-2">
                <h2 className="font-headline text-xl font-bold text-ink">Cost estimate</h2>
                <span className="text-xs font-mono text-ink-soft">Not calculated</span>
              </div>

              <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-6 space-y-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-clay border border-ink/14 text-forest">
                  <FileText className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-headline text-lg font-bold text-ink">
                    No estimate has been generated for this project.
                  </h3>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    Project details are saved, but cost estimation is not connected to this page yet. Start a new estimate when the estimation engine is available.
                  </p>
                </div>
                <Link
                  to="/app/new"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-brick hover:underline focus-ring rounded"
                >
                  <span>Start a new estimate</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="bg-clay/40 border border-ink/14 rounded-lg p-3.5 flex gap-2.5 items-start text-xs text-ink-soft">
              <Info className="w-4 h-4 text-forest flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="leading-relaxed">
                <strong className="text-ink">This record stays with your project:</strong> Project names and notes are stored against your account. Estimates and revisions will appear here once the estimation flow is wired to the backend.
              </p>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-5">
            <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 space-y-3">
              <HouseSchematic showFloorTable={false} />
              <p className="text-[11px] text-ink-soft leading-relaxed pt-2 border-t border-ink/10">
                Schematic illustration only. Area, floors and setbacks are not stored on this project yet.
              </p>
            </div>

            <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 space-y-2 text-xs text-ink-soft leading-relaxed font-sans">
              <h3 className="font-headline text-base font-bold text-ink">Scope stays important</h3>
              <p>
                Assumes normal foundations, regular site access and no basement. Structural design and material specifications need professional review.
              </p>
              <p className="border-t border-ink/10 pt-2 text-[11px]">
                Excluded: land, approvals and statutory fees, professional fees, external works, major utility connections, furniture, modular kitchen, lift and solar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
