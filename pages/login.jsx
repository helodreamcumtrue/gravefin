import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useApp } from '../context/AppContext';
import Icon from '../components/Icons';

export default function Login() {
  const router = useRouter();
  const { setCurrentUser, personas, switchPersona, addToast } = useApp();
  const [email, setEmail] = useState('owner@campus.edu');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      setCurrentUser(data.user);
      localStorage.setItem('graveyard_active_user_id', data.user.id);
      addToast(`Welcome back, ${data.user.alias}!`, 'success');
      router.push('/dashboard');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (p) => {
    await switchPersona(p.id);
    router.push('/dashboard');
  };

  return (
    <div className="container" style={{ padding: '60px 0 90px', maxWidth: 460 }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ width: 48, height: 48, border: '2px solid var(--border)', borderRadius: '12px 12px 6px 6px', background: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, boxShadow: '2px 2px 0px #141414' }}>
          <Icon name="tombstone" size={22} />
        </div>
        <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.03em' }}>
          Authenticate to Graveyard
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: 0 }}>
          Your real email is private. You will interact solely under your assigned <strong>Digger</strong> alias.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="card"
        style={{
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          background: '#FFFFFF',
          borderRadius: '18px',
          boxShadow: '3px 4px 0px #141414'
        }}
      >
        <div>
          <label className="label">Account Email</label>
          <input
            type="email"
            className="input"
            style={{ height: 42, borderRadius: '10px' }}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Password</label>
          <input
            type="password"
            className="input"
            style={{ height: 42, borderRadius: '10px' }}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          style={{ marginTop: 6, height: 42, fontSize: 14.5, borderRadius: '10px' }}
          disabled={loading}
        >
          {loading ? 'Authenticating...' : 'Log In with Email →'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Don&apos;t have an account? <Link href="/signup" style={{ color: 'var(--text)', fontWeight: 800, textDecoration: 'underline' }}>Create anonymous account</Link>
        </div>
      </form>

      {/* Quick Switch Demo Accounts */}
      <div style={{ marginTop: 36 }}>
        <div style={{ fontSize: 11.5, textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 800, letterSpacing: '0.04em', marginBottom: 12, textAlign: 'center' }}>
          Or Select A Pre-Seeded Testing Persona
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {personas.map(p => (
            <button
              key={p.id}
              className="card"
              onClick={() => handleQuickLogin(p)}
              style={{
                padding: '14px',
                textAlign: 'left',
                cursor: 'pointer',
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1.8px solid var(--border)',
                boxShadow: '1.5px 2px 0px #141414',
                transition: 'transform 0.1s ease'
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                {p.alias}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 3 }}>
                {p.credits} cr · ★ {p.reputation} rep
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
