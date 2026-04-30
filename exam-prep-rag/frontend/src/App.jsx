import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import QuizPlatform from './components/QuizPlatform';
import FileUpload from './components/FileUpload';
import ServerWakeUp from './components/ServerWakeUp';
import './index.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function AppContent() {
  const { sidebarOpen, setSidebarOpen, activeView } = useApp();

  return (
    <div className="app-layout">
      <Sidebar />
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <div className="main-content">
        <Header />
        {activeView === 'chat' ? <ChatWindow /> : <QuizPlatform />}
      </div>
      <FileUpload />
    </div>
  );
}

function AuthGate() {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState('landing'); // 'landing' or 'auth'
  const [authMode, setAuthMode] = useState('login');   // 'login' or 'signup'

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authView === 'auth') {
      return (
        <div className="page-transition-in">
          <AuthPage
            defaultMode={authMode}
            onBack={() => setAuthView('landing')}
          />
        </div>
      );
    }

    return (
      <div className="page-transition-in">
        <LandingPage
          onSignIn={() => { setAuthMode('login'); setAuthView('auth'); }}
          onSignUp={() => { setAuthMode('signup'); setAuthView('auth'); }}
        />
      </div>
    );
  }

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

function App() {
  const [serverReady, setServerReady] = useState(false);
  const [showWakeUp, setShowWakeUp] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkServer = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${API_BASE}/api/health`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok && !cancelled) {
          // Server responded fast — no wake-up screen needed
          setServerReady(true);
        }
      } catch {
        // Server didn't respond within 3s — show wake-up screen
        if (!cancelled) {
          setShowWakeUp(true);
        }
      }
    };

    checkServer();
    return () => { cancelled = true; };
  }, []);

  const handleReady = useCallback(() => {
    setServerReady(true);
    setShowWakeUp(false);
  }, []);

  if (showWakeUp && !serverReady) {
    return <ServerWakeUp onReady={handleReady} />;
  }

  if (!serverReady) {
    // Brief initial check in progress — show minimal loading
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />
      </div>
    );
  }

  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

export default App;

