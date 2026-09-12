import React, { useState } from 'react';
import Icon from './Icons';
import { useApp } from '../context/AppContext';

export default function MilestoneTracker({ commitmentId, milestones = [], isTaker = false, onMilestoneUpdated }) {
  const { addToast } = useApp();
  const [updating, setUpdating] = useState(null);

  const markComplete = async (mid) => {
    try {
      setUpdating(mid);
      const res = await fetch(`/api/commitments/${commitmentId}/milestones/${mid}/complete`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update milestone');

      addToast(data.message || 'Milestone marked as MET', 'success');
      if (onMilestoneUpdated) onMilestoneUpdated();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setUpdating(null);
    }
  };

  if (!milestones || milestones.length === 0) {
    return (
      <div style={{ padding: '14px 18px', background: '#FFFFFF', border: '1.5px dashed var(--border-soft)', borderRadius: 10, fontSize: 13, color: 'var(--text-dim)' }}>
        No milestone checkpoints defined for this commitment.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {milestones.map((m, idx) => {
        const isMet = m.status === 'MET';
        const isMissed = m.status === 'MISSED';
        const isPending = m.status === 'PENDING';

        return (
          <div
            key={m.id}
            style={{
              padding: '14px 18px',
              background: '#FFFFFF',
              border: '2px solid var(--border)',
              borderRadius: '10px',
              boxShadow: '1.5px 2px 0px #141414',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '6px',
                  border: '1.8px solid var(--border)',
                  background: isMet ? '#EAF5ED' : isMissed ? '#FDE8E8' : '#FAF8F4',
                  color: isMet ? 'var(--success)' : isMissed ? 'var(--error)' : 'var(--text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 800
                }}
              >
                {isMet ? '✓' : idx + 1}
              </span>

              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                  {m.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                  Due: {new Date(m.dueAt).toLocaleDateString()} · Status: <span style={{ fontWeight: 700, color: isMet ? 'var(--success)' : isMissed ? 'var(--error)' : 'var(--text)' }}>{m.status}</span>
                  {m.missCount > 0 && ` (${m.missCount} missed warnings)`}
                </div>
              </div>
            </div>

            {isTaker && isPending && (
              <button
                className="btn-sketch btn-sketch-sm"
                onClick={() => markComplete(m.id)}
                disabled={updating === m.id}
              >
                {updating === m.id ? 'Updating...' : 'Mark as MET ✓'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
