import React, { useState } from 'react';
import { GitCommit, ShieldCheck, ChevronDown, ChevronUp, Link as LinkIcon } from 'lucide-react';

export default function ProvenanceTimeline({ nodes = [] }) {
  const defaultNodes = [
    {
      id: 'prov_1',
      hash: '0x3a8f7129b0cd4',
      timestamp: new Date(Date.now() - 120 * 86400000).toISOString(),
      eventType: 'created',
      actorName: 'Original Creator',
      actorRole: 'Maintainer',
      note: 'Initial repository commit and prototype deployment.'
    },
    {
      id: 'prov_2',
      hash: '0x94de8812af031',
      timestamp: new Date(Date.now() - 45 * 86400000).toISOString(),
      eventType: 'listed',
      actorName: 'Curator',
      actorRole: 'Owner',
      note: 'Archived to Digital Graveyard with open escrow stake requirement.'
    }
  ];

  const timelineNodes = nodes && nodes.length > 0 ? nodes : defaultNodes;
  const [expandedId, setExpandedId] = useState(timelineNodes[timelineNodes.length - 1]?.id || null);

  return (
    <div className="sketch-card-static" style={{ padding: 24, position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 14,
          marginBottom: 20,
          borderBottom: '2px solid rgba(17, 17, 17, 0.12)'
        }}
      >
        <div>
          <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--color-ink)' }}>
            Provenance Timeline
          </h3>
          <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(17, 17, 17, 0.65)', margin: '2px 0 0' }}>
            Append-only ownership chain & cryptographic hashes
          </p>
        </div>

        <span className="sketch-tag" style={{ padding: '4px 10px', fontSize: 11.5, fontFamily: 'var(--font-mono)', fontWeight: 700, gap: 5 }}>
          <ShieldCheck style={{ width: 14, height: 14, color: 'var(--color-ink)' }} />
          <span>Verified Ledger</span>
        </span>
      </div>

      {/* Vertical Timeline Chain */}
      <div
        style={{
          position: 'relative',
          paddingLeft: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        {/* Timeline vertical stem */}
        <div
          style={{
            position: 'absolute',
            left: 11,
            top: 10,
            bottom: 10,
            width: 2,
            backgroundColor: 'var(--color-ink)'
          }}
        />

        {timelineNodes.map((node, index) => {
          const isExpanded = expandedId === node.id;
          const isLast = index === timelineNodes.length - 1;

          return (
            <div key={node.id} style={{ position: 'relative' }}>
              {/* Chain Node Marker */}
              <div
                style={{
                  position: 'absolute',
                  left: -23,
                  top: 8,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  border: '2px solid var(--color-ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isLast ? 'var(--color-ink)' : 'var(--color-paper)',
                  color: isLast ? 'var(--color-paper)' : 'var(--color-ink)',
                  zIndex: 2
                }}
              >
                <GitCommit style={{ width: 12, height: 12 }} />
              </div>

              {/* Node Card */}
              <div
                className="sketch-card-static"
                style={{
                  padding: 14,
                  backgroundColor: 'var(--color-paper)',
                  cursor: 'pointer'
                }}
                onClick={() => setExpandedId(isExpanded ? null : node.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span
                      className="sketch-tag"
                      style={{
                        padding: '2px 6px',
                        fontSize: 10,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}
                    >
                      {node.eventType}
                    </span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13.5, color: 'var(--color-ink)' }}>
                      {node.actorName}
                    </span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(17, 17, 17, 0.6)' }}>
                      ({node.actorRole})
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(17, 17, 17, 0.7)' }}>
                      {new Date(node.timestamp).toLocaleDateString()}
                    </span>
                    {isExpanded ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
                  </div>
                </div>

                {isExpanded && (
                  <div
                    style={{
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: '1px solid rgba(17, 17, 17, 0.12)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      fontSize: 11.5,
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(17, 17, 17, 0.85)' }}>
                      <LinkIcon style={{ width: 12, height: 12, flexShrink: 0 }} />
                      <span style={{ fontWeight: 700 }}>Hash:</span>
                      <code
                        style={{
                          backgroundColor: 'var(--color-paper-dark)',
                          padding: '1px 6px',
                          borderRadius: 4,
                          border: '1px solid rgba(17, 17, 17, 0.2)'
                        }}
                      >
                        {node.hash}
                      </code>
                    </div>

                    <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'rgba(17, 17, 17, 0.9)' }}>
                      {node.note}
                    </p>

                    {node.priorHashRef && (
                      <p style={{ margin: 0, fontSize: 10.5, color: 'rgba(17, 17, 17, 0.6)' }}>
                        Parent Ref: <span style={{ fontFamily: 'var(--font-mono)' }}>{node.priorHashRef}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
