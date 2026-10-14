# 🪦 Gravefin (Project Graveyard) — Complete Context & User Flow Specification

> **Document Version**: 1.0.0  
> **Repository**: `GRAVFIN` (`gravefin`)  
> **Primary Philosophy**: *"A blind, escrow-backed marketplace for finishing other people's abandoned code."*  
> **Visual Identity**: Parchment Desk & Hand-Drawn Sketch Design Tokens (`Patrick Hand`, `Architects Daughter`, `Inter`)  
> **Backend Architecture**: Next.js 14 Pages Router + Prisma ORM (PostgreSQL / SQLite) + Cryptographic HMAC Sessions

---

## 1. Executive Summary & Core Mechanism

### 1.1 The Problem
Countless high-potential side projects, hackathon prototypes, student codebases, and open-source tools sit abandoned in GitHub "graveyards." When owners try to find collaborators online:
- People promise to finish code but disappear after getting repo access.
- Endless subjective messaging/chatting leads to scope creep and disputes.
- Code owners ghost contributors who complete work, refusing to pay or acknowledge delivery.
- Traditional freelance platforms require heavy KYC, fiat payments, and subjective dispute mediation.

### 1.2 The Gravefin Solution
Gravefin replaces subjective trust with an **adversarial-safe, deterministic, escrow-backed protocol**:
1. **Skin-in-the-Game Staking**: Anonymous "Diggers" must lock platform credits in escrow to claim an abandoned codebase.
2. **Zero In-App Chat**: No DMs, no comment threads, no bribery or harassment. Coordination is strictly state-machine-driven via deliverables, milestone check-offs, and cryptographic timelines.
3. **Strict Anonymity**: Users operate under pseudonymous aliases (e.g. `Digger-1042`, `Digger-2099`). Identity metadata is never exposed to counter-parties.
4. **Append-Only Immutable Ledger (`LedgerEntry`)**: Every stake lock, forfeiture, refund, bonus reward, and reputation penalty is permanently recorded with full auditability.
5. **Deterministic Automated Timeouts (The Iron Cron)**:
   - **Taker Inactive (>14 days without delivery/milestone)** $\rightarrow$ Escrow forfeited to Owner, Taker −20 reputation, +1 ghost strike, codebase relisted.
   - **Owner Ghosting (>7 days without reviewing submission)** $\rightarrow$ Auto-accepted, Taker refunded + rewarded bonus credits, Owner −10 reputation, +1 ghost strike.
   - **3 Ghost Strikes** $\rightarrow$ Account automatically restricted from listing or claiming projects.

---

## 2. Technology Stack & Environment

### 2.1 Core Technologies
| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | **Next.js 14** (`next` `^14.2.23`) | Pages Router (`pages/` directory architecture) |
| **UI Library** | **React 18** (`react` `^18.3.1`) | Functional components, Context API, Lucide React icons, Canvas Confetti |
| **Design Tokens** | Hand-drawn Parchment System | Custom sketch borders, warm parchment `#FAF6EE`, inked lines, custom typography |
| **ORM & Database**| **Prisma 5** (`@prisma/client` `^5.22.0`) | Supports Serverless PostgreSQL (Neon) & Local SQLite (`dev.db`) |
| **Authentication** | Cryptographic HMAC SHA-256 | `HttpOnly` signed cookies (`graveyard_session`), bcrypt password hashing |
| **OAuth** | GitHub OAuth 2.0 Integration | `/api/auth/github` & `/api/auth/github/callback` |
| **GraphQL API** | **GraphQL Yoga v5** (`graphql`, `graphql-yoga`) | `/api/graphql` endpoint with GraphiQL IDE, schema & resolvers |
| **Testing/Simulation**| Built-in Time-Travel Sandbox | `/simulator` console with `simulateDaysElapsed` parameter |

