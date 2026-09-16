import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useApp } from '../context/AppContext';
import {
  Compass,
  MapPin,
  BookOpen,
  PlusCircle,
  LayoutDashboard,
  Trophy,
  Search,
  User,
  Sparkles,
  X,
  ArrowRight,
  Shield,
  Coins,
  Terminal,
  Info
} from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const { currentUser, personas, switchPersona, logout, campusMode, setCampusMode } = useApp();
  const [personaOpen, setPersonaOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/browse');
    }
  };

  const navLinks = [
    { href: '/browse', label: 'Collections', icon: Compass },
    { href: '/browse/map', label: 'Map', icon: MapPin },
    { href: '/workbench', label: 'Workbench', icon: BookOpen },
    { href: '/submit', label: 'Submit', icon: PlusCircle },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/simulator', label: 'Sandbox', icon: Terminal },
    { href: '/about', label: 'Manifesto', icon: Info },
  ];

  const isActive = (href) => {
    if (href === '/browse') {
      return router.pathname === '/browse' && !router.asPath.includes('/browse/map');
    }
    return router.pathname === href || router.asPath.startsWith(href);
  };

  return (
    <header
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        paddingBottom: 24,
        borderBottom: '2px solid rgba(17, 17, 17, 0.12)',
        marginBottom: 28,
        position: 'relative',
        zIndex: 50
      }}
      data-purpose="navigation-header"
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16
        }}
      >
        {/* Brand & Campus Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            {/* Hand-drawn Tombstone Logo with Inscribed Cross/Pages */}
            <div style={{ width: 38, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg
                style={{ width: '100%', height: '100%', color: 'var(--color-ink)' }}
                stroke="currentColor"
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 40 48"
              >
                <path d="M 8 45 L 8 18 C 8 8, 32 8, 32 18 L 32 45" />
                <path d="M 4 45 L 36 45" />
                <path d="M 15 26 C 18 24, 20 25, 20 28 C 20 25, 22 24, 25 26 L 25 33 C 22 31, 20 32, 20 34 C 20 32, 18 31, 15 33 Z" strokeWidth="1.8" />
                <path d="M 20 28 L 20 34" strokeWidth="1.8" />
              </svg>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontFamily: 'var(--font-hand)',
                  fontSize: 30,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  letterSpacing: '0.01em',
                  color: 'var(--color-ink)'
                }}
              >
                Digital Graveyard
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'rgba(17, 17, 17, 0.65)',
                  marginTop: -2
                }}
              >
                {campusMode ? 'Campus Edition (.edu)' : 'Open Archive'}
              </span>
            </div>
          </Link>

          {/* Campus Scope Toggle Button */}
          <button
            onClick={() => setCampusMode(!campusMode)}
            className="sketch-btn"
            style={{
              padding: '4px 12px',
              fontSize: 11.5,
              fontFamily: 'var(--font-mono)',
              gap: 6,
              backgroundColor: campusMode ? 'var(--color-ink)' : 'var(--color-paper)',
              color: campusMode ? 'var(--color-paper)' : 'var(--color-ink)'
            }}
            title="Toggle between Campus (.edu) and Global Graveyard archive"
          >
            <Sparkles style={{ width: 13, height: 13 }} />
            <span>{campusMode ? 'Campus Mode ON' : 'Switch to Campus'}</span>
          </button>
        </div>

        {/* Center Nav Links - Desktop */}
        <nav
          className="hide-mobile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            fontFamily: 'var(--font-hand)',
            fontSize: 22,
            color: 'var(--color-ink)'
          }}
        >
          {navLinks.map((item) => {
            const active = isActive(item.href);
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  position: 'relative',
                  paddingBottom: 4,
                  textDecoration: 'none',
                  color: 'inherit',
                  fontWeight: active ? 700 : 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'opacity 0.15s'
                }}
              >
                <IconComponent style={{ width: 18, height: 18 }} />
                <span>{item.label}</span>
                {active && (
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: 2.5,
                      backgroundColor: 'var(--color-ink)',
                      borderRadius: 99
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Search & User Profile Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', minWidth: 160, maxWidth: 220 }}>
            <Search
              style={{
                width: 15,
                height: 15,
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-ink)',
                pointerEvents: 'none'
              }}
            />
            <input
              type="text"
              placeholder="Search artifacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sketch-input"
              style={{
                width: '100%',
                paddingLeft: 32,
                paddingRight: 10,
                paddingTop: 6,
                paddingBottom: 6,
                fontSize: 13,
                fontFamily: 'var(--font-sans)'
              }}
            />
          </form>

          {/* User Profile / Persona Switcher Trigger */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setPersonaOpen(!personaOpen)}
              className="sketch-btn"
              style={{
                height: 38,
                padding: '0 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                position: 'relative',
                fontSize: 12.5,
                fontFamily: 'var(--font-mono)'
              }}
              title={currentUser ? `Archivist: ${currentUser.alias}` : 'Archaeologist Profile'}
              aria-label="Archivist Profile"
            >
              <User style={{ width: 15, height: 15, color: 'var(--color-ink)' }} />
              <span className="hide-mobile" style={{ fontWeight: 600 }}>
                {currentUser ? `${currentUser.alias} (${currentUser.credits} cr)` : 'Select Persona'}
              </span>
              <span style={{ fontSize: 10, opacity: 0.7 }}>▾</span>
              {currentUser && (
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    backgroundColor: '#15803d',
                    border: '1.5px solid #ffffff'
                  }}
                />
              )}
            </button>

            {/* Persona Switcher Dropdown */}
            {personaOpen && (
              <div
                className="sketch-card-static"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 48,
                  width: 320,
                  padding: 16,
                  zIndex: 200,
                  boxShadow: '4px 6px 0px #141414',
                  backgroundColor: 'var(--color-paper)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 10, borderBottom: '1.5px solid rgba(17, 17, 17, 0.15)', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-hand)', fontSize: 22, fontWeight: 700, color: 'var(--color-ink)' }}>
                      {currentUser?.alias || 'Guest Archaeologist'}
                    </div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(17, 17, 17, 0.65)' }}>
                      {currentUser?.email || 'Anonymous Digger'}
                    </div>
                  </div>
                  <button
                    onClick={() => setPersonaOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                  >
                    <X style={{ width: 16, height: 16 }} />
                  </button>
                </div>

                {currentUser && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    <div className="sketch-tag" style={{ flex: 1, padding: '4px 8px', fontSize: 11.5, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      <Coins style={{ width: 12, height: 12 }} />
                      <span>{currentUser.credits} Credits</span>
                    </div>
                    <div className="sketch-tag" style={{ flex: 1, padding: '4px 8px', fontSize: 11.5, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      <Shield style={{ width: 12, height: 12 }} />
                      <span>{currentUser.reputation} Rep</span>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12, paddingBottom: 10, borderBottom: '1.5px dashed rgba(17, 17, 17, 0.2)' }}>
                  <Link
                    href="/dashboard"
                    onClick={() => setPersonaOpen(false)}
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: 'none',
                      color: 'var(--color-ink)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 0'
                    }}
                  >
                    <span>View Dashboard & Ledger</span>
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>

                  <Link
                    href="/workbench"
                    onClick={() => setPersonaOpen(false)}
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: 'none',
                      color: 'var(--color-ink)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 0'
                    }}
                  >
                    <span>Archivist Workbench</span>
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>

                  <Link
                    href="/submit"
                    onClick={() => setPersonaOpen(false)}
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: 'none',
                      color: 'var(--color-ink)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 0'
                    }}
                  >
                    <span>Submit Dead Project</span>
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                </div>

                {/* Persona Switcher Quick Selection */}
                <div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(17, 17, 17, 0.6)', marginBottom: 6 }}>
                    Switch Demo Persona
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 130, overflowY: 'auto' }}>
                    {personas.map((p) => {
                      const isCurrent = currentUser?.id === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            switchPersona(p.id);
                            setPersonaOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '4px 8px',
                            borderRadius: 6,
                            border: isCurrent ? '1.5px solid var(--color-ink)' : '1px solid transparent',
                            backgroundColor: isCurrent ? 'var(--color-paper-dark)' : 'transparent',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontFamily: 'inherit'
                          }}
                        >
                          <span style={{ fontWeight: isCurrent ? 700 : 500 }}>{p.alias}</span>
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(17, 17, 17, 0.6)' }}>
                            {p.credits} cr
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {currentUser && (
                  <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid rgba(17, 17, 17, 0.1)' }}>
                    <button
                      onClick={async () => {
                        setPersonaOpen(false);
                        await logout();
                        router.push('/');
                      }}
                      style={{
                        width: '100%',
                        padding: '6px 0',
                        fontSize: 12,
                        color: 'var(--error)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontWeight: 600
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="sketch-btn hide-desktop"
            style={{ width: 36, height: 36, padding: 0 }}
            aria-label="Toggle mobile menu"
          >
            {mobileNavOpen ? <X style={{ width: 16, height: 16 }} /> : <Compass style={{ width: 16, height: 16 }} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileNavOpen && (
        <nav
          className="hide-desktop sketch-card-static"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: 16,
            fontFamily: 'var(--font-hand)',
            fontSize: 22
          }}
        >
          {navLinks.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  textDecoration: 'none',
                  color: 'var(--color-ink)',
                  fontWeight: active ? 700 : 500
                }}
              >
                <IconComponent style={{ width: 20, height: 20 }} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
