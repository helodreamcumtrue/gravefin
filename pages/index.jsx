import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProjectCard from '../components/ProjectCard';
import Icon from '../components/Icons';

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        setProjects(data.projects || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Display top 4 featured projects like in the screenshot
  const featuredProjects = projects.slice(0, 4);

  return (
    <div style={{ paddingBottom: 70 }}>
      {/* HERO SECTION matching reference */}
      <section className="container" style={{ padding: '60px 0 36px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.15fr 0.85fr',
            gap: 40,
            alignItems: 'center'
          }}
        >
          {/* Left Column Text */}
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 'clamp(38px, 4.4vw, 56px)',
                lineHeight: 1.08,
                letterSpacing: '-0.035em',
                margin: '0 0 16px',
                color: 'var(--text)'
              }}
            >
              Every abandoned<br />project has a story.
            </h1>

            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: 'var(--text)',
                marginBottom: 16,
                letterSpacing: '-0.01em'
              }}
            >
              Preserve. Understand. Revive.
            </div>

            <p
              style={{
                fontSize: 15,
                color: 'var(--text-muted)',
                lineHeight: 1.6,
                maxWidth: 460,
                margin: '0 0 28px'
              }}
            >
              Digital Graveyard is a home for forgotten digital projects — where their history is saved and their second life begins.
            </p>

            <Link href="/browse" className="btn-sketch" style={{ fontSize: 15, padding: '12px 24px' }}>
              Explore the Graveyard <span style={{ marginLeft: 4 }}>→</span>
            </Link>
          </div>

          {/* Right Column Hand-Drawn SVG Illustration */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <HandDrawnGraveyardScene />
          </div>
        </div>
      </section>

      {/* Horizontal Divider Line matching screenshot */}
      <div className="container">
        <hr className="sketch-divider" />
      </div>

      {/* FEATURED PROJECTS SECTION matching reference */}
      <section className="container" style={{ paddingTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 26,
              letterSpacing: '-0.03em',
              margin: 0,
              color: 'var(--text)'
            }}
          >
            Featured Projects
          </h2>

          <Link
            href="/browse"
            style={{
              fontSize: 14.5,
              fontWeight: 700,
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            View all <span>→</span>
          </Link>
        </div>

        {/* 4 Cards Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="card-sketch"
                style={{ height: 260, background: '#FFFFFF', opacity: 0.6 }}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 20
            }}
          >
            {featuredProjects.map((project, idx) => (
              <ProjectCard key={project.id} project={project} index={idx} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * Hand-Drawn Ink Illustration:
 * - Solid black circular moon
 * - Wavy horizontal clouds
 * - Bare spooky twisted branch tree
 * - Grassy mounds and tufts
 * - Curved gravestone with text:
 *   "Not forgotten. Just waiting."
 */
function HandDrawnGraveyardScene() {
  return (
    <svg
      viewBox="0 0 460 300"
      width="100%"
      height="auto"
      style={{ maxWidth: 440, overflow: 'visible' }}
    >
      {/* Hand-Drawn Solid Moon */}
      <circle cx="320" cy="70" r="14" fill="#141414" />

      {/* Sketched Cloud Lines */}
      <path
        d="M275 95 C 295 90, 340 92, 365 95"
        stroke="#141414"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M285 118 C 305 116, 325 119, 340 117"
        stroke="#141414"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M280 135 C 295 133, 310 136, 330 134"
        stroke="#141414"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />

      {/* Bare Spooky Tree */}
      <g stroke="#141414" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Trunk */}
        <path d="M380 205 Q 382 170 385 135 Q 386 115 390 95" strokeWidth="3" />
        <path d="M385 205 Q 386 170 388 135 Q 389 115 390 95" strokeWidth="2.2" />
        
        {/* Left main branch */}
        <path d="M386 145 Q 370 135 365 115 Q 360 100 355 85" />
        <path d="M365 115 Q 370 105 375 90" />
        <path d="M358 95 Q 350 90 345 80" />

        {/* Right main branch */}
        <path d="M388 135 Q 405 125 412 110 Q 418 95 422 80" />
        <path d="M408 118 Q 412 108 418 98" />
        <path d="M390 100 Q 400 85 405 70" />
        
        {/* Top twigs */}
        <path d="M390 95 Q 385 80 380 65" />
        <path d="M390 95 Q 395 78 400 68" />
      </g>

      {/* Ground Horizon Contours */}
      <path
        d="M245 190 Q 255 180 265 190 Q 275 200 295 195"
        stroke="#141414"
        strokeWidth="1.6"
        fill="none"
      />
      <path
        d="M370 195 Q 385 185 400 195 Q 415 190 425 200"
        stroke="#141414"
        strokeWidth="1.6"
        fill="none"
      />

      {/* Distant Hills / Grass mounds */}
      <g stroke="#141414" strokeWidth="1.6" fill="none">
        {/* Far left grass tufts */}
        <path d="M255 190 l 3 -8 l 3 8 l 3 -9 l 3 9" />
        <path d="M270 185 Q 278 172 285 185" />
        <path d="M288 185 Q 296 172 304 185" />
        <path d="M305 188 l 3 -7 l 3 7 l 3 -8 l 3 8" />
        
        {/* Grass patch far left */}
        <path d="M260 215 l 4 -6 l 4 6 l 4 -8 l 4 8" />
        
        {/* Right side grass tufts */}
        <path d="M390 200 l 3 -8 l 3 8 l 3 -9 l 3 9" />
      </g>

      {/* Centered Tombstone Structure */}
      <g>
        {/* Tombstone body */}
        <path
          d="M315 220 
             V 140 
             C 315 105, 365 105, 365 140 
             V 220"
          fill="#FFFFFF"
          stroke="#141414"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Hand-lettered inscription: "Not forgotten. Just waiting." */}
        <text
          x="340"
          y="136"
          fontFamily="var(--font-hand), 'Patrick Hand', cursive"
          fontSize="12.5"
          fontWeight="700"
          textAnchor="middle"
          fill="#141414"
        >
          Not
        </text>
        <text
          x="340"
          y="152"
          fontFamily="var(--font-hand), 'Patrick Hand', cursive"
          fontSize="12.5"
          fontWeight="700"
          textAnchor="middle"
          fill="#141414"
        >
          forgotten.
        </text>
        <text
          x="340"
          y="168"
          fontFamily="var(--font-hand), 'Patrick Hand', cursive"
          fontSize="12.5"
          fontWeight="700"
          textAnchor="middle"
          fill="#141414"
        >
          Just
        </text>
        <text
          x="340"
          y="184"
          fontFamily="var(--font-hand), 'Patrick Hand', cursive"
          fontSize="12.5"
          fontWeight="700"
          textAnchor="middle"
          fill="#141414"
        >
          waiting.
        </text>

        {/* Shadow base under tombstone */}
        <path
          d="M310 220 C 320 228, 360 228, 370 220"
          stroke="#141414"
          strokeWidth="2"
          fill="none"
        />
      </g>

      {/* Dense Grass Tufts around the base of tombstone matching screenshot */}
      <g stroke="#141414" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M295 220 L 298 206 L 302 222 L 306 204 L 310 224" />
        <path d="M308 224 L 312 208 L 316 226 L 320 205 L 324 225" />
        <path d="M322 225 L 327 210 L 332 226 L 338 207 L 344 226" />
        <path d="M342 226 L 347 212 L 352 227 L 358 209 L 364 225" />
        <path d="M362 225 L 366 208 L 371 226 L 376 205 L 382 223" />
        <path d="M380 223 L 385 210 L 390 225 L 395 212 L 400 224" />
        <path d="M398 224 L 404 214 L 409 225 L 415 218 L 420 225" />
      </g>

      {/* Ground dots / pebble textures */}
      <circle cx="280" cy="205" r="1" fill="#141414" />
      <circle cx="286" cy="208" r="0.8" fill="#141414" />
      <circle cx="370" cy="180" r="0.8" fill="#141414" />
      <circle cx="375" cy="183" r="1" fill="#141414" />
      <circle cx="410" cy="185" r="1" fill="#141414" />
      <circle cx="414" cy="188" r="0.8" fill="#141414" />
    </svg>
  );
}
