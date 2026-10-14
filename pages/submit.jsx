import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useApp } from '../context/AppContext';
import Icon from '../components/Icons';
import { GitBranch, Code2 } from 'lucide-react';
import { getLocalProjects, saveLocalProjects } from '../lib/mockFallback';

const CATEGORIES = ['Web', 'Mobile', 'AI/ML', 'IoT', 'Game', 'Cybersecurity'];

export default function SubmitProject() {
  const router = useRouter();
  const { currentUser, personas, switchPersona, addToast } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Web');
  const [completion, setCompletion] = useState(30);
  const [techTags, setTechTags] = useState('React, Node.js, SQLite');
  const [stakeRequired, setStakeRequired] = useState(100);
  const [gitRepoUrl, setGitRepoUrl] = useState('');
  const [gitBranch, setGitBranch] = useState('main');
  const [milestoneMode, setMilestoneMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      addToast('Please select or log in to a persona to submit a project', 'error');
      return;
    }
    if (currentUser.banned) {
      addToast('Account restricted due to 3 ghost strikes. Project submission blocked.', 'error');
      return;
    }
    if (!title.trim() || !description.trim()) {
      addToast('Title and description are required', 'error');
      return;
    }
    if (!gitRepoUrl.trim()) {
      addToast('Git repository URL is required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const tagsArray = techTags.split(',').map(s => s.trim()).filter(Boolean);
      const cleanGitUrl = gitRepoUrl.trim();
      const repoSlug = cleanGitUrl.split('/').filter(Boolean).pop()?.replace('.git', '') || 'repository';
      const cleanBranch = gitBranch.trim() || 'main';
      const packageLabel = `${repoSlug}.git (${cleanBranch})`;

      try {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(currentUser ? { 'x-user-id': currentUser.id } : {})
          },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            category,
            completion: Number(completion),
            techTags: JSON.stringify(tagsArray),
            stakeRequired: Number(stakeRequired),
            fileName: packageLabel,
            fileUrl: cleanGitUrl,
            milestoneMode,
            githubRepoUrl: cleanGitUrl
          })
        });

        if (res.ok) {
          const data = await res.json();
          addToast('Project listed in the Graveyard successfully!', 'success');
          router.push(`/project/${data.project.id}`);
          return;
        }
      } catch (err) {
        // Handled in demo fallback below
      }

      // Demo fallback for GitHub Pages static export
      const newProj = {
        id: `p-${Date.now()}`,
        ownerId: currentUser.id,
        owner: currentUser,
        title: title.trim(),
        description: description.trim(),
        category,
        completion: Number(completion),
        techTags: JSON.stringify(tagsArray),
        stakeRequired: Number(stakeRequired),
        fileName: packageLabel,
        fileUrl: cleanGitUrl,
        milestoneMode,
        githubRepoUrl: cleanGitUrl,
        status: 'LISTED',
        createdAt: new Date().toISOString(),
        commitments: []
      };
      const allProjects = getLocalProjects();
      saveLocalProjects([newProj, ...allProjects]);
      addToast('Project listed in the Graveyard successfully! (Demo Mode)', 'success');
      router.push(`/project/${newProj.id}`);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="container" style={{ padding: '70px 0 90px', maxWidth: 480, textAlign: 'center' }}>
        <div className="card" style={{ padding: 36, borderRadius: '18px', background: '#FFFFFF', border: '2px solid var(--border)', boxShadow: '3px 4px 0px #141414' }}>
          <div style={{ width: 48, height: 48, border: '2px solid var(--border)', borderRadius: '12px 12px 6px 6px', background: '#FAF8F4', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: '2px 2px 0px #141414' }}>
            <Icon name="upload" size={22} />
          </div>
          <h2 className="font-display" style={{ fontSize: 26, fontWeight: 800, margin: '0 0 10px' }}>
            Authentication Required
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 20px', lineHeight: 1.5 }}>
            Listing an abandoned repository and configuring an escrow stake requirement requires an active account.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            <Link href="/login" className="btn btn-primary btn-block" style={{ height: 42, borderRadius: '10px', fontSize: 14.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Log In with Email →
            </Link>
            <Link href="/signup" className="btn btn-secondary btn-block" style={{ height: 42, borderRadius: '10px', fontSize: 14.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Create Anonymous Account
            </Link>
          </div>

          <div style={{ paddingTop: 16, borderTop: '1px dashed var(--border)' }}>
            <div style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8, letterSpacing: '0.05em' }}>
              Quick Persona Switch (Instant Testing)
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              {(personas || []).slice(0, 4).map(p => (
                <button
                  key={p.id}
                  type="button"
                  className="btn-sketch-sm"
                  onClick={() => switchPersona(p.id)}
                  style={{ fontSize: 11.5, padding: '4px 10px', cursor: 'pointer' }}
                >
                  {p.alias}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 0 80px', maxWidth: 720 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#FFFFFF', border: '1.8px solid var(--border)', borderRadius: '20px', fontSize: 12, fontWeight: 700, marginBottom: 12, boxShadow: '1.5px 1.5px 0px #141414' }}>
          <Icon name="tombstone" size={13} /> Project Intake Registry
        </div>
        <h1 className="font-display" style={{ fontSize: 32, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.03em' }}>
          Upload Abandoned Codebase
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14.5, margin: 0, lineHeight: 1.5 }}>
          List an unfinished project anonymously. Define the stake requirement to ensure only serious builders claim and finish your work.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="card"
        style={{
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
          background: '#FFFFFF',
          borderRadius: '18px',
          boxShadow: '3px 4px 0px #141414'
        }}
      >
        {/* Project Name */}
        <div>
          <label className="label">Project Title *</label>
          <input
            className="input"
            style={{ height: 42, borderRadius: '10px' }}
            placeholder="e.g. Adaptive Audio Equalizer"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Short & Detailed Description */}
        <div>
          <label className="label">Overview & Current State *</label>
          <textarea
            className="input"
            rows={5}
            style={{ borderRadius: '12px', padding: '12px 14px', lineHeight: 1.5 }}
            placeholder="Explain what is currently working, what is broken or missing, and what a taker must build to finish it..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 5 }}>
            Be specific about missing architecture, untested components, or deployment blockers.
          </div>
        </div>

        {/* Category & Completion Slider */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              style={{ height: 42, borderRadius: '10px', cursor: 'pointer' }}
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="label" style={{ margin: 0 }}>Starting Completion</label>
              <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)' }}>{completion}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="95"
              value={completion}
              onChange={e => setCompletion(e.target.value)}
              style={{ width: '100%', marginTop: 8, accentColor: '#141414', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Technologies */}
        <div>
          <label className="label">Technologies & Frameworks (comma-separated)</label>
          <input
            className="input"
            style={{ height: 42, borderRadius: '10px' }}
            placeholder="e.g. Next.js, FastAPI, PostgreSQL, Tailwind"
            value={techTags}
            onChange={e => setTechTags(e.target.value)}
          />
        </div>

        {/* Git Repository Source (Replaces source code zip file upload) */}
        <div
          style={{
            background: '#FAF8F4',
            padding: 22,
            borderRadius: 14,
            border: '2px solid var(--border)',
            boxShadow: '2px 2px 0px #141414'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <GitBranch size={18} />
              <label className="label" style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Git Repository URL *</label>
            </div>
            <span style={{ fontSize: 11.5, background: 'var(--ink)', color: '#FFFFFF', padding: '3px 8px', borderRadius: 12, fontWeight: 600 }}>
              Replaces ZIP upload
            </span>
          </div>

          <input
            className="input"
            style={{ height: 44, borderRadius: '10px' }}
            placeholder="https://github.com/owner/repository (or .git clone URL)"
            value={gitRepoUrl}
            onChange={e => setGitRepoUrl(e.target.value)}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 14 }}>
            <div>
              <label className="label" style={{ fontSize: 12 }}>Target Branch / Revision</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <GitBranch size={16} color="var(--text-muted)" />
                <input
                  className="input"
                  style={{ height: 38, borderRadius: '8px' }}
                  placeholder="main"
                  value={gitBranch}
                  onChange={e => setGitBranch(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label" style={{ fontSize: 12 }}>Required Escrow Stake (Credits) *</label>
              <input
                type="number"
                min="20"
                max="500"
                className="input"
                style={{ height: 38, borderRadius: '8px' }}
                value={stakeRequired}
                onChange={e => setStakeRequired(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 12, display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.4 }}>
            <Code2 size={15} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              Public or private Git repository link. Approved Diggers receive access coordinates to this Git repository upon locking skin-in-the-game collateral in escrow. Live GitHub GraphQL metadata and forensic autopsy diagnostics are generated from this link.
            </span>
          </div>
        </div>

        {/* Milestone Mode Toggle */}
        <div
          className="surface2"
          style={{
            padding: 16,
            borderRadius: '12px',
            border: '2px solid var(--border)',
            boxShadow: '1px 2px 0px #141414'
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={milestoneMode}
              onChange={e => setMilestoneMode(e.target.checked)}
              style={{ accentColor: '#141414', width: 18, height: 18, cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                Enable Milestone Checkpoints
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                Splits the blind work phase into 3 phased review targets (M1, M2, M3) with automated checkpoint verification.
              </div>
            </div>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary btn-block"
          style={{ padding: '14px', fontSize: 15, marginTop: 8, borderRadius: '12px' }}
          disabled={submitting}
        >
          {submitting ? 'Listing in Graveyard...' : 'List Git Repository in Graveyard →'}
        </button>
      </form>
    </div>
  );
}
