import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ProjectCard from '../components/ProjectCard';
import { useApp } from '../context/AppContext';
import { getLocalProjects } from '../lib/mockFallback';
import {
  BookOpen,
  PlusCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';

export default function ArchivistWorkbenchPage() {
  const { currentUser } = useApp();
  const [projects, setProjects] = useState([]);
  const [activeSection, setActiveSection] = useState('specimens'); // 'specimens' | 'annotations' | 'requests'

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => {
        if (data.projects && data.projects.length > 0) {
          setProjects(data.projects);
        } else {
          setProjects(getLocalProjects());
        }
      })
      .catch(() => {
        setProjects(getLocalProjects());
      });
  }, []);

  const userProjects = projects.filter(p => currentUser && p.ownerId === currentUser.id);
  const displaySpecimens = userProjects.length > 0 ? userProjects : projects.slice(0, 4);

  const p1 = projects[0] || { id: 'p1', title: 'AI Adaptive Study Plan Generator' };
  const p2 = projects[1] || { id: 'p2', title: 'Campus Shuttle Live Radar & Dispatch' };
  const p3 = projects[2] || { id: 'p3', title: 'Local Grocery Co-op ERP' };
  const p4 = projects[3] || { id: 'p4', title: 'Edge Sensor IoT Telemetry' };
  const p7 = projects[6] || projects[0] || { id: 'p7', title: 'WebAssembly Modular Audio Synth' };

  return (
    <>
      <Head>
        <title>Archivist Workbench — Digital Graveyard</title>
        <meta name="description" content="Curatorial command center for software specimens, marginalia field notes, and stewardship dossiers." />
      </Head>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            paddingBottom: 16,
            borderBottom: '2px solid rgba(17, 17, 17, 0.12)',
            gap: 16
          }}
        >
          <div>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(17, 17, 17, 0.6)', display: 'block' }}>
              CURATORIAL COMMAND CENTER
            </span>
            <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: 38, fontWeight: 700, margin: '2px 0 0', color: 'var(--color-ink)' }}>
              ARCHIVIST WORKBENCH
            </h1>
          </div>

          <Link
            href="/submit"
            className="sketch-btn-primary"
            style={{
              padding: '8px 18px',
              fontFamily: 'var(--font-hand)',
              fontSize: 20,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none'
            }}
          >
            <PlusCircle style={{ width: 18, height: 18 }} />
            <span>Accession New Specimen</span>
          </Link>
        </div>

        {/* Section Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontFamily: 'var(--font-hand)',
            fontSize: 22,
            borderBottom: '2px solid rgba(17, 17, 17, 0.12)',
            paddingBottom: 4,
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={() => setActiveSection('specimens')}
            className="sketch-btn"
            style={{
              padding: '6px 16px',
              backgroundColor: activeSection === 'specimens' ? 'var(--color-ink)' : 'var(--color-paper)',
              color: activeSection === 'specimens' ? 'var(--color-paper)' : 'var(--color-ink)',
              fontFamily: 'inherit',
              fontSize: 'inherit'
            }}
          >
            {userProjects.length > 0 ? `My Accessioned (${userProjects.length})` : `Curated Specimens (${displaySpecimens.length})`}
          </button>

          <button
            onClick={() => setActiveSection('annotations')}
            className="sketch-btn"
            style={{
              padding: '6px 16px',
              backgroundColor: activeSection === 'annotations' ? 'var(--color-ink)' : 'var(--color-paper)',
              color: activeSection === 'annotations' ? 'var(--color-paper)' : 'var(--color-ink)',
              fontFamily: 'inherit',
              fontSize: 'inherit'
            }}
          >
            Margin Notes & Annotations
          </button>

          <button
            onClick={() => setActiveSection('requests')}
            className="sketch-btn"
            style={{
              padding: '6px 16px',
              backgroundColor: activeSection === 'requests' ? 'var(--color-ink)' : 'var(--color-paper)',
              color: activeSection === 'requests' ? 'var(--color-paper)' : 'var(--color-ink)',
              fontFamily: 'inherit',
              fontSize: 'inherit'
            }}
          >
            Pending Stewardship Dossiers
          </button>
        </div>

        {/* Section 1: Curated Specimens */}
        {activeSection === 'specimens' && (
          <div>
            {userProjects.length === 0 && currentUser && (
              <div className="sketch-card-static" style={{ padding: '10px 16px', marginBottom: 16, backgroundColor: 'rgba(232, 162, 74, 0.15)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                ℹ️ Showing featured graveyard specimens. You haven't accessioned any artifacts under <strong>{currentUser.alias}</strong> yet. Click "Accession New Specimen" to list one!
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {displaySpecimens.map((project, idx) => (
                <ProjectCard key={project.id} project={project} index={idx} />
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Margin Notes & Annotations */}
        {activeSection === 'annotations' && (
          <div className="sketch-card-static" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--color-ink)' }}>
              Field Marginalia Transcript Log
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="sketch-card" style={{ padding: 16, backgroundColor: 'var(--color-paper)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(17, 17, 17, 0.65)', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-ink)' }}>{p1.title}</span>
                  <span>Yesterday at 14:20</span>
                </div>
                <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(17, 17, 17, 0.85)', lineHeight: 1.45 }}>
                  "Verified WAL mode configuration on SQLite database file. Write lock latency reduced by 85%."
                </p>
                <Link href={`/project/${p1.id}`} style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-ink)', textDecoration: 'underline', display: 'inline-block', marginTop: 6 }}>
                  View Specimen Record →
                </Link>
              </div>

              <div className="sketch-card" style={{ padding: 16, backgroundColor: 'var(--color-paper)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(17, 17, 17, 0.65)', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-ink)' }}>{p2.title}</span>
                  <span>3 days ago</span>
                </div>
                <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(17, 17, 17, 0.85)', lineHeight: 1.45 }}>
                  "Suggested decoupling transport provider layer to allow self-hosted Mapbox or open-source Leaflet GeoJSON feeds."
                </p>
                <Link href={`/project/${p2.id}`} style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-ink)', textDecoration: 'underline', display: 'inline-block', marginTop: 6 }}>
                  View Specimen Record →
                </Link>
              </div>

              <div className="sketch-card" style={{ padding: 16, backgroundColor: 'var(--color-paper)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(17, 17, 17, 0.65)', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-ink)' }}>{p7.title}</span>
                  <span>1 week ago</span>
                </div>
                <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(17, 17, 17, 0.85)', lineHeight: 1.45 }}>
                  "C++ DSP core compiles cleanly with Emscripten. Web Audio AudioWorklet node buffer alignment confirmed."
                </p>
                <Link href={`/project/${p7.id}`} style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-ink)', textDecoration: 'underline', display: 'inline-block', marginTop: 6 }}>
                  View Specimen Record →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Pending Stewardship Dossiers */}
        {activeSection === 'requests' && (
          <div className="sketch-card-static" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--color-ink)' }}>
              Active Stewardship Dossiers
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                className="sketch-card"
                style={{
                  padding: 20,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16,
                  backgroundColor: 'var(--color-paper)'
                }}
              >
                <div>
                  <span className="sketch-tag" style={{ padding: '2px 8px', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    PROJECT: {p3.title.toUpperCase()}
                  </span>
                  <h4 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 16, margin: '6px 0 2px', color: 'var(--color-ink)' }}>
                    Stewardship Transfer Request from Digger-2099
                  </h4>
                  <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'rgba(17, 17, 17, 0.7)', margin: 0 }}>
                    Plan: Deliver PDF invoice generator & automated dispatch worker with {p3.stakeRequired || 100} cr escrow locked
                  </p>
                </div>

                <Link
                  href={`/project/${p3.id}`}
                  className="sketch-btn-primary"
                  style={{
                    padding: '8px 16px',
                    fontFamily: 'var(--font-hand)',
                    fontSize: 18,
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  Open Transfer Vault
                </Link>
              </div>

              <div
                className="sketch-card"
                style={{
                  padding: 20,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16,
                  backgroundColor: 'var(--color-paper)'
                }}
              >
                <div>
                  <span className="sketch-tag" style={{ padding: '2px 8px', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    PROJECT: {p4.title.toUpperCase()}
                  </span>
                  <h4 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 16, margin: '6px 0 2px', color: 'var(--color-ink)' }}>
                    Work Submitted for Owner Verification
                  </h4>
                  <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'rgba(17, 17, 17, 0.7)', margin: 0 }}>
                    Status: Digger-3310 submitted completed calibration widgets. Awaiting owner sign-off.
                  </p>
                </div>

                <Link
                  href={`/project/${p4.id}`}
                  className="sketch-btn-primary"
                  style={{
                    padding: '8px 16px',
                    fontFamily: 'var(--font-hand)',
                    fontSize: 18,
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  Review Deliverable
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
