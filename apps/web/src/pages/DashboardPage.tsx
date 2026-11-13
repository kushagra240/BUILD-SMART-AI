import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useProjects } from '../hooks/useProjects';
import { formatDate } from '../lib/formatters';
import { DeleteProjectButton } from '../components/projects/DeleteProjectButton';
import { ProductHeader } from '../components/layout/ProductHeader';
import { Glyph } from '../components/common/Glyph';
import buildSmartMark from '../assets/buildsmart-mark.png';

const CARD_IMAGES = [
  'https://images.unsplash.com/photo-1721815693498-cc28507c0ba2?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=600',
  'https://images.unsplash.com/photo-1691272477702-0a2edae135f2?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=600',
  'https://images.unsplash.com/photo-1608619769165-25647672335f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=600',
];

export function DashboardPage() {
  const { user } = useAuth();
  const { items, status, error, reload, remove } = useProjects();
  const [actionError, setActionError] = useState<string | null>(null);

  const handleDelete = async (projectId: string) => {
    setActionError(null);
    await remove(projectId);
  };

  return (
    <main className="product-page">
      <ProductHeader active="projects" />
      <section className="dashboard-content">
        <div className="dashboard-heading">
          <div>
            <p className="app-eyebrow">Project workspace</p>
            <h1>Your estimates</h1>
            <p>
              {user
                ? `Welcome back, ${user.full_name}. Review saved projects or begin a new construction plan.`
                : 'Review saved projects or begin a new construction plan.'}
            </p>
          </div>
          <Link to="/app/new" className="cobalt-button">
            <Glyph name="plus" size={17} /> New estimate
          </Link>
        </div>

        {actionError && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-error/25 bg-error/5 px-5 py-3 text-sm text-error"
          >
            {actionError}
          </div>
        )}

        {status === 'error' && (
          <div
            role="alert"
            className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-error/30 bg-error/10 px-4 py-4 text-xs text-error"
          >
            <div>
              <p className="font-semibold">Could not load this page</p>
              <p className="mt-0.5">{error || 'Server unavailable'}</p>
            </div>
            <button
              type="button"
              onClick={reload}
              className="self-start sm:self-auto px-3 py-1.5 rounded-md border border-error/40 bg-white text-error text-xs font-medium hover:bg-error/5"
            >
              Try again
            </button>
          </div>
        )}

        <div className="dashboard-summary">
          <div>
            <span>Saved projects</span>
            <strong className="mono">{items.length}</strong>
          </div>
          <div>
            <span>Portfolio estimate</span>
            <strong className="mono">
              ₹{items.length === 0 ? '0.00' : (items.length * 43.2).toFixed(1)}L
            </strong>
          </div>
          <div>
            <span>Average rate</span>
            <strong className="mono">₹2,400/sq ft</strong>
          </div>
        </div>

        {status === 'loading' ? (
          <div className="py-20 text-center text-ink-soft text-sm">Loading estimates…</div>
        ) : items.length === 0 ? (
          <section className="empty-estimates">
            <span className="empty-mark">
              <img src={buildSmartMark} alt="" />
            </span>
            <p className="app-eyebrow">Your workspace is ready</p>
            <h2>No saved projects yet.</h2>
            <p>
              Start with the built-up area and construction quality. Your first planning estimate
              takes less than a minute.
            </p>
            <Link to="/app/new" className="cobalt-button">
              Create your first estimate <Glyph name="arrow" />
            </Link>
          </section>
        ) : (
          <>
            <div className="project-grid">
              {items.map((project, index) => (
                <div className="saved-project-card relative group" key={project.id}>
                  <Link
                    to={`/app/projects/${project.id}`}
                    className="block text-inherit no-underline"
                  >
                    <div className="project-image">
                      <img
                        src={CARD_IMAGES[index % CARD_IMAGES.length]}
                        alt={project.name}
                      />
                      <span className={`project-status status-${index % 3}`}>
                        Estimate ready
                      </span>
                    </div>
                    <div className="project-card-body">
                      <span className="project-index">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h2>{project.name}</h2>
                      <p>{project.notes || 'Baner, Pune · G+1'}</p>
                      <div className="project-cost">
                        <span>Planning estimate</span>
                        <strong className="mono">₹43,20,000</strong>
                      </div>
                      <div className="project-card-foot">
                        <span>
                          <Glyph name="area" size={13} /> 1,800 sq ft
                        </span>
                        <span>
                          <Glyph name="calendar" size={13} />{' '}
                          {formatDate(project.updated_at || project.created_at)}
                        </span>
                        <Glyph name="arrow" size={16} />
                      </div>
                    </div>
                  </Link>
                  <div className="absolute top-3 right-3 z-10">
                    <DeleteProjectButton
                      projectId={project.id}
                      projectName={project.name}
                      onDelete={() => handleDelete(project.id)}
                      onError={(err) => setActionError(err)}
                    />
                  </div>
                </div>
              ))}
              <Link to="/app/new" className="new-project-card">
                <span>
                  <Glyph name="plus" size={23} />
                </span>
                <strong>Start a new estimate</strong>
                <small>Set up another residential project</small>
              </Link>
            </div>
            <div className="dashboard-guidance">
              <span>
                <Glyph name="check" size={16} />
              </span>
              <div>
                <strong>Planning note</strong>
                <p>
                  Estimates include a 5% contingency. Final construction costs depend on drawings,
                  site conditions, and contractor quotations.
                </p>
              </div>
              <Link to="/methodology" className="text-xs font-semibold text-accent hover:underline">
                View methodology →
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
