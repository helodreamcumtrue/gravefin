import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProjectCard from '../components/ProjectCard';
import { useApp } from '../context/AppContext';
import { getLocalProjects } from '../lib/mockFallback';
import {
  Compass,
  LayoutGrid,
  Filter,
  Sparkles,
  Search,
  SlidersHorizontal,
  X
} from 'lucide-react';

const CATEGORIES = ['Any', 'Web', 'Mobile', 'AI/ML', 'IoT', 'DevTools', 'Education', 'Web3', 'Security'];
const STATUSES = [
  { value: 'Any', label: 'All Artifacts' },
  { value: 'LISTED', label: 'Available to Claim' },
  { value: 'ACTIVE', label: 'Active in Escrow' },
  { value: 'SUBMITTED', label: 'Work Submitted' },
  { value: 'COMPLETED', label: 'Revival Complete' }
];

export default function Browse() {
  const router = useRouter();
  const { campusMode } = useApp();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Any');
  const [status, setStatus] = useState('Any');
  const [maxStake, setMaxStake] = useState('Any');
  const [sort, setSort] = useState('recent');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const q = router.query.q || router.query.search;
    if (typeof q === 'string') {
      setSearch(q);
    }
  }, [router.query.q, router.query.search]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
        return;
      }
    } catch (err) {
      // In static / GitHub Pages demo mode
    }
    setProjects(getLocalProjects());
    setLoading(false);
  };

  const filteredProjects = useMemo(() => {
    let list = [...projects];

    // Campus mode filter
    if (campusMode) {
      list = list.filter(
        (p) =>
          p.district === 'Campus Graveyard' ||
          p.category === 'Education' ||
          (p.owner && p.owner.email && p.owner.email.endsWith('.edu'))
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          (typeof p.techTags === 'string' && p.techTags.toLowerCase().includes(q)) ||
          (p.owner && p.owner.alias?.toLowerCase().includes(q))
      );
    }

    if (category !== 'Any') {
      list = list.filter((p) => p.category === category || p.domainCategory === category);
    }

    if (status !== 'Any') {
      list = list.filter((p) => p.status === status);
    }

    if (maxStake !== 'Any') {
      const limit = Number(maxStake);
      list = list.filter((p) => (p.stakeRequired || 0) <= limit);
    }

    switch (sort) {
      case 'stakeAsc':
        list.sort((a, b) => (a.stakeRequired || 0) - (b.stakeRequired || 0));
        break;
      case 'stakeDesc':
        list.sort((a, b) => (b.stakeRequired || 0) - (a.stakeRequired || 0));
        break;
      case 'completion':
        list.sort((a, b) => (b.completion || b.revivalScore?.overallScore || 0) - (a.completion || a.revivalScore?.overallScore || 0));
        break;
      case 'recent':
      default:
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
    }

    return list;
  }, [projects, search, category, status, maxStake, sort, campusMode]);

  const FilterSidebar = (
    <div
      className="sketch-card-static"
      style={{
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        backgroundColor: 'var(--color-paper)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1.5px solid rgba(17, 17, 17, 0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter style={{ width: 16, height: 16 }} />
          <span style={{ fontFamily: 'var(--font-hand)', fontSize: 22, fontWeight: 700, color: 'var(--color-ink)' }}>
            Filter Catalog
          </span>
        </div>
        {(category !== 'Any' || status !== 'Any' || maxStake !== 'Any' || search) && (
          <button
            onClick={() => {
              setCategory('Any');
              setStatus('Any');
              setMaxStake('Any');
              setSearch('');
            }}
            style={{ fontSize: 11, fontFamily: 'var(--font-mono)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', textDecoration: 'underline' }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div>
        <label style={{ display: 'block', fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
          Domain Category
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {CATEGORIES.map((c) => {
            const isSelected = category === c;
            return (
              <label
                key={c}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  fontWeight: isSelected ? 700 : 500,
                  color: 'var(--color-ink)',
                  cursor: 'pointer',
                  padding: '2px 0'
                }}
              >
                <input
                  type="radio"
                  name="category"
                  checked={isSelected}
                  onChange={() => setCategory(c)}
                  style={{ accentColor: 'var(--color-ink)' }}
                />
                <span>{c}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Status Filter */}
      <div style={{ paddingTop: 10, borderTop: '1px solid rgba(17, 17, 17, 0.1)' }}>
        <label style={{ display: 'block', fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
          Escrow Status
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {STATUSES.map((s) => {
            const isSelected = status === s.value;
            return (
              <label
                key={s.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  fontWeight: isSelected ? 700 : 500,
                  color: 'var(--color-ink)',
                  cursor: 'pointer',
                  padding: '2px 0'
                }}
              >
                <input
                  type="radio"
                  name="status"
                  checked={isSelected}
                  onChange={() => setStatus(s.value)}
                  style={{ accentColor: 'var(--color-ink)' }}
                />
                <span>{s.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Maximum Required Stake Filter */}
      <div style={{ paddingTop: 10, borderTop: '1px solid rgba(17, 17, 17, 0.1)' }}>
        <label style={{ display: 'block', fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
          Stake Ceiling
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['Any', '50', '100', '150'].map((stake) => (
            <button
              key={stake}
              onClick={() => setMaxStake(stake)}
              className="sketch-btn"
              style={{
                padding: '3px 10px',
                fontSize: 11.5,
                fontFamily: 'var(--font-mono)',
                backgroundColor: maxStake === stake ? 'var(--color-ink)' : 'var(--color-paper)',
                color: maxStake === stake ? 'var(--color-paper)' : 'var(--color-ink)'
              }}
            >
              {stake === 'Any' ? 'Any' : `≤ ${stake} cr`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Head>
        <title>Archival Collections — Digital Graveyard</title>
        <meta
          name="description"
          content="Explore the preservation catalog of abandoned student and open-source software artifacts."
        />
      </Head>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Top Header & View Mode Switcher */}
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
              {campusMode ? 'CAMPUS GRAVEYARD ARCHIVE' : 'OPEN PRESERVATION CATALOG'}
            </span>
            <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: 38, fontWeight: 700, margin: '2px 0 0', color: 'var(--color-ink)' }}>
              ARCHIVAL COLLECTIONS
            </h1>
          </div>

          {/* View Mode Toggle: Grid vs Map */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
              <LayoutGrid style={{ width: 14, height: 14 }} />
              <span>Catalog Grid</span>
            </span>

            <Link
              href="/browse/map"
              className="sketch-btn"
              style={{
                padding: '6px 14px',
                fontSize: 13,
                fontFamily: 'var(--font-mono)',
                textDecoration: 'none',
                gap: 6
              }}
            >
              <Compass style={{ width: 14, height: 14 }} />
              <span>Cartography Map</span>
            </Link>
          </div>
        </div>

        {/* Search Bar & Sort Row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search
              style={{
                width: 16,
                height: 16,
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-ink)'
              }}
            />
            <input
              type="text"
              placeholder="Search by title, technology, or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sketch-input"
              style={{
                width: '100%',
                paddingLeft: 36,
                paddingRight: 12,
                paddingTop: 8,
                paddingBottom: 8,
                fontSize: 13.5
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Mobile Filter Toggle Button */}
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="sketch-btn hide-desktop"
              style={{ padding: '8px 14px', fontSize: 13, gap: 6 }}
            >
              <SlidersHorizontal style={{ width: 14, height: 14 }} />
              <span>Filters</span>
            </button>

            {/* Sort Select */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="sketch-btn"
              style={{
                padding: '8px 14px',
                fontSize: 13,
                fontFamily: 'var(--font-mono)',
                outline: 'none'
              }}
            >
              <option value="recent">Recently Archived</option>
              <option value="completion">Highest Revival Potential</option>
              <option value="stakeAsc">Lowest Stake First</option>
              <option value="stakeDesc">Highest Stake First</option>
            </select>
          </div>
        </div>

        {/* Mobile Filter Modal */}
        {mobileFilterOpen && (
          <div className="modal-backdrop" onClick={() => setMobileFilterOpen(false)}>
            <div className="modal-sketch" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: 24, margin: 0 }}>Filter Artifacts</h3>
                <button onClick={() => setMobileFilterOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>
              {FilterSidebar}
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="sketch-btn-primary"
                style={{ width: '100%', marginTop: 16, padding: '10px 0', fontFamily: 'var(--font-hand)', fontSize: 20 }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Main 2-Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 28, alignItems: 'start' }}>
          {/* Desktop Filter Sidebar */}
          <div className="hide-mobile">
            {FilterSidebar}
          </div>

          {/* Projects Catalog Grid */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'rgba(17, 17, 17, 0.7)' }}>
                Showing {filteredProjects.length} preserved artifact{filteredProjects.length === 1 ? '' : 's'}
              </span>
            </div>

            {filteredProjects.length === 0 ? (
              <div
                className="sketch-card-static"
                style={{
                  padding: 48,
                  textAlign: 'center',
                  color: 'rgba(17, 17, 17, 0.6)'
                }}
              >
                <Compass style={{ width: 44, height: 44, strokeWidth: 1.5, marginBottom: 12 }} />
                <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: 26, margin: '0 0 6px', color: 'var(--color-ink)' }}>
                  No preserved artifacts found
                </h3>
                <p style={{ fontSize: 13, fontFamily: 'var(--font-mono)', margin: 0 }}>
                  Try adjusting your search query, clearing filters, or switching off Campus mode.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {filteredProjects.map((project, idx) => (
                  <ProjectCard key={project.id} project={project} index={idx} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
