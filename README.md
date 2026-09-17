# 🪦 Gravefin / Project Graveyard

> *"A blind, escrow-backed marketplace for finishing other people's abandoned code."*

Gravefin is a production-grade, trustless marketplace that resurrects abandoned student and developer side projects. Owners list dead repositories with a credit stake requirement; anonymous Diggers claim the codebase, lock their skin-in-the-game collateral in escrow, finish the code, and claim platform rewards upon verified delivery.

---

## ⚡ Key Highlights

- **Adversarial-Safe Architecture**: Assume zero trust between users. The backend and the append-only ledger are the only enforcers.
- **Strict Anonymity**: Cross-user identifiers are randomly generated aliases (e.g. `Digger-1042`, `Digger-2099`). Real emails and contact info are private and never exposed to other users or public endpoints.
- **HMAC SHA-256 Session Authentication**: Cryptographic session tokens stored in secure, `HttpOnly` cookies.
- **Zero In-App Chat**: No chat or DMs. Eliminates subjective arguments, off-platform harassment, and bribery.
- **Points-Based Escrow Economy**: Staking platform credits sidesteps financial/PCI compliance while enforcing skin-in-the-game commitment.
- **Append-Only Immutable Ledger (`LedgerEntry`)**: Every stake lock, forfeiture, refund, reward, and penalty is permanently recorded with full auditability.
- **Deterministic Automated Timeout Resolution**:
  - **Taker Inactive (>14 days)** $\rightarrow$ Escrow forfeited to Owner, Taker −20 rep, +1 strike, codebase relisted.
  - **Owner Ghosting (>7 days without review)** $\rightarrow$ Auto-completed, Taker refunded + rewarded, Owner −10 rep, +1 strike.
  - **3 Ghost Strikes** $\rightarrow$ Account automatically restricted from creating listings or claiming projects.
- **Interactive Protocol Sandbox (`/simulator`)**: Built-in visual simulation console to fast-forward time (+7d, +14d, +30d) and trigger automated cron resolution on demand.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (Pages Router)
- **Frontend**: React 18 with Parchment Desk & Hand-Drawn Sketch Design Tokens (`Patrick Hand`, `Architects Daughter`, `Inter`)
- **Visual Features**: 2D Excavation Cartography Quadrant Map, Forensic Autopsies, Provenance Timelines, Archivist Workbench, Community Leaderboards
- **Database / ORM**: Prisma ORM with Neon Serverless PostgreSQL & local fallback
- **Security**: Bcrypt password hashing, HMAC SHA-256 session signatures, HttpOnly cookie serialization

---

## 📁 Streamlined Repository Structure

