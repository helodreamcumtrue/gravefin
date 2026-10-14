import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useApp } from '../context/AppContext';
import {
  Code2,
  Play,
  Copy,
  Check,
  ExternalLink,
  Database,
  Terminal,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const PRESET_QUERIES = [
  {
    id: 'catalog',
    name: '1. Catalog & Autopsies',
    description: 'Fetch projects, tech tags, revival scores, and autopsy causes',
    query: `query GetProjectsWithAutopsies {
  projects(limit: 5) {
    id
    title
    category
    status
    stakeRequired
    techTags
    revivalScore
    revivalDetails {
      overallScore
      effortEstimate
    }
    autopsy {
      cause
      status
      difficulty
    }
    owner {
      alias
      reputation
    }
  }
}`
  },
  {
    id: 'leaderboard',
    name: '2. Diggers & Leaderboard',
    description: 'Query top-ranked Diggers, credits, reputation, and strikes',
    query: `query GetCommunityLeaderboard {
  leaderboard(limit: 5) {
    id
    alias
    credits
    reputation
    ghostStrikes
    banned
  }
  systemStats {
    totalProjects
    totalResurrections
    totalCreditsStaked
    averageRevivalScore
  }
}`
  },
  {
    id: 'ledger',
    name: '3. Immutable Ledger Audit',
    description: 'Inspect append-only transaction trail across users',
    query: `query AuditLedger {
  ledgerEntries(limit: 10) {
    id
    type
    amount
    notes
    createdAt
    user {
      alias
    }
  }
}`
  },
  {
    id: 'cron',
    name: '4. Simulation Cron Mutation',
    description: 'Simulate +7 days timeout sweep deterministically',
    query: `mutation SimulateProtocolTimeouts {
  triggerTimeoutCheck(secret: "graveyard_secret_key", simulateDaysElapsed: 7) {
    success
    effectiveDate
    events
    summary
  }
}`
  }
];

export default function GraphQLExplorer() {
  const { currentUser, addToast } = useApp();
  const [selectedPreset, setSelectedPreset] = useState(PRESET_QUERIES[0].id);
  const [queryString, setQueryString] = useState(PRESET_QUERIES[0].query);
  const [resultString, setResultString] = useState('');
  const [loading, setLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset.id);
    setQueryString(preset.query);
  };

  const handleRunQuery = async () => {
    try {
      setLoading(true);
      const start = performance.now();

      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentUser ? { 'x-user-id': currentUser.id } : {})
        },
        body: JSON.stringify({ query: queryString })
      });

      const data = await res.json();
      const elapsed = Math.round(performance.now() - start);
      setExecutionTime(elapsed);
      setResultString(JSON.stringify(data, null, 2));

      if (data.errors) {
        addToast(`Query returned with ${data.errors.length} error(s)`, 'error');
      } else {
        addToast(`GraphQL executed in ${elapsed}ms`, 'success');
      }
    } catch (err) {
      setResultString(JSON.stringify({ error: err.message }, null, 2));
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultString || queryString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast('Copied to clipboard!', 'info');
  };

  return (
    <>
      <Head>
        <title>GraphQL API Explorer — Project Graveyard</title>
        <meta name="description" content="Interactive GraphQL protocol explorer for Project Graveyard datasets and mutations." />
      </Head>

      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, padding: '20px 0 60px' }}>
        {/* Header Banner */}
        <div
          style={{
            background: 'var(--paper)',
            border: '2px solid var(--border)',
            borderRadius: 14,
            padding: '24px 28px',
            boxShadow: '4px 4px 0px var(--border)',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--ink)', color: '#FFFFFF', borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              <Code2 size={13} /> GraphQL Yoga Engine v5
            </div>
            <h1 className="font-display" style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800 }}>
              Gravefin GraphQL Protocol Explorer
            </h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>
              Query dead code specimens, verify escrow transactions, inspect immutable ledgers, and trigger mutations.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <a
              href="/api/graphql"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
            >
              <span>Launch GraphiQL IDE</span>
              <ExternalLink size={14} />
            </a>
            <button
              onClick={handleRunQuery}
              disabled={loading}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 18px' }}
            >
              <Play size={14} fill="currentColor" />
              <span>{loading ? 'Running...' : 'Execute Query'}</span>
            </button>
          </div>
        </div>

        {/* Preset Selector */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {PRESET_QUERIES.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              style={{
                background: selectedPreset === preset.id ? 'var(--ink)' : 'var(--paper)',
                color: selectedPreset === preset.id ? '#FFFFFF' : 'var(--ink)',
                border: '1.8px solid var(--border)',
                borderRadius: 10,
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: selectedPreset === preset.id ? '2px 2px 0px rgba(0,0,0,0.3)' : '2px 2px 0px var(--border)',
                transition: 'all 0.15s ease'
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* 2-Column Split: Query Editor vs Output */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 20 }}>
          {/* Query Editor */}
          <div
            style={{
              background: 'var(--paper)',
              border: '2px solid var(--border)',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '3px 3px 0px var(--border)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                background: 'rgba(0,0,0,0.03)',
                borderBottom: '1.5px solid var(--border)',
                padding: '10px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}>
                <Terminal size={15} />
                <span>GraphQL Request Document</span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>POST /api/graphql</span>
            </div>

            <textarea
              value={queryString}
              onChange={(e) => setQueryString(e.target.value)}
              spellCheck="false"
              rows={18}
              style={{
                width: '100%',
                padding: 16,
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: 13.5,
                lineHeight: 1.5,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* JSON Output Viewer */}
          <div
            style={{
              background: '#181A1B',
              color: '#E0E0E0',
              border: '2px solid var(--border)',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '3px 3px 0px var(--border)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                background: '#111213',
                borderBottom: '1px solid #333',
                padding: '10px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#A0D090' }}>
                <Database size={15} />
                <span>JSON Response {executionTime ? `(${executionTime}ms)` : ''}</span>
              </div>

              {resultString && (
                <button
                  onClick={handleCopy}
                  style={{
                    background: 'transparent',
                    border: '1px solid #444',
                    color: '#AAA',
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  {copied ? <Check size={12} color="#A0D090" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            <pre
              style={{
                margin: 0,
                padding: 16,
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: 12.5,
                lineHeight: 1.5,
                overflowX: 'auto',
                height: '100%',
                minHeight: 380,
                color: '#89D989'
              }}
            >
              {resultString || '// Click "Execute Query" above to fetch live data from /api/graphql'}
            </pre>
          </div>
        </div>

        {/* Schema Capabilities Reference */}
        <div
          style={{
            background: 'var(--paper)',
            border: '2px solid var(--border)',
            borderRadius: 12,
            padding: 20,
            boxShadow: '3px 3px 0px var(--border)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Layers size={18} />
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Available GraphQL Types & Relationships</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            <div style={{ background: '#FFF', border: '1.5px solid var(--border)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#8A4F1D' }}>type Project</div>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                Fields: <code>id, title, status, stakeRequired, techTags, revivalScore, autopsy, owner, commitments</code>
              </p>
            </div>
            <div style={{ background: '#FFF', border: '1.5px solid var(--border)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#2B5E28' }}>type Commitment</div>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                Fields: <code>id, status, stakeLocked, ghostDeadlineAt, submissionNotes, milestones, taker</code>
              </p>
            </div>
            <div style={{ background: '#FFF', border: '1.5px solid var(--border)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1E40AF' }}>type User</div>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                Fields: <code>id, alias, credits, reputation, ghostStrikes, ownedProjects, commitments, ledgerEntries</code>
              </p>
            </div>
            <div style={{ background: '#FFF', border: '1.5px solid var(--border)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#6B21A8' }}>type LedgerEntry</div>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                Fields: <code>id, type, amount, relatedProjectId, notes, createdAt, user</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
