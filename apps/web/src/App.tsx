import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MockBanner } from './components/layout/MockBanner';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { WizardPage } from './pages/WizardPage';
import { ResultsPage } from './pages/ResultsPage';
import { DashboardPage } from './pages/DashboardPage';
import { SavedProjectsPage } from './pages/SavedProjectsPage';
import { SavedProjectDetailPage } from './pages/SavedProjectDetailPage';
import { MaterialsGuidePage } from './pages/MaterialsGuidePage';
import { MethodologyPage } from './pages/MethodologyPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AuthProvider } from './auth/AuthProvider';
import { RequireAuth } from './auth/RequireAuth';

/**
 * The landing page is a full-bleed, self-contained layout from the Figma
 * export: it ships its own floating header and footer, so the global chrome is
 * suppressed on "/" only. Every other route keeps the app shell.
 */
function AppShell() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className="app-surface flex min-h-screen flex-col bg-paper font-sans text-ink selection:bg-accent/20 selection:text-ink">
      {!isLanding && <MockBanner />}
      {!isLanding && <Navbar />}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<RequireAuth />}>
            <Route path="/app" element={<DashboardPage />} />
            <Route path="/app/new" element={<WizardPage />} />
            <Route path="/app/estimates/:id" element={<ResultsPage />} />
            <Route path="/app/projects" element={<SavedProjectsPage />} />
            <Route path="/app/projects/:id" element={<SavedProjectDetailPage />} />
          </Route>
          <Route path="/materials" element={<MaterialsGuidePage />} />
          <Route path="/methodology" element={<MethodologyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {!isLanding && <Footer />}
    </div>
  );
}

export function App() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;

  // Keep the document language and tab title in sync with the chosen locale so
  // screen readers announce the right language and the browser tab follows it.
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t('app.title');
  }, [language, t]);

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
