import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function parseAuthError(detail, fallback) {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg || d.message || JSON.stringify(d)).join('. ');
  }
  return fallback;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ep_token'));
  const [loading, setLoading] = useState(true);

  // On page load only: validate a stored token (skip right after login/signup)
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    if (user) {
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Invalid token');
        return r.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('ep_token');
        setToken(null);
        setUser(null);
        setLoading(false);
      });
  }, [token, user]);

  const applyAuthSession = (data) => {
    localStorage.setItem('ep_token', data.token);
    setUser(data.user);
    setToken(data.token);
    setLoading(false);
    return data.user;
  };

  const login = async (email, password) => {
    let res;
    try {
      res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        }),
      });
    } catch {
      throw new Error(
        `Cannot reach the server at ${API_BASE}. Start the backend with: uvicorn app.main:app --reload`
      );
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseAuthError(err.detail, 'Login failed'));
    }

    const data = await res.json();
    return applyAuthSession(data);
  };

  const signup = async (email, password, name) => {
    let res;
    try {
      res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password.trim(),
          name: name.trim(),
        }),
      });
    } catch {
      throw new Error(
        `Cannot reach the server at ${API_BASE}. Start the backend with: uvicorn app.main:app --reload`
      );
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseAuthError(err.detail, 'Signup failed'));
    }

    const data = await res.json();
    return applyAuthSession(data);
  };

  const logout = () => {
    localStorage.removeItem('ep_token');
    setToken(null);
    setUser(null);
  };

  const getAuthHeaders = () => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, getAuthHeaders, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
