import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import ProjectCard from '../components/ProjectCard';
import Icon from '../components/Icons';

const CATEGORIES = ['Any', 'Web', 'Mobile', 'AI/ML', 'IoT', 'Game', 'Cybersecurity'];
const STATUSES = [
  { value: 'Any', label: 'All Statuses' },
  { value: 'LISTED', label: 'Available to Claim' },
  { value: 'ACTIVE', label: 'Active in Escrow' },
  { value: 'SUBMITTED', label: 'Work Submitted' },
  { value: 'COMPLETED', label: 'Completed' }
];

export default function Browse() {
  const router = useRouter();
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
    if (router.query.search) {
      setSearch(router.query.search);
    }
  }, [router.query.search]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    let list = [...projects];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.techTags.toLowerCase().includes(q) ||
        (p.owner && p.owner.alias.toLowerCase().includes(q))
      );
    }

    if (category !== 'Any') {
      list = list.filter(p => p.category === category);
    }

    if (status !== 'Any') {
      list = list.filter(p => p.status === status);
    }

    if (maxStake !== 'Any') {
      const limit = Number(maxStake);
      list = list.filter(p => p.stakeRequired <= limit);
    }

    switch (sort) {
      case 'stakeAsc':
        list.sort((a, b) => a.stakeRequired - b.stakeRequired);
        break;
      case 'stakeDesc':
        list.sort((a, b) => b.stakeRequired - a.stakeRequired);
        break;
      case 'completion':
        list.sort((a, b) => b.completion - a.completion);
        break;
      case 'recent':
      default:
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    return list;
  }, [projects, search, category, status, maxStake, sort]);

  const FilterSidebar = (
    <div
      style={{
        background: '#FFFFFF',
        border: '2px solid var(--border)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: 'var(--shadow-sketch)',
        display: 'flex',
        flexDirection: 'column',
        gap: 22
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottom: '1.5px solid var(--border)' }}>
        <Icon name="filter" size={16} />
        <span style={{ fontWeight: 800, fontSize: 15, fontFamily: 'var(--font-display)' }}>Filter Graveyard</span>
      </div>

      {/* Category Filter */}
      <div>
        <label className="label" style={{ fontSize: 13 }}>Category</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {CATEGORIES.map(c => {
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
                  color: isSelected ? 'var(--text)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '3px 0'
                }}
              >
                <input
                  type="radio"
                  name="category"
                  checked={isSelected}
                  onChange={() => setCategory(c)}
                  style={{ accentColor: '#141414' }}
                />
                {c}
              </label>
            );
          })}
        </div>
      </div>

      {/* Status Filter */}
      <div>
        <label className="label" style={{ fontSize: 13 }}>Project Status</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {STATUSES.map(s => {
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
                  color: isSelected ? 'var(--text)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '3px 0'
                }}
              >
                <input
                  type="radio"
                  name="status"
                  checked={isSelected}
                  onChange={() => setStatus(s.value)}
                  style={{ accentColor: '#141414' }}
                />
                {s.label}
              </label>
            );
          })}
        </div>
      </div>

      {/* Stake Requirement */}
      <div>
        <label className="label" style={{ fontSize: 13 }}>Max Stake Required</label>
        <select
          className="input"
          value={maxStake}
          onChange={e => setMaxStake(e.target.value)}
          style={{ fontSize: 13, cursor: 'pointer' }}
        >
          <option value="Any">Any Stake Amount</option>
          <option value="80">Up to 80 Credits</option>
          <option value="100">Up to 100 Credits</option>
          <option value="150">Up to 150 Credits</option>
        </select>
      </div>

      {/* Clear Filters */}
      <button
        className="btn btn-outline btn-sm"
        style={{ width: '100%', fontSize: 12.5 }}
        onClick={() => {
          setSearch('');
          setCategory('Any');
          setStatus('Any');
          setMaxStake('Any');
          setSort('recent');
        }}
      >
        Clear all filters
      </button>
    </div>
  );

  return (
    <div className="container" style={{ padding: '36px 0 70px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 32, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.03em' }}>
            Explore the Graveyard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14.5, margin: 0 }}>
            Inspect abandoned codebases, required escrow stakes, and claim projects to revive.
          </p>
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dim)' }}>
          {loading ? 'Scanning graveyard...' : `${filteredProjects.length} codebase${filteredProjects.length !== 1 ? 's' : ''} available`}
        </div>
      </div>

      {/* Search & Sort Controls Bar */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 28,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-dim)' }}>
            <Icon name="search" size={16} />
          </span>
          <input
            className="input"
            style={{
              paddingLeft: 42,
              height: 42,
              borderRadius: '12px',
              boxShadow: '1.5px 2px 0px #141414'
            }}
            placeholder="Search by title, tags (React, Next.js, Python), or owner alias..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <button
          className="btn btn-outline hide-desktop"
          onClick={() => setMobileFilterOpen(true)}
          style={{ height: 42 }}
        >
          <Icon name="filter" size={15} /> Filters
        </button>

        <select
          className="input"
          style={{
            width: 230,
            height: 42,
            borderRadius: '12px',
            boxShadow: '1.5px 2px 0px #141414',
            cursor: 'pointer'
          }}
          value={sort}
          onChange={e => setSort(e.target.value)}
        >
          <option value="recent">Sort: Most Recent</option>
          <option value="stakeAsc">Sort: Lowest Stake First</option>
          <option value="stakeDesc">Sort: Highest Stake First</option>
          <option value="completion">Sort: Highest Completion %</option>
        </select>
      </div>

      {/* Main Grid & Filters Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 32, alignItems: 'start' }}>
        <aside className="hide-mobile">{FilterSidebar}</aside>

        <div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="tombstone-card" style={{ height: 260, opacity: 0.5, animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '60px 24px',
                background: '#FFFFFF',
                borderRadius: '18px'
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  border: '2px solid var(--border)',
                  borderRadius: '50%',
                  background: '#F4EFE6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                  boxShadow: '2px 2px 0px #141414'
                }}
              >
                <Icon name="tombstone" size={24} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', margin: '0 0 8px' }}>
                No matching codebases found
              </h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', maxWidth: 380, margin: '0 auto 20px', lineHeight: 1.5 }}>
                Try loosening your search terms or resetting filters to browse all abandoned projects.
              </p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setSearch('');
                  setCategory('Any');
                  setStatus('Any');
                  setMaxStake('Any');
                }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
              {filteredProjects.map(p => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {mobileFilterOpen && (
        <div className="modal-backdrop" onClick={() => setMobileFilterOpen(false)}>
          <div className="modal-sketch" style={{ maxWidth: 360, padding: 22 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontWeight: 800, fontSize: 17, fontFamily: 'var(--font-display)' }}>Filter Projects</span>
              <button className="btn-icon btn-ghost" onClick={() => setMobileFilterOpen(false)}>
                <Icon name="close" size={18} />
              </button>
            </div>
            {FilterSidebar}
            <button
              className="btn btn-primary btn-block"
              style={{ marginTop: 18 }}
              onClick={() => setMobileFilterOpen(false)}
            >
              Show {filteredProjects.length} Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
