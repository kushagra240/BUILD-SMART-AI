import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
        <div className="min-h-screen bg-paper text-ink flex flex-col font-sans selection:bg-ochre/30 selection:text-ink">
          <MockBanner />
          <Navbar />
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
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