```
├── components/          # Reusable UI components
│   ├── AutopsyChart.jsx       # Forensic autopsy report & Cause of Decline diagnostic badges
│   ├── EscrowStatusBanner.jsx # Real-time state machine progress header
│   ├── Footer.jsx             # Digital Graveyard archive footer
│   ├── GraveyardMap.jsx       # 2D Cartesian excavation quadrant map
│   ├── HandoverChecklist.jsx  # Dual sign-off protocol, blooming tree, & MilestoneTracker
│   ├── Icons.jsx              # Hand-drawn SVG icon suite
│   ├── Navbar.jsx             # Archive navigation, active persona pill, & campus toggle
│   ├── ProjectCard.jsx        # Tombstone card with headstone frame & health score
│   └── ProvenanceTimeline.jsx # Append-only cryptographic hash chain
├── context/             # Global application & auth context (AppContext.jsx)
├── lib/                 # Core server libraries
│   ├── auth.js          # Cryptographic session tokens, cookies, hashing
│   ├── ledger.js        # Append-only transaction ledger & penalty logic
│   ├── mockFallback.js  # Enriched local dataset for demo & static export
│   └── prisma.js        # Prisma client singleton instance
├── pages/
│   ├── _app.jsx         # App wrapper & framed parchment desktop canvas
│   ├── _document.jsx    # Custom HTML document & Google Font loaders
│   ├── index.jsx        # Landing hero, lifecycle banner & philosophy pillars
│   ├── browse.jsx       # Project catalog with category, status & stake filters
│   ├── browse/map.jsx   # Dedicated 2D cartography quadrant map page
│   ├── dashboard.jsx    # User profile, stakes, active claims, & colocated LedgerTable
│   ├── leaderboard.jsx  # Community preservation rankings table & badges
│   ├── login.jsx        # Unified Digger authentication (Sign In / Register tabs & GitHub)
│   ├── signup.jsx       # Lightweight registration alias delegating to unified auth
│   ├── simulator.jsx    # Interactive cron & timeout execution sandbox
│   ├── submit.jsx       # Dead repository listing flow
│   ├── workbench.jsx    # Archivist workbench with specimens & marginalia notes
│   ├── project/
│   │   └── [id].jsx     # 4-tab project dossier (Overview, Autopsy, Handover, Provenance)
│   └── api/
│       ├── auth/
│       │   └── [...slug].js  # Unified auth: login, signup, logout, me, personas, switch, & GitHub OAuth
│       ├── commitments/
│       │   └── [...slug].js  # Consolidated claims (submit, withdraw, verify, milestones)
│       ├── projects/
│       │   ├── index.js      # List & create projects
│       │   └── [...slug].js  # Project details, commit, approve, reject, download
│       ├── users/
│       │   └── [...slug].js  # User profile & immutable ledger history
│       ├── cron/
│       │   └── timeout-check.js # Automated Vercel cron background resolver
│       └── upload.js         # Multipart file upload handler
├── prisma/
│   ├── schema.prisma    # PostgreSQL database schema & models
│   └── seed.js          # Pre-seeded test personas and dead projects
├── project-proposal/
│   ├── PROJECT_PROPOSAL.md  # Project proposal in Markdown
│   └── PROJECT_PROPOSAL.tex  # Project proposal in LaTeX
├── scripts/
│   └── test-all.js      # Master unified test suite (protocol, edge cases, auth)
├── styles/
│   └── globals.css      # Hand-drawn ink parchment design system
├── DEPLOYMENT.md        # Step-by-step Neon PostgreSQL & Vercel guide
└── vercel.json          # Vercel serverless cron configuration
```

---

## 🚀 Quick Start

### 1. Configure Environment Variables
Create `.env` based on `.env.example`:
```env
DATABASE_URL="postgresql://user:password@ep-host.aws.neon.tech/neondb?sslmode=require"
SESSION_SECRET="your-super-secret-key"
CRON_SECRET="your-cron-secret"
NEXT_PUBLIC_APP_NAME="Digital Graveyard"
```

### 2. Install & Push Database Schema
```bash
npm install
npm run prisma:push
npm run seed
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Test Suite
```bash
npm test
```

---

## 📋 Deterministic Penalty Matrix

| Event | Stake Collateral | Reputation Impact | Strike Count | Codebase State |
|---|---|---|---|---|
| **Taker ghosts (>14d inactive)** | Forfeited $\rightarrow$ Owner | Taker −20 | Taker +1 | Relisted as `LISTED` |
| **Owner ghosts (no review, >7d)** | Taker refunded + 100 cr reward | Owner −10 | Owner +1 | Marked `COMPLETED` |
| **Taker cancels pre-approval** | Unlocked | Taker −2 | — | Relisted as `LISTED` |
| **Owner cancels post-approval** | Full refund $\rightarrow$ Taker | Owner −5 | — | Relisted as `LISTED` |
| **Milestone missed (1st/2nd)** | Locked in escrow | Taker −5 | — | Remains `ACTIVE` |
| **Milestone missed (3rd/critical)**| Forfeited $\rightarrow$ Owner | Taker −20 | Taker +1 | Relisted as `LISTED` |
| **Bad-faith / Plagiarism flagged** | Forfeited $\rightarrow$ Owner | Taker −15 | — | Relisted as `LISTED` |
| **Ghost Strikes $\ge$ 3** | — | — | $\ge$ 3 | Account Suspended |

---

## 🚢 Deployment to Vercel

Refer to [`DEPLOYMENT.md`](file:///d:/GRAVFIN/DEPLOYMENT.md) for full production deployment instructions on Vercel with Neon PostgreSQL.
