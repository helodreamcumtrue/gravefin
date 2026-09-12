import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Icon from '../components/Icons';

export default function Simulator() {
  const { addToast, refreshUser } = useApp();
  const [daysElapsed, setDaysElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [cronLogs, setCronLogs] = useState([]);
  const [lastSummary, setLastSummary] = useState(null);

  const runCron = async (days = 0) => {
    try {
      setRunning(true);
      const res = await fetch('/api/cron/timeout-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: 'graveyard_secret_key',
          simulateDaysElapsed: days
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to trigger cron');

      setLastSummary(data);
      if (data.events && data.events.length > 0) {
        setCronLogs(prev => [...data.events, ...prev]);
        addToast(`Cron processed: ${data.events.length} system actions executed!`, 'success');
      } else {
        setCronLogs(prev => [
          `[CRON RUN @ ${new Date(data.effectiveDate).toLocaleDateString()}] No overdue timeouts detected. All active commitments healthy.`,
          ...prev
        ]);
        addToast('Cron check completed. No overdue timeouts detected.', 'info');
      }

      await refreshUser();
    } catch (err) {
      console.error(err);
      addToast(err.message, 'error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 0 80px', maxWidth: 920 }}>
      {/* Header */}
      <div style={{ marginBottom: 30 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: '#FFFFFF', border: '1.8px solid var(--border)', borderRadius: '20px', fontSize: 12, fontWeight: 700, marginBottom: 12, boxShadow: '1.5px 1.5px 0px #141414' }}>
          <Icon name="activity" size={13} /> Interactive Protocol Sandbox
        </div>
        <h1 className="font-display" style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.03em' }}>
          Protocol Simulator & Cron Console
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14.5, margin: 0, lineHeight: 1.6 }}>
          Project Graveyard relies on deterministic automated timers rather than human arbiters.
          Use this console to simulate time passing, trigger the daily cron verification job, and observe automatic forfeitures, refunds, and bans in real-time.
        </p>
      </div>

      {/* Control Panel Card */}
      <div
        className="card"
        style={{
          padding: 28,
          marginBottom: 28,
          background: '#FFFFFF',
          borderRadius: '18px',
          boxShadow: '3px 4px 0px #141414'
        }}
      >
        <h3 className="font-display" style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          Simulate Cron Timeouts
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 22 }}>
          <button
            className="btn btn-secondary"
            onClick={() => runCron(0)}
            disabled={running}
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 5,
              borderRadius: '14px',
              textAlign: 'left'
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              Check Today (+0 Days)
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.35 }}>
              Standard daily cron verification check at current timestamp.
            </div>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => runCron(8)}
            disabled={running}
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 5,
              borderRadius: '14px',
              textAlign: 'left'
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 14, color: '#9E5D00', fontFamily: 'var(--font-display)' }}>
              Fast-Forward +8 Days
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.35 }}>
              Triggers 7-day Owner ghost auto-completion & escrow release.
            </div>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => runCron(15)}
            disabled={running}
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 5,
              borderRadius: '14px',
              textAlign: 'left'
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 14, color: '#9E1C1C', fontFamily: 'var(--font-display)' }}>
              Fast-Forward +15 Days
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.35 }}>
              Triggers 14-day Builder ghost timeout & stake forfeiture.
            </div>
          </button>
        </div>

        {/* Custom Days Slider */}
        <div
          className="surface2"
          style={{
            padding: 20,
            borderRadius: '14px',
            border: '2px solid var(--border)',
            boxShadow: '1.5px 2px 0px #141414'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-display)' }}>
              Custom Time Travel: +{daysElapsed} Days
            </span>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => runCron(daysElapsed)}
              disabled={running}
            >
              {running ? 'Processing...' : `Run Cron at +${daysElapsed} Days →`}
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            value={daysElapsed}
            onChange={e => setDaysElapsed(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#141414', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-dim)', marginTop: 6, fontWeight: 600 }}>
            <span>Today (0d)</span>
            <span>7 Days (Owner timeout)</span>
            <span>14 Days (Builder ghost)</span>
            <span>30 Days (Cycle)</span>
          </div>
        </div>
      </div>

      {/* Live Event Output Log */}
      <div
        className="card"
        style={{
          padding: 26,
          marginBottom: 28,
          background: '#FFFFFF',
          borderRadius: '18px',
          boxShadow: '3px 4px 0px #141414'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 className="font-display" style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Automated Cron Execution Log
          </h3>
          {cronLogs.length > 0 && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setCronLogs([])}
              style={{ fontSize: 12 }}
            >
              Clear Log
            </button>
          )}
        </div>

        {cronLogs.length === 0 ? (
          <div
            style={{
              padding: '28px 16px',
              background: '#F4EFE6',
              border: '1.8px dashed var(--border)',
              borderRadius: '12px',
              fontSize: 13.5,
              color: 'var(--text-dim)',
              textAlign: 'center'
            }}
          >
            Click one of the simulation triggers above to run the cron verification job and inspect deterministic state transitions.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
            {cronLogs.map((log, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: log.includes('GHOST') ? '#FDE8E8' : log.includes('OWNER GHOST') ? '#EAF5ED' : '#F4EFE6',
                  border: '1.8px solid var(--border)',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  lineHeight: 1.5,
                  color: 'var(--text)',
                  boxShadow: '1px 1.5px 0px #141414'
                }}
              >
                {log}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deterministic Penalty Matrix Reference */}
      <div
        className="card"
        style={{
          padding: 26,
          background: '#FFFFFF',
          borderRadius: '18px',
          boxShadow: '3px 4px 0px #141414'
        }}
      >
        <h3 className="font-display" style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          Deterministic Penalty Matrix Reference (§4)
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F4EFE6', borderBottom: '2px solid var(--border)', color: 'var(--text)', fontWeight: 800 }}>
                <th style={{ padding: '10px 12px' }}>Event</th>
                <th style={{ padding: '10px 12px' }}>Stake Escrow</th>
                <th style={{ padding: '10px 12px' }}>Reputation</th>
                <th style={{ padding: '10px 12px' }}>Strikes</th>
                <th style={{ padding: '10px 12px' }}>Project State</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1.5px dotted var(--border)' }}>
                <td style={{ padding: '12px 10px', fontWeight: 600 }}>Taker ghosts (inactive &gt;14d)</td>
                <td style={{ padding: '12px 10px', color: '#9E1C1C', fontWeight: 700 }}>Forfeit → Owner</td>
                <td style={{ padding: '12px 10px', color: '#9E1C1C', fontWeight: 700 }}>Taker −20</td>
                <td style={{ padding: '12px 10px', fontWeight: 700 }}>Taker +1</td>
                <td style={{ padding: '12px 10px' }}>Relisted</td>
              </tr>
              <tr style={{ borderBottom: '1.5px dotted var(--border)' }}>
                <td style={{ padding: '12px 10px', fontWeight: 600 }}>Owner ghosts (no verify, &gt;7d)</td>
                <td style={{ padding: '12px 10px', color: '#1E6B3E', fontWeight: 700 }}>Refund + Reward</td>
                <td style={{ padding: '12px 10px', color: '#9E1C1C', fontWeight: 700 }}>Owner −10</td>
                <td style={{ padding: '12px 10px', fontWeight: 700 }}>Owner +1</td>
                <td style={{ padding: '12px 10px', color: '#1E6B3E', fontWeight: 700 }}>Closed (Completed)</td>
              </tr>
              <tr style={{ borderBottom: '1.5px dotted var(--border)' }}>
                <td style={{ padding: '12px 10px', fontWeight: 600 }}>Taker cancels pre-approval</td>
                <td style={{ padding: '12px 10px' }}>None</td>
                <td style={{ padding: '12px 10px', color: '#9E1C1C', fontWeight: 700 }}>Taker −2</td>
                <td style={{ padding: '12px 10px' }}>—</td>
                <td style={{ padding: '12px 10px' }}>Relisted</td>
              </tr>
              <tr style={{ borderBottom: '1.5px dotted var(--border)' }}>
                <td style={{ padding: '12px 10px', fontWeight: 600 }}>Owner cancels post-approval</td>
                <td style={{ padding: '12px 10px', color: '#1E6B3E', fontWeight: 700 }}>Refund → Taker</td>
                <td style={{ padding: '12px 10px', color: '#9E1C1C', fontWeight: 700 }}>Owner −5</td>
                <td style={{ padding: '12px 10px' }}>—</td>
                <td style={{ padding: '12px 10px' }}>Relisted</td>
              </tr>
              <tr style={{ borderBottom: '1.5px dotted var(--border)' }}>
                <td style={{ padding: '12px 10px', fontWeight: 600 }}>Plagiarism / Bad-Faith flagged</td>
                <td style={{ padding: '12px 10px', color: '#9E1C1C', fontWeight: 700 }}>Forfeit → Owner</td>
                <td style={{ padding: '12px 10px', color: '#9E1C1C', fontWeight: 700 }}>Taker −15</td>
                <td style={{ padding: '12px 10px' }}>—</td>
                <td style={{ padding: '12px 10px' }}>Relisted</td>
              </tr>
              <tr>
                <td style={{ padding: '12px 10px', fontWeight: 600 }}>Ghost Strikes ≥ 3</td>
                <td style={{ padding: '12px 10px' }}>—</td>
                <td style={{ padding: '12px 10px' }}>—</td>
                <td style={{ padding: '12px 10px', color: '#9E1C1C', fontWeight: 800 }}>≥ 3</td>
                <td style={{ padding: '12px 10px', color: '#9E1C1C', fontWeight: 800 }}>Account Banned / Restricted</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
