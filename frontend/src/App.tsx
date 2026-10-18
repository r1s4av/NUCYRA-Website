import React, { lazy, Suspense, useState, useEffect } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { StatusBanner } from './components/layout/StatusBanner';
import { HealthStatus } from './types';
import { checkBackendHealth } from './services/api';

const HomePage = lazy(() => import('./pages/HomePage').then((page) => ({ default: page.HomePage })));
const AnalysisLabPage = lazy(() => import('./pages/AnalysisLabPage').then((page) => ({ default: page.AnalysisLabPage })));
const IvpStudioPage = lazy(() => import('./pages/IvpStudioPage').then((page) => ({ default: page.IvpStudioPage })));
const AiInsightsPage = lazy(() => import('./pages/AiInsightsPage').then((page) => ({ default: page.AiInsightsPage })));
const QuantitativeAnalysisPage = lazy(() => import('./pages/QuantitativeAnalysisPage').then((page) => ({ default: page.QuantitativeAnalysisPage })));
const MethodologyPage = lazy(() => import('./pages/MethodologyPage').then((page) => ({ default: page.MethodologyPage })));

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<string>('home');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Poll backend health status on mount
  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const data = await checkBackendHealth();
        if (isMounted) {
          setHealth(data);
          setHealthError(null);
          setIsHealthLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setHealth(null);
          setHealthError(err.message || 'Backend connection error');
          setIsHealthLoading(false);
        }
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000); // Check every 15s

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-bio-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden">
        {/* Ambient Optical Lighting Layers */}
        <div className="fixed inset-0 bg-microscope-grid opacity-30 pointer-events-none z-0" />
        <div className="fixed -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-cyan-600/10 blur-[140px] pointer-events-none z-0" />
        <div className="fixed top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[140px] pointer-events-none z-0" />
        <div className="fixed -bottom-40 left-1/4 w-[600px] h-[600px] rounded-full bg-teal-600/10 blur-[160px] pointer-events-none z-0" />

        {/* Top Status Bar */}
        <div className="relative z-50">
          <StatusBanner
            health={health}
            isLoading={isHealthLoading}
            error={healthError}
          />
        </div>

        {/* Main Navigation */}
        <Navbar activePage={activePage} onNavigate={setActivePage} />

        {/* Page Content with Animated Transitions */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Suspense
            fallback={
              <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-xs font-mono text-slate-400">
                <Loader2 className="h-7 w-7 animate-spin text-cyan-400" />
                <span>Loading analysis workspace…</span>
              </div>
            }
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                {activePage === 'home' && <HomePage onNavigate={setActivePage} />}
                {activePage === 'lab' && <AnalysisLabPage />}
                {activePage === 'ivp' && <IvpStudioPage />}
                {activePage === 'ai' && <AiInsightsPage />}
                {activePage === 'quant' && <QuantitativeAnalysisPage />}
                {activePage === 'methodology' && <MethodologyPage />}
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </main>

        {/* Master Footer */}
        <div className="relative z-10">
          <Footer />
        </div>
      </div>
    </MotionConfig>
  );
};

export default App;
