import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ProjectCard from '../components/ProjectCard';
import { getLocalProjects } from '../lib/mockFallback';
import {
  Sparkles,
  ArrowRight,
  Compass,
  BookOpen,
  ShieldCheck,
  GitFork
} from 'lucide-react';

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

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
      })
      .finally(() => setLoading(false));
  }, []);

  const featuredProjects = projects.slice(0, 4);

  return (
    <>
      <Head>
        <title>Digital Graveyard — Preserve. Understand. Revive.</title>
        <meta
          name="description"
          content="A non-morbid preservation archive for abandoned software projects, postmortem autopsies, and open stewardship transfers."
        />
      </Head>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        {/* HERO SECTION */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 40,
            alignItems: 'center',
            paddingTop: 8,
            paddingBottom: 16
          }}
          data-purpose="hero-section"
        >
          {/* Left Column: Headlines & Action CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'inline-flex' }}>
              <span
                className="sketch-tag"
                style={{
                  padding: '4px 12px',
                  fontSize: 11.5,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  gap: 6
                }}
              >
                <Sparkles style={{ width: 14, height: 14, color: 'var(--color-ink)' }} />
                <span>OPEN ARCHIVAL PRESERVATION LIBRARY</span>
              </span>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-hand)',
                fontSize: 'clamp(42px, 5.5vw, 68px)',
                fontWeight: 700,
                lineHeight: 1.06,
                letterSpacing: '-0.02em',
                margin: 0,
                color: 'var(--color-ink)'
              }}
            >
              Every abandoned project has a story.
            </h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h2
                style={{
                  fontFamily: 'var(--font-hand)',
                  fontSize: 'clamp(24px, 3vw, 32px)',
                  fontWeight: 700,
                  color: 'rgba(17, 17, 17, 0.9)',
                  margin: 0
                }}
              >
                Preserve. Understand. Revive.
              </h2>
              <p
                style={{
                  fontSize: 16,
                  color: 'rgba(17, 17, 17, 0.82)',
                  lineHeight: 1.6,
                  maxWidth: 540,
                  margin: 0,
                  fontFamily: 'var(--font-sans)'
                }}
              >
                Digital Graveyard is a digital archive of forgotten software ideas. We document historical autopsy reports, compute code health scores, and facilitate structured stewardship transfers.
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, paddingTop: 4 }}>
              <Link
                href="/browse"
                className="sketch-btn-primary"
                style={{
                  padding: '12px 24px',
                  fontFamily: 'var(--font-hand)',
                  fontSize: 24,
                  fontWeight: 700,
                  gap: 10,
                  textDecoration: 'none'
                }}
              >
                <span>Explore the Graveyard</span>
                <ArrowRight style={{ width: 22, height: 22 }} />
              </Link>

              <Link
                href="/browse/map"
                className="sketch-btn"
                style={{
                  padding: '12px 24px',
                  fontFamily: 'var(--font-hand)',
                  fontSize: 24,
                  fontWeight: 700,
                  gap: 10,
                  textDecoration: 'none'
                }}
              >
                <Compass style={{ width: 20, height: 20, color: 'var(--color-ink)' }} />
                <span>Graveyard Map</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Hand-Drawn Sketch Illustration */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              className="sketch-card"
              style={{
                padding: 24,
                backgroundColor: 'var(--color-paper)',
                width: '100%',
                maxWidth: 420,
                boxShadow: '4px 6px 0px #141414',
                textAlign: 'center'
              }}
            >
              {/* Organic Line Art SVG Graphic */}
              <svg
                style={{ width: '100%', height: 240, color: 'var(--color-ink)', fill: 'none', stroke: 'currentColor', margin: '0 auto' }}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 320 240"
              >
                {/* Sun & Clouds */}
                <circle cx="260" cy="50" r="18" strokeDasharray="3 3" />
                <path d="M 230 45 C 240 35, 270 35, 280 45" />
                <path d="M 40 40 Q 60 25 80 40 Q 100 25 120 40 Z" />

                {/* Bare Tree */}
                <path d="M 50 200 L 50 120 M 50 160 L 25 130 M 50 140 L 75 110 M 50 180 L 30 165" />

                {/* Central Main Tombstone */}
                <path d="M 110 200 L 110 90 C 110 50, 210 50, 210 90 L 210 200 Z" strokeWidth="2.5" fill="#fdfbf7" />
                {/* Base Line */}
                <path d="M 80 200 L 240 200" strokeWidth="3" />

                {/* Inked Motto on Stone */}
                <text x="160" y="115" textAnchor="middle" style={{ fontFamily: 'var(--font-hand)', fontSize: 16, fill: 'currentColor', fontWeight: 700 }} stroke="none">
                  Not forgotten.
                </text>
                <text x="160" y="140" textAnchor="middle" style={{ fontFamily: 'var(--font-hand)', fontSize: 16, fill: 'currentColor', fontWeight: 700 }} stroke="none">
                  Just waiting.
                </text>
                <path d="M 140 155 L 180 155" strokeWidth="1.2" />

                {/* Side Tombstones & Grass Doodles */}
                <path d="M 85 200 L 85 160 C 85 140, 105 140, 105 160 L 105 200" />
                <path d="M 215 200 L 215 150 C 215 130, 235 130, 235 150 L 235 200" />
                <path d="M 20 200 Q 35 185 40 200 M 100 200 Q 115 190 120 200 M 240 200 Q 255 185 260 200" />
              </svg>

              <p style={{ fontFamily: 'var(--font-hand)', fontSize: 22, fontWeight: 700, margin: '8px 0 2px', color: 'var(--color-ink)' }}>
                Digital Preservation Vault
              </p>
              <p style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'rgba(17, 17, 17, 0.65)', margin: 0 }}>
                Preserving technical lineage & ownership provenance
              </p>
            </div>
          </div>
        </section>

        {/* Software Lifecycle Timeline Banner */}
        <section
          className="sketch-card-static"
          style={{
            padding: '24px 20px',
            backgroundColor: 'rgba(244, 239, 230, 0.4)',
            textAlign: 'center'
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--color-ink)' }}>
              The Software Lifecycle Timeline
            </h3>
            <p style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'rgba(17, 17, 17, 0.65)', margin: '4px 0 0' }}>
              Every project passes through archival stages
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 700
            }}
          >
            <span className="sketch-tag" style={{ padding: '6px 14px', backgroundColor: 'var(--color-paper)' }}>1. Idea</span>
            <span>→</span>
            <span className="sketch-tag" style={{ padding: '6px 14px', backgroundColor: 'var(--color-paper)' }}>2. Prototype</span>
            <span>→</span>
            <span className="sketch-tag" style={{ padding: '6px 14px', backgroundColor: 'var(--color-paper)' }}>3. Launch</span>
            <span>→</span>
            <span className="sketch-tag" style={{ padding: '6px 14px', backgroundColor: 'var(--color-paper)' }}>4. Peak</span>
            <span>→</span>
            <span className="sketch-tag" style={{ padding: '6px 14px', backgroundColor: 'var(--color-paper)' }}>5. Decline</span>
            <span>→</span>
            <span className="sketch-tag" style={{ padding: '6px 14px', backgroundColor: 'var(--color-paper)' }}>6. Archive</span>
            <span>→</span>
            <span
              className="sketch-tag"
              style={{
                padding: '6px 14px',
                backgroundColor: 'var(--color-ink)',
                color: 'var(--color-paper)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              🌱 7. Revival?
            </span>
          </div>
        </section>

        {/* Hand-Drawn Organic Divider */}
        <div className="sketch-divider" />

        {/* Featured Preserved Artifacts Grid */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-hand)', fontSize: 36, fontWeight: 700, margin: 0, color: 'var(--color-ink)' }}>
                Featured Preserved Artifacts
              </h2>
              <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'rgba(17, 17, 17, 0.65)', margin: '2px 0 0' }}>
                Inspected by Project Archaeologists
              </p>
            </div>

            <Link
              href="/browse"
              style={{
                fontFamily: 'var(--font-hand)',
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--color-ink)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>View all artifacts</span>
              <ArrowRight style={{ width: 20, height: 20 }} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {featuredProjects.map((project, idx) => (
              <ProjectCard key={project.id} project={project} index={idx} />
            ))}
          </div>
        </section>

        {/* Philosophy & Transparency Principles Banner */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
            paddingTop: 8
          }}
        >
          <div className="sketch-card-static" style={{ padding: 22, backgroundColor: 'var(--color-paper)' }}>
            <BookOpen style={{ width: 28, height: 28, color: 'var(--color-ink)', marginBottom: 10, strokeWidth: 1.8 }} />
            <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: 24, fontWeight: 700, margin: '0 0 6px', color: 'var(--color-ink)' }}>
              Archival Autopsy
            </h3>
            <p style={{ fontSize: 13, color: 'rgba(17, 17, 17, 0.82)', lineHeight: 1.5, margin: 0, fontFamily: 'var(--font-sans)' }}>
              Detailed postmortems analyze peak commit activity, maintainer turnover, and exact decline reasons so future builders don't repeat mistakes.
            </p>
          </div>

          <div className="sketch-card-static" style={{ padding: 22, backgroundColor: 'var(--color-paper)' }}>
            <ShieldCheck style={{ width: 28, height: 28, color: 'var(--color-ink)', marginBottom: 10, strokeWidth: 1.8 }} />
            <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: 24, fontWeight: 700, margin: '0 0 6px', color: 'var(--color-ink)' }}>
              Immutable Provenance
            </h3>
            <p style={{ fontSize: 13, color: 'rgba(17, 17, 17, 0.82)', lineHeight: 1.5, margin: 0, fontFamily: 'var(--font-sans)' }}>
              Every listing records an append-only cryptographic ownership chain tracing original creators, curators, and new adopting diggers.
            </p>
          </div>

          <div className="sketch-card-static" style={{ padding: 22, backgroundColor: 'var(--color-paper)' }}>
            <GitFork style={{ width: 28, height: 28, color: 'var(--color-ink)', marginBottom: 10, strokeWidth: 1.8 }} />
            <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: 24, fontWeight: 700, margin: '0 0 6px', color: 'var(--color-ink)' }}>
              Fork-Friendly License
            </h3>
            <p style={{ fontSize: 13, color: 'rgba(17, 17, 17, 0.82)', lineHeight: 1.5, margin: 0, fontFamily: 'var(--font-sans)' }}>
              Permissively licensed codebases (MIT/Apache/BSD) allow instant forks without transfer friction. Build on top of proven ideas.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