### 2.2 Environment Configuration (`.env`)
```ini
# Database Connection (Neon Postgres for production or file:./dev.db for SQLite)
DATABASE_URL="postgresql://user:password@ep-cool-fog.us-east-2.aws.neon.tech/graveyard?sslmode=require"

# System Automation & Cron Secret
CRON_SECRET="graveyard_secret_key"
NEXT_PUBLIC_APP_NAME="Project Graveyard"

# GitHub OAuth 2.0 Integration
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

---

## 3. Database Schema & Data Models (`prisma/schema.prisma`)

```
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│              User               │ 1       * │             Project             │
├─────────────────────────────────┼───────────┼─────────────────────────────────┤
│ id: String (CUID, PK)           │           │ id: String (CUID, PK)           │
│ email: String (Unique)          │           │ ownerId: String (FK -> User)    │
│ alias: String (e.g Digger-1042) │           │ title: String                   │
│ credits: Int (Default 500)      │           │ stakeRequired: Int (Escrow)     │
│ reputation: Int (Default 100)   │           │ status: String (State Machine)  │
│ ghostStrikes: Int (Default 0)   │           │ revivalScore: Int (0-100)       │
│ banned: Boolean (Strikes >= 3)  │           │ autopsyCause: String            │
└────────────────┬────────────────┘           └────────────────┬────────────────┘
                 │ 1                                           │ 1
                 │                                             │
                 │ *                                           │ *
┌────────────────┴────────────────┐           ┌────────────────┴────────────────┐
│           LedgerEntry           │           │           Commitment            │
├─────────────────────────────────┤           ├─────────────────────────────────┤
│ id: String (CUID, PK)           │           │ id: String (CUID, PK)           │
│ userId: String (FK -> User)     │           │ projectId: String (FK -> Proj)  │
│ type: STAKE_LOCK / REFUND / etc │           │ takerId: String (FK -> User)    │
│ amount: Int (Credits change)    │           │ status: PENDING / ACTIVE / etc  │
│ relatedProjectId: String?       │           │ stakeLocked: Int                │
│ createdAt: DateTime (Immutable) │           │ ghostDeadlineAt: DateTime (+14d)│
└─────────────────────────────────┘           └────────────────┬────────────────┘
                                                               │ 1
                                                               │ *
                                              ┌────────────────┴────────────────┐
                                              │            Milestone            │
                                              ├─────────────────────────────────┤
                                              │ id: String (CUID, PK)           │
                                              │ commitmentId: String (FK)       │
                                              │ title: String                   │
                                              │ dueAt: DateTime                 │
                                              │ status: PENDING / MET / MISSED  │
                                              └─────────────────────────────────┘
