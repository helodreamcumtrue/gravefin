import React from 'react';

export default function Icon({ name, size = 18, strokeWidth = 2, className = '' }) {
  const p = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  };

  const paths = {
    tombstone: (
      <>
        <path d="M5 21h14" {...p} />
        <path d="M7 21V9a5 5 0 0 1 10 0v12" {...p} />
        <path d="M12 8v6M10 10h4" {...p} />
      </>
    ),
    tombstoneArch: (
      <>
        <path d="M4 21h16" {...p} />
        <path d="M6 21V9a6 6 0 0 1 12 0v12" {...p} />
        <circle cx="12" cy="12" r="2" {...p} />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" {...p} />
        <path d="M21 21l-4.3-4.3" {...p} />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" {...p} />
        <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" {...p} />
      </>
    ),
    userCircle: (
      <>
        <circle cx="12" cy="12" r="10" {...p} />
        <circle cx="12" cy="9" r="3" {...p} />
        <path d="M6.5 19a6 6 0 0 1 11 0" {...p} />
      </>
    ),
    arrowRight: (
      <>
        <path d="M5 12h14" {...p} />
        <path d="M13 6l6 6-6 6" {...p} />
      </>
    ),
    check: <path d="M20 6L9 17l-5-5" {...p} />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" {...p} />
        <polyline points="12 6 12 12 16 14" {...p} />
      </>
    ),
    coin: (
      <>
        <circle cx="12" cy="12" r="9" {...p} />
        <path d="M12 7v10M15 9.5a2.5 2.5 0 0 0-5 0c0 3 5 2 5 5a2.5 2.5 0 0 1-5 0" {...p} />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" {...p} />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" {...p} />
      </>
    ),
    shield: <path d="M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6z" {...p} />,
    activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" {...p} />,
    download: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" {...p} />
        <polyline points="7 10 12 15 17 10" {...p} />
        <line x1="12" y1="15" x2="12" y2="3" {...p} />
      </>
    ),
    upload: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" {...p} />
        <polyline points="17 8 12 3 7 8" {...p} />
        <line x1="12" y1="3" x2="12" y2="15" {...p} />
      </>
    ),
    close: (
      <>
        <path d="M18 6L6 18" {...p} />
        <path d="M6 6l12 12" {...p} />
      </>
    ),
    menu: (
      <>
        <path d="M3 6h18" {...p} />
        <path d="M3 12h18" {...p} />
        <path d="M3 18h18" {...p} />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" {...p} />
        <path d="M5 12h14" {...p} />
      </>
    ),
    chevronDown: <path d="M6 9l6 6 6-6" {...p} />,
    chevronLeft: <path d="M15 18l-6-6 6-6" {...p} />,
    alertTriangle: (
      <>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" {...p} />
        <line x1="12" y1="9" x2="12" y2="13" {...p} />
        <line x1="12" y1="17" x2="12.01" y2="17" {...p} />
      </>
    ),
    layers: (
      <>
        <path d="M12 2l9 5-9 5-9-5z" {...p} />
        <path d="M3 12l9 5 9-5" {...p} />
        <path d="M3 17l9 5 9-5" {...p} />
      </>
    ),
    star: <path d="M12 2.5l2.9 6.2 6.6.7-5 4.6 1.4 6.6-5.9-3.4-5.9 3.4 1.4-6.6-5-4.6 6.6-.7z" {...p} />,
    logOut: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" {...p} />
        <polyline points="16 17 21 12 16 7" {...p} />
        <line x1="21" y1="12" x2="9" y2="12" {...p} />
      </>
    )
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      {paths[name] || null}
    </svg>
  );
}
