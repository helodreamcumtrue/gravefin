# PROJECT GRAVEYARD — AGENT CONTEXT DOC

# 0. TL;DR
Platform: Owners upload unfinished projects (zip) → anonymous Takers commit → point-stake escrow → blind async work → Owner verifies → system releases stake+reward. Zero user-to-user trust; all trust enforced by backend via deterministic rules + append-only ledger. MVP: 1:1 only, no chat, no GitHub, no real money, no admin/dispute UI, campus scale (~100 users), Next.js(JS)+Prisma+Postgres(Neon)+Vercel.

# 1. Entities
| Entity | Fields | Notes |
|---|---|---|
| User | id, email(hidden), passwordHash, alias(unique, "Digger-####"), credits(int), reputation(int, default 100), ghostStrikes(int,0), banned(bool,false), createdAt | email/identity NEVER returned by any API except own profile |
| Project | id, ownerId(FK User), title, description, fileUrl(zip), stakeRequired(int credits), techTags(text/json), milestoneMode(bool), status(enum), reviewTimeoutAt(datetime,null), createdAt, updatedAt | code stored as zip on platform, not exposed until release |
| Commitment | id, projectId(FK, 1 active max), takerId(FK User), status(enum), stakeLocked(int), committedAt, approvedAt, ghostDeadlineAt, submittedAt, resolvedAt | represents one Owner↔Taker match |
| Milestone | id, commitmentId(FK), title, dueAt, status(PENDING/MET/MISSED), missCount | only used if milestoneMode=true |
| LedgerEntry | id, userId(FK), type(enum), amount(int, +/-), relatedProjectId, relatedCommitmentId, createdAt | APPEND-ONLY, no update/delete ever |

# 2. Roles & Permissions
| Role | Can | Cannot |
|---|---|---|
| Owner | upload/list project, approve/reject commit request, verify submission, cancel active commitment | see Taker identity, message Taker, manually negotiate penalty |
| Taker | browse/discover projects, commit (first-come), download zip after approval, submit completion, withdraw before approval | see Owner identity, message Owner, commit to >1 project active per project row |
| System (backend/cron) | auto-timeout ghost detection, auto-complete on Owner timeout, ledger writes, ban enforcement | — |
| Admin/Arbiter | N/A — **not in MVP** | any manual dispute resolution (post-MVP only) |

# 3. System Flow
1. Owner signs up → uploads project zip + sets stakeRequired + (optional) milestones → status=LISTED.
2. Taker browses (alias-only view) → commits to project (first-come-first-serve) → status=PENDING_APPROVAL, stake NOT yet locked.
3. Owner approves → Commitment.status=ACTIVE, Taker's `stakeLocked` credits deducted+locked, ghostDeadlineAt=now+14d.
   Owner rejects → back to LISTED, no penalty.
4. Blind work phase: no chat/messaging. Taker works off-system using downloaded zip.
5. (If milestoneMode) Taker marks milestones met by due dates; misses tracked.
6. Taker submits completion → status=SUBMITTED, reviewTimeoutAt=now+7d (assumption).
7. Owner verifies → status=COMPLETED: stake returned + reward credits to Taker, reputation updated.
   OR Owner never verifies → cron auto-completes at reviewTimeoutAt with same reward effect + Owner penalty.
   OR Owner flags bad-faith/plagiarism → status=REJECTED_BADFAITH: stake forfeited, no reward.
8. Ghost detection (cron, daily): ACTIVE commitment past ghostDeadlineAt w/ no submission → Taker ghosted; SUBMITTED past reviewTimeoutAt → Owner ghosted (see step 7).
9. All state changes write one+ LedgerEntry rows (append-only) for auditability.
10. ghostStrikes≥3 → user.banned=true, blocked from new commitments/listings.

# 4. Trust Mechanism
- **Anonymity**: platform stores real identity (email/auth) for account/abuse control only; NEVER exposed via any API/UI to other users. All UI/API show `alias` only. Applies equally to Owner & Taker. No DM/chat feature exists — removes need for identity exposure entirely.
- **Escrow**: points-based (no real currency). Taker's stake locked on Owner-approval (not on commit). Stake released/forfeited only by deterministic backend rules — never by user negotiation.
- **Penalties** (all system-enforced, ledger-recorded):
  | Event | Stake | Reputation | GhostStrikes | Project |
  |---|---|---|---|---|
  | Taker ghosts (inactive>14d) | forfeit→Owner | Taker −20 | Taker +1 | relisted |
  | Owner ghosts (no verify, timeout) | Taker: refund+reward | Owner −10 | Owner +1 | closed(completed) |
  | Taker cancels pre-approval | none | Taker −2 | — | relisted |
  | Owner cancels post-approval | refund→Taker | Owner −5 | — | relisted |
  | Milestone miss (1st) | none | warning only | — | active |
  | Milestone miss (repeated) | none | Taker −5 | — | active |
  | Milestone miss (severe) | treated as ghost | full ghost penalty | +1 | relisted |
  | Plagiarism/bad-faith | forfeit | Taker −15 | — | closed/relisted (assumption) |
  | ghostStrikes≥3 | — | — | — | user banned/restricted |
