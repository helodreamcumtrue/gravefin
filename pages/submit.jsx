import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useApp } from '../context/AppContext';
import Icon from '../components/Icons';

const CATEGORIES = ['Web', 'Mobile', 'AI/ML', 'IoT', 'Game', 'Cybersecurity'];

export default function SubmitProject() {
  const router = useRouter();
  const { currentUser, addToast } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Web');
  const [completion, setCompletion] = useState(30);
  const [techTags, setTechTags] = useState('React, Node.js, SQLite');
  const [stakeRequired, setStakeRequired] = useState(100);
  const [fileName, setFileName] = useState('abandoned_codebase.zip');
  const [fileUrl, setFileUrl] = useState('/downloads/source.zip');
  const [uploading, setUploading] = useState(false);
  const [milestoneMode, setMilestoneMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // File upload handler
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip') && !file.name.toLowerCase().endsWith('.tar.gz')) {
      addToast('Please upload a .zip or .tar.gz archive', 'error');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      addToast('File exceeds maximum size of 50MB', 'error');
      return;
    }

    try {
      setUploading(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser.id
          },
          body: JSON.stringify({
            fileName: file.name,
            fileBase64: base64
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');

        setFileName(file.name);
        setFileUrl(data.fileUrl);
        addToast(`Uploaded ${file.name} successfully!`, 'success');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      addToast(err.message, 'error');
      setUploading(false);
    }
  };

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

    try {
      setSubmitting(true);
      const tagsArray = techTags.split(',').map(s => s.trim()).filter(Boolean);

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          completion: Number(completion),
          techTags: JSON.stringify(tagsArray),
          stakeRequired: Number(stakeRequired),
          fileName: fileName.trim() || 'project.zip',
          fileUrl,
          milestoneMode
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit project');

      addToast('Project listed in the Graveyard successfully!', 'success');
      router.push(`/project/${data.project.id}`);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

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

        {/* Escrow Stake Required & File Upload */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div>
            <label className="label">Required Escrow Stake (Credits)</label>
            <input
              type="number"
              min="20"
              max="500"
              className="input"
              style={{ height: 42, borderRadius: '10px' }}
              value={stakeRequired}
              onChange={e => setStakeRequired(e.target.value)}
              required
            />
            <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 4 }}>
              Locked from the builder upon your approval.
            </div>
          </div>

          {/* Zip Upload Input */}
          <div>
            <label className="label">Source Code Archive (.zip, max 50MB)</label>
            <input
              type="file"
              accept=".zip,.tar.gz"
              className="input"
              onChange={handleFileChange}
              disabled={uploading}
              style={{ padding: '7px 10px', height: 42, borderRadius: '10px', cursor: 'pointer' }}
            />
            <div style={{ fontSize: 11.5, color: uploading ? 'var(--accent)' : 'var(--text-dim)', marginTop: 4 }}>
              {uploading ? 'Uploading archive...' : `Current package: ${fileName}`}
            </div>
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
          disabled={submitting || uploading}
        >
          {submitting ? 'Listing in Graveyard...' : 'List Codebase in Graveyard →'}
        </button>
      </form>
    </div>
  );
}
