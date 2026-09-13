import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { ChildProvider, useChild } from './context/ChildContext';

import { Navbar } from './components/Navbar';
import { AccessibilityToolbar } from './components/AccessibilityToolbar';
import { ChildModal } from './components/ChildModal';

import { Home } from './pages/Home';
import { AuthPage } from './pages/AuthPage';
import { LearnMode } from './pages/LearnMode';
import { TestMode } from './pages/TestMode';
import { ResultsView } from './pages/ResultsView';
import { Dashboard } from './pages/Dashboard';
import { HandwritingPreview } from './pages/HandwritingPreview';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

function MainAppLayout() {
  const [childModalOpen, setChildModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-indigo-200">
      <div>
        <Navbar onOpenChildModal={() => setChildModalOpen(true)} />
        <main className="pb-16">
          <Routes>
            <Route path="/" element={<Home onOpenChildModal={() => setChildModalOpen(true)} />} />
            <Route path="/auth" element={<AuthPage />} />
            
            <Route
              path="/learn"
              element={
                <ProtectedRoute>
                  <LearnMode onOpenChildModal={() => setChildModalOpen(true)} />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/test"
              element={
                <ProtectedRoute>
                  <TestMode onOpenChildModal={() => setChildModalOpen(true)} />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/results/:scoreId"
              element={
                <ProtectedRoute>
                  <ResultsView />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard onOpenChildModal={() => setChildModalOpen(true)} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/handwriting-preview"
              element={<HandwritingPreview />}
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-zinc-200/80 dark:border-zinc-800 text-center text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-zinc-600 dark:text-zinc-400">
            LexiScreen — Non-Medical Multimodal Learning Screener
          </p>
          <p className="text-[11px] text-zinc-400">
            For educational screening & early support indicators only. Not a medical diagnosis.
          </p>
        </div>
      </footer>

      {/* Global Dyslexia & Typography Toolbar */}
      <AccessibilityToolbar />

      {/* Global Child Creation Modal */}
      <ChildModal
        isOpen={childModalOpen}
        onClose={() => setChildModalOpen(false)}
      />
    </div>
  );
}

import { ErrorBoundary } from './components/ErrorBoundary';

export function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ChildProvider>
            <AccessibilityProvider>
              <MainAppLayout />
            </AccessibilityProvider>
          </ChildProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
