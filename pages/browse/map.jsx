import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import GraveyardMap from '../../components/GraveyardMap';
import { useApp } from '../../context/AppContext';
import { getLocalProjects } from '../../lib/mockFallback';
import { Compass, LayoutGrid, Sparkles } from 'lucide-react';

export default function CartographyMapPage() {
  const { campusMode } = useApp();
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

  const displayedProjects = useMemo(() => {
    if (!campusMode) return projects;
    return projects.filter(
      (p) =>
        p.district === 'Campus Graveyard' ||
        p.category === 'Education' ||
        (p.owner && p.owner.email && p.owner.email.endsWith('.edu'))
    );
  }, [projects, campusMode]);

  return (
    <>
      <Head>
        <title>Graveyard Quadrant Map — Digital Graveyard</title>
        <meta name="description" content="Interactive 2D Cartesian quadrant map plotting software revival potential against excavation depth." />
      </Head>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Navigation Breadcrumb / Mode Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link
              href="/browse"
              className="sketch-btn"
              style={{ padding: '6px 14px', fontSize: 13, textDecoration: 'none', gap: 6 }}
            >
              <LayoutGrid style={{ width: 14, height: 14 }} />
              <span>Catalog Grid View</span>
            </Link>

            <span
              className="sketch-tag"
              style={{
                padding: '6px 14px',
                fontSize: 13,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                backgroundColor: 'var(--color-ink)',
                color: 'var(--color-paper)',
                gap: 6
              }}
            >
              <Compass style={{ width: 14, height: 14 }} />
              <span>Cartography View</span>
            </span>
          </div>

          {campusMode && (
            <div className="sketch-tag" style={{ padding: '4px 10px', fontSize: 11.5, fontFamily: 'var(--font-mono)', gap: 5 }}>
              <Sparkles style={{ width: 13, height: 13 }} />
              <span>Campus District Filter Active</span>
            </div>
          )}
        </div>

        {/* Map Component */}
        <GraveyardMap projects={displayedProjects} />
      </div>
    </>
  );
}
