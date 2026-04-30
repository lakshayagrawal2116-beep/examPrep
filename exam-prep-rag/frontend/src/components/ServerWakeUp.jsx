import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * ServerWakeUp — shown when the backend is sleeping (e.g. Render free tier).
 * Pings /api/health every 3s until it responds, then calls onReady().
 */
export default function ServerWakeUp({ onReady }) {
  const [dots, setDots] = useState('');
  const [elapsed, setElapsed] = useState(0);

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Track elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Retry ping until healthy
  useEffect(() => {
    let cancelled = false;

    const ping = async () => {
      while (!cancelled) {
        try {
          const res = await fetch(`${API_BASE}/api/health`, {
            signal: AbortSignal.timeout(5000),
          });
          if (res.ok) {
            if (!cancelled) onReady();
            return;
          }
        } catch {
          // Server still waking up — retry
        }
        // Wait 3s before next attempt
        await new Promise(r => setTimeout(r, 3000));
      }
    };

    ping();
    return () => { cancelled = true; };
  }, [onReady]);

  const tips = [
    'Free-tier servers sleep after inactivity',
    'This usually takes 20–40 seconds',
    'Your data is safe — hang tight!',
  ];

  const tipIndex = Math.floor(elapsed / 6) % tips.length;

  return (
    <div className="wakeup-screen">
      <div className="wakeup-card">
        {/* Animated server icon */}
        <div className="wakeup-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
            <line x1="6" y1="6" x2="6.01" y2="6"/>
            <line x1="6" y1="18" x2="6.01" y2="18"/>
          </svg>
          <div className="wakeup-pulse" />
        </div>

        <h2>Waking up the server{dots}</h2>
        <p className="wakeup-subtitle">
          The backend is starting up. This only happens after a period of inactivity.
        </p>

        {/* Progress bar (indeterminate) */}
        <div className="wakeup-progress">
          <div className="wakeup-progress-bar" />
        </div>

        <div className="wakeup-elapsed">
          {elapsed}s elapsed
        </div>

        <div className="wakeup-tip">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
          </svg>
          <span>{tips[tipIndex]}</span>
        </div>
      </div>
    </div>
  );
}
