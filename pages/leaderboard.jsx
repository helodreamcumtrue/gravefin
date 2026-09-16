import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Trophy, Award, Sparkles, ShieldCheck } from 'lucide-react';

const FALLBACK_LEADERBOARD = [
  {
    rank: 1,
    alias: 'Digger-1042',
    handle: '@digger_chen',
    role: 'Chief Project Archaeologist',
    projectsRevived: 9,
    artifactsPreserved: 28,
    reputation: 140,
    badges: ['🏆 Chief Archaeologist', '⚡ Master Reviver', '🪦 Graveyard Keeper'],
  },
  {
    rank: 2,
    alias: 'Digger-2099',
    handle: '@alex_rivera',
    role: 'Lead Code Reviver',
    projectsRevived: 7,
    artifactsPreserved: 21,
    reputation: 125,
    badges: ['🏆 First Revival', '⚡ Fast Handover'],
  },
  {
    rank: 3,
    alias: 'Digger-7700',
    handle: '@chloe_zhao',
    role: 'Graveyard Curator',
    projectsRevived: 5,
    artifactsPreserved: 17,
    reputation: 130,
    badges: ['🪦 Graveyard Keeper', '🛡️ Zero Ghosting'],
  },
  {
    rank: 4,
    alias: 'Digger-3310',
    handle: '@elena_dev',
    role: 'Specimen Inspector',
    projectsRevived: 4,
    artifactsPreserved: 14,
    reputation: 95,
    badges: ['⚡ Fast Handover'],
  },
  {
    rank: 5,
    alias: 'Digger-5501',
    handle: '@marcus_vance',
    role: 'Excavation Scholar',
    projectsRevived: 3,
    artifactsPreserved: 11,
    reputation: 60,
    badges: ['📜 Field Researcher'],
  }
];

export default function LeaderboardPage() {
  const [leaderboards, setLeaderboards] = useState(FALLBACK_LEADERBOARD);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users/leaderboard')
      .then(res => res.json())
      .then(data => {
        if (data.leaderboard && data.leaderboard.length > 0) {
          setLeaderboards(data.leaderboard);
        }
      })
      .catch(() => {
        // Fallback to pre-seeded static rankings
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Head>
        <title>Graveyard Shift Leaderboard — Digital Graveyard</title>
        <meta name="description" content="Community preservation rankings and honors for top software project archaeologists." />
      </Head>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Header Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            paddingBottom: 16,
            borderBottom: '2px solid rgba(17, 17, 17, 0.12)',
            gap: 12
          }}
        >
          <div>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(17, 17, 17, 0.6)', display: 'block' }}>
              Community Preservation Rankings
            </span>
            <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: 38, fontWeight: 700, margin: '2px 0 0', color: 'var(--color-ink)' }}>
              GRAVEYARD SHIFT LEADERBOARD
            </h1>
          </div>

          <span className="sketch-tag" style={{ padding: '6px 14px', fontSize: 12.5, fontFamily: 'var(--font-mono)', fontWeight: 700, gap: 6 }}>
            <Trophy style={{ width: 16, height: 16, color: 'var(--color-ink)' }} />
            <span>Top Project Archaeologists</span>
          </span>
        </div>

        {/* Leaderboard Table Card */}
        <div className="sketch-card-static" style={{ padding: 24, overflowX: 'auto', backgroundColor: 'var(--color-paper)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-ink)', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-ink)', textTransform: 'uppercase' }}>
                <th style={{ paddingBottom: 12, paddingRight: 12 }}>Rank</th>
                <th style={{ paddingBottom: 12, paddingRight: 12 }}>Archaeologist</th>
                <th style={{ paddingBottom: 12, paddingRight: 12 }}>Role</th>
                <th style={{ paddingBottom: 12, paddingRight: 12, textAlign: 'center' }}>Revivals</th>
                <th style={{ paddingBottom: 12, paddingRight: 12, textAlign: 'center' }}>Reputation</th>
                <th style={{ paddingBottom: 12 }}>Key Badges</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: 13.5, fontFamily: 'var(--font-sans)' }}>
              {leaderboards.map((user) => (
                <tr
                  key={user.rank}
                  style={{
                    borderBottom: '1px solid rgba(17, 17, 17, 0.1)',
                    transition: 'background-color 0.15s'
                  }}
                >
                  <td style={{ padding: '16px 12px 16px 0', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 16 }}>
                    {user.rank === 1 ? '🥇 #1' : user.rank === 2 ? '🥈 #2' : user.rank === 3 ? '🥉 #3' : `#${user.rank}`}
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-ink)' }}>{user.alias}</div>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(17, 17, 17, 0.6)' }}>
                      {user.handle}
                    </span>
                  </td>
                  <td style={{ padding: '16px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(17, 17, 17, 0.85)' }}>
                    {user.role}
                  </td>
                  <td style={{ padding: '16px 12px', textAlign: 'center', fontWeight: 800, color: 'var(--color-ink)', fontSize: 15 }}>
                    {user.projectsRevived}
                  </td>
                  <td style={{ padding: '16px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    ★ {user.reputation}
                  </td>
                  <td style={{ padding: '16px 0' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {user.badges.map((badge, i) => (
                        <span key={i} className="sketch-tag" style={{ padding: '2px 7px', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                          {badge}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
