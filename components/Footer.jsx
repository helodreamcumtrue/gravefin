import React from 'react';
import Link from 'next/link';
import Icon from './Icons';

export default function Footer() {
  return (
    <footer style={{ marginTop: 80, paddingBottom: 50 }}>
      <div className="container">
        <hr className="sketch-divider" style={{ margin: '0 0 36px' }} />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 20
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 28,
                height: 28,
                border: '1.8px solid var(--border)',
                borderRadius: '6px 6px 2px 2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#FFFFFF'
              }}
            >
              <Icon name="tombstone" size={16} />
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>
              Digital Graveyard
            </span>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: 24, fontSize: 14, fontWeight: 600 }}>
            <Link href="/browse" style={{ color: 'var(--text)' }}>Explore</Link>
            <Link href="/about" style={{ color: 'var(--text)' }}>About & Manifesto</Link>
            <Link href="/submit" style={{ color: 'var(--text)' }}>Submit Project</Link>
            <Link href="/dashboard" style={{ color: 'var(--text)' }}>Community Ledger</Link>
            <Link href="/simulator" style={{ color: 'var(--text)' }}>Sandbox</Link>
          </div>

          {/* Tagline */}
          <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            Not forgotten. Just waiting.
          </div>
        </div>
      </div>
    </footer>
  );
}
