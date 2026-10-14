import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useApp } from '../context/AppContext';
import {
  Compass,
  MapPin,
  BookOpen,
  PlusCircle,
  LayoutDashboard,
  Search,
  User,
  Sparkles,
  X,
  ArrowRight,
  Shield,
  Coins,
  Terminal,
  Info,
  Code2,
  ChevronDown,
  Layers,
  Menu
} from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const { currentUser, personas, switchPersona, logout, campusMode, setCampusMode } = useApp();
  const [personaOpen, setPersonaOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const toolsRef = useRef(null);
  const personaRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (toolsRef.current && !toolsRef.current.contains(e.target)) {
        setToolsOpen(false);
      }
      if (personaRef.current && !personaRef.current.contains(e.target)) {
        setPersonaOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/browse');
    }
  };

  // Primary uncluttered links
  const primaryLinks = [
    { href: '/browse', label: 'Artifacts', icon: Compass },
    { href: '/submit', label: 'Submit', icon: PlusCircle },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/about', label: 'Manifesto', icon: Info },
  ];

  // Secondary tools consolidated into dropdown
  const toolLinks = [
    { href: '/browse/map', label: 'Cartography Map', icon: MapPin, desc: '2D Cartesian quadrant map' },
    { href: '/workbench', label: 'Archivist Workbench', icon: BookOpen, desc: 'Curatorial research center' },
    { href: '/simulator', label: 'Protocol Sandbox', icon: Terminal, desc: 'Time-travel & cron simulator' },
    { href: '/graphql', label: 'GraphQL Explorer', icon: Code2, desc: 'Interactive protocol queries' },
  ];

  const isActive = (href) => {
    if (href === '/browse') {
      return router.pathname === '/browse' && !router.asPath.includes('/browse/map');
    }
    return router.pathname === href || router.asPath.startsWith(href);
  };

  const isToolsActive = toolLinks.some(t => router.pathname.startsWith(t.href));

  return (
    <header
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        paddingBottom: 18,
        borderBottom: '2px solid rgba(17, 17, 17, 0.12)',
        marginBottom: 26,
        position: 'relative',
        zIndex: 50
      }}
      data-purpose="navigation-header"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16
        }}
      >
        {/* Brand & Campus Scope */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            {/* Hand-drawn Tombstone Logo */}
            <div style={{ width: 34, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  fontSize: 27,
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
                  fontSize: 9.5,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'rgba(17, 17, 17, 0.65)',
                  marginTop: -2
                }}
              >
                {campusMode ? 'Campus Edition (.edu)' : 'Open Archive'}
              </span>
            </div>
          </Link>

          {/* Campus Toggle Button */}
          <button
            onClick={() => setCampusMode(!campusMode)}
            className="sketch-btn hide-mobile"
            style={{
              padding: '3px 9px',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              gap: 5,
              backgroundColor: campusMode ? 'var(--color-ink)' : 'var(--color-paper)',
              color: campusMode ? 'var(--color-paper)' : 'var(--color-ink)',
              borderRadius: 6
            }}
            title="Toggle between Campus (.edu) and Global Graveyard archive"
          >
            <Sparkles style={{ width: 12, height: 12 }} />
            <span>{campusMode ? 'Campus ON' : 'Campus'}</span>
          </button>
        </div>

        {/* Center Nav Links - Streamlined Desktop */}
        <nav
          className="hide-mobile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            fontFamily: 'var(--font-hand)',
            fontSize: 21,
            color: 'var(--color-ink)'
          }}
        >
          {primaryLinks.map((item) => {
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
                <IconComponent style={{ width: 17, height: 17 }} />
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

          {/* Tools Dropdown Trigger */}
          <div ref={toolsRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setToolsOpen(!toolsOpen)}
              style={{
                background: isToolsActive ? 'rgba(0,0,0,0.06)' : 'transparent',
                border: isToolsActive ? '1.5px solid var(--border)' : '1.5px solid transparent',
                borderRadius: 8,
                padding: '3px 8px',
                fontFamily: 'var(--font-hand)',
                fontSize: 21,
                color: 'var(--color-ink)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontWeight: isToolsActive ? 700 : 500
              }}
            >
              <Layers style={{ width: 17, height: 17 }} />
              <span>Tools</span>
              <ChevronDown style={{ width: 14, height: 14, transform: toolsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>

            {/* Tools Dropdown Menu */}
            {toolsOpen && (
              <div
                className="sketch-card-static"
                style={{
                  position: 'absolute',
                  top: 36,
                  left: -30,
                  width: 250,
                  padding: '8px 6px',
                  zIndex: 200,
                  backgroundColor: 'var(--color-paper)',
                  boxShadow: '4px 6px 0px #141414',
                  borderRadius: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}
              >
                {toolLinks.map((tool) => {
                  const IconComp = tool.icon;
                  const active = router.pathname === tool.href;
                  return (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      onClick={() => setToolsOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        textDecoration: 'none',
                        color: 'var(--color-ink)',
                        borderRadius: 6,
                        backgroundColor: active ? 'rgba(0,0,0,0.06)' : 'transparent',
                        transition: 'background 0.12s'
                      }}
                    >
                      <IconComp style={{ width: 16, height: 16, color: 'var(--color-ink)', flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-sans)', lineHeight: 1.2 }}>
                          {tool.label}
                        </span>
                        <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                          {tool.desc}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Right Controls: Search & Persona Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <form onSubmit={handleSearchSubmit} className="hide-mobile" style={{ position: 'relative', width: 160 }}>
            <Search
              style={{
                width: 14,
                height: 14,
                position: 'absolute',
                left: 9,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-ink)',
                pointerEvents: 'none'
              }}
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sketch-input"
              style={{
                width: '100%',
                paddingLeft: 28,
                paddingRight: 8,
                paddingTop: 5,
                paddingBottom: 5,
                fontSize: 12,
                borderRadius: 8,
                fontFamily: 'var(--font-sans)'
              }}
            />
          </form>

          {/* User Persona Profile Pill */}
          <div ref={personaRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setPersonaOpen(!personaOpen)}
              className="sketch-btn"
              style={{
                height: 35,
                padding: '0 10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                borderRadius: 8
              }}
              title={currentUser ? `Digger: ${currentUser.alias}` : 'Archaeologist Profile'}
              aria-label="Digger Profile"
            >
              <User style={{ width: 14, height: 14 }} />
              <span className="hide-mobile" style={{ fontWeight: 600 }}>
                {currentUser ? `${currentUser.alias} (${currentUser.credits} cr)` : 'Persona'}
              </span>
              <span style={{ fontSize: 10, opacity: 0.7 }}>▾</span>
            </button>

            {/* Persona Switcher Dropdown */}
            {personaOpen && (
              <div
                className="sketch-card-static"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 42,
                  width: 300,
                  padding: 14,
                  zIndex: 200,
                  boxShadow: '4px 6px 0px #141414',
                  backgroundColor: 'var(--color-paper)',
                  borderRadius: 12
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 8, borderBottom: '1.5px solid rgba(17, 17, 17, 0.15)', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-hand)', fontSize: 20, fontWeight: 700, color: 'var(--color-ink)' }}>
                      {currentUser?.alias || 'Guest Archaeologist'}
                    </div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(17, 17, 17, 0.65)' }}>
                      {currentUser?.email || 'Anonymous Digger'}
                    </div>
                  </div>
                  <button
                    onClick={() => setPersonaOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                  >
                    <X style={{ width: 15, height: 15 }} />
                  </button>
                </div>

                {currentUser && (
                  <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                    <div className="sketch-tag" style={{ flex: 1, padding: '3px 6px', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      <Coins style={{ width: 11, height: 11 }} />
                      <span>{currentUser.credits} Credits</span>
                    </div>
                    <div className="sketch-tag" style={{ flex: 1, padding: '3px 6px', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      <Shield style={{ width: 11, height: 11 }} />
                      <span>{currentUser.reputation} Rep</span>
                    </div>
                  </div>
                )}

                {/* Switch Persona Options */}
                <div>
                  <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(17, 17, 17, 0.6)', marginBottom: 6 }}>
                    Switch Demo Persona
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 120, overflowY: 'auto' }}>
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
                            borderRadius: 5,
                            border: isCurrent ? '1.5px solid var(--color-ink)' : '1px solid transparent',
                            backgroundColor: isCurrent ? 'var(--color-paper-dark)' : 'transparent',
                            cursor: 'pointer',
                            fontSize: 11.5,
                            fontFamily: 'inherit'
                          }}
                        >
                          <span style={{ fontWeight: isCurrent ? 700 : 500 }}>{p.alias}</span>
                          <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'rgba(17, 17, 17, 0.6)' }}>
                            {p.credits} cr
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {currentUser && (
                  <div style={{ marginTop: 10, paddingTop: 6, borderTop: '1px solid rgba(17, 17, 17, 0.1)' }}>
                    <button
                      onClick={async () => {
                        setPersonaOpen(false);
                        await logout();
                        router.push('/');
                      }}
                      style={{
                        width: '100%',
                        padding: '4px 0',
                        fontSize: 11.5,
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

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="sketch-btn hide-desktop"
            style={{ width: 34, height: 34, padding: 0 }}
            aria-label="Toggle mobile menu"
          >
            {mobileNavOpen ? <X style={{ width: 16, height: 16 }} /> : <Menu style={{ width: 16, height: 16 }} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <nav
          className="hide-desktop sketch-card-static"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            padding: 14,
            fontFamily: 'var(--font-hand)',
            fontSize: 20
          }}
        >
          {primaryLinks.map((item) => {
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
                <IconComponent style={{ width: 18, height: 18 }} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0', opacity: 0.3 }} />
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-dim)', paddingLeft: 4 }}>
            Archaeologist Tools
          </div>

          {toolLinks.map((tool) => {
            const ToolIcon = tool.icon;
            const active = router.pathname === tool.href;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                onClick={() => setMobileNavOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  textDecoration: 'none',
                  color: 'var(--color-ink)',
                  fontWeight: active ? 700 : 500,
                  fontSize: 18
                }}
              >
                <ToolIcon style={{ width: 16, height: 16 }} />
                <span>{tool.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
