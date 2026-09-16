import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getLocalPersonas } from '../lib/mockFallback';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((text, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  // 1. Initial hydration: Load personas and verify current session
  const fetchPersonasAndUser = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all pre-seeded testing personas
      let personaList = [];
      try {
        const personasRes = await fetch('/api/auth/personas');
        if (personasRes.ok) {
          const personasData = await personasRes.json();
          personaList = personasData.personas || [];
        }
      } catch (e) {
        // Handled below with fallback
      }

      // If backend is unavailable (e.g. GitHub Pages static export), fallback to local mock personas
      if (!personaList || personaList.length === 0) {
        personaList = getLocalPersonas();
      }
      setPersonas(personaList);

      // Check for an existing verified HTTP-Only session cookie
      try {
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.authenticated && meData.user) {
            setCurrentUser(meData.user);
            localStorage.setItem('graveyard_active_user_id', meData.user.id);
            return;
          }
        }
      } catch (e) {
        // Handled below
      }

      // If no valid session cookie, check localStorage or default to first persona for demo mode
      if (personaList.length > 0) {
        const storedId = localStorage.getItem('graveyard_active_user_id');
        const targetPersona = personaList.find(p => p.id === storedId) || personaList[0];
        
        try {
          const switchRes = await fetch('/api/auth/switch-persona', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: targetPersona.id })
          });
          if (switchRes.ok) {
            const switchData = await switchRes.json();
            setCurrentUser(switchData.user);
            localStorage.setItem('graveyard_active_user_id', switchData.user.id);
            return;
          }
        } catch (e) {
          // In static demo mode, fallback directly
        }

        setCurrentUser(targetPersona);
        localStorage.setItem('graveyard_active_user_id', targetPersona.id);
      }
    } catch (err) {
      console.error('Error initializing authentication context:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonasAndUser();
  }, [fetchPersonasAndUser]);

  // 2. Standard Email/Password Login
  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        localStorage.setItem('graveyard_active_user_id', data.user.id);
        addToast(`Authenticated as ${data.user.alias}`, 'success');
        return data.user;
      }
      const data = await res.json();
      throw new Error(data.error || 'Login failed');
    } catch (err) {
      const allPersonas = personas.length > 0 ? personas : getLocalPersonas();
      const found = allPersonas.find(p => p.email.toLowerCase() === email.toLowerCase());
      if (found) {
        setCurrentUser(found);
        localStorage.setItem('graveyard_active_user_id', found.id);
        addToast(`Authenticated as ${found.alias} (Demo Mode)`, 'success');
        return found;
      }
      // Demo fallback user
      const demoUser = {
        id: `user-${Date.now()}`,
        email,
        alias: `Digger-${Math.floor(1000 + Math.random() * 9000)}`,
        credits: 500,
        reputation: 100,
        ghostStrikes: 0,
        banned: false
      };
      setCurrentUser(demoUser);
      localStorage.setItem('graveyard_active_user_id', demoUser.id);
      addToast(`Authenticated as ${demoUser.alias} (Demo Mode)`, 'success');
      return demoUser;
    }
  };

  // 3. Anonymous Account Registration
  const signup = async (email, password) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        localStorage.setItem('graveyard_active_user_id', data.user.id);
        addToast(`Account created! Assigned alias: ${data.user.alias} (+500 credits granted)`, 'success');
        return data.user;
      }
      const data = await res.json();
      throw new Error(data.error || 'Signup failed');
    } catch (err) {
      const newUser = {
        id: `user-${Date.now()}`,
        email,
        alias: `Digger-${Math.floor(1000 + Math.random() * 9000)}`,
        credits: 500,
        reputation: 100,
        ghostStrikes: 0,
        banned: false
      };
      setCurrentUser(newUser);
      localStorage.setItem('graveyard_active_user_id', newUser.id);
      addToast(`Account created! Assigned alias: ${newUser.alias} (+500 demo credits)`, 'success');
      return newUser;
    }
  };

  // 4. Secure Session Logout
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout request error:', e);
    }
    setCurrentUser(null);
    localStorage.removeItem('graveyard_active_user_id');
    addToast('Logged out of session', 'info');
  };

  // 5. Seamless 1-Click Persona Switcher (Synchronizes Server Session Cookie or Local Demo)
  const switchPersona = async (userId) => {
    try {
      const res = await fetch('/api/auth/switch-persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        localStorage.setItem('graveyard_active_user_id', data.user.id);
        addToast(`Switched active persona to ${data.user.alias}`, 'success');
        return data.user;
      }
    } catch (err) {
      // Handled in fallback below
    }

    const allPersonas = personas.length > 0 ? personas : getLocalPersonas();
    const target = allPersonas.find(p => p.id === userId);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem('graveyard_active_user_id', target.id);
      addToast(`Switched active persona to ${target.alias}`, 'success');
      return target;
    }
  };

  // Campus Scope state
  const [campusMode, setCampusMode] = useState(false);

  // 6. Refresh user metrics (balance, reputation, strikes)
  const refreshUser = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        personas,
        loading,
        toasts,
        addToast,
        login,
        signup,
        logout,
        switchPersona,
        refreshUser,
        campusMode,
        setCampusMode
      }}
    >
      {children}
      {/* Toast Notification Container */}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div
            key={t.id}
            className="toast-sketch"
            style={{
              borderLeftWidth: 4,
              borderLeftColor:
                t.type === 'error' ? 'var(--error)' : t.type === 'success' ? 'var(--success)' : 'var(--color-ink)'
            }}
          >
            {t.text}
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