```

### 3.1 State Machine Lifecycle (`Project.status` & `Commitment.status`)
1. **`LISTED`**: Codebase is in the public cemetery catalog. Waiting for a Digger to commit stake.
2. **`PENDING_APPROVAL`**: Digger committed credits; stake is deducted from Digger's balance and locked in escrow. Code owner reviews Digger's reputation and accepts or rejects.
3. **`ACTIVE`**: Owner approved the Digger. Source code ZIP unlocked for download. `ghostDeadlineAt` set to `now + 14 days`.
4. **`SUBMITTED`**: Digger uploaded finished deliverable ZIP/URL and handover checklist. `reviewTimeoutAt` set to `now + 7 days`.
5. **`COMPLETED`**: Owner accepted delivery (or 7-day auto-acceptance triggered). Escrow refunded to Digger + completion bonus awarded. Both parties gain reputation.
6. **Failure States**:
   - **`GHOSTED_RELISTED`**: Taker failed to deliver within 14 days. Stake forfeited to Owner. Taker gets strike. Project returned to `LISTED`.
   - **`REJECTED_BADFAITH`**: Owner rejected delivery with evidence of bad faith. Escrow handling determined by protocol rules.
   - **`CANCELLED_RELISTED`**: Mutual cancellation prior to submission; stake refunded.

---

## 4. Directory & File Inventory

```
d:/GRAVFIN/
├── prisma/
│   ├── schema.prisma              # Data models: User, Project, Commitment, Milestone, LedgerEntry
│   └── seed.js                    # Comprehensive seed with 8 archetypal cemetery specimens
├── lib/
│   ├── auth.js                    # HMAC SHA-256 session tokens, bcrypt passwords, alias generator
│   ├── ledger.js                  # Atomic append-only ledger entries & automated penalty logic
│   ├── githubIntelligence.js      # GraphQL repository metrics, revival scoring, autopsy diagnostics
│   ├── mockFallback.js            # Standalone fallback dataset for offline/static demo operation
│   └── prisma.js                  # Prisma Client singleton
├── components/
│   ├── Navbar.jsx                 # Archive header, persona switcher pill, quick stats (Credits/Rep)
│   ├── Footer.jsx                 # Digital Graveyard archive colophon
│   ├── ProjectCard.jsx            # Hand-drawn Tombstone card with revival score badge
│   ├── EscrowStatusBanner.jsx     # Live state-machine progress indicator with countdown timers
│   ├── AutopsyChart.jsx           # Forensic diagnostics & Cause of Decline taxonomy badges
│   ├── HandoverChecklist.jsx      # Dual sign-off protocol, milestone tracker, blooming tree visual
│   ├── GraveyardMap.jsx           # 2D Cartesian excavation quadrant map (Revival vs Technical Debt)
│   ├── ProvenanceTimeline.jsx     # Cryptographic hash chain timeline of project events
│   └── Icons.jsx                  # Custom hand-drawn SVGs
└── pages/
    ├── _app.jsx                   # Framed parchment layout wrapper & AppProvider
    ├── _document.jsx              # Google Fonts (Patrick Hand, Architects Daughter, Inter)
    ├── index.jsx                  # Hero portal, live statistics, recent cemetery listings, philosophy
    ├── browse.jsx                 # Filterable catalog (Search, Category, Stake, Sort by Revival Score)
    ├── browse/map.jsx             # Dedicated 2D cartography quadrant excavation map
    ├── project/[id].jsx           # Core workspace: Autopsy, Escrow Action Box, Handover Checklist
    ├── dashboard.jsx              # User command center (Owned listings, Active excavations, Ledger history)
    ├── workbench.jsx              # Curatorial command center for specimens and marginalia dossiers
    ├── leaderboard.jsx            # Top Diggers ranked by reputation, completions, and salvage volume
    ├── simulator.jsx              # Time-travel sandbox (+7d, +14d, +30d) and live cron inspector
    ├── submit.jsx                 # Multi-step project listing wizard with GitHub repo intelligence
    ├── login.jsx / signup.jsx     # Authentication and pre-seeded persona fast-switcher
    └── api/
        ├── auth/[...slug].js      # Register, login, logout, me, switch-persona, github oauth
        ├── projects/              # List, create, fetch detail, trigger github analysis
        ├── commitments/           # Commit, approve, submit deliverable, accept, reject
        └── cron/timeout-check.js  # The Iron Cron: automated timeout checks & penalty enforcement
