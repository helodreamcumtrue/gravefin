import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Compass, Sparkles, Layers, ShieldCheck, Tag, Code } from 'lucide-react';

export default function GraveyardMap({ projects = [] }) {
  const [selectedProject, setSelectedProject] = useState(projects[0] || null);

  return (
    <div className="sketch-card-static" style={{ padding: '24px', position: 'relative' }}>
      {/* Header bar */}
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
            Excavation Cartography
          </span>
          <h2 style={{ fontFamily: 'var(--font-hand)', fontSize: 32, fontWeight: 700, margin: '2px 0 0', color: 'var(--color-ink)' }}>
            GRAVEYARD QUADRANT MAP
          </h2>
        </div>

        <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'rgba(17, 17, 17, 0.8)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles style={{ width: 15, height: 15, color: 'var(--color-ink)' }} />
          <span>Click any marker to inspect artifact details</span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
          alignItems: 'stretch'
        }}
      >
        {/* Interactive 2D Cartesian Quadrant Chart */}
        <div
          className="sketch-card-static"
          style={{
            position: 'relative',
            minHeight: 460,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
            backgroundColor: 'var(--color-paper)'
          }}
        >
          {/* Quadrant Labels Background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: '1fr 1fr',
              pointerEvents: 'none',
              opacity: 0.22
            }}
          >
            <div style={{ borderRight: '1.5px solid rgba(17, 17, 17, 0.4)', borderBottom: '1.5px solid rgba(17, 17, 17, 0.4)', padding: 16, fontFamily: 'var(--font-hand)', fontSize: 24, fontWeight: 700, color: 'var(--color-ink)' }}>
              Hidden Gem
            </div>
            <div style={{ borderBottom: '1.5px solid rgba(17, 17, 17, 0.4)', padding: 16, fontFamily: 'var(--font-hand)', fontSize: 24, fontWeight: 700, color: 'var(--color-ink)', textAlign: 'right', backgroundColor: 'rgba(244, 239, 230, 0.4)' }}>
              Gold Mine 🪙
            </div>
            <div style={{ borderRight: '1.5px solid rgba(17, 17, 17, 0.4)', padding: 16, fontFamily: 'var(--font-hand)', fontSize: 24, fontWeight: 700, color: 'var(--color-ink)', display: 'flex', alignItems: 'flex-end' }}>
              Lost Cause
            </div>
            <div style={{ padding: 16, fontFamily: 'var(--font-hand)', fontSize: 24, fontWeight: 700, color: 'var(--color-ink)', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
              High Risk
            </div>
          </div>

          {/* Axes Lines */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1.5, backgroundColor: 'rgba(17, 17, 17, 0.25)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1.5, backgroundColor: 'rgba(17, 17, 17, 0.25)', pointerEvents: 'none' }} />

          {/* Axis Labels */}
          <div style={{ position: 'absolute', left: 12, top: 10, fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-ink)', zIndex: 10 }}>
            ▲ High Revival Potential (100)
          </div>
          <div style={{ position: 'absolute', left: 12, bottom: 10, fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-ink)', zIndex: 10 }}>
            ▼ Low Potential (0)
          </div>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-24px)', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-ink)', zIndex: 10 }}>
            ◀ Low Effort (Surface Dig)
          </div>
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-24px)', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-ink)', textAlign: 'right', zIndex: 10 }}>
            High Effort (Deep Excavation) ▶
          </div>

          {/* Plotted Project Headstone Markers */}
          <div style={{ position: 'absolute', inset: 48 }}>
            {projects.map((project, idx) => {
              // Extract or calculate coordinates (effort 0-100, potential 0-100)
              const effort = project.quadrantCoordinates?.effort ?? ((idx * 27 + 20) % 80 + 10);
              const potential = project.quadrantCoordinates?.potential ?? (project.revivalScore?.overallScore || project.completion || 65);
              const isSelected = selectedProject?.id === project.id;
              const score = project.revivalScore?.overallScore || project.completion || 75;

              return (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  style={{
                    position: 'absolute',
                    left: `${effort}%`,
                    bottom: `${potential}%`,
                    transform: isSelected ? 'translate(-50%, 50%) scale(1.25)' : 'translate(-50%, 50%)',
                    zIndex: isSelected ? 30 : 20,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease'
                  }}
                  title={`${project.title} (Revival: ${score}%)`}
                >
                  <div
                    className="sketch-headstone"
                    style={{
                      width: 36,
                      height: 42,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11.5,
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      backgroundColor: isSelected ? 'var(--color-ink)' : 'var(--color-paper)',
                      color: isSelected ? 'var(--color-paper)' : 'var(--color-ink)',
                      boxShadow: '1.5px 2px 0px #141414',
                      border: '2px solid var(--color-ink)'
                    }}
                  >
                    {score}
                  </div>

                  {/* Marker Tag */}
                  <span
                    style={{
                      position: 'absolute',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      top: '100%',
                      marginTop: 3,
                      backgroundColor: 'var(--color-ink)',
                      color: 'var(--color-paper)',
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      padding: '1px 6px',
                      borderRadius: 4,
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      opacity: isSelected ? 1 : 0,
                      transition: 'opacity 0.15s'
                    }}
                  >
                    {project.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Project Detail Drawer */}
        {selectedProject ? (
          <div
            className="sketch-card"
            style={{
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              backgroundColor: 'var(--color-paper)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                <span className="sketch-tag" style={{ padding: '3px 8px', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {selectedProject.district || selectedProject.category || 'General Archive'}
                </span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'rgba(17, 17, 17, 0.75)', fontWeight: 700 }}>
                  Revival {selectedProject.revivalScore?.overallScore || selectedProject.completion || 75}%
                </span>
              </div>

              <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: 28, fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 8px' }}>
                {selectedProject.title}
              </h3>

              <p style={{ fontSize: 13.5, color: 'rgba(17, 17, 17, 0.85)', lineHeight: 1.5, marginBottom: 16, fontFamily: 'var(--font-sans)' }}>
                {selectedProject.tagline || selectedProject.description}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12, borderTop: '1.5px solid rgba(17, 17, 17, 0.12)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(17, 17, 17, 0.65)' }}>Excavation Depth:</span>
                  <span style={{ fontWeight: 700 }}>{selectedProject.revivalScore?.effortEstimate || 'Moderate Excavation'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(17, 17, 17, 0.65)' }}>Declared Inactive:</span>
                  <span style={{ fontWeight: 700 }}>{selectedProject.declaredInactiveDate || 'March 2025'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(17, 17, 17, 0.65)' }}>License:</span>
                  <span style={{ fontWeight: 700 }}>{selectedProject.license || 'MIT'}</span>
                </div>

                {selectedProject.stakeRequired && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(17, 17, 17, 0.65)' }}>Escrow Stake:</span>
                    <span style={{ fontWeight: 700 }}>🪙 {selectedProject.stakeRequired} Credits</span>
                  </div>
                )}

                <div style={{ marginTop: 4 }}>
                  <span style={{ color: 'rgba(17, 17, 17, 0.65)', display: 'block', marginBottom: 4 }}>Required Tech Stack:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(Array.isArray(selectedProject.techStack)
                      ? selectedProject.techStack
                      : (typeof selectedProject.techTags === 'string'
                          ? JSON.parse(selectedProject.techTags || '[]')
                          : selectedProject.techTags || [])
                    ).map((t) => (
                      <span key={t} className="sketch-tag" style={{ padding: '2px 6px', fontSize: 10.5 }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ paddingTop: 20 }}>
              <Link
                href={`/project/${selectedProject.id}`}
                className="sketch-btn-primary"
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  fontFamily: 'var(--font-hand)',
                  fontSize: 20,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  textDecoration: 'none'
                }}
              >
                <span>Inspect Full Record</span>
                <ArrowRight style={{ width: 18, height: 18 }} />
              </Link>
            </div>
          </div>
        ) : (
          <div
            className="sketch-card-static"
            style={{
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              color: 'rgba(17, 17, 17, 0.6)'
            }}
          >
            <Compass style={{ width: 44, height: 44, marginBottom: 12, strokeWidth: 1.5 }} />
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: 20, margin: 0 }}>
              Select a tombstone marker to view artifact summary.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
