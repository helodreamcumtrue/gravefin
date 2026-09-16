import React from 'react';
import { Activity, AlertTriangle, Lightbulb } from 'lucide-react';

export default function AutopsyChart({ report }) {
  if (!report) {
    report = {
      declinePattern: 'Gradual Decline',
      peakPeriod: 'Q2 2024 (380 Commits)',
      ownerStatedReason: 'Core student maintainers graduated and relocated. Handing stewardship over to the community.',
      dataCorrelationNote: 'Commit velocity dropped sharply after semester finals. Zero unresolved architectural bugs.',
      recommendedRevivalPath: 'Update dependencies to React 18 / Next.js 14 and redeploy free-tier serverless demo.',
      activityTimeline: [
        { period: 'Q1 2024', commits: 180, contributors: 4 },
        { period: 'Q2 2024', commits: 380, contributors: 7, isPeak: true },
        { period: 'Q3 2024', commits: 110, contributors: 3 },
        { period: 'Q4 2024', commits: 30, contributors: 1 },
        { period: 'Q1 2025', commits: 0, contributors: 0 }
      ]
    };
  }

  const timeline = report.activityTimeline || [];
  const maxCommits = Math.max(...timeline.map((item) => item.commits), 1);

  return (
    <div className="sketch-card-static" style={{ padding: 24, position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          paddingBottom: 16,
          marginBottom: 20,
          borderBottom: '2px solid rgba(17, 17, 17, 0.12)',
          gap: 12
        }}
      >
        <div>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(17, 17, 17, 0.6)', display: 'block' }}>
            Signature Diagnostic
          </span>
          <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: 28, fontWeight: 700, margin: '2px 0 0', color: 'var(--color-ink)' }}>
            AUTOPSY REPORT
          </h3>
        </div>

        <div>
          <span
            className="sketch-tag"
            style={{
              padding: '4px 10px',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              gap: 6
            }}
          >
            <AlertTriangle style={{ width: 14, height: 14, color: 'var(--color-ink)' }} />
            <span>Pattern: {report.declinePattern || 'Gradual Maintainer Roll-Off'}</span>
          </span>
        </div>
      </div>

      {/* Activity Timeline Bar Chart */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'rgba(17, 17, 17, 0.7)', marginBottom: 8 }}>
          <span>Historical Activity Timeline (Commits / Period)</span>
          <span style={{ fontWeight: 700 }}>Peak: {report.peakPeriod}</span>
        </div>

        <div
          style={{
            height: 160,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 12,
            padding: '24px 16px 8px',
            borderBottom: '2px solid var(--color-ink)',
            borderLeft: '2px solid var(--color-ink)',
            backgroundColor: 'rgba(244, 239, 230, 0.4)',
            borderRadius: '0 0 8px 0'
          }}
        >
          {timeline.map((item) => {
            const heightPct = Math.round((item.commits / maxCommits) * 100);

            return (
              <div
                key={item.period}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  position: 'relative'
                }}
              >
                {item.isPeak && (
                  <span
                    className="sketch-tag"
                    style={{
                      fontSize: 9.5,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      padding: '1px 5px',
                      marginBottom: 2
                    }}
                  >
                    PEAK
                  </span>
                )}

                {/* Commit Bar */}
                <div
                  style={{
                    width: '100%',
                    maxWidth: 48,
                    height: `${Math.max(heightPct, 8)}%`,
                    backgroundColor: item.isPeak ? 'var(--color-ink)' : 'rgba(17, 17, 17, 0.7)',
                    border: '1.8px solid var(--color-ink)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.2s ease'
                  }}
                  title={`${item.commits} commits by ${item.contributors} contributor(s)`}
                />

                {/* Period Label */}
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(17, 17, 17, 0.8)', textAlign: 'center', marginTop: 4, whiteSpace: 'nowrap' }}>
                  {item.period}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Narrative Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontFamily: 'var(--font-sans)', fontSize: 13.5 }}>
        <div className="sketch-card-static" style={{ padding: 16, backgroundColor: 'var(--color-paper)' }}>
          <h4 style={{ fontFamily: 'var(--font-hand)', fontSize: 20, fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 6px' }}>
            Owner Postmortem
          </h4>
          <p style={{ color: 'rgba(17, 17, 17, 0.85)', lineHeight: 1.5, margin: 0 }}>
            {report.ownerStatedReason}
          </p>
        </div>

        <div style={{ padding: 14, borderLeft: '4px solid var(--color-ink)', backgroundColor: 'rgba(244, 239, 230, 0.5)' }}>
          <h4 style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-ink)' }}>
            <Activity style={{ width: 14, height: 14 }} />
            <span>Forensic Data Correlation</span>
          </h4>
          <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'rgba(17, 17, 17, 0.85)', lineHeight: 1.5, margin: 0 }}>
            {report.dataCorrelationNote}
          </p>
        </div>

        <div className="sketch-card-static" style={{ padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12, backgroundColor: 'var(--color-paper)' }}>
          <Lightbulb style={{ width: 20, height: 20, flexShrink: 0, marginTop: 2, color: 'var(--color-ink)' }} />
          <div>
            <h4 style={{ fontFamily: 'var(--font-hand)', fontSize: 20, fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 4px' }}>
              Recommended Revival Path
            </h4>
            <p style={{ color: 'rgba(17, 17, 17, 0.85)', lineHeight: 1.5, margin: 0, fontSize: 13 }}>
              {report.recommendedRevivalPath}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
