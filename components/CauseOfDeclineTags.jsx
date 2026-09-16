import React from 'react';

export default function CauseOfDeclineTags({ tags = [] }) {
  const getLabelAndIcon = (tag) => {
    switch (tag) {
      case 'funding':
        return { label: 'Funding Exhaustion', icon: '💸' };
      case 'graduation':
        return { label: 'Academic Graduation', icon: '🎓' };
      case 'team-separation':
        return { label: 'Team Separation', icon: '👥' };
      case 'time-constraints':
        return { label: 'Time Constraints', icon: '⏳' };
      case 'loss-of-interest':
        return { label: 'Loss of Interest', icon: '🍃' };
      case 'technical-debt':
        return { label: 'Technical Debt', icon: '⚙️' };
      case 'market-shift':
        return { label: 'Market Dynamics', icon: '📉' };
      default:
        return { label: tag, icon: '📌' };
    }
  };

  const tagList = tags.length > 0 ? tags : ['graduation', 'time-constraints'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(17, 17, 17, 0.65)' }}>
        Primary Cause of Decline
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {tagList.map((tag) => {
          const { label, icon } = getLabelAndIcon(tag);
          return (
            <span
              key={tag}
              className="sketch-tag"
              style={{
                padding: '4px 10px',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                fontWeight: 500,
                color: 'var(--color-ink)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
