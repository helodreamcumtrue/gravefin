import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import EscrowStatusBanner from '../../components/EscrowStatusBanner';
import AutopsyChart, { CauseOfDeclineTags } from '../../components/AutopsyChart';
import ProvenanceTimeline from '../../components/ProvenanceTimeline';
import HandoverChecklist, { MilestoneTracker } from '../../components/HandoverChecklist';
import Icon from '../../components/Icons';
import { getLocalProjects, saveLocalProjects } from '../../lib/mockFallback';

export default function ProjectDetails({ projectId }) {
  const router = useRouter();
  const id = projectId || router.query.id;
  const { currentUser, personas, switchPersona, addToast, refreshUser } = useApp();

  const [project, setProject] = useState(null);
  const [activeCommitment, setActiveCommitment] = useState(null);
  const [userRole, setUserRole] = useState('GUEST');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submissionUrl, setSubmissionUrl] = useState('');

  const [flagModalOpen, setFlagModalOpen] = useState(false);

  useEffect(() => {
    if (id) fetchProjectDetail();
  }, [id, currentUser]);

  const fetchProjectDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${id}`, {
        headers: currentUser ? { 'x-user-id': currentUser.id } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
        setActiveCommitment(data.activeCommitment);
        setUserRole(data.userRole);
        return;
      }
    } catch (err) {
      // In static / GitHub Pages demo mode
    }

    // Fallback in static / GitHub Pages demo mode
    const allProjects = getLocalProjects();
    const target = allProjects.find(p => p.id === id) || allProjects[0];
    if (target) {
      setProject(target);
      const commitment = target.commitments?.[0] || null;
      setActiveCommitment(commitment);
      let role = 'GUEST';
      if (currentUser) {
        if (currentUser.id === target.ownerId) role = 'OWNER';
        else if (commitment && commitment.takerId === currentUser.id) role = 'TAKER';
      }
      setUserRole(role);
    }
    setLoading(false);
  };

  // 1. Taker claims project
  const handleCommit = async () => {
    if (!currentUser) {
      addToast('Please select or log in to a persona to claim a project', 'error');
      return;
    }
    if (currentUser.credits < (project?.stakeRequired || 0)) {
      addToast(`Insufficient credits. Required: ${project.stakeRequired}, Available: ${currentUser.credits}`, 'error');
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch(`/api/projects/${project.id}/commit`, {
        method: 'POST',
        headers: { 'x-user-id': currentUser.id }
      });
      if (res.ok) {
        addToast('Claim submitted! Awaiting owner approval to lock escrow.', 'success');
        await fetchProjectDetail();
        await refreshUser();
        return;
      }
    } catch (err) {
      // Handled in demo fallback below
    }

    // Fallback for static demo mode
    const allProjects = getLocalProjects();
    const updated = allProjects.map(p => {
      if (p.id === project.id) {
        return {
          ...p,
          status: 'PENDING_APPROVAL',
          commitments: [
            {
              id: `c-${Date.now()}`,
              projectId: p.id,
              takerId: currentUser.id,
              taker: currentUser,
              status: 'PENDING_APPROVAL',
              stakeLocked: 0,
              committedAt: new Date().toISOString()
            }
          ]
        };
      }
      return p;
    });
    saveLocalProjects(updated);
    addToast('Claim submitted! Awaiting owner approval (Demo Mode)', 'success');
    await fetchProjectDetail();
    setActionLoading(false);
  };

  // 2. Owner approves commitment
  const handleApprove = async () => {
    if (!currentUser) {
      addToast('Please log in to approve commitments', 'error');
      return;
    }
    if (!activeCommitment) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/projects/${project.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ commitmentId: activeCommitment.id })
      });
      if (res.ok) {
        const data = await res.json();
        addToast(data.message, 'success');
        await fetchProjectDetail();
        await refreshUser();
        return;
      }
    } catch (err) {
      // Handled in fallback
    }

    // Fallback for static demo mode
    const allProjects = getLocalProjects();
    const updated = allProjects.map(p => {
      if (p.id === project.id) {
        return {
          ...p,
          status: 'ACTIVE',
          commitments: (p.commitments || []).map(c => ({
            ...c,
            status: 'ACTIVE',
            stakeLocked: p.stakeRequired,
            approvedAt: new Date().toISOString(),
            ghostDeadlineAt: new Date(Date.now() + 14 * 86400000).toISOString()
          }))
        };
      }
      return p;
    });
    saveLocalProjects(updated);
    addToast('Commitment approved and escrow stake locked! (Demo Mode)', 'success');
    await fetchProjectDetail();
    setActionLoading(false);
  };

  // 3. Owner rejects commitment
  const handleReject = async () => {
    if (!currentUser) {
      addToast('Please log in first', 'error');
      return;
    }
    if (!activeCommitment) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/projects/${project.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ commitmentId: activeCommitment.id })
      });
      if (res.ok) {
        const data = await res.json();
        addToast(data.message, 'info');
        await fetchProjectDetail();
        return;
      }
    } catch (err) {
      // Handled in fallback
    }

    const allProjects = getLocalProjects();
    const updated = allProjects.map(p => {
      if (p.id === project.id) {
        return {
          ...p,
          status: 'LISTED',
          commitments: []
        };
      }
      return p;
    });
    saveLocalProjects(updated);
    addToast('Commitment rejected and project relisted (Demo Mode)', 'info');
    await fetchProjectDetail();
    setActionLoading(false);
  };

  // 4. Taker withdraws pre-approval
  const handleWithdraw = async () => {
    if (!currentUser) {
      addToast('Please log in first', 'error');
      return;
    }
    if (!activeCommitment) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/commitments/${activeCommitment.id}/withdraw`, {
        method: 'POST',
        headers: { 'x-user-id': currentUser.id }
      });
      if (res.ok) {
        const data = await res.json();
        addToast(data.message, 'info');
        await fetchProjectDetail();
        await refreshUser();
        return;
      }
    } catch (err) {
      // Handled in fallback
    }

    const allProjects = getLocalProjects();
    const updated = allProjects.map(p => {
      if (p.id === project.id) {
        return { ...p, status: 'LISTED', commitments: [] };
      }
      return p;
    });
    saveLocalProjects(updated);
    addToast('Commitment withdrawn (Demo Mode)', 'info');
    await fetchProjectDetail();
    setActionLoading(false);
  };

  // 5. Taker submits completed work
  const handleSubmitDeliverable = async () => {
    if (!currentUser) {
      addToast('Please log in first', 'error');
      return;
    }
    if (!activeCommitment) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/commitments/${activeCommitment.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          notes: submissionNotes,
          deliverableUrl: submissionUrl
        })
      });
      if (res.ok) {
        const data = await res.json();
        addToast(data.message, 'success');
        setSubmitModalOpen(false);
        await fetchProjectDetail();
        return;
      }
    } catch (err) {
      // Handled in fallback
    }

    const allProjects = getLocalProjects();
    const updated = allProjects.map(p => {
      if (p.id === project.id) {
        return {
          ...p,
          status: 'SUBMITTED',
          reviewTimeoutAt: new Date(Date.now() + 7 * 86400000).toISOString(),
          commitments: (p.commitments || []).map(c => ({
            ...c,
            status: 'SUBMITTED',
            submittedAt: new Date().toISOString(),
            submissionNotes,
            submissionUrl
          }))
        };
      }
      return p;
    });
    saveLocalProjects(updated);
    addToast('Deliverable submitted for review! (Demo Mode)', 'success');
    setSubmitModalOpen(false);
    await fetchProjectDetail();
    setActionLoading(false);
  };

  // 6. Owner verifies deliverable (approve or flagBadFaith)
  const handleVerify = async (decision) => {
    if (!currentUser) {
      addToast('Please log in first', 'error');
      return;
    }
    if (!activeCommitment) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/commitments/${activeCommitment.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ decision })
      });
      if (res.ok) {
        const data = await res.json();
        addToast(data.message, decision === 'approve' ? 'success' : 'warning');
        setFlagModalOpen(false);
        await fetchProjectDetail();
        await refreshUser();
        return;
      }
    } catch (err) {
      // Handled in fallback
    }

    const allProjects = getLocalProjects();
    const updated = allProjects.map(p => {
      if (p.id === project.id) {
        if (decision === 'approve') {
          return {
            ...p,
            status: 'COMPLETED',
            completion: 100,
            commitments: (p.commitments || []).map(c => ({
              ...c,
              status: 'COMPLETED',
              resolvedAt: new Date().toISOString()
            }))
          };
        } else {
          return {
            ...p,
            status: 'GHOSTED_RELISTED',
            commitments: (p.commitments || []).map(c => ({
              ...c,
              status: 'FLAGGED',
              resolvedAt: new Date().toISOString()
            }))
          };
        }
      }
      return p;
    });
    saveLocalProjects(updated);
    addToast(decision === 'approve' ? 'Work approved & stake released! (Demo Mode)' : 'Forfeited & relisted! (Demo Mode)', 'success');
    setFlagModalOpen(false);
    await fetchProjectDetail();
    setActionLoading(false);
  };

  // Download project source code
  const handleDownload = () => {
    if (project?.id) {
      window.location.href = `/api/projects/${project.id}/download`;
    } else {
      window.open('/downloads/source.zip', '_blank');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading codebase details...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <h2>Project not found</h2>
        <Link href="/browse" className="btn btn-outline" style={{ marginTop: 16 }}>
          Back to Browse
        </Link>
      </div>
    );
  }

  let tags = [];
  try {
    tags = typeof project.techTags === 'string' ? JSON.parse(project.techTags) : project.techTags || [];
  } catch (e) {
    tags = (project.techTags || '').split(',').map(s => s.trim()).filter(Boolean);
  }

  const isOwner = userRole === 'OWNER';
  const isTaker = userRole === 'TAKER';
  const isPending = activeCommitment?.status === 'PENDING_APPROVAL';
  const isActive = activeCommitment?.status === 'ACTIVE';
  const isSubmitted = activeCommitment?.status === 'SUBMITTED';
  const isCompleted = project.status === 'COMPLETED';

  return (
    <div className="container" style={{ padding: '36px 0 70px' }}>
      {/* Back button */}
      <Link
        href="/browse"
        className="btn btn-outline btn-sm"
        style={{ marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <Icon name="chevronLeft" size={15} /> Back to Graveyard
      </Link>

      {/* Escrow Pipeline Tracker */}
      <EscrowStatusBanner
        status={project.status}
        activeCommitment={activeCommitment}
        reviewTimeoutAt={project.reviewTimeoutAt}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 32, alignItems: 'start' }}>
        {/* Left Column: Codebase Details */}
        <div>
          {/* Hero Dossier Card */}
          <div
            className="card"
            style={{
              padding: 26,
              marginBottom: 20,
              position: 'relative',
              background: '#FFFFFF'
            }}
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <span className="chip" style={{ fontSize: 12 }}>
                <Icon name="tombstone" size={13} /> {project.category}
              </span>
              <span className="chip chip-accent" style={{ fontSize: 12 }}>
                🔒 {project.stakeRequired} credits stake
              </span>
              {project.milestoneMode && (
                <span className="chip chip-teal" style={{ fontSize: 12 }}>
                  ✓ Milestone Mode
                </span>
              )}
            </div>

            <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.03em' }}>
              {project.title}
            </h1>

            <div style={{ display: 'flex', gap: 14, fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span>Listed by <strong>{project.owner?.alias}</strong> ({project.owner?.reputation} rep)</span>
              <span>·</span>
              <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              borderBottom: '2px solid var(--border)',
              marginBottom: 22,
              paddingBottom: 4,
              overflowX: 'auto'
            }}
          >
            {[
              { id: 'overview', label: '📋 Overview & Specs' },
              { id: 'autopsy', label: '🔬 Autopsy & Diagnostics' },
              { id: 'handover', label: '🌱 Escrow & Handover' },
              { id: 'provenance', label: '📜 Provenance Ledger' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="btn-sketch-sm"
                style={{
                  background: activeTab === tab.id ? 'var(--accent)' : '#FFFFFF',
                  color: activeTab === tab.id ? '#FFFFFF' : 'var(--text)',
                  borderColor: 'var(--border)',
                  fontWeight: activeTab === tab.id ? 800 : 600,
                  fontSize: 13,
                  padding: '8px 14px',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  boxShadow: activeTab === tab.id ? 'none' : 'var(--shadow-sketch-sm)'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: OVERVIEW & SPECS */}
          {activeTab === 'overview' && (
            <div>
              {/* Completion Progress Gauge */}
              <div
                className="surface2"
                style={{
                  padding: 20,
                  marginBottom: 24,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  border: '2px solid var(--border)',
                  borderRadius: '16px',
                  boxShadow: 'var(--shadow-sketch-sm)'
                }}
              >
                <div
                  style={{
                    width: 66,
                    height: 66,
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    border: '2px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 17,
                    color: 'var(--text)',
                    boxShadow: '1.5px 2px 0px #141414',
                    flexShrink: 0
                  }}
                >
                  <span>{project.completion}%</span>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14.5, fontFamily: 'var(--font-display)' }}>
                    Scope Completion Estimate
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.45 }}>
                    Estimated working state of original scope. The anonymous builder must complete all remaining deliverables to successfully release escrow.
                  </p>
                </div>
              </div>

              {/* Description */}
              <div
                className="card"
                style={{
                  padding: 24,
                  marginBottom: 24,
                  background: '#FFFFFF'
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-display)', margin: '0 0 12px', color: 'var(--text)' }}>
                  About this codebase
                </h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--text-muted)', margin: 0, whiteSpace: 'pre-line' }}>
                  {project.description}
                </p>
              </div>

              {/* Tech Stack */}
              <div
                className="card"
                style={{
                  padding: 22,
                  marginBottom: 24,
                  background: '#FFFFFF'
                }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-display)', margin: '0 0 12px', color: 'var(--text)' }}>
                  Technologies & Frameworks
                </h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {tags.map(t => (
                    <span
                      key={t}
                      className="tag-sketch"
                      style={{ fontSize: 12.5, padding: '5px 12px', background: '#F4EFE6' }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Protocol Guarantee Box */}
              <div
                className="card"
                style={{
                  padding: 22,
                  background: '#F4EFE6',
                  border: '2px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Icon name="shield" size={17} />
                  <strong style={{ fontSize: 14.5, fontFamily: 'var(--font-display)' }}>System Enforced Trust Guarantees</strong>
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65 }}>
                  <li><strong>Zero Exposure:</strong> Neither party ever sees the other's real email, name, or contact details.</li>
                  <li><strong>Ghost Protection:</strong> If the builder stops working for 14 days, their stake is automatically forfeited to the owner and the project relists.</li>
                  <li><strong>Review Protection:</strong> If the owner fails to verify submitted work within 7 days, the system automatically awards the reward to the builder.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: AUTOPSY & DIAGNOSTICS */}
          {activeTab === 'autopsy' && (
            <div>
              {/* Cause of Decline Diagnostic Tags */}
              <div className="sketch-card-static" style={{ padding: 20, marginBottom: 24, backgroundColor: 'var(--color-paper)' }}>
                <CauseOfDeclineTags tags={project.autopsyReport?.causeOfDeclineTags} />
              </div>

              {/* Autopsy Report Forensic Diagnostic */}
              <div style={{ marginBottom: 24 }}>
                <AutopsyChart report={project.autopsyReport} />
              </div>
            </div>
          )}

          {/* TAB 3: ESCROW & HANDOVER */}
          {activeTab === 'handover' && (
            <div>
              {/* Stewardship Handover Protocol & Transformation */}
              <div style={{ marginBottom: 24 }}>
                <HandoverChecklist project={project} />
              </div>

              {/* Milestones Section */}
              {activeCommitment && activeCommitment.milestones && activeCommitment.milestones.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-display)', margin: 0, color: 'var(--text)' }}>
                      Milestone Checkpoints
                    </h3>
                    <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600 }}>
                      System-tracked milestones
                    </span>
                  </div>
                  <MilestoneTracker
                    commitmentId={activeCommitment.id}
                    milestones={activeCommitment.milestones}
                    isTaker={isTaker}
                    onMilestoneUpdated={fetchProjectDetail}
                  />
                </div>
              )}

              {/* Submitted Notes (if SUBMITTED) */}
              {activeCommitment?.submissionNotes && (
                <div
                  className="surface2"
                  style={{
                    padding: 20,
                    marginBottom: 24,
                    border: '2px solid var(--border)',
                    borderLeft: '6px solid var(--border)',
                    borderRadius: '12px'
                  }}
                >
                  <h4 style={{ margin: '0 0 8px', fontSize: 14.5, fontWeight: 800, color: 'var(--text)' }}>
                    Taker Deliverable Notes
                  </h4>
                  <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                    {activeCommitment.submissionNotes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PROVENANCE LEDGER */}
          {activeTab === 'provenance' && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <ProvenanceTimeline nodes={project.provenance} />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Escrow Actions & Role Pane */}
        <div>
          {/* Quick Role Switcher for Seamless Testing */}
          <div
            className="surface2"
            style={{
              padding: 14,
              borderRadius: 14,
              border: '2px dashed var(--border)',
              marginBottom: 16,
              background: '#FBF8F2'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>
                🎭 Quick Role Switcher
              </span>
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                Active: <strong style={{ color: 'var(--accent)' }}>{currentUser?.alias || 'Guest'}</strong>
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(personas || []).slice(0, 4).map(p => {
                const isCurr = currentUser?.id === p.id;
                const roleLabel = p.id === project.ownerId ? 'Owner' : (activeCommitment?.takerId === p.id ? 'Taker' : 'Builder');
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => switchPersona(p.id)}
                    className="btn-sketch-sm"
                    style={{
                      fontSize: 11,
                      padding: '4px 8px',
                      background: isCurr ? 'var(--accent)' : '#FFFFFF',
                      color: isCurr ? '#FFFFFF' : 'var(--text)',
                      borderColor: 'var(--border)',
                      cursor: 'pointer'
                    }}
                  >
                    {p.alias} ({roleLabel})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Card */}
          <div
            className="card"
            style={{
              padding: 24,
              position: 'sticky',
              top: 88,
              background: '#FFFFFF'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: '1.5px solid var(--border)' }}>
              <Icon name="lock" size={17} />
              <h3 className="font-display" style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>
                Escrow & Claim Actions
              </h3>
            </div>

            {/* CASE 1: Current User is OWNER */}
            {isOwner && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ padding: '10px 12px', background: 'rgba(232,162,74,.1)', borderRadius: 8, fontSize: 13, color: 'var(--accent)' }}>
                  👑 You own this project.
                </div>

                {/* A. Pending Commitment waiting for Owner Approval */}
                {isPending && activeCommitment && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      <strong>{activeCommitment.taker?.alias}</strong> ({activeCommitment.taker?.reputation} rep) requested to claim this project.
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: 0 }}>
                      Approving will lock <strong>{project.stakeRequired} credits</strong> from the taker in escrow and begin the 14-day work timer.
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-primary btn-block"
                        onClick={handleApprove}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Approving...' : 'Approve & Lock Stake'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={handleReject}
                        disabled={actionLoading}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}

                {/* B. Active work in progress */}
                {isActive && (
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                      Taker <strong>{activeCommitment.taker?.alias}</strong> is actively working off-platform.
                    </div>
                    <div className="chip chip-accent" style={{ marginBottom: 14 }}>
                      🔒 {activeCommitment.stakeLocked} credits locked in escrow
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: 0 }}>
                      Taker has until {new Date(activeCommitment.ghostDeadlineAt).toLocaleDateString()} to deliver completed code.
                    </p>
                  </div>
                )}

                {/* C. Work Submitted - Owner must verify */}
                {isSubmitted && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 13, color: 'var(--accent-2)', fontWeight: 600 }}>
                      🎉 Deliverable ready for your review!
                    </div>
                    <button className="btn btn-secondary btn-block" onClick={handleDownload}>
                      <Icon name="download" size={14} /> Download Deliverable
                    </button>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-primary btn-block"
                        onClick={() => handleVerify('approve')}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Releasing...' : 'Verify & Release (+100 cr)'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setFlagModalOpen(true)}
                        disabled={actionLoading}
                      >
                        Flag Bad-Faith
                      </button>
                    </div>
                  </div>
                )}

                {/* D. Project Completed */}
                {isCompleted && (
                  <div style={{ padding: '12px 14px', background: 'rgba(95,179,163,.15)', borderRadius: 10, fontSize: 13, color: 'var(--accent-2)' }}>
                    <Icon name="check" size={15} /> Project successfully revived and closed.
                  </div>
                )}

                {/* E. Listed with no commitments */}
                {!activeCommitment && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Your project is listed in Browse and waiting for an anonymous taker to stake credits.
                  </div>
                )}
              </div>
            )}

            {/* CASE 2: Current User is the TAKER */}
            {isTaker && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ padding: '10px 12px', background: 'rgba(95,179,163,.12)', borderRadius: 8, fontSize: 13, color: 'var(--accent-2)' }}>
                  🛠️ You are the committed builder for this codebase.
                </div>

                {/* A. Pending approval */}
                {isPending && (
                  <div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                      Your claim request has been sent to the owner. Once approved, your {project.stakeRequired} credits stake will be locked.
                    </p>
                    <button
                      className="btn btn-outline btn-sm btn-block"
                      onClick={handleWithdraw}
                      disabled={actionLoading}
                    >
                      Cancel Claim (-2 Rep Penalty)
                    </button>
                  </div>
                )}

                {/* B. Active work phase */}
                {isActive && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      Stake locked: <strong>{activeCommitment.stakeLocked} credits</strong>
                    </div>

                    <button className="btn btn-primary btn-block" onClick={handleDownload}>
                      <Icon name="download" size={15} /> Download Source Code (.zip)
                    </button>

                    <button
                      className="btn btn-teal btn-block"
                      onClick={() => setSubmitModalOpen(true)}
                    >
                      <Icon name="upload" size={15} /> Submit Completed Work
                    </button>

                    <div style={{ fontSize: 11.5, color: 'var(--text-dim)', textAlign: 'center' }}>
                      Work is blind and off-platform. Submit when finished to trigger the 7-day review window.
                    </div>
                  </div>
                )}

                {/* C. Submitted */}
                {isSubmitted && (
                  <div style={{ padding: '12px', background: 'rgba(232,162,74,.1)', borderRadius: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>
                      Awaiting Owner Verification
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Your deliverable is under review. If the owner ghosts, your stake will be refunded and your 100 reward credits awarded automatically.
                    </div>
                  </div>
                )}

                {/* D. Completed */}
                {isCompleted && (
                  <div style={{ padding: '12px', background: 'rgba(95,179,163,.15)', borderRadius: 10, fontSize: 13, color: 'var(--accent-2)' }}>
                    🎉 Completed! Your stake has been refunded and 100 reward credits credited to your ledger.
                  </div>
                )}
              </div>
            )}

            {/* CASE 3: GUEST / UNCOMMITTED USER */}
            {!isOwner && !isTaker && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {project.status === 'LISTED' ? (
                  <>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      Claim this abandoned project to finish it off-platform. Upon owner approval, your stake will be held in escrow until verification.
                    </div>

                    <div className="surface2" style={{ padding: 14, borderRadius: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                        <span>Required Stake:</span>
                        <strong style={{ color: 'var(--accent)' }}>{project.stakeRequired} cr</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                        <span>Completion Reward:</span>
                        <strong style={{ color: 'var(--accent-2)' }}>+100 cr (+15 rep)</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                        <span>Your Balance:</span>
                        <strong>{currentUser ? currentUser.credits : 0} cr</strong>
                      </div>
                    </div>

                    <button
                      className="btn btn-primary btn-block"
                      onClick={handleCommit}
                      disabled={actionLoading || (currentUser && currentUser.credits < project.stakeRequired)}
                    >
                      {actionLoading ? 'Claiming...' : `Commit ${project.stakeRequired} Credits Stake`}
                    </button>

                    {currentUser && currentUser.credits < project.stakeRequired && (
                      <div style={{ fontSize: 12, color: 'var(--error)', textAlign: 'center' }}>
                        You need {project.stakeRequired - currentUser.credits} more credits to claim this project.
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ padding: '14px', background: 'var(--surface-2)', borderRadius: 10, fontSize: 13, color: 'var(--text-dim)', textAlign: 'center' }}>
                    This project is currently claimed or in progress by an anonymous taker.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deliverable Submission Modal */}
      {submitModalOpen && (
        <div className="modal-backdrop" onClick={() => setSubmitModalOpen(false)}>
          <div className="modal-sketch" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 className="font-display" style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>
                Submit Completed Deliverable
              </h3>
              <button className="btn-icon btn-ghost" onClick={() => setSubmitModalOpen(false)}>
                <Icon name="close" size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.5 }}>
              Provide summary notes of what you built, fixed, or tested. The owner will have 7 days to verify.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">Completion Summary & Verification Notes *</label>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="Explain the changes made, tests executed, and how to run the completed app..."
                  value={submissionNotes}
                  onChange={e => setSubmissionNotes(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Deliverable Archive URL / Path</label>
                <input
                  className="input"
                  placeholder="/downloads/completed_deliverable.zip"
                  value={submissionUrl}
                  onChange={e => setSubmissionUrl(e.target.value)}
                />
              </div>

              <button
                className="btn btn-primary btn-block"
                style={{ marginTop: 10, padding: '12px' }}
                onClick={handleSubmitDeliverable}
                disabled={actionLoading || !submissionNotes.trim()}
              >
                {actionLoading ? 'Submitting...' : 'Submit Deliverable & Begin 7-Day Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flag Bad-Faith Modal */}
      {flagModalOpen && (
        <div className="modal-backdrop" onClick={() => setFlagModalOpen(false)}>
          <div className="modal-sketch" onClick={e => e.stopPropagation()}>
            <h3 className="font-display" style={{ fontSize: 19, fontWeight: 800, margin: '0 0 10px', color: '#9E1C1C' }}>
              Flag Bad-Faith / Plagiarized Submission
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 20 }}>
              Are you sure? Flagging bad-faith work will forfeit the builder's locked stake directly to you, apply a -15 reputation penalty to the builder, and relist this codebase in the graveyard.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setFlagModalOpen(false)}>
                Cancel
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleVerify('flagBadFaith')}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Confirm Forfeiture & Relist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export async function getStaticPaths() {
  const ids = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'p12'];
  return {
    paths: ids.map(id => ({ params: { id } })),
    fallback: process.env.GITHUB_PAGES === 'true' ? false : 'blocking'
  };
}

export async function getStaticProps({ params }) {
  return {
    props: {
      projectId: params.id
    }
  };
}