```

---

## 5. Complete End-to-End User Flow

### 5.1 Comprehensive System Architecture & Lifecycle User Flow (Mermaid)

```mermaid
flowchart TD
    %% Personas
    Owner([Code Owner / Abandoner])
    Digger([Anonymous Digger / Resurrector])
    Cron([The Iron Cron / Automated Protocol])

    %% 1. Listing Flow
    subgraph S1["1. Listing & Ingestion Phase"]
        Owner -->|Lists dead repo| SubmitPage["/submit (Wizard)"]
        SubmitPage -->|Enter GitHub URL & ZIP| RunAutopsy["Run GitHub Forensic Analysis"]
        RunAutopsy --> GenAutopsy["Calculate Revival Score (0-100) & Cause of Decline"]
        GenAutopsy --> SetStake["Set Stake Requirement (e.g. 150 Credits)"]
        SetStake --> PublishListing["Project State: LISTED"]
    end

    %% 2. Discovery & Commitment
    subgraph S2["2. Discovery & Escrow Staking Phase"]
        Digger -->|Explores Cemetery| BrowseCatalog["/browse or /browse/map (Quadrant Map)"]
        BrowseCatalog --> ViewProject["/project/:id (Tombstone Detail)"]
        ViewProject --> InspectAutopsy["Review Forensic Report & Repo Health"]
        InspectAutopsy --> ClickStake{"Click 'Stake & Claim'"}
        
        ClickStake -- Insufficient Credits --> PromptEarn["Error: Insufficient Credits to Stake"]
        ClickStake -- Has Credits --> LockEscrow["Deduct Credits from Digger -> Lock in Escrow"]
        LockEscrow --> AppendLedger1["Append Ledger: STAKE_LOCK (-150 Credits)"]
        AppendLedger1 --> ProjPending["Commitment: PENDING_APPROVAL"]
    end

    %% 3. Approval & Active Sprint
    subgraph S3["3. Excavation & Active Development Phase"]
        ProjPending --> OwnerReview{"Owner Reviews Digger Persona"}
        OwnerReview -- Rejects --> RefundStake["Refund Stake to Digger -> Project returns to LISTED"]
        OwnerReview -- Approves --> ActivateSprint["Project State: ACTIVE"]
        
        ActivateSprint --> SetDeadlines["Set Ghost Deadline: now + 14 Days"]
        ActivateSprint --> UnlockCode["Unlock Source Code ZIP for Digger"]
        
        UnlockCode --> TrackMilestones["Digger updates Milestones & Handover Checklist"]
        TrackMilestones --> UploadDeliverable["Digger uploads Finished Deliverable ZIP / URL"]
        UploadDeliverable --> ProjSubmitted["Project State: SUBMITTED"]
        ProjSubmitted --> SetReviewTimeout["Set Owner Review Timeout: now + 7 Days"]
    end

    %% 4. Handover & Resolution
    subgraph S4["4. Resolution & Payout Phase"]
        ProjSubmitted --> OwnerSignoff{"Owner Reviews Deliverable"}
        
        %% Path A: Owner Accepts
        OwnerSignoff -- Accepts Delivery --> CompleteProject["Project State: COMPLETED"]
        CompleteProject --> ReleaseEscrow["1. Refund 100% Locked Stake to Digger"]
        CompleteProject --> RewardBonus["2. Award Platform Reward Credits to Digger"]
        CompleteProject --> BoostRep["3. Digger +30 Rep, Owner +15 Rep"]
        BoostRep --> AppendLedger2["Append Ledger: STAKE_REFUND, REWARD_CREDIT, REP_DELTA"]
        
        %% Path B: Bad Faith Dispute
        OwnerSignoff -- Rejects Bad Faith --> FlagDispute["Flag Bad-Faith Deliverable"]
        FlagDispute --> HandleDispute["Forfeit Stake / Strike applied per evidence"]
    end

    %% 5. Automated Timeout Enforcement (The Iron Cron)
    subgraph S5["5. The Iron Cron (Deterministic Automation)"]
        Cron --> DailyCheck["GET/POST /api/cron/timeout-check"]
        
        %% Taker Inactivity Timeout (>14 days)
        DailyCheck --> CheckTakerTimeout{"ACTIVE Commitment > 14 days without delivery?"}
        CheckTakerTimeout -- Yes --> PenalizeTaker["1. Forfeit Escrow to Owner (+150 credits)"]
        PenalizeTaker --> StrikeTaker["2. Taker: -20 Rep, +1 Ghost Strike"]
        StrikeTaker --> RelistProject["3. Project State: GHOSTED_RELISTED -> Relisted to Public"]
        
        %% Owner Inactivity Timeout (>7 days)
        DailyCheck --> CheckOwnerTimeout{"SUBMITTED Project > 7 days without Owner review?"}
        CheckOwnerTimeout -- Yes --> AutoAccept["1. Auto-Accept: Delivery verified by timeout"]
        AutoAccept --> RefundRewardTaker["2. Taker gets full refund + completion bonus"]
        AutoAccept --> PenalizeOwner["3. Owner: -10 Rep, +1 Ghost Strike"]
        PenalizeOwner --> MarkComplete["4. Project State: COMPLETED"]
        
        %% 3-Strikes Rule
        StrikeTaker --> CheckStrikes{"User Ghost Strikes >= 3?"}
        PenalizeOwner --> CheckStrikes
        CheckStrikes -- Yes --> BanUser["Account Status: BANNED from Listing & Claiming"]
    end
