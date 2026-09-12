import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useApp } from '../context/AppContext';
import Icon from './Icons';

export default function Navbar() {
  const router = useRouter();
  const { currentUser, personas, switchPersona } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [personaOpen, setPersonaOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/browse');
    }
  };

  const navLinks = [
    { href: '/browse', label: 'Explore' },
    { href: '/about', label: 'About' },
    { href: '/submit', label: 'Submit' },
    { href: '/dashboard', label: 'Community' },
    { href: '/simulator', label: 'Sandbox' }
  ];

  return (
    <header
      style={{
        background: 'transparent',
        borderBottom: '2px solid var(--border)',
        padding: '14px 0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(250, 248, 244, 0.96)',
        backdropFilter: 'blur(6px)'
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <span
              style={{
                width: 32,
                height: 32,
                border: '2px solid var(--border)',
                borderRadius: '8px 8px 4px 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#FFFFFF',
                boxShadow: '1px 2px 0px #141414'
              }}
            >
              <Icon name="tombstone" size={18} />
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 18,
                letterSpacing: '-0.03em',
                color: 'var(--text)'
              }}
            >
              Digital Graveyard
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hide-mobile" style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            {navLinks.map(link => {
              const isActive = router.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontSize: 14.5,
                    fontWeight: isActive ? 800 : 500,
                    color: 'var(--text)',
                    borderBottom: isActive ? '2px solid var(--border)' : '2px solid transparent',
                    paddingBottom: 2,
                    cursor: 'pointer',
                    transition: 'border-color 0.15s'
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Search Bar & Profile Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Hand-drawn Search Bar from Reference */}
          <form onSubmit={handleSearchSubmit} className="hide-mobile" style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 11, top: 9, color: 'var(--text-dim)' }}>
              <Icon name="search" size={15} />
            </span>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                background: '#FFFFFF',
                border: '1.8px solid var(--border)',
                borderRadius: '8px',
                padding: '7px 12px 7px 32px',
                fontSize: 13,
                width: 220,
                outline: 'none',
                fontFamily: 'inherit',
                boxShadow: '1px 1.5px 0px rgba(0,0,0,0.15)'
              }}
            />
          </form>

          {/* User Persona Button & Dropdown */}
          {currentUser ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setPersonaOpen(o => !o)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#FFFFFF',
                  border: '1.8px solid var(--border)',
                  borderRadius: '20px',
                  padding: '4px 12px 4px 6px',
                  boxShadow: '1.5px 2px 0px #141414',
                  cursor: 'pointer'
                }}
                title="Active Digger Persona"
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: '1.5px solid var(--border)',
                    background: '#FAF8F4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Icon name="user" size={13} />
                </span>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{currentUser.alias}</span>
                <span className="tag-sketch" style={{ fontSize: 11, padding: '1px 6px' }}>
                  {currentUser.credits} cr
                </span>
              </button>

              {/* Persona Switcher Menu */}
              {personaOpen && (
                <div
                  className="modal-sketch"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 44,
                    width: 280,
                    padding: 16,
                    zIndex: 200,
                    borderRadius: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1.5px solid var(--border)', marginBottom: 10 }}>
                    <span style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase' }}>
                      Testing Personas
                    </span>
                    <button
                      onClick={() => setPersonaOpen(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {personas.map(p => {
                      const isSelected = p.id === currentUser.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            switchPersona(p.id);
                            setPersonaOpen(false);
                          }}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: isSelected ? '2px solid #141414' : '1px solid var(--border-soft)',
                            background: isSelected ? '#FAF8F4' : '#FFFFFF',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{p.alias}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                              {p.credits} cr · {p.reputation} rep
                            </div>
                          </div>
                          {isSelected && <span style={{ fontSize: 12, fontWeight: 800 }}>✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="btn-sketch btn-sketch-sm">
              Log In
            </Link>
          )}

          {/* Mobile Menu Icon */}
          <button
            className="hide-desktop"
            onClick={() => setMobileOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <Icon name={mobileOpen ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="hide-desktop"
          style={{
            padding: '16px 24px',
            borderTop: '2px solid var(--border)',
            background: '#FAF8F4',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}
        >
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{ fontWeight: 700, fontSize: 15 }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
