import React, { useState } from 'react';
import Icon from '../components/Icons';

export default function About() {
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    {
      q: 'Why is there absolutely no in-app messaging or chat?',
      a: 'Chat introduces social pressure, off-platform deal-making, harassment, and subjective disputes. By eliminating communication channels entirely, both parties work blind against system-enforced rules and deliverables.'
    },
    {
      q: 'How does the points-based escrow work?',
      a: 'When an Owner approves a Taker, the required credits (e.g. 100 credits) are locked from the Taker into escrow. If the Taker finishes the work and it is verified, their stake is refunded and they earn an additional 100 reward credits. If they ghost for 14 days, the stake automatically forfeits to the Owner.'
    },
    {
      q: 'What prevents an Owner from refusing to verify to steal free work?',
      a: 'The 7-day automated review timer. If an Owner receives submitted work and fails to verify or act within 7 days, the system automatically marks the project completed, refunds the Taker, grants the completion reward, and penalizes the Owner with a -10 reputation strike.'
    },
    {
      q: 'What happens if someone racks up ghost strikes?',
      a: 'Every time a user ghosts or violates protocol deadlines, they receive +1 ghost strike. Upon accumulating 3 ghost strikes, the account is automatically banned from creating new listings or claiming projects.'
    },
    {
      q: 'Why are all usernames replaced with Digger-#### aliases?',
      a: 'To guarantee adversarial safety. Neither side ever knows who the other person is, removing bias, reputation exploitation, and identity theft risks entirely.'
    },
    {
      q: 'Is real money involved in the MVP?',
      a: 'No. The campus MVP uses an internal credit economy. This eliminates payment processor overhead, legal licensing, and escrow escrow liability while still providing authentic skin in the game.'
    }
  ];

  return (
    <div className="container" style={{ padding: '40px 0 80px', maxWidth: 840 }}>
      {/* Title */}
      <div style={{ marginBottom: 36, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: '#FFFFFF', border: '1.8px solid var(--border)', borderRadius: '20px', fontSize: 12, fontWeight: 700, marginBottom: 14, boxShadow: '1.5px 1.5px 0px #141414' }}>
          <Icon name="tombstone" size={13} /> The Digital Graveyard Protocol
        </div>
        <h1 className="font-display" style={{ fontSize: 36, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.03em' }}>
          The Trustless Graveyard Manifesto
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.65, margin: '0 auto', maxWidth: 640 }}>
          Every year, thousands of hackathon builds, side projects, and startup MVPs quietly die.
          Not because the code was bad, but because two strangers could never safely trust each other to finish it.
        </p>
      </div>

      {/* The Two Fears Cards */}
      <div
        className="card"
        style={{
          padding: 28,
          marginBottom: 36,
          background: '#FFFFFF',
          borderRadius: '18px',
          boxShadow: '3px 4px 0px #141414'
        }}
      >
        <h3 className="font-display" style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          The Two Unsolved Fears We Remove
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <div
            style={{
              padding: 20,
              background: '#F4EFE6',
              border: '2px solid var(--border)',
              borderRadius: '14px',
              boxShadow: '1.5px 2px 0px #141414'
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 8, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>💀 1. The Owner&apos;s Fear</span>
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
              &ldquo;If I give a stranger my repository, will they disappear, submit junk, or steal my hard work?&rdquo;
            </p>
            <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: '#141414' }}>
              ✓ Solved by Taker Credit Staking & automatic forfeiture.
            </div>
          </div>

          <div
            style={{
              padding: 20,
              background: '#F4EFE6',
              border: '2px solid var(--border)',
              borderRadius: '14px',
              boxShadow: '1.5px 2px 0px #141414'
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 8, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🛠️ 2. The Builder&apos;s Fear</span>
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
              &ldquo;If I put in 20 hours of real work, will the owner ghost me and refuse to release my reward?&rdquo;
            </p>
            <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: '#1E6B3E' }}>
              ✓ Solved by 7-Day Auto-Release & Owner reputation strikes.
            </div>
          </div>
        </div>
      </div>

      {/* Core Differentiators Table */}
      <div style={{ marginBottom: 40 }}>
        <h2 className="font-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, letterSpacing: '-0.02em' }}>
          Architectural Differentiators
        </h2>
        <div
          className="card"
          style={{
            overflow: 'hidden',
            background: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '3px 4px 0px #141414'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F4EFE6', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '14px 18px', width: '45%', color: 'var(--text-muted)', fontWeight: 800 }}>Traditional Marketplaces</th>
                <th style={{ padding: '14px 18px', color: 'var(--text)', fontWeight: 800 }}>Digital Graveyard Protocol</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1.5px dotted var(--border)' }}>
                <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>Public profiles, resumes, ratings & social links</td>
                <td style={{ padding: '14px 18px', fontWeight: 700 }}>Pure alias (Digger-####) + deterministic ledger reputation</td>
              </tr>
              <tr style={{ borderBottom: '1.5px dotted var(--border)' }}>
                <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>Subjective human customer support disputes</td>
                <td style={{ padding: '14px 18px', fontWeight: 700 }}>Fixed, automated deterministic penalty timers</td>
              </tr>
              <tr style={{ borderBottom: '1.5px dotted var(--border)' }}>
                <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>Credit card fees, chargebacks & banking custody</td>
                <td style={{ padding: '14px 18px', fontWeight: 700 }}>Closed-loop credit economy with blind escrow staking</td>
              </tr>
              <tr style={{ borderBottom: '1.5px dotted var(--border)' }}>
                <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>Chat-based negotiation & interpersonal pressure</td>
                <td style={{ padding: '14px 18px', fontWeight: 700 }}>Zero in-app chat — system state machine mediates all handoffs</td>
              </tr>
              <tr>
                <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>Trusting an unknown stranger</td>
                <td style={{ padding: '14px 18px', fontWeight: 800, color: '#1E6B3E' }}>Trusting immutable code and automated state rules</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div>
        <h2 className="font-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 18, letterSpacing: '-0.02em' }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((f, idx) => (
            <div
              key={idx}
              className="card"
              style={{
                borderRadius: '14px',
                overflow: 'hidden',
                background: '#FFFFFF',
                boxShadow: openFaq === idx ? '2px 3px 0px #141414' : '1px 2px 0px #141414'
              }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                style={{
                  width: '100%',
                  background: openFaq === idx ? '#F4EFE6' : '#FFFFFF',
                  border: 'none',
                  color: 'var(--text)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  textAlign: 'left',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
              >
                <span>{f.q}</span>
                <Icon name={openFaq === idx ? 'close' : 'chevronDown'} size={16} />
              </button>
              {openFaq === idx && (
                <div style={{ padding: '16px 20px', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65, borderTop: '1.5px solid var(--border)' }}>
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