```

---

### 5.2 Step-by-Step Persona Walkthroughs

#### Persona A: The Code Abandoner (Owner)
1. **Login & Identity**: Authenticates via GitHub OAuth or picks the seeded `Digger-1042` persona.
2. **Repository Listing**:
   - Navigates to `/submit`.
   - Enters GitHub repository URL (e.g. `https://github.com/facebook/react` or student repo) and project title.
   - The platform calls [githubIntelligence.js](file:///d:/GRAVFIN/lib/githubIntelligence.js), calculating commit velocity, issue ratio, peak activity month, and assigns a **Revival Score** (0–100) and **Cause of Decline** badge (e.g., *“Solo Burnout”*, *“Scope Explosion”*, *“Dependency Rot”*).
   - Sets the required Digger stake (e.g., `100 Credits`).
   - Uploads the initial archive zip and defines the completion criteria.
3. **Reviewing Applications**:
   - Receives an excavation request on their dashboard. Inspects applicant’s reputation score and past completed projects.
   - Clicks **Approve Commitment**. Stake is held in the escrow ledger, starting the 14-day delivery clock.
4. **Accepting Delivery**:
   - Once the Digger marks all milestones complete and attaches the deliverable ZIP, the Owner receives notification on `/project/[id]`.
   - Owner tests the build and clicks **Sign Off & Release Escrow**. Confetti triggers, escrow returns to Digger with completion reward, and Owner's reputation increases by +15.

#### Persona B: The Resurrector (Digger)
1. **Exploration**:
   - Opens `/browse` or the 2D Cartography Quadrant Map at `/browse/map`.
   - Analyzes projects by **Technical Debt vs Revival Potential** (e.g. *Q1: High Revival / Low Debt = "Golden Relics"*).
2. **Claiming the Codebase**:
   - Opens the tombstone page `/project/[id]`.
   - Reviews the Autopsy Chart and Cause of Decline breakdown.
   - Clicks **Stake & Claim** (locks 100 credits in escrow).
3. **Excavation & Build**:
   - Once approved by the Owner, downloads the unlocked source ZIP.
   - Checks off milestones in the **Handover Checklist** ([HandoverChecklist.jsx](file:///d:/GRAVFIN/components/HandoverChecklist.jsx)) as code progresses.
4. **Delivery**:
   - Submits the completed codebase ZIP or pull request link with handover release notes.
   - Waits for Owner review (guaranteed resolution within 7 days by the protocol cron).
5. **Payout**:
   - Receives full stake refund + reward bonus + 30 reputation points. The immutable ledger logs the cryptographic transaction hash.

#### Persona C: Protocol Auditor / Testing Judge
1. **Sandbox Testing**:
   - Navigates to `/simulator` (Interactive Protocol Sandbox).
   - Can fast-forward system time by `+7 Days`, `+14 Days`, or `+30 Days`.
   - Clicks **"Trigger Cron Now"** to execute [timeout-check.js](file:///d:/GRAVFIN/pages/api/cron/timeout-check.js).
   - Observes automated forfeiture and auto-completion events stream into the live console log.
2. **Ledger Audit**:
   - Visits `/dashboard` to inspect the append-only `LedgerEntry` table verifying that balances cannot be tampered with.

---

## 6. API Endpoints Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/me` | `GET` | Returns current verified user from `graveyard_session` cookie |
| `/api/auth/switch-persona` | `POST` | Instantly switches between seeded testing personas |
| `/api/auth/github` | `GET` | Initiates GitHub OAuth 2.0 authorization code flow |
| `/api/projects` | `GET` / `POST` | Fetches catalog or creates a new project specimen |
| `/api/projects/[id]` | `GET` | Fetches detailed project, autopsy data, and active commitment |
| `/api/projects/[id]/analyze` | `POST` | Triggers on-demand GitHub repository intelligence inspection |
| `/api/commitments/commit` | `POST` | Locks credits in escrow and submits excavation claim |
| `/api/commitments/approve` | `POST` | Owner approves Digger claim; unlocks source and starts 14d timer |
| `/api/commitments/submit` | `POST` | Digger submits completed code deliverable and checklist |
| `/api/commitments/accept` | `POST` | Owner signs off; refunds stake + rewards bonus to Digger |
| `/api/cron/timeout-check` | `POST` | The Iron Cron: resolves 14d taker ghosts and 7d owner ghost timeouts |
| `/api/upload` | `POST` | Handles project archive ZIP uploads with mime-type safety |
| `/api/graphql` | `GET` / `POST` | Complete GraphQL API endpoint & embedded GraphiQL Playground IDE |
| `/graphql` | UI Page | Interactive GraphQL Protocol Explorer with pre-set queries & live runner |
