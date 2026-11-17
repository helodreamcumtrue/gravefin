import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import {
  CheckCircle2,
  Circle,
  Award,
  Sparkles,
  Send,
  FileText,
  Sprout,
  TreeDeciduous,
  Lock,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

export default function HandoverChecklist({ project, isOwner: propIsOwner, isTaker: propIsTaker, currentUser: propCurrentUser, activeCommitment }) {
  const { currentUser: ctxUser, addToast } = useApp();
  const currentUser = propCurrentUser !== undefined ? propCurrentUser : ctxUser;

  // Resilient role resolution
  const isOwner = propIsOwner !== undefined
    ? propIsOwner
    : Boolean(currentUser && project && currentUser.id === project.ownerId);

  const isTaker = propIsTaker !== undefined
    ? propIsTaker
    : Boolean(
        currentUser && (
          (activeCommitment && currentUser.id === activeCommitment.takerId) ||
          (project?.commitments && project.commitments.some(c => c.takerId === currentUser.id && ['PENDING_APPROVAL', 'ACTIVE', 'SUBMITTED', 'COMPLETED'].includes(c.status)))
        )
      );
  const [steps, setSteps] = useState([
    {
      id: 'step_1',
      title: 'Repository Access & Core Branch Transfer',
      description: 'Admin ownership of GitHub/GitLab repository transferred or invitation accepted by adopting maintainer.',
      ownerConfirmed: true,
      adopterConfirmed: true,
      completedAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'step_2',
      title: 'Domain & DNS Records Delegation',
      description: 'DNS zone delegation or Cloudflare/Vercel CNAME routing updated for production web assets.',
      ownerConfirmed: true,
      adopterConfirmed: false,
      completedAt: null
    },
    {
      id: 'step_3',
      title: 'Secrets, API Tokens & Environment Variables Handover',
      description: 'Database credentials, Stripe keys, and deployment webhooks securely re-issued and verified in transfer vault.',
      ownerConfirmed: false,
      adopterConfirmed: false,
      completedAt: null
    },
    {
      id: 'step_4',
      title: 'Provenance Block Signing & Final Escrow Release',
      description: 'Both parties sign the append-only ledger transaction, releasing locked stake collateral to the reviving Digger.',
      ownerConfirmed: false,
      adopterConfirmed: false,
      completedAt: null
    }
  ]);

  const [growthStage, setGrowthStage] = useState('tombstone'); // 'tombstone' | 'sapling' | 'tree'
  const [isCompleted, setIsCompleted] = useState(false);

  React.useEffect(() => {
    if (project?.status === 'COMPLETED') {
      setGrowthStage('tree');
      setIsCompleted(true);
      setSteps(prev => prev.map(s => ({
        ...s,
        ownerConfirmed: true,
        adopterConfirmed: true,
        completedAt: s.completedAt || new Date().toISOString()
      })));
    } else if (project?.status === 'SUBMITTED') {
      setGrowthStage('sapling');
      setIsCompleted(false);
      setSteps(prev => prev.map((s, idx) => ({
        ...s,
        ownerConfirmed: idx < 3,
        adopterConfirmed: idx < 3,
        completedAt: idx < 3 ? (s.completedAt || new Date().toISOString()) : null
      })));
    } else if (project?.status === 'ACTIVE') {
      setGrowthStage('sapling');
      setIsCompleted(false);
      setSteps(prev => prev.map((s, idx) => ({
        ...s,
        ownerConfirmed: idx === 0,
        adopterConfirmed: idx === 0,
        completedAt: idx === 0 ? (s.completedAt || new Date().toISOString()) : null
      })));
    } else {
      setGrowthStage('tombstone');
      setIsCompleted(false);
      setSteps(prev => prev.map(s => ({
        ...s,
        ownerConfirmed: false,
        adopterConfirmed: false,
        completedAt: null
      })));
    }
  }, [project?.status]);

  const [messages, setMessages] = useState([
    { id: 1, sender: 'Original Creator', text: 'Transfer documentation PDF generated and linked below.', time: '10:30 AM' },
    { id: 2, sender: 'Reviving Adopter', text: 'Confirmed repo write access. Running local test suite now.', time: '11:15 AM' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const toggleStep = (stepId, roleKey) => {
    if (!currentUser) {
      addToast('Authentication required: Sign in to sign protocol checkpoints.', 'error');
      return;
    }

    if (roleKey === 'ownerConfirmed') {
      if (!isOwner) {
        addToast('Permission Denied: Only the verified repository Owner can sign this checkpoint.', 'error');
        return;
      }
    } else if (roleKey === 'adopterConfirmed') {
      if (!isTaker) {
        addToast('Permission Denied: Only the committed Adopter/Taker can sign this checkpoint.', 'error');
        return;
      }
    }

    setSteps((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== stepId) return s;
        const nextVal = !s[roleKey];
        const nextOwner = roleKey === 'ownerConfirmed' ? nextVal : s.ownerConfirmed;
        const nextAdopter = roleKey === 'adopterConfirmed' ? nextVal : s.adopterConfirmed;
        const bothDone = nextOwner && nextAdopter;
        return {
          ...s,
          [roleKey]: nextVal,
          completedAt: bothDone ? (s.completedAt || new Date().toISOString()) : null
        };
      });

      const allDone = updated.every(s => s.ownerConfirmed && s.adopterConfirmed);
      if (allDone) {
        setGrowthStage('tree');
        setIsCompleted(true);
        try {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {
          // Confetti fallback
        }
        addToast('🎉 All dual checkpoints verified! Stewardship handover sealed.', 'success');
      } else {
        addToast(`${roleKey === 'ownerConfirmed' ? 'Owner' : 'Adopter'} signature updated.`, 'success');
      }

      return updated;
    });
  };

  const triggerRevivalCelebration = () => {
    setSteps((prev) =>
      prev.map((s) => ({
        ...s,
        ownerConfirmed: true,
        adopterConfirmed: true,
        completedAt: s.completedAt || new Date().toISOString()
      }))
    );
    setGrowthStage('tree');
    setIsCompleted(true);

    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // Confetti fallback
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    if (!currentUser) {
      addToast('Authentication required: Sign in to append an audit entry.', 'error');
      return;
    }
    if (!isOwner && !isTaker) {
      addToast('Access Restricted: Only active project stakeholders (Owner or Adopter) can append to the escrow audit log.', 'error');
      return;
    }

    const senderRole = isOwner ? 'Owner' : 'Adopter';
    const senderLabel = `${currentUser.alias || 'Participant'} (${senderRole})`;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: senderLabel,
        text: newMessage.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setNewMessage('');
    addToast('Audit log entry appended.', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Visual Metaphor Banner: Tombstone to Tree Transformation */}
      <div
        className="sketch-card-static"
        style={{
          padding: 24,
          textAlign: 'center',
          backgroundColor: 'rgba(244, 239, 230, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12
        }}
      >
        {/* Animated Graphic Stage */}
        <div style={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {growthStage === 'tombstone' && (
            <svg style={{ width: 56, height: 68, color: 'var(--color-ink)' }} stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 40 48">
              <path d="M 8 45 L 8 18 C 8 8, 32 8, 32 18 L 32 45" />
              <path d="M 4 45 L 36 45" />
              <path d="M 16 26 L 24 26 M 20 22 L 20 34" strokeWidth="2" />
            </svg>
          )}
          {growthStage === 'sapling' && (
            <Sprout style={{ width: 56, height: 56, color: '#15803d', strokeWidth: 2 }} />
          )}
          {growthStage === 'tree' && (
            <TreeDeciduous style={{ width: 68, height: 68, color: '#15803d', strokeWidth: 2 }} />
          )}
        </div>

        <div>
          <h2 style={{ fontFamily: 'var(--font-hand)', fontSize: 30, fontWeight: 700, margin: 0, color: 'var(--color-ink)' }}>
            {growthStage === 'tombstone' && 'Stewardship Transfer in Progress'}
            {growthStage === 'sapling' && 'Seeds of Revival Sprouting...'}
            {growthStage === 'tree' && '🎉 REVIVAL COMPLETE! Artifact Transformed.'}
          </h2>
          <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'rgba(17, 17, 17, 0.7)', maxWidth: 540, margin: '6px auto 0' }}>
            {growthStage === 'tree'
              ? 'The dead repository has bloomed into a living open-source project. Provenance ledger block recorded.'
              : 'Dual sign-off required by both Original Creator and Adopter to complete stewardship transfer.'}
          </p>
        </div>

        {!isCompleted && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'rgba(17, 17, 17, 0.75)', marginTop: 6 }}>
            <span className="sketch-tag" style={{ padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
              Protocol Stage: {project?.status || 'LISTED'}
            </span>
            <span>Dual-signing advances automatically as deliverables are submitted & verified</span>
          </div>
        )}
      </div>

      {/* Role Access Scope Notice */}
      <div
        className="sketch-card-static"
        style={{
          padding: '12px 18px',
          backgroundColor: isOwner
            ? 'rgba(232, 162, 74, 0.15)'
            : isTaker
            ? 'rgba(95, 179, 163, 0.15)'
            : 'rgba(17, 17, 17, 0.04)',
          border: '1.5px solid var(--color-ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          fontFamily: 'var(--font-mono)',
          fontSize: 12.5
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isOwner ? (
            <>
              <span style={{ fontSize: 16 }}>👑</span>
              <div>
                <strong style={{ color: 'var(--color-ink)' }}>Verified Role: Repository Owner</strong>
                <span style={{ color: 'rgba(17, 17, 17, 0.75)', display: 'block', fontSize: 11.5 }}>
                  You hold cryptographic signing rights for Owner checkpoints. Adopter sign checkpoints are restricted to the committed adopter.
                </span>
              </div>
            </>
          ) : isTaker ? (
            <>
              <span style={{ fontSize: 16 }}>🛠️</span>
              <div>
                <strong style={{ color: 'var(--color-ink)' }}>Verified Role: Committed Adopter</strong>
                <span style={{ color: 'rgba(17, 17, 17, 0.75)', display: 'block', fontSize: 11.5 }}>
                  You hold cryptographic signing rights for Adopter checkpoints. Owner sign checkpoints are restricted to the repository owner.
                </span>
              </div>
            </>
          ) : (
            <>
              <Lock style={{ width: 16, height: 16, color: 'var(--color-ink)' }} />
              <div>
                <strong style={{ color: 'var(--color-ink)' }}>Observer Mode (Read-Only)</strong>
                <span style={{ color: 'rgba(17, 17, 17, 0.75)', display: 'block', fontSize: 11.5 }}>
                  Dual-signing is strictly role-restricted. Only the repository Owner and assigned Adopter may sign checkpoints.
                </span>
              </div>
            </>
          )}
        </div>

        {!currentUser && (
          <a
            href={`/login?redirect=/project/${project?.id || ''}`}
            className="sketch-btn"
            style={{ padding: '4px 12px', fontSize: 11.5, fontWeight: 700, textDecoration: 'none' }}
          >
            Sign In to Verify Authority →
          </a>
        )}
      </div>

      {/* Main Handover Grid: Checklist & Telemetry Log */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24
        }}
      >
        {/* Checklist Steps Column */}
        <div className="sketch-card-static" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, gridColumn: 'span 2' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 12,
              borderBottom: '2px solid rgba(17, 17, 17, 0.12)'
            }}
          >
            <div>
              <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--color-ink)' }}>
                Transfer Protocol Checklist
              </h3>
              <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(17, 17, 17, 0.65)', margin: '2px 0 0' }}>
                Dual-confirmation required per step
              </p>
            </div>

            <span className="sketch-tag" style={{ padding: '3px 8px', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, gap: 4 }}>
              <FileText style={{ width: 13, height: 13 }} />
              <span>Legal Agreement</span>
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {steps.map((step, idx) => {
              const isDone = step.ownerConfirmed && step.adopterConfirmed;

              return (
                <div
                  key={step.id}
                  className="sketch-card-static"
                  style={{
                    padding: 16,
                    backgroundColor: isDone ? 'rgba(244, 239, 230, 0.4)' : 'var(--color-paper)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span
                        className="sketch-headstone"
                        style={{
                          width: 26,
                          height: 30,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          fontSize: 11,
                          flexShrink: 0
                        }}
                      >
                        0{idx + 1}
                      </span>
                      <div>
                        <h4 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14.5, margin: 0, color: 'var(--color-ink)' }}>
                          {step.title}
                        </h4>
                        <p style={{ fontSize: 12.5, color: 'rgba(17, 17, 17, 0.8)', lineHeight: 1.4, margin: '4px 0 0', fontFamily: 'var(--font-sans)' }}>
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {isDone && (
                      <span className="sketch-tag" style={{ padding: '2px 6px', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#15803d', gap: 3, flexShrink: 0 }}>
                        <Award style={{ width: 11, height: 11 }} />
                        <span>VERIFIED</span>
                      </span>
                    )}
                  </div>

                  {/* Dual Confirm Buttons */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      paddingTop: 10,
                      borderTop: '1px solid rgba(17, 17, 17, 0.1)',
                      fontSize: 11.5,
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      {/* Owner Sign Button */}
                      <button
                        type="button"
                        onClick={() => toggleStep(step.id, 'ownerConfirmed')}
                        disabled={!isOwner}
                        title={
                          isOwner
                            ? step.ownerConfirmed
                              ? 'Click to revoke Owner signature'
                              : 'Click to record Owner signature'
                            : 'Restricted: Only repository Owner can sign this step'
                        }
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          borderRadius: 4,
                          border: '1.5px solid var(--color-ink)',
                          backgroundColor: step.ownerConfirmed ? 'var(--color-ink)' : 'transparent',
                          color: step.ownerConfirmed ? 'var(--color-paper)' : 'var(--color-ink)',
                          cursor: isOwner ? 'pointer' : 'not-allowed',
                          opacity: isOwner ? 1 : 0.5,
                          fontWeight: step.ownerConfirmed ? 700 : 500,
                          fontSize: 11.5,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {step.ownerConfirmed ? (
                          <CheckCircle2 style={{ width: 13, height: 13 }} />
                        ) : !isOwner ? (
                          <Lock style={{ width: 12, height: 12 }} />
                        ) : (
                          <Circle style={{ width: 13, height: 13 }} />
                        )}
                        <span>Owner Sign</span>
                        {!isOwner && <span style={{ fontSize: 9.5, opacity: 0.8 }}>(Owner only)</span>}
                      </button>

                      {/* Adopter Sign Button */}
                      <button
                        type="button"
                        onClick={() => toggleStep(step.id, 'adopterConfirmed')}
                        disabled={!isTaker}
                        title={
                          isTaker
                            ? step.adopterConfirmed
                              ? 'Click to revoke Adopter signature'
                              : 'Click to record Adopter signature'
                            : 'Restricted: Only assigned Adopter can sign this step'
                        }
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          borderRadius: 4,
                          border: '1.5px solid var(--color-ink)',
                          backgroundColor: step.adopterConfirmed ? 'var(--color-ink)' : 'transparent',
                          color: step.adopterConfirmed ? 'var(--color-paper)' : 'var(--color-ink)',
                          cursor: isTaker ? 'pointer' : 'not-allowed',
                          opacity: isTaker ? 1 : 0.5,
                          fontWeight: step.adopterConfirmed ? 700 : 500,
                          fontSize: 11.5,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {step.adopterConfirmed ? (
                          <CheckCircle2 style={{ width: 13, height: 13 }} />
                        ) : !isTaker ? (
                          <Lock style={{ width: 12, height: 12 }} />
                        ) : (
                          <Circle style={{ width: 13, height: 13 }} />
                        )}
                        <span>Adopter Sign</span>
                        {!isTaker && <span style={{ fontSize: 9.5, opacity: 0.8 }}>(Adopter only)</span>}
                      </button>
                    </div>

                    {step.completedAt && (
                      <span style={{ fontSize: 10.5, color: 'rgba(17, 17, 17, 0.6)' }}>
                        Verified: {new Date(step.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audit Telemetry & Ledger Proof Log Column */}
        <div className="sketch-card-static" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 400 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 8, borderBottom: '2px solid rgba(17, 17, 17, 0.12)' }}>
              <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--color-ink)' }}>
                Handover Audit Log
              </h3>
              <span className="sketch-tag" style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 6px' }}>
                Zero Chat / Audit Only
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
              {messages.map((msg) => (
                <div key={msg.id} className="sketch-card-static" style={{ padding: 10, fontSize: 12, backgroundColor: 'var(--color-paper)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'rgba(17, 17, 17, 0.6)', marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-ink)' }}>{msg.sender}</span>
                    <span>{msg.time}</span>
                  </div>
                  <p style={{ margin: 0, fontFamily: 'var(--font-mono)', color: 'rgba(17, 17, 17, 0.9)', lineHeight: 1.35, fontSize: 11.5 }}>
                    {msg.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(17, 17, 17, 0.12)' }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={!isOwner && !isTaker}
              placeholder={
                !currentUser
                  ? 'Sign in as Owner or Adopter to append audit entries...'
                  : !isOwner && !isTaker
                  ? 'Observer Mode: Log appending restricted to Owner/Adopter...'
                  : 'Append audit log entry / verification proof...'
              }
              className="sketch-input"
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: 11.5,
                fontFamily: 'var(--font-mono)',
                opacity: (!isOwner && !isTaker) ? 0.6 : 1,
                cursor: (!isOwner && !isTaker) ? 'not-allowed' : 'text'
              }}
            />
            <button
              type="submit"
              disabled={!isOwner && !isTaker}
              className="sketch-btn"
              style={{
                padding: '6px 12px',
                opacity: (!isOwner && !isTaker) ? 0.5 : 1,
                cursor: (!isOwner && !isTaker) ? 'not-allowed' : 'pointer'
              }}
              title={(!isOwner && !isTaker) ? 'Restricted to Owner/Adopter' : 'Append Entry'}
            >
              <Send style={{ width: 14, height: 14 }} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function MilestoneTracker({ commitmentId, milestones = [], isTaker = false, onMilestoneUpdated }) {
  const { currentUser, addToast } = useApp();
  const [updating, setUpdating] = useState(null);

  const markComplete = async (mid) => {
    if (!currentUser) {
      addToast('Authentication required: Please log in to update milestones.', 'error');
      return;
    }
    if (!isTaker) {
      addToast('Permission Denied: Only the assigned Adopter/Taker can mark milestones as MET.', 'error');
      return;
    }

    try {
      setUpdating(mid);
      const res = await fetch(`/api/commitments/${commitmentId}/milestones/${mid}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        }
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