- No manual dispute resolution in MVP; all outcomes deterministic.

# 5. APIs
| Method | Route | Input | Output | Auth |
|---|---|---|---|---|
| POST | /api/auth/signup | email,password | user(alias,id) | none |
| POST | /api/auth/login | email,password | session cookie/JWT | none |
| POST | /api/projects | title,desc,zipFile,stakeRequired,techTags,milestoneMode | project | Owner(session) |
| GET | /api/projects | filters(tech,status) | project[] (alias only) | any authed |
| GET | /api/projects/:id | — | project detail | any authed |
| POST | /api/projects/:id/commit | — | commitment(PENDING_APPROVAL) | Taker |
| POST | /api/projects/:id/approve | commitmentId | commitment(ACTIVE), locks stake | Owner(must own project) |
| POST | /api/projects/:id/reject | commitmentId | commitment(REJECTED) | Owner |
| POST | /api/commitments/:id/withdraw | — | commitment(CANCELLED), rep−2 | Taker(own commitment) |
| GET | /api/projects/:id/download | — | zip stream | Taker(APPROVED/ACTIVE only) |
| POST | /api/commitments/:id/submit | — | commitment(SUBMITTED) | Taker(own, ACTIVE) |
| POST | /api/commitments/:id/verify | approve\|flagBadFaith | commitment(COMPLETED/REJECTED_BADFAITH) | Owner(own project) |
| POST | /api/commitments/:id/milestones/:mid/complete | — | milestone(MET) | Taker(own) |
| GET | /api/users/me | — | own profile incl. email | self only |
| GET | /api/users/me/ledger | — | LedgerEntry[] | self only |
| POST | /api/cron/timeout-check | cron secret | ghost/auto-complete side effects | system/cron only |

# 6. DB Schema
```sql
User(
  id PK, email TEXT UNIQUE, passwordHash TEXT, alias TEXT UNIQUE,
  credits INT DEFAULT 0, reputation INT DEFAULT 100,
  ghostStrikes INT DEFAULT 0, banned BOOL DEFAULT false, createdAt TIMESTAMP
)
Project(
  id PK, ownerId FK->User, title TEXT, description TEXT, fileUrl TEXT,
  stakeRequired INT, techTags TEXT, milestoneMode BOOL DEFAULT false,
  status ENUM(LISTED,PENDING_APPROVAL,ACTIVE,SUBMITTED,COMPLETED,
    GHOSTED_RELISTED,CANCELLED_RELISTED,REJECTED_BADFAITH,CLOSED),
  reviewTimeoutAt TIMESTAMP NULL, createdAt TIMESTAMP, updatedAt TIMESTAMP
)
Commitment(
  id PK, projectId FK->Project, takerId FK->User,
  status ENUM(PENDING_APPROVAL,ACTIVE,SUBMITTED,COMPLETED,
    GHOSTED,CANCELLED,REJECTED_BADFAITH),
  stakeLocked INT, committedAt TIMESTAMP, approvedAt TIMESTAMP NULL,
  ghostDeadlineAt TIMESTAMP NULL, submittedAt TIMESTAMP NULL, resolvedAt TIMESTAMP NULL,
  UNIQUE(projectId) WHERE status IN (PENDING_APPROVAL,ACTIVE,SUBMITTED)  -- enforce 1:1 active
)
Milestone(
  id PK, commitmentId FK->Commitment, title TEXT, dueAt TIMESTAMP,
  status ENUM(PENDING,MET,MISSED), missCount INT DEFAULT 0
)
LedgerEntry(
  id PK, userId FK->User,
  type ENUM(STAKE_LOCK,STAKE_FORFEIT,STAKE_REFUND,REWARD_CREDIT,
    REP_DELTA,GHOST_STRIKE),
  amount INT, relatedProjectId FK NULL, relatedCommitmentId FK NULL,
  createdAt TIMESTAMP
  -- APPEND ONLY: no UPDATE/DELETE permission at app layer
)
```

# 7. State Machine
Project: `LISTED → PENDING_APPROVAL → ACTIVE → SUBMITTED → COMPLETED/CLOSED`
Side exits: `PENDING_APPROVAL → LISTED` (reject/withdraw) · `ACTIVE → GHOSTED_RELISTED → LISTED` · `ACTIVE → CANCELLED_RELISTED → LISTED` (owner cancel) · `SUBMITTED → COMPLETED` (verify) or `→ COMPLETED` (auto-timeout, owner penalized) or `→ REJECTED_BADFAITH → LISTED` (flagged).
Commitment mirrors Project sub-states 1:1; terminal states: COMPLETED, GHOSTED, CANCELLED, REJECTED_BADFAITH.
Milestone: `PENDING → MET` or `PENDING → MISSED` (escalates per §4 table; 3rd+ severe miss forces Commitment→GHOSTED path).

