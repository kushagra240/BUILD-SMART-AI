import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import buildSmartLogo from '../assets/buildsmart-logo.png';
import buildSmartMark from '../assets/buildsmart-mark.png';
import '../styles/landing.css';

/**
 * Port of the Figma Make landing page (buildui/src/App.tsx). The markup, copy
 * and class names are kept identical so the exported CSS applies unchanged.
 * The only behavioural additions are the router hand-offs: "Log in" goes to
 * /login and the modal continues into /app/new.
 */

type IconName =
  | 'home'
  | 'arrow'
  | 'calculator'
  | 'chart'
  | 'layers'
  | 'shield'
  | 'check'
  | 'menu'
  | 'close'
  | 'pin'
  | 'spark'
  | 'clock';

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9M9 20v-6h6v6" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14M14 7l5 5-5 5" />
      </>
    ),
    calculator: (
      <>
        <rect x="4" y="2.5" width="16" height="19" rx="2" />
        <path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </>
    ),
    layers: (
      <>
        <path d="m12 3-9 5 9 5 9-5-9-5Z" />
        <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    pin: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    spark: (
      <>
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
        <path d="m5.6 5.6 2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

const features: { number: string; title: string; copy: string; icon: IconName }[] = [
  {
    number: '01',
    title: 'Location-aware costs',
    copy: 'Current Pune labour and material rates, adjusted for your locality.',
    icon: 'pin',
  },
  {
    number: '02',
    title: 'Clear cost breakdowns',
    copy: 'See where every rupee goes across structure, finishes and services.',
    icon: 'chart',
  },
  {
    number: '03',
    title: 'Material scenarios',
    copy: 'Compare economy, standard and premium specifications side by side.',
    icon: 'layers',
  },
  {
    number: '04',
    title: 'Built-in safeguards',
    copy: 'Plan contingencies early and avoid expensive surprises on site.',
    icon: 'shield',
  },
];

// Design-supplied illustrative rates from the Figma export. They are not read
// from the rates schema yet, so they carry TODO(data): replace with sourced
// values once the rates database is wired into the quick planner (see T41).
const qualityRates = {
  Economy: 2000,
  Standard: 2400,
  Premium: 3100,
};

export function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [area, setArea] = useState(1800);
  const [quality, setQuality] = useState<keyof typeof qualityRates>('Standard');
  const [formOpen, setFormOpen] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  const estimate = useMemo(() => area * qualityRates[quality], [area, quality]);
  const estimateLabel = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(estimate);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) {
      return;
    }
    const revealElements = Array.from(page.querySelectorAll<HTMLElement>('.reveal'));

    if (typeof IntersectionObserver === 'undefined') {
      // Without an observer the reveal class must not leave content invisible.
      revealElements.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
      },
      { threshold: 0.14 }
    );
    revealElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!formOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFormOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [formOpen]);

  const scrollToPlanner = () => {
    document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <div className="landing" ref={pageRef}>
      <div className="intro-curtain" aria-hidden="true">
        <span className="intro-mark">
          <img src={buildSmartMark} alt="" />
        </span>
        <strong>BuildSmart</strong>
      </div>

      <header className="site-header">
        <a className="logo" href="#top" aria-label="BuildSmart home">
          <img src={buildSmartLogo} alt="BuildSmart AI" />
        </a>
        <nav className={menuOpen ? 'nav-open' : ''} aria-label="Main navigation">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#planner">Cost guide</a>
          <a href="#about">About</a>
        </nav>
        <div className="header-actions">
          <button className="login-button" onClick={() => navigate('/login')}>
            Log in
          </button>
          <button className="header-cta" onClick={scrollToPlanner}>
            Start an estimate <Icon name="arrow" size={15} />
          </button>
        </div>
        <button
          className="mobile-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <Icon name={menuOpen ? 'close' : 'menu'} />
        </button>
      </header>

      <main id="top">
        <section className="hero-frame">
          <img
            className="hero-photo"
            src="https://images.unsplash.com/photo-1691272477702-0a2edae135f2?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=88&w=2000"
            alt="Modern residential home surrounded by tropical planting"
          />
          <div className="hero-wash" />
          <svg className="blueprint blueprint-one" viewBox="0 0 500 300" aria-hidden="true">
            <path d="M3 260h494M72 258V116l116-70 115 70v142M188 46l115 70 118-71v213M107 258v-93h58v93M224 258v-74h45v74M340 258V138h50v120" />
            <path d="M55 276h265M55 286h195M72 102h348" />
          </svg>

          <div className="hero-content">
            <p className="hero-eyebrow">
              <span />
              Residential construction planning, Pune
            </p>
            <h1>
              Know what your home
              <span>will cost. Before you build.</span>
            </h1>
            <p className="hero-subtitle">
              Plan your construction budget with local rates, practical material choices, and
              transparent cost breakdowns.
            </p>
            <div className="hero-actions">
              <button className="hero-cta" onClick={scrollToPlanner}>
                Build your estimate
                <span>
                  <Icon name="arrow" size={18} />
                </span>
              </button>
              <a className="text-cta" href="#how">
                See how it works <span>↓</span>
              </a>
            </div>
          </div>

          <div className="floating-estimate">
            <div className="estimate-topline">
              <span className="mini-home">
                <Icon name="home" size={16} />
              </span>
              <div>
                <small>Sample planning estimate</small>
                <strong>Deshmukh residence</strong>
              </div>
              <span className="live-badge">Example</span>
            </div>
            <div className="estimate-amount">
              <small>Estimated build cost</small>
              <strong>₹43,20,000</strong>
              <span>₹2,400 / sq ft</span>
            </div>
            <div className="mini-chart" role="img" aria-label="Estimate breakdown chart">
              <span style={{ width: '40%' }} />
              <span style={{ width: '25%' }} />
              <span style={{ width: '20%' }} />
              <span style={{ width: '15%' }} />
            </div>
            <div className="chart-labels">
              <span>Structure</span>
              <span>Finishes</span>
              <span>Services</span>
              <span>Buffer</span>
            </div>
            <div className="estimate-footer">
              <span>
                <Icon name="check" size={13} /> Standard specification
              </span>
              <span>1,800 sq ft</span>
            </div>
          </div>

          <div className="hero-scroll">
            <span>Explore</span>
            <i />
          </div>
        </section>

        <section className="feature-dock reveal" id="features">
          {features.map((feature) => (
            <article className="feature-card" key={feature.number}>
              <div className="feature-card-top">
                <span>{feature.number}</span>
                <span className="feature-icon">
                  <Icon name={feature.icon} size={17} />
                </span>
              </div>
              <div>
                <h2>{feature.title}</h2>
                <p>{feature.copy}</p>
              </div>
              <span className="feature-arrow">
                <Icon name="arrow" size={16} />
              </span>
            </article>
          ))}
        </section>

        <section className="proof-strip reveal" aria-label="Product highlights">
          <p>Built for homeowners, architects, and project planners</p>
          <div>
            <span>
              <strong>9</strong> cost categories
            </span>
            <span>
              <strong>3</strong> quality scenarios
            </span>
            <span>
              <strong>Local</strong> Pune pricing
            </span>
            <span>
              <strong>Clear</strong> assumptions
            </span>
          </div>
        </section>

        <section className="process-section" id="how">
          <div className="section-heading reveal">
            <p className="section-label">A better starting point</p>
            <h2>
              From an empty plot to a<span>budget you can build around.</span>
            </h2>
            <p>
              No opaque totals. BuildSmart turns the details of your home into a practical,
              category-by-category construction plan.
            </p>
          </div>
          <div className="process-visual reveal">
            <div className="process-image">
              <img
                src="https://images.unsplash.com/photo-1721815693498-cc28507c0ba2?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=86&w=1200"
                alt="Contemporary multi-storey Indian residence"
              />
              <span className="image-caption">Residential reference · Pune</span>
            </div>
            <div className="steps">
              {[
                ['01', 'Describe your home', 'Set the location, built-up area, floors and rooms.'],
                [
                  '02',
                  'Choose your specification',
                  'Compare material packages without compromising essentials.',
                ],
                [
                  '03',
                  'Review the full budget',
                  'Understand every category, assumption and contingency.',
                ],
              ].map(([number, title, copy], index) => (
                <article className={index === 0 ? 'active-step' : ''} key={number}>
                  <span>{number}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{copy}</p>
                  </div>
                  <Icon name={index === 0 ? 'check' : 'arrow'} size={16} />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="planner-section" id="planner">
          <div className="planner-copy reveal">
            <p className="section-label light">Try the cost planner</p>
            <h2>A useful first number, in under a minute.</h2>
            <p>
              Adjust the home size and specification to see an indicative Pune construction
              estimate. You can refine every detail in the full estimator.
            </p>
            <ul>
              <li>
                <Icon name="check" size={15} /> Material and labour included
              </li>
              <li>
                <Icon name="check" size={15} /> Local planning rates
              </li>
              <li>
                <Icon name="check" size={15} /> No signup required
              </li>
            </ul>
          </div>
          <div className="planner-card reveal">
            <div className="planner-card-head">
              <div>
                <small>Quick estimate</small>
                <h3>Plan your build</h3>
              </div>
              <span>
                <Icon name="calculator" />
              </span>
            </div>
            <label className="range-label">
              <span>Built-up area</span>
              <strong>{area.toLocaleString('en-IN')} sq ft</strong>
            </label>
            <input
              className="area-range"
              type="range"
              min="600"
              max="5000"
              step="100"
              value={area}
              aria-label="Built-up area in square feet"
              onChange={(event) => setArea(Number(event.target.value))}
              style={{ '--range-progress': `${((area - 600) / 4400) * 100}%` } as CSSProperties}
            />
            <div className="range-scale">
              <span>600 sq ft</span>
              <span>5,000 sq ft</span>
            </div>
            <fieldset>
              <legend>Construction quality</legend>
              <div className="quality-options">
                {(Object.keys(qualityRates) as (keyof typeof qualityRates)[]).map((item) => (
                  <button
                    className={quality === item ? 'quality-active' : ''}
                    key={item}
                    onClick={() => setQuality(item)}
                  >
                    <span>{item}</span>
                    <small>₹{qualityRates[item].toLocaleString('en-IN')}/sq ft</small>
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="planner-result">
              <div>
                <span>Indicative build cost</span>
                <strong>{estimateLabel}</strong>
              </div>
              <span className="result-note">
                <Icon name="clock" size={14} /> 12–14 month build
              </span>
            </div>
            <button className="planner-button" onClick={() => setFormOpen(true)}>
              Create detailed estimate <Icon name="arrow" size={17} />
            </button>
          </div>
        </section>

        <section className="closing-section reveal" id="about">
          <div>
            <span className="closing-mark">
              <img src={buildSmartMark} alt="" />
            </span>
            <p>Thoughtful budgets, before you build.</p>
          </div>
          <h2>Make your first construction decision with confidence.</h2>
          <button onClick={scrollToPlanner}>
            Start planning <Icon name="arrow" />
          </button>
        </section>
      </main>

      <footer className="site-footer">
        <a className="logo" href="#top">
          <img src={buildSmartLogo} alt="BuildSmart AI" />
        </a>
        <p>Indicative construction planning for Pune, India.</p>
        <div>
          <a href="#features">Features</a>
          <a href="#planner">Cost guide</a>
          <Link to="/methodology">Methodology</Link>
        </div>
      </footer>

      {formOpen && (
        <div className="modal-backdrop" onMouseDown={() => setFormOpen(false)}>
          <section
            className="estimate-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setFormOpen(false)} aria-label="Close">
              <Icon name="close" />
            </button>
            <span className="modal-icon">
              <img src={buildSmartMark} alt="" />
            </span>
            <p className="section-label">Your estimate is ready to refine</p>
            <h2 id="modal-title">Tell us where you’re planning to build.</h2>
            <p>
              We’ll use your locality to refine labour, transport, and material assumptions for this{' '}
              {area.toLocaleString('en-IN')} sq ft {quality.toLowerCase()} home.
            </p>
            <label>
              Project name
              <input defaultValue="My new home" />
            </label>
            <label>
              Locality
              <select defaultValue="">
                <option value="" disabled>
                  Select a Pune locality
                </option>
                <option>Baner</option>
                <option>Kharadi</option>
                <option>Wakad</option>
                <option>Hinjewadi</option>
              </select>
            </label>
            <button
              className="modal-submit"
              onClick={() => {
                setFormOpen(false);
                navigate('/app/new');
              }}
            >
              Continue to project details <Icon name="arrow" size={17} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
