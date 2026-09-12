import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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
      const personasRes = await fetch('/api/auth/personas');
      let personaList = [];
      if (personasRes.ok) {
        const personasData = await personasRes.json();
        personaList = personasData.personas || [];
        setPersonas(personaList);
      }

      // Check for an existing verified HTTP-Only session cookie
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.authenticated && meData.user) {
          setCurrentUser(meData.user);
          localStorage.setItem('graveyard_active_user_id', meData.user.id);
          return;
        }
      }

      // If no valid session cookie, check localStorage or default to first persona for demo mode
      if (personaList.length > 0) {
        const storedId = localStorage.getItem('graveyard_active_user_id');
        const targetPersona = personaList.find(p => p.id === storedId) || personaList[0];
        
        // Sync server session cookie atomically to the target persona
        const switchRes = await fetch('/api/auth/switch-persona', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: targetPersona.id })
        });
        if (switchRes.ok) {
          const switchData = await switchRes.json();
          setCurrentUser(switchData.user);
          localStorage.setItem('graveyard_active_user_id', switchData.user.id);
        } else {
          setCurrentUser(targetPersona);
        }
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
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    setCurrentUser(data.user);
    localStorage.setItem('graveyard_active_user_id', data.user.id);
    addToast(`Authenticated as ${data.user.alias}`, 'success');
    return data.user;
  };

  // 3. Anonymous Account Registration
  const signup = async (email, password) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Signup failed');
    }
    setCurrentUser(data.user);
    localStorage.setItem('graveyard_active_user_id', data.user.id);
    addToast(`Account created! Assigned alias: ${data.user.alias} (+500 credits granted)`, 'success');
    return data.user;
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

  // 5. Seamless 1-Click Persona Switcher (Synchronizes Server Session Cookie)
  const switchPersona = async (userId) => {
    try {
      const res = await fetch('/api/auth/switch-persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to switch persona');

      setCurrentUser(data.user);
      localStorage.setItem('graveyard_active_user_id', data.user.id);
      addToast(`Switched active persona to ${data.user.alias}`, 'success');
      return data.user;
    } catch (err) {
      addToast(err.message || 'Failed to switch persona', 'error');
    }
  };

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
        refreshUser
      }}
    >
      {children}
      {/* Toast Notification Container */}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div
            key={t.id}
            className="toast"
            style={{
              borderLeftColor:
                t.type === 'error' ? 'var(--error)' : t.type === 'success' ? 'var(--accent-2)' : 'var(--accent)'
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
