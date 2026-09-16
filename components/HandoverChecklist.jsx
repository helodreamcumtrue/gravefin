import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Circle,
  Award,
  Sparkles,
  Send,
  FileText,
  Sprout,
  TreeDeciduous
} from 'lucide-react';

export default function HandoverChecklist({ project }) {
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

  const [growthStage, setGrowthStage] = useState('sapling'); // 'tombstone' | 'sapling' | 'tree'
  const [isCompleted, setIsCompleted] = useState(false);

  const [messages, setMessages] = useState([
    { id: 1, sender: 'Original Creator', text: 'Transfer documentation PDF generated and linked below.', time: '10:30 AM' },
    { id: 2, sender: 'Reviving Adopter', text: 'Confirmed repo write access. Running local test suite now.', time: '11:15 AM' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const toggleStep = (stepId, roleKey) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        const updated = { ...s, [roleKey]: !s[roleKey] };
        if (updated.ownerConfirmed && updated.adopterConfirmed && !s.completedAt) {
          updated.completedAt = new Date().toISOString();
        }
        return updated;
      })
    );
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
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'You',
        text: newMessage.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setNewMessage('');
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
          <button
            onClick={triggerRevivalCelebration}
            className="sketch-btn"
            style={{
              padding: '6px 16px',
              fontFamily: 'var(--font-hand)',
              fontSize: 18,
              fontWeight: 700,
              gap: 8,
              marginTop: 4
            }}
          >
            <Sparkles style={{ width: 16, height: 16, color: 'var(--color-ink)' }} />
            <span>Simulate Full Handover Sign-Off</span>
          </button>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button
                        onClick={() => toggleStep(step.id, 'ownerConfirmed')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '3px 8px',
                          borderRadius: 4,
                          border: '1.5px solid var(--color-ink)',
                          backgroundColor: step.ownerConfirmed ? 'var(--color-ink)' : 'transparent',
                          color: step.ownerConfirmed ? 'var(--color-paper)' : 'var(--color-ink)',
                          cursor: 'pointer',
                          fontWeight: step.ownerConfirmed ? 700 : 500
                        }}
                      >
                        {step.ownerConfirmed ? <CheckCircle2 style={{ width: 13, height: 13 }} /> : <Circle style={{ width: 13, height: 13 }} />}
                        <span>Owner Sign</span>
                      </button>

                      <button
                        onClick={() => toggleStep(step.id, 'adopterConfirmed')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '3px 8px',
                          borderRadius: 4,
                          border: '1.5px solid var(--color-ink)',
                          backgroundColor: step.adopterConfirmed ? 'var(--color-ink)' : 'transparent',
                          color: step.adopterConfirmed ? 'var(--color-paper)' : 'var(--color-ink)',
                          cursor: 'pointer',
                          fontWeight: step.adopterConfirmed ? 700 : 500
                        }}
                      >
                        {step.adopterConfirmed ? <CheckCircle2 style={{ width: 13, height: 13 }} /> : <Circle style={{ width: 13, height: 13 }} />}
                        <span>Adopter Sign</span>
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
              placeholder="Append audit log entry / proof..."
              className="sketch-input"
              style={{ flex: 1, padding: '6px 10px', fontSize: 11.5, fontFamily: 'var(--font-mono)' }}
            />
            <button type="submit" className="sketch-btn" style={{ padding: '6px 12px' }} title="Append Entry">
              <Send style={{ width: 14, height: 14 }} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
