import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useApp } from '../context/AppContext';
import Icon from '../components/Icons';

export default function Signup() {
  const router = useRouter();
  const { signup, addToast } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      addToast('Passwords do not match', 'error');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      addToast('Password must be at least 6 characters', 'error');
      return;
    }

    try {
      setLoading(true);
      await signup(email, password);
      router.push('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Signup failed');
      addToast(err.message || 'Signup failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '50px 0 80px', maxWidth: 460 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, border: '2px solid var(--border)', borderRadius: '12px 12px 6px 6px', background: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, boxShadow: '2px 2px 0px #141414' }}>
          <Icon name="tombstone" size={22} />
        </div>
        <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.03em' }}>
          Create Anonymous Account
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: 0 }}>
          You will automatically be issued a unique <strong>Digger-####</strong> alias and 500 starter escrow credits.
        </p>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: 16,
            background: '#FFF0F0',
            border: '1.8px solid #F87171',
            borderRadius: '10px',
            color: '#B91C1C',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '2px 2px 0px #141414'
          }}
        >
          <Icon name="alertTriangle" size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="card"
        style={{
          padding: 26,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          background: '#FFFFFF',
          borderRadius: '18px',
          border: '2px solid var(--border)',
          boxShadow: '3px 4px 0px #141414'
        }}
      >
        <div>
          <label className="label">Your Email (Private & Hidden)</label>
          <input
            type="email"
            className="input"
            style={{ height: 42, borderRadius: '10px' }}
            placeholder="you@campus.edu"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 4 }}>
            Never exposed in any public API response, repository, or UI view.
          </div>
        </div>

        <div>
          <label className="label">Password (Min. 6 Characters)</label>
          <input
            type="password"
            className="input"
            style={{ height: 42, borderRadius: '10px' }}
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Confirm Password</label>
          <input
            type="password"
            className="input"
            style={{ height: 42, borderRadius: '10px' }}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <div
          className="surface2"
          style={{
            padding: 12,
            borderRadius: '10px',
            border: '1.8px solid var(--border)',
            fontSize: 12.5,
            color: '#1E6B3E',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '1px 1.5px 0px #141414'
          }}
        >
          <Icon name="coin" size={15} />
          <span>Includes <strong>500 Credits</strong> onboarding grant for escrow staking.</span>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          style={{ marginTop: 4, height: 42, fontSize: 14.5, borderRadius: '10px' }}
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register & Receive Alias →'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--text)', fontWeight: 800, textDecoration: 'underline' }}>Log in</Link>
        </div>
      </form>
    </div>
  );
}
