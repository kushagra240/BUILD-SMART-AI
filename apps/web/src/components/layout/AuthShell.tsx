import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import buildSmartLogo from '../../assets/buildsmart-logo.png';

/**
 * Two-panel shell for the login and register screens matching Figma ProductPages AuthScreen.
 * The left panel (.auth-story) holds the blueprint SVG, value statement, and proof points.
 * The right panel (.auth-form-side) holds the back link, form card, and legal note.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-story">
        <Link to="/" className="auth-logo" aria-label="BuildSmart home">
          <img src={buildSmartLogo} alt="BuildSmart AI" />
        </Link>
        <div className="auth-blueprint" aria-hidden="true">
          <svg viewBox="0 0 600 440">
            <path d="M60 380h490M110 380V170l145-95 145 95v210M255 75l145 95 100-65v275M155 380V245h72v135M306 380V260h58v120M430 380V210h55v170" />
            <path d="M75 405h390M75 420h270M108 150h405" />
          </svg>
        </div>
        <div className="auth-message">
          <p>Residential construction planning</p>
          <h1>Build with clarity from the very first number.</h1>
          <span>
            Location-aware costs, transparent assumptions, and material choices designed for how
            homes are built in Pune.
          </span>
        </div>
        <div className="auth-proof">
          <div>
            <strong>9</strong>
            <span>cost categories</span>
          </div>
          <div>
            <strong>3</strong>
            <span>quality scenarios</span>
          </div>
          <div>
            <strong>100%</strong>
            <span>clear assumptions</span>
          </div>
        </div>
      </section>

      <section className="auth-form-side">
        <Link to="/" className="auth-back">
          ← Back to website
        </Link>
        {children}
        <p className="auth-legal">Indicative planning estimates · Pune region</p>
      </section>
    </main>
  );
}
