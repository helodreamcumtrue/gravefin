import React from 'react';
import Link from 'next/link';
import Icon from '../components/Icons';

export default function Custom404() {
  return (
    <div className="container" style={{ padding: '80px 20px', textAlign: 'center', maxWidth: 540 }}>
      <div
        className="card"
        style={{
          padding: 40,
          background: '#FFFFFF',
          border: '2px solid var(--border)',
          borderRadius: '24px 24px 12px 12px',
          boxShadow: '4px 5px 0px #141414',
          margin: '0 auto'
        }}
      >
        <div
          style={{
            width: 64,
            height: 72,
            border: '2px solid var(--border)',
            borderRadius: '24px 24px 4px 4px',
            background: '#FAF8F4',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '3px 3px 0px #141414'
          }}
        >
          <Icon name="tombstone" size={34} />
        </div>

        <h1 className="font-display" style={{ fontSize: 32, fontWeight: 900, margin: '0 0 12px' }}>
          404 - Tombstone Not Found
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
          This path has been buried or does not exist in the digital graveyard. Explore active and listed dead codebases waiting for revival.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/browse" className="btn btn-primary" style={{ height: 42, padding: '0 24px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Icon name="compass" size={16} /> Browse Projects
          </Link>
          <Link href="/" className="btn btn-outline" style={{ height: 42, padding: '0 24px', display: 'inline-flex', alignItems: 'center' }}>
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
