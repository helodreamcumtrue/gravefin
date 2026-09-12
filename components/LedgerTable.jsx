import React from 'react';
import Icon from './Icons';

export default function LedgerTable({ entries = [] }) {
  if (!entries || entries.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: '2px solid var(--border)',
            background: '#FAF8F4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '1.5px 2px 0px #141414'
          }}
        >
          <Icon name="activity" size={20} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>No ledger transactions recorded yet.</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 4 }}>
          Every stake lock, refund, penalty, and reward will be immutably recorded here.
        </div>
      </div>
    );
  }

  const getTypeBadge = (type) => {
    switch (type) {
      case 'STAKE_LOCK':
        return <span className="tag-sketch" style={{ background: '#FFF4E5', borderColor: '#9E5D00', color: '#9E5D00' }}>🔒 LOCK</span>;
      case 'STAKE_REFUND':
        return <span className="tag-sketch" style={{ background: '#EAF5ED', borderColor: '#1E6B3E', color: '#1E6B3E' }}>🔓 REFUND</span>;
      case 'STAKE_FORFEIT':
        return <span className="tag-sketch" style={{ background: '#FDE8E8', borderColor: '#9E1C1C', color: '#9E1C1C' }}>⚠️ FORFEIT</span>;
      case 'REWARD_CREDIT':
        return <span className="tag-sketch" style={{ background: '#EAF5ED', borderColor: '#1E6B3E', color: '#1E6B3E' }}>🎉 REWARD</span>;
      case 'REP_DELTA':
        return <span className="tag-sketch" style={{ background: '#E8F0FE', borderColor: '#1A56DB', color: '#1A56DB' }}>★ REP</span>;
      case 'GHOST_STRIKE':
        return <span className="tag-sketch" style={{ background: '#FDE8E8', borderColor: '#9E1C1C', color: '#9E1C1C' }}>🚫 STRIKE</span>;
      default:
        return <span className="tag-sketch">{type}</span>;
    }
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text)', fontSize: 12, fontWeight: 800 }}>
            <th style={{ padding: '10px 12px' }}>Timestamp</th>
            <th style={{ padding: '10px 12px' }}>Type</th>
            <th style={{ padding: '10px 12px' }}>Delta</th>
            <th style={{ padding: '10px 12px' }}>Audit Details</th>
            <th style={{ padding: '10px 12px' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(e => {
            const isPositive = e.amount > 0;
            const isNegative = e.amount < 0;

            return (
              <tr key={e.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <td style={{ padding: '12px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                  {new Date(e.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style={{ padding: '12px' }}>
                  {getTypeBadge(e.type)}
                </td>
                <td style={{ padding: '12px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                  <span style={{ color: isPositive ? 'var(--success)' : isNegative ? 'var(--error)' : 'var(--text)' }}>
                    {isPositive ? `+${e.amount}` : e.amount} cr
                  </span>
                </td>
                <td style={{ padding: '12px', color: 'var(--text-muted)', maxWidth: 360 }}>
                  {e.notes || 'System ledger entry'}
                </td>
                <td style={{ padding: '12px' }}>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: '2px 6px',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      background: '#FAF8F4'
                    }}
                  >
                    IMMUTABLE
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
