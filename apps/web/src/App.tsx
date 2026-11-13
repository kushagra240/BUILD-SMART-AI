import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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

function AppLayout() {
  const location = useLocation();
  const isCustomProductPage =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/app' ||
    location.pathname === '/app/new' ||
    location.pathname.startsWith('/app/estimates');

  return (
    <div className="app-surface flex min-h-screen flex-col bg-paper font-sans text-ink selection:bg-accent/20 selection:text-ink">
      {!isCustomProductPage && <MockBanner />}
      {!isCustomProductPage && <Navbar />}
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
      {!isCustomProductPage && <Footer />}
    </div>
  );
}

export function App() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t('app.title');
  }, [language, t]);

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
