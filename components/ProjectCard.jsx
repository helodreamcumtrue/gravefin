import React from 'react';
import Link from 'next/link';
import Icon from './Icons';

export default function ProjectCard({ project, index = 0 }) {
  let tags = [];
  try {
    tags = typeof project.techTags === 'string' ? JSON.parse(project.techTags) : project.techTags || [];
  } catch (e) {
    tags = (project.techTags || '').split(',').map(s => s.trim()).filter(Boolean);
  }

  // Ensure category is included as a tag if not present
  if (project.category && !tags.includes(project.category)) {
    tags = [project.category, ...tags];
  }

  // Variations in border-radius to give each card its own organic hand-drawn character
  const sketchBorderStyles = [
    '255px 15px 225px 15px/15px 225px 15px 255px',
    '15px 225px 15px 255px/255px 15px 225px 15px',
    '225px 20px 240px 15px/15px 240px 20px 225px',
    '18px 245px 20px 230px/240px 18px 230px 20px'
  ];
  const borderRadius = sketchBorderStyles[index % sketchBorderStyles.length];

  // Calculate simulated "last active" text from updated date
  const lastActiveText = project.updatedAt
    ? `Last active ${Math.max(1, Math.floor((Date.now() - new Date(project.updatedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)))} mo ago`
    : 'Last active 8 mo ago';

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '2px solid var(--border)',
        borderRadius,
        boxShadow: '2px 3px 0px #141414',
        padding: '24px 20px 18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        cursor: 'pointer'
      }}
      className="card-sketch-hover"
    >
      <Link href={`/project/${project.id}`} style={{ display: 'block' }}>
        {/* Top Tombstone Icon Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div
            style={{
              width: 32,
              height: 38,
              border: '1.8px solid var(--border)',
              borderRadius: '14px 14px 2px 2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#FAF8F4',
              color: 'var(--text)'
            }}
          >
            <Icon name="tombstoneArch" size={18} />
          </div>

          <span
            className="badge-sketch"
            style={{ fontSize: 11, padding: '2px 7px' }}
          >
            {project.status === 'LISTED' ? 'Open' : project.status}
          </span>
        </div>

        {/* Project Title */}
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 18,
            letterSpacing: '-0.02em',
            margin: '0 0 8px',
            color: 'var(--text)',
            lineHeight: 1.25
          }}
        >
          {project.title}
        </h3>

        {/* Short Description */}
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            margin: '0 0 16px',
            minHeight: 40,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {project.description}
        </p>

        {/* Tech Tag Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {tags.slice(0, 2).map(tag => (
            <span key={tag} className="tag-sketch">
              {tag}
            </span>
          ))}
          {project.stakeRequired && (
            <span
              className="tag-sketch"
              style={{ background: '#FAF8F4', fontWeight: 700 }}
            >
              🪙 {project.stakeRequired} cr
            </span>
          )}
        </div>
      </Link>

      {/* Dotted Divider Line matching reference */}
      <div>
        <div className="sketch-dotted" />

        {/* Footer info: Last active & Revival rate */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            color: 'var(--text-muted)'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="clock" size={12} />
            {lastActiveText}
          </span>
          <span style={{ fontWeight: 800, color: 'var(--text)' }}>
            Revival {project.completion}%
          </span>
        </div>
      </div>
    </div>
  );
}