# 8. Edge Cases
- Race: 2 Takers commit same instant → DB unique constraint on active Commitment per Project resolves; 2nd gets conflict error.
- Taker credits < stakeRequired at approval time → approval blocked, auto-reject, Owner notified to pick next.
- Cron downtime → timeout checks must be idempotent (re-run safe) and catch up on next run, not double-penalize (guard via resolvedAt/status check).
- Owner uploads malicious zip → scan/size-limit at upload (not detailed in MVP scope beyond basic validation).
- ghostStrikes ban must block new `commit`/`create project` calls but not existing active commitments.
- Milestone severe-miss path must reuse exact ghost-penalty logic (single source of truth), not duplicate.
- Project relisted after forfeiture/cancel must reset Commitment linkage (old commitment stays terminal, new one created on next commit).
- Reward credit amount on COMPLETED not specified by user → **flagged in Assumptions**.

# 9. Non-Functional
- **Security**: never serialize `email`/`passwordHash` in any non-self API response; alias is the only cross-user identifier; session/JWT auth (custom, no OAuth); rate-limit `/commit` to prevent spam-claiming.
- **Integrity**: LedgerEntry table immutable at ORM/app layer (no update/delete methods exposed); all balance changes derived by summing ledger, or cached balance + ledger as audit trail (pick one, document — recommend cached `credits`/`reputation` fields + ledger as audit log).
- **Scalability**: campus MVP (~100 users) now; schema/indices (on status, ownerId, takerId) should hold to low-thousands without redesign.
- **Constraints**: no real payments (no PCI scope); no file diffing/CI (manual review only); no external identity provider.

# 10. Assumptions
- Review timeout (Owner verify window) = 7 days (not specified by user; ghost timeout=14d IS specified).
- Reward credit amount on successful completion = configurable per-project or platform constant — exact value TBD, not specified.
- Owner-cancel and Taker-ghost both relist the project (not fully specified — assumed since project still needs completion).
- Plagiarism/bad-faith outcome relists project (assumed; could alternatively close it — flag for product decision).
- Initial signup credit grant amount unspecified — assume a fixed onboarding credit balance (config value).
- Stake amount set per-project by Owner at creation (not explicitly stated but implied by "stake required").
- Single currency type ("credits") covers both stake and reputation-linked rewards; reputation and credits tracked as separate numeric fields.
- Ban after 3 ghostStrikes = "temporary restriction" duration unspecified — assume fixed cool-down (e.g., 30 days), configurable.
- Zip file size/type limits not specified — assume reasonable default (e.g., ≤50MB) enforced at upload.

# 11. Out of Scope (MVP)
- Chat/messaging between users (any form).
- GitHub/external repo integration (Slide-deck's "GitHub API, Wayback Machine, npm/PyPI" enrichment — NOT in this MVP).
- Team/bounty mode (multiple Takers per project).
- Admin/Moderator/Arbiter dashboards, manual dispute resolution.
- Real-money payments/withdrawals.
- Automated testing/CI verification of submitted work.
- AI Revival Advisor, Contributor Marketplace, Leaderboards, Public Clone-Report Registry, Autopsy Report/Revival Score analytics (all deck "Tier 2/3" features — future scope only).
- OAuth/social login.

# 12. Dev Notes
- Do NOT assume any chat/messaging exists anywhere in the product — UI/API must never surface one user's contact info to another, under any status.
- Do NOT assume GitHub integration, CI, or automated code analysis — all review is manual by Owner.
- Do NOT assume multi-taker/team support — Commitment↔Project is strictly 1:1 (enforce via DB constraint, not just app logic).
- Do NOT build any manual dispute/admin UI for MVP — all resolution paths are the deterministic rules in §4/§7 only.
- Do NOT expose `email`, `passwordHash`, or any real-identity field in Project/Commitment/Discovery responses — alias only.
- Treat LedgerEntry as source-of-truth audit trail even if cached balances are used for read performance — never allow direct balance mutation bypassing a ledger write.
- Cron/timeout job is the ONLY actor allowed to transition ACTIVE→GHOSTED or SUBMITTED→COMPLETED(auto) — no user-triggered equivalent endpoint should exist.
- Stack is fixed: Next.js API routes (JavaScript, not TS), Prisma ORM, PostgreSQL via Neon, deploy on Vercel — do not introduce other frameworks/languages.
- Frontend already exists separately (per user) — backend/API contracts in §5 must match what that frontend expects; confirm route/field naming against existing frontend before finalizing if discrepancies arise.
