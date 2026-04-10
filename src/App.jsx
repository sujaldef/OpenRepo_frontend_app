import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

import Dashboard from './pages/Dashboard/Index';

import Overview from './pages/components/Overview';
import Issues from './pages/components/Issues';
import Recommendations from './pages/components/Recommendations';
import Predictions from './pages/components/Prediction';
import AuthPage from './pages/Auth/Index';
import ProtectedRoute from './pages/components/ProtectedRoute';
import Code from './pages/components/Code';
import CodeExplorer from './pages/components/CodeExplorer/CodeExplorer';

function AppContent() {
  const { isDarkTheme } = useTheme();

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkTheme
          ? 'bg-[#050505] text-zinc-300'
          : 'bg-slate-50 text-slate-900'
      }`}
    >
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/dashboard/code" element={<Code />} />

        {/* Code Explorer - standalone window route */}
        <Route path="/code/:repoId" element={<CodeExplorer />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          {/* repo-specific routes */}
          <Route path=":repoId/overview" element={<Overview />} />
          <Route path=":repoId/issues" element={<Issues />} />
          <Route path=":repoId/Recommendations" element={<Recommendations />} />
          <Route path=":repoId/Predictions" element={<Predictions />} />
        </Route>
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}
