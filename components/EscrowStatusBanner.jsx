import React from 'react';
import Icon from './Icons';

export default function EscrowStatusBanner({ status, activeCommitment, reviewTimeoutAt }) {
  const steps = [
    { key: 'LISTED', label: '1. Listed', desc: 'Awaiting claim' },
    { key: 'PENDING_APPROVAL', label: '2. Claimed', desc: 'Owner review' },
    { key: 'ACTIVE', label: '3. Blind Escrow', desc: 'Stake locked (14d limit)' },
    { key: 'SUBMITTED', label: '4. Submitted', desc: '7d verify window' },
    { key: 'COMPLETED', label: '5. Revived', desc: 'Escrow released' }
  ];

  const getStepIndex = (st) => {
    switch (st) {
      case 'LISTED': return 0;
      case 'PENDING_APPROVAL': return 1;
      case 'ACTIVE': return 2;
      case 'SUBMITTED': return 3;
      case 'COMPLETED': return 4;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(status);

  // Calculate countdown days
  let countdownText = null;
  if (status === 'ACTIVE' && activeCommitment?.ghostDeadlineAt) {
    const diffDays = Math.ceil((new Date(activeCommitment.ghostDeadlineAt) - new Date()) / (1000 * 60 * 60 * 24));
    countdownText = diffDays > 0 ? `${diffDays} days left until ghost timeout` : 'Ghost timeout passed (pending cron)';
  } else if (status === 'SUBMITTED' && reviewTimeoutAt) {
    const diffDays = Math.ceil((new Date(reviewTimeoutAt) - new Date()) / (1000 * 60 * 60 * 24));
    countdownText = diffDays > 0 ? `${diffDays} days left for owner verification` : 'Verification window expired (auto-completion pending)';
  }

  return (
    <div
      className="card-sketch"
      style={{
        padding: '22px 24px',
        marginBottom: 28,
        background: '#FFFFFF'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <span style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-dim)', fontWeight: 800 }}>
            ESCROW LIFECYCLE PIPELINE
          </span>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              margin: '3px 0 0',
              fontSize: 18,
              fontWeight: 800,
              color: 'var(--text)'
            }}
          >
            Current State: <u>{status}</u>
          </h3>
        </div>

        {countdownText && (
          <span className="tag-sketch" style={{ background: '#FFF4E5', borderColor: '#9E5D00', color: '#9E5D00', fontSize: 13, fontWeight: 700 }}>
            <Icon name="clock" size={13} /> {countdownText}
          </span>
        )}
      </div>

      {/* Step Sequence in Hand-drawn Index Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12
        }}
      >
        {steps.map((s, idx) => {
          const isPassed = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div
              key={s.key}
              style={{
                padding: '10px 12px',
                border: isCurrent ? '2px solid #141414' : '1.5px solid var(--border-soft)',
                borderRadius: '8px',
                background: isCurrent ? '#FAF8F4' : '#FFFFFF',
                boxShadow: isCurrent ? '2px 2px 0px #141414' : 'none',
                opacity: isCurrent || isPassed ? 1 : 0.45
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: isCurrent ? 800 : 700, color: 'var(--text)' }}>
                {isPassed ? <span style={{ color: 'var(--success)' }}>✓</span> : null}
                <span>{s.label}</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>
                {s.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
