import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useApp } from '../context/AppContext';
import LedgerTable from '../components/LedgerTable';
import Icon from '../components/Icons';
import { getLocalProjects } from '../lib/mockFallback';

export default function Dashboard() {
  const router = useRouter();
  const { currentUser, refreshUser, addToast } = useApp();
  const [tab, setTab] = useState('overview');
  const [userData, setUserData] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (router.query.tab) {
      setTab(router.query.tab);
    }
    if (router.query.connected === 'github') {
      addToast('GitHub account successfully linked!', 'success');
      if (refreshUser) refreshUser();
    }
    if (router.query.error === 'github_already_linked') {
      addToast('This GitHub account is already linked to another user.', 'error');
    }
  }, [router.query, addToast, refreshUser]);

  useEffect(() => {
    if (currentUser) {
      loadDashboard();
    }
  }, [currentUser]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      // 1. Fetch user projects & commitments
      const res = await fetch('/api/users/me', {
        headers: { 'x-user-id': currentUser.id }
      });
      if (res.ok) {
        const data = await res.json();
        setUserData(data);

        // 2. Fetch immutable ledger entries
        const ledgerRes = await fetch('/api/users/me/ledger', {
          headers: { 'x-user-id': currentUser.id }
        });
        if (ledgerRes.ok) {
          const ledgerData = await ledgerRes.json();
          setLedger(ledgerData.ledger || []);
        }
        setLoading(false);
        return;
      }
    } catch (err) {
      // Handled in demo fallback below
    }

    // Static / GitHub Pages fallback
    const allProjects = getLocalProjects();
    const owned = allProjects.filter(p => p.ownerId === currentUser.id);
    const userCommitments = [];
    allProjects.forEach(p => {
      (p.commitments || []).forEach(c => {
        if (c.takerId === currentUser.id) {
          userCommitments.push({ ...c, project: p });
        }
      });
    });
    setUserData({
      user: currentUser,
      ownedProjects: owned,
      commitments: userCommitments
    });
    setLedger([
      { id: 'l1', type: 'REWARD_CREDIT', amount: 500, createdAt: new Date(Date.now() - 20 * 86400000).toISOString(), notes: 'Genesis builder grant' },
      { id: 'l2', type: 'REWARD_CREDIT', amount: 150, createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), notes: 'Platform milestone reward' }
    ]);
    setLoading(false);
  };

  if (!currentUser) {
    return (
      <div className="container" style={{ padding: '70px 0 90px', maxWidth: 480, textAlign: 'center' }}>
        <div className="card" style={{ padding: 36, borderRadius: '18px', background: '#FFFFFF', border: '2px solid var(--border)', boxShadow: '3px 4px 0px #141414' }}>
          <div style={{ width: 48, height: 48, border: '2px solid var(--border)', borderRadius: '12px 12px 6px 6px', background: '#FAF8F4', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: '2px 2px 0px #141414' }}>
            <Icon name="lock" size={22} />
          </div>
          <h2 className="font-display" style={{ fontSize: 26, fontWeight: 800, margin: '0 0 10px' }}>
            Authentication Required
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.5 }}>
            Access to your listed repositories, active escrow stakes, and immutable ledger requires an authenticated session.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href="/login" className="btn btn-primary btn-block" style={{ height: 42, borderRadius: '10px', fontSize: 14.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Log In with Email →
            </Link>
            <Link href="/signup" className="btn btn-secondary btn-block" style={{ height: 42, borderRadius: '10px', fontSize: 14.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Create Anonymous Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const ownedProjects = userData?.ownedProjects || [];
  const commitments = userData?.commitments || [];
  const activeCommitments = commitments.filter(c => ['PENDING_APPROVAL', 'ACTIVE', 'SUBMITTED'].includes(c.status));
  const pendingIncoming = ownedProjects.filter(p => p.status === 'PENDING_APPROVAL');
  const pendingVerifications = ownedProjects.filter(p => p.status === 'SUBMITTED');

  const navTabs = [
    { id: 'overview', label: 'Overview', icon: 'grid' },
    { id: 'owned', label: `My Listed Code (${ownedProjects.length})`, icon: 'layers', badge: pendingIncoming.length + pendingVerifications.length },
    { id: 'commitments', label: `My Claims & Work (${commitments.length})`, icon: 'lock', badge: activeCommitments.length },
    { id: 'ledger', label: `Escrow Ledger (${ledger.length})`, icon: 'activity' },
    { id: 'anonymity', label: 'Anonymity & Account', icon: 'shield' }
  ];

  return (
    <div className="container" style={{ padding: '36px 0 70px', display: 'grid', gridTemplateColumns: '250px 1fr', gap: 32, alignItems: 'start' }}>
      {/* Sidebar Tabs */}
      <aside className="hide-mobile">
        <div
          style={{
            position: 'sticky',
            top: 88,
            background: '#FFFFFF',
            border: '2px solid var(--border)',
            borderRadius: '16px',
            padding: '20px 16px',
            boxShadow: 'var(--shadow-sketch)'
          }}
        >
          <div style={{ padding: '0 4px 16px', borderBottom: '1.5px solid var(--border)', marginBottom: 14 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 800, letterSpacing: '0.04em' }}>
              Authenticated Alias
            </div>
            <div className="font-display" style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginTop: 3 }}>
              {currentUser.alias}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1E6B3E', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
              ★ {currentUser.reputation} Reputation
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {navTabs.map(t => (
              <div
                key={t.id}
                className={`sidebar-link ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name={t.icon} size={16} />
                  <span>{t.label}</span>
                </div>
                {t.badge > 0 && (
                  <span
                    style={{
                      background: tab === t.id ? '#FFFFFF' : '#141414',
                      color: tab === t.id ? '#141414' : '#FFFFFF',
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '10px'
                    }}
                  >
                    {t.badge}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div>
        {/* Mobile Tab Selector */}
        <select
          className="input hide-desktop"
          style={{ marginBottom: 20, height: 42, borderRadius: '12px' }}
          value={tab}
          onChange={e => setTab(e.target.value)}
        >
          {navTabs.map(t => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>

        {/* TAB 1: OVERVIEW */}
        {tab === 'overview' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.03em' }}>
                System Ledger & Activity
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
                Live balances, active escrows, and deterministic reputation standing for <strong>{currentUser.alias}</strong>.
              </p>
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
              <div className="card" style={{ padding: 20, background: '#FFFFFF' }}>
                <div style={{ color: 'var(--text)', marginBottom: 8 }}><Icon name="coin" size={20} /></div>
                <div className="font-display" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>
                  {currentUser.credits} cr
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginTop: 4 }}>Available Credits</div>
              </div>

              <div className="card" style={{ padding: 20, background: '#FFFFFF' }}>
                <div style={{ color: '#1E6B3E', marginBottom: 8 }}><Icon name="shield" size={20} /></div>
                <div className="font-display" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>
                  {currentUser.reputation}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginTop: 4 }}>Reputation Score</div>
              </div>

              <div className="card" style={{ padding: 20, background: '#FFFFFF' }}>
                <div style={{ color: currentUser.ghostStrikes > 0 ? '#9E1C1C' : 'var(--text-muted)', marginBottom: 8 }}>
                  <Icon name="alertTriangle" size={20} />
                </div>
                <div className="font-display" style={{ fontSize: 26, fontWeight: 800, color: currentUser.ghostStrikes > 0 ? '#9E1C1C' : 'var(--text)' }}>
                  {currentUser.ghostStrikes} / 3
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginTop: 4 }}>Ghost Strikes (3 = Ban)</div>
              </div>

              <div className="card" style={{ padding: 20, background: '#FFFFFF' }}>
                <div style={{ color: '#1A56DB', marginBottom: 8 }}><Icon name="lock" size={20} /></div>
                <div className="font-display" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>
                  {activeCommitments.length}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginTop: 4 }}>Active Claims</div>
              </div>
            </div>

            {/* Quick Actions Alerts */}
            {pendingIncoming.length > 0 && (
              <div
                className="surface2"
                style={{
                  padding: 18,
                  marginBottom: 20,
                  border: '2px solid var(--border)',
                  borderLeft: '6px solid #E8A24A',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: 'var(--shadow-sketch-sm)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14.5, color: '#9E5D00', fontFamily: 'var(--font-display)' }}>
                    Action Required: {pendingIncoming.length} Pending Claim Request
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                    An anonymous builder wants to claim your project. Review and approve to lock their stake.
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setTab('owned')}>
                  Review
                </button>
              </div>
            )}

            {pendingVerifications.length > 0 && (
              <div
                className="surface2"
                style={{
                  padding: 18,
                  marginBottom: 20,
                  border: '2px solid var(--border)',
                  borderLeft: '6px solid #1E6B3E',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: 'var(--shadow-sketch-sm)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14.5, color: '#1E6B3E', fontFamily: 'var(--font-display)' }}>
                    Action Required: Deliverable Ready for Review
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                    A builder has submitted completed code. Verify and approve to release escrow.
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setTab('owned')}>
                  Verify Work
                </button>
              </div>
            )}

            {/* Recent Ledger Feed */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 className="font-display" style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>
                  Recent Immutable Transactions
                </h3>
                <button className="btn btn-outline btn-sm" onClick={() => setTab('ledger')}>
                  Full Audit Log →
                </button>
              </div>
              <div className="card" style={{ padding: 18, background: '#FFFFFF' }}>
                <LedgerTable entries={ledger.slice(0, 5)} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY LISTED PROJECTS */}
        {tab === 'owned' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 className="font-display" style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
                  My Listed Codebases
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: '3px 0 0' }}>
                  Projects you uploaded to the graveyard.
                </p>
              </div>
              <Link href="/submit" className="btn btn-primary btn-sm">
                <Icon name="plus" size={14} /> Upload New Code
              </Link>
            </div>

            {ownedProjects.length === 0 ? (
              <div className="card" style={{ padding: 48, textAlign: 'center', background: '#FFFFFF' }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', border: '2px solid var(--border)', background: '#F4EFE6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Icon name="tombstone" size={24} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 6px' }}>No Listed Projects Yet</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: '0 0 16px' }}>You have not listed any abandoned codebases in the graveyard.</p>
                <Link href="/submit" className="btn btn-primary btn-sm">Upload an Abandoned Project</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {ownedProjects.map(p => {
                  const active = p.commitments?.[0];
                  return (
                    <div
                      key={p.id}
                      className="card"
                      style={{
                        padding: 22,
                        background: '#FFFFFF',
                        borderRadius: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)' }}>
                              {p.title}
                            </h3>
                            <span className={`badge-sketch badge-${p.status}`}>{p.status}</span>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 5 }}>
                            {p.category} · {p.completion}% complete · <strong>{p.stakeRequired} credits</strong> required stake
                          </div>
                        </div>

                        <Link href={`/project/${p.id}`} className="btn btn-secondary btn-sm">
                          Manage Project →
                        </Link>
                      </div>

                      {active && (
                        <div
                          style={{
                            marginTop: 14,
                            paddingTop: 12,
                            borderTop: '1.5px dotted var(--border)',
                            fontSize: 13,
                            color: 'var(--text-muted)'
                          }}
                        >
                          Active Builder: <strong style={{ color: 'var(--text)' }}>{active.taker?.alias}</strong> ({active.taker?.reputation} rep)
                          {active.status === 'PENDING_APPROVAL' && <span style={{ color: '#9E5D00', fontWeight: 700, marginLeft: 8 }}>(Pending your approval)</span>}
                          {active.status === 'SUBMITTED' && <span style={{ color: '#1E6B3E', fontWeight: 700, marginLeft: 8 }}>(Deliverable submitted for review!)</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MY COMMITMENTS */}
        {tab === 'commitments' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 className="font-display" style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
                My Claims & Work in Progress
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: '3px 0 0' }}>
                Codebases where your stake is locked in blind escrow.
              </p>
            </div>

            {commitments.length === 0 ? (
              <div className="card" style={{ padding: 48, textAlign: 'center', background: '#FFFFFF' }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', border: '2px solid var(--border)', background: '#F4EFE6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Icon name="lock" size={24} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 6px' }}>No Active Claims</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: '0 0 16px' }}>You have not claimed any projects in the graveyard yet.</p>
                <Link href="/browse" className="btn btn-primary btn-sm">Explore Graveyard Codebases</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {commitments.map(c => (
                  <div
                    key={c.id}
                    className="card"
                    style={{
                      padding: 22,
                      background: '#FFFFFF',
                      borderRadius: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)' }}>
                            {c.project?.title}
                          </h3>
                          <span className={`badge-sketch badge-${c.status}`}>{c.status}</span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 5 }}>
                          Owner: {c.project?.owner?.alias} · Stake Locked: <strong style={{ color: 'var(--text)' }}>{c.stakeLocked} cr</strong>
                        </div>
                      </div>

                      <Link href={`/project/${c.projectId}`} className="btn btn-secondary btn-sm">
                        View & Submit Work →
                      </Link>
                    </div>

                    {c.ghostDeadlineAt && c.status === 'ACTIVE' && (
                      <div
                        style={{
                          marginTop: 14,
                          paddingTop: 12,
                          borderTop: '1.5px dotted var(--border)',
                          fontSize: 12.5,
                          color: 'var(--text-muted)'
                        }}
                      >
                        ⏱️ Ghost Timeout Deadline: <strong>{new Date(c.ghostDeadlineAt).toLocaleDateString()}</strong> (Deliverable must be submitted before this deadline)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: IMMUTABLE AUDIT LEDGER */}
        {tab === 'ledger' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 className="font-display" style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
                Append-Only Escrow Ledger
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: '3px 0 0' }}>
                Cryptographic audit trail of all credit stake locks, refunds, rewards, and strike updates. No update or delete operations exist.
              </p>
            </div>

            <div className="card" style={{ padding: 20, background: '#FFFFFF' }}>
              <LedgerTable entries={ledger} />
            </div>
          </div>
        )}

        {/* TAB 5: ANONYMITY & ACCOUNT */}
        {tab === 'anonymity' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 className="font-display" style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
                Anonymity & Adversarial Guarantees
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: '3px 0 0' }}>
                How Digital Graveyard protects your privacy and enforces adversarial safety.
              </p>
            </div>

            <div className="card" style={{ padding: 26, background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label className="label">Public Network Identifier</label>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                  {currentUser.alias}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 3 }}>
                  This is the ONLY identifier returned across any API to owners or takers.
                </div>
              </div>

              <div style={{ borderTop: '1.5px dotted var(--border)', paddingTop: 14 }}>
                <label className="label">Registered Email (Private & Hidden)</label>
                <div style={{ fontSize: 14.5, color: 'var(--text)' }}>
                  {currentUser.email}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 3 }}>
                  Used strictly for authentication and abuse defense. Never exposed to other users or public endpoints.
                </div>
              </div>

              <div style={{ borderTop: '1.5px dotted var(--border)', paddingTop: 14 }}>
                <label className="label">Ghost Strike Standing</label>
                <div style={{ fontSize: 14.5, color: currentUser.ghostStrikes > 0 ? '#9E1C1C' : '#1E6B3E', fontWeight: 800 }}>
                  {currentUser.ghostStrikes} Strikes accrued (Account is {currentUser.banned ? 'RESTRICTED' : 'in Good Standing'})
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 3 }}>
                  3 strikes automatically restricts an account from creating new listings or claiming codebases.
                </div>
              </div>

              {/* Connected Git / GitHub Identity */}
              <div style={{ borderTop: '1.5px dotted var(--border)', paddingTop: 14 }}>
                <label className="label">Connected Git Identity (OAuth)</label>
                {currentUser.githubUsername || userData?.user?.githubUsername ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: '#24292F', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '1.5px 1.5px 0px #141414' }}>
                          <Icon name="github" size={20} />
                        </div>
                        <div>
                          <a
                            href={`https://github.com/${currentUser.githubUsername || userData?.user?.githubUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--text)', textDecoration: 'underline' }}
                          >
                            @{currentUser.githubUsername || userData?.user?.githubUsername}
                          </a>
                          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                            Verified GitHub OAuth Account
                          </div>
                        </div>
                      </div>
                      <span className="badge-sketch" style={{ background: '#DCFCE7', color: '#166534', border: '1.5px solid #166534', fontWeight: 700, fontSize: 12 }}>
                        ✓ Connected
                      </span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 8 }}>
                      Enables seamless 1-click GitHub login and cryptographic repo handover attestations.
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: '#FAF8F4', border: '1.5px solid var(--border)', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name="github" size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                            No Git account linked
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                            Connect GitHub for fast 1-click login and repo transfer attestations.
                          </div>
                        </div>
                      </div>
                      <a
                        href="/api/auth/github"
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, textDecoration: 'none', background: '#24292F', color: '#FFFFFF', border: '1.5px solid #141414', boxShadow: '1.5px 1.5px 0px #141414' }}
                      >
                        <Icon name="github" size={15} />
                        <span>Connect GitHub</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
