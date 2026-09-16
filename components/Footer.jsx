import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ marginTop: 48, paddingTop: 28, borderTop: '2px solid rgba(17, 17, 17, 0.15)', color: 'var(--color-ink)' }}>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            className="sketch-btn"
            style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-hand)', fontWeight: 800, fontSize: 16 }}
          >
            DG
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: 20, fontWeight: 700, margin: 0 }}>Digital Graveyard Archive</p>
            <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(17, 17, 17, 0.6)', margin: 0 }}>Preservation Library • Est. 2024</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20, fontFamily: 'var(--font-hand)', fontSize: 18 }}>
          <Link href="/browse" style={{ textDecoration: 'none', color: 'inherit' }}>Collections</Link>
          <Link href="/browse/map" style={{ textDecoration: 'none', color: 'inherit' }}>Cartography Map</Link>
          <Link href="/workbench" style={{ textDecoration: 'none', color: 'inherit' }}>Archivist Workbench</Link>
          <Link href="/submit" style={{ textDecoration: 'none', color: 'inherit' }}>Submit Artifact</Link>
          <Link href="/leaderboard" style={{ textDecoration: 'none', color: 'inherit' }}>Leaderboard</Link>
          <Link href="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>Dashboard & Ledger</Link>
          <Link href="/simulator" style={{ textDecoration: 'none', color: 'inherit' }}>Sandbox</Link>
          <Link href="/about" style={{ textDecoration: 'none', color: 'inherit' }}>Manifesto</Link>
        </div>
      </div>

      <div className="sketch-divider" style={{ margin: '20px 0', opacity: 0.3 }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'rgba(17, 17, 17, 0.7)', gap: 8, paddingBottom: 8 }}>
        <p style={{ margin: 0 }}>A non-morbid preservation library for abandoned software ideas and open provenance records.</p>
        <p style={{ margin: 0, fontStyle: 'italic', fontFamily: 'var(--font-hand)', fontSize: 16, color: 'var(--color-ink)' }}>
          "Not forgotten. Just waiting."
        </p>
      </div>
    </footer>
  );
}
