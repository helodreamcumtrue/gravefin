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
    }, 4000);
  }, []);

  // Fetch available personas and initialize current user
  const fetchPersonasAndUser = useCallback(async (preferredUserId = null) => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/personas');
      if (!res.ok) throw new Error('Failed to fetch personas');
      const data = await res.json();
      setPersonas(data.personas || []);

      if (data.personas && data.personas.length > 0) {
        const targetId = preferredUserId || localStorage.getItem('graveyard_active_user_id') || data.personas[0].id;
        const active = data.personas.find(p => p.id === targetId) || data.personas[0];
        
        // Fetch full profile for this user
        const userRes = await fetch('/api/users/me', {
          headers: { 'x-user-id': active.id }
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData.user);
          localStorage.setItem('graveyard_active_user_id', active.id);
        } else {
          setCurrentUser(active);
        }
      }
    } catch (err) {
      console.error('Error initializing user context:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonasAndUser();
  }, [fetchPersonasAndUser]);

  // Switch persona (instant testing helper)
  const switchPersona = async (userId) => {
    try {
      localStorage.setItem('graveyard_active_user_id', userId);
      const res = await fetch('/api/users/me', {
        headers: { 'x-user-id': userId }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        addToast(`Switched active persona to ${data.user.alias}`, 'success');
      }
    } catch (err) {
      addToast('Failed to switch persona', 'error');
    }
  };

  // Refresh current user data
  const refreshUser = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/users/me', {
        headers: { 'x-user-id': currentUser.id }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
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
