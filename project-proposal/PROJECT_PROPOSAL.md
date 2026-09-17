# Project Proposal: Gravefin

**Gravefin: A Blind, Escrow-Backed Marketplace for Resurrecting Abandoned Codebases**  
*Project Proposal for UCS503P / Capstone Engineering*  
**Submitted to:** Department of Computer Science & Engineering, Thapar Institute of Engineering and Technology  
**Author(s):** Harshit & Team, CSED  
**Date:** September 2026  

---

## 1. Higher-order goal *(...secondary framing)*

This project aims to salvage abandoned digital intellectual capital and advance collaborative software engineering by creating an adversarial-safe, trustless marketplace for finishing incomplete codebases. While academic institutions and open-source ecosystems produce thousands of viable hackathon, capstone, and research projects that stall at 60–80% completion, the immediate engineering objective is to translate **skin-in-the-game collateral and deterministic timeout enforcement** into a measurable, production-grade web application.

---

## 2. Time-to-value *(...primary heuristic)*

- **Rapid Increment Delivery:** We prototype and validate the core end-to-end escrow state machine (Project Listing $\rightarrow$ Claim with Stake $\rightarrow$ Blind Delivery $\rightarrow$ Verification & Collateral Release) within a single iteration window.
- **Fast Feedback over Speculative Complexity:** We eliminate subjective negotiation by substituting in-app chat with strict state machine transitions, prioritizing automated CI-backed tests and ledger consistency early.
- **Measurable Milestones:** Success is defined by concrete operational metrics: zero double-claims, deterministic timeout enforcement via automated background jobs, and 100% auditability across an append-only transaction ledger.

---

## 3. Problem Statement

Across university campuses and developer communities, hundreds of promising repositories are abandoned due to graduation, semester transitions, or shifting academic priorities. Common failure modes include:

- **Intellectual Capital Waste:** High-potential codebases (compilers, kernel modules, distributed databases, machine learning pipelines) sit idle in private or dead repositories rather than reaching deployment.
- **The Free-Rider & Ghosting Problem:** When code is shared informally, prospective contributors frequently claim interest, request complete source access, and subsequently ghost—leaving original owners exploited and projects stalled.
- **Subjective Disputes & Off-Platform Chaos:** Unstructured communication channels (DMs, emails, forums) lead to scope creep, unverified claims, harassment, and interpersonal conflict over project completion.
- **Financial & Regulatory Overhead:** Implementing fiat monetary escrows requires burdensome PCI-DSS compliance, KYC identity verification, and banking rails that stifle low-friction student adoption.

**Why this matters now (contextual relevance):** In resource-constrained engineering environments, finishing existing, tested partial implementations is orders of magnitude more efficient than rebuilding from scratch. A trustless, points-based escrow marketplace introduces accountability without financial overhead.

---

## 4. Proposed Solution *(...Software Proposition)*

### 4.1 Overview
Gravefin is a web-based, trustless escrow platform composed of the following core modules:

- **Dead Codebase Registry:** Repository owners list incomplete codebases with metadata, completion percentage, tech tags, and a mandatory collateral stake requirement.
- **Anonymous Digger Identity Layer:** Cross-user identifiers are cryptographically decoupled from personal identities using deterministic pseudonyms (e.g., `Digger-1042`), preserving privacy and eliminating off-platform bias.
- **Skin-in-the-Game Escrow Machine:** Takers lock credit collateral into escrow upon owner approval, ensuring genuine commitment before source archives are decrypted and unlocked for download.
- **Append-Only Immutable Ledger:** Every credit allocation, stake lock, forfeiture, refund, and reputation adjustment is recorded into an append-only audit trail (`LedgerEntry`).
- **Deterministic Timeout & Slashing Engine:** Background cron services continuously inspect project deadlines, automatically penalizing inactive takers (>14 days) or unresponsive owners (>7 days).
- **Interactive Protocol Simulator:** A dedicated testing sandbox permitting administrators and evaluators to fast-forward time (+7d, +14d, +30d) and observe automated protocol state transitions in real time.

### 4.2 Core Workflow
```
[ Owner Lists Repo ] 
         │
         ▼
[ Taker Claims Project ] ──(Credits Verified)──► [ Owner Approves & Locks Escrow Stake ]
                                                                 │
                                                                 ▼
[ Owner Disputes / Bad-Faith ] ◄── [ Taker Submits Code ] ◄── [ Taker Downloads Source Archive ]
         │                                  │
         ▼                                  ▼
[ Stake Forfeited to Owner ]     [ Verified: Stake Refunded + 100 cr Reward ]
[ Taker −15 Rep, Relisted ]      [ +15 Rep to Owner & Taker, Marked COMPLETED ]
```

1. **Listing:** Owner posts a project specifying completion stage (e.g., 65%) and required taker stake (e.g., 150 credits).
2. **Claiming:** Prospective Taker submits a claim request. System validates credit balance.
3. **Escrow Lock:** Owner reviews applicant’s reputation and approves. The platform locks the stake in escrow, changes project state to `ACTIVE`, and generates a 14-day inactivity deadline.
4. **Blind Work & Download:** Taker downloads the authorized project archive and implements required milestones without conversational interference.
5. **Submission:** Taker uploads completed deliverables with implementation notes, transitioning the project to `SUBMITTED` and triggering a 7-day owner review window.
6. **Resolution:** 
   - *Approval:* Stake is fully refunded to Taker, 100 platform completion credits are rewarded, and both parties gain +15 reputation.
   - *Owner Timeout (>7 days):* Automated cron automatically verifies the project, releasing escrow and awarding credits to the diligent Taker while docking Owner reputation.

### 4.3 Operational Constraints
- **Zero In-App Chat:** No chat or messaging UI is built. All interactions are atomic state transitions.
- **Client Usability:** Responsive web UI optimized for both desktop development environments and mobile monitoring without heavy client-side frameworks.
- **Deployability:** Built on managed serverless primitives (Next.js serverless functions, Neon PostgreSQL, Vercel cron) for zero-maintenance continuous operation.

---

## 5. Solution Approach *(...Engineering focus)*

This is an applied systems engineering project focusing on distributed state machine consistency, adversarial fault tolerance, and verifiable auditability rather than speculative algorithms.

### 5.1 Deterministic Penalty Matrix *(...non-research heuristic)*

To eliminate human subjectivity and prevent platform abuse, all governance is handled via a deterministic matrix:

| Trigger Event | Stake Collateral Action | Reputation Delta | Strike Delta | Post-Action Codebase State |
|---|---|---|---|---|
| **Taker ghosts (>14d inactive)** | Forfeited $\rightarrow$ Transferred to Owner | Taker −20 | Taker +1 | Relisted as `LISTED` |
| **Owner ghosts (no review >7d)** | Full refund to Taker + 100 cr reward | Owner −10 | Owner +1 | Codebase marked `COMPLETED` |
| **Taker cancels pre-approval** | None (no stake was locked) | Taker −2 | — | Relisted as `LISTED` |
| **Owner cancels post-approval** | Full refund returned to Taker | Owner −5 | — | Relisted as `LISTED` |
| **Milestone missed (1st/2nd)** | Retained in escrow | Taker −5 | — | Remains `ACTIVE` |
| **Repeated Milestone Failure** | Forfeited $\rightarrow$ Transferred to Owner | Taker −20 | Taker +1 | Relisted as `LISTED` |
| **Plagiarism / Bad-Faith Flag** | Forfeited $\rightarrow$ Transferred to Owner | Taker −15 | — | Relisted as `LISTED` |
| **Cumulative Strikes $\ge$ 3** | All pending stakes cancelled | — | $\ge$ 3 | **Permanent Account Suspension** |

### 5.2 Web Architecture *(...web-based solution)*

A 3-tier architecture with unified dynamic routing:

- **Presentation Layer (Frontend):** React 18, Next.js Pages router, semantic HTML5, Vanilla CSS tokenized design system (dark cyber-noir aesthetic), responsive card layouts, and accessible modals.
- **Application & API Layer (Backend):** Next.js Serverless API endpoints utilizing consolidated catch-all dispatchers (`pages/api/auth/[action].js`, `pages/api/projects/[...slug].js`, `pages/api/commitments/[...slug].js`, `pages/api/users/[...slug].js`).
- **Security & Authentication:** HMAC SHA-256 session signatures, Bcrypt password hashing, and `HttpOnly`, `SameSite=Lax` cookie serialization.
- **Data & Persistence Layer:** Prisma ORM connected to Neon Serverless PostgreSQL with connection pooling and relational foreign-key integrity.

### 5.3 CI/CD and Delivery Automation
- **Automated Validation:** Single-command unified test suite (`scripts/test-all.js`) verifying database integrity, protocol transitions, and live HTTP API flows on every build.
- **Continuous Deployment:** Integrated GitHub Actions / Vercel pipeline automatically deploying `main` branch to production upon test passage.

---

## 6. Evaluation Criteria *(...measurable and attributable)*

### 6.1 Primary Evaluation Metric
**Escrow Resolution Efficiency (ERE):** The percentage of initiated project commitments that transition from `ACTIVE` to either a verified completion or an automated deterministic penalty without deadlocking.
- **Target:** 100% deterministic resolution (0 deadlocked or orphaned states).
- **Attribution:** Verified via automated cron execution logs and ledger timestamp diffs (`committedAt` vs. `resolvedAt`).

### 6.2 Secondary Evaluation Metrics
- **Zero Double-Claims:** Concurrency safety ensuring no codebase can be simultaneously claimed by multiple takers (verified via database transaction tests).
- **Audit Completeness:** Ratio of credit balance mutations to corresponding `LedgerEntry` records (Target: Exactly 1.0; zero unlogged balance changes).
- **Anonymity Leakage Rate:** Zero instances of user emails, hash passwords, or real names exposed in public API responses (verified via sanitization integration tests).
- **System Availability & Build Health:** 100% build pass rate with 0 compilation errors and <100 ms API response times under standard loads.

### 6.3 Pilot Validation Plan
1. **Pre-Seeded Actor Simulation:** Deploy 6 distinct test personas (`Digger-1042` Owner, `Digger-2099` Active Taker, `Digger-3310` Flagged Contributor, `Digger-5501` Strike-Risk User) across 12 diverse dead codebases.
2. **Sandbox Fast-Forward:** Execute temporal simulations (+7 days, +14 days) via `/simulator` to validate automated slashing, stake refunding, and account banning.
3. **Cohort User Testing:** Conduct a pilot with 15–20 student developers submitting and claiming lab repositories over a 2-week testing window.

---

## 7. Scalability *(...with foresight)*

1. **Theoretical Scalability:**
   - **Stateless API Handlers:** Serverless Next.js functions scale horizontally with incoming demand.
   - **Connection Pooling:** PgBouncer-backed connection pooling via Neon PostgreSQL prevents database thread exhaustion under high concurrency.
   - **Consolidated Dispatchers:** Catch-all API routes minimize serverless lambda cold-start proliferation.

2. **Practical Deployability:**
   - Single-click deployment on Vercel with zero custom container orchestration required.
   - Cloud-native managed PostgreSQL eliminating database maintenance overhead.
   - Standard cron triggers (`/api/cron/timeout-check`) natively supported via `vercel.json`.

---

## 8. Engine Availability Heuristic

The project avoids unproven bleeding-edge infrastructure by adopting mature, industry-standard tooling:

- **Next.js 14 & React 18:** Established industry standards for server-rendered and static web applications.
- **Prisma ORM 5.22:** Type-safe database querying with declarative migrations and relational guarantees.
- **Neon Serverless PostgreSQL:** Enterprise-grade relational database with automatic branch replication and high-throughput connection pooling.
- **Node.js Native Crypto & BcryptJS:** Battle-tested cryptographic primitives for token signing and credential hashing.

---

## 9. Project Scope and Deliverables *(...iteration-friendly)*

### 9.1 Initial Deliverable *(First Iteration — Completed & Operational)*
- [x] Full responsive web application across 11 core pages (Browse, Project Details, User Dashboard, Submit, Simulator, Login, Signup, About).
- [x] Database schema & seed data (6 personas, 12 projects across Systems, Web, ML, and Mobile categories).
- [x] Complete escrow state machine with stake locking, deliverable submission, and owner verification.
- [x] Append-only audit ledger recording every transaction.
- [x] Cryptographic HMAC SHA-256 session authentication with `HttpOnly` cookies.
- [x] Consolidated, readable API layer (reduced from 18 files down to 7).
- [x] Master test runner (`scripts/test-all.js`) passing 23/23 end-to-end tests.

### 9.2 Subsequent Deliverables *(Future Iterations)*
- Multi-milestone incremental escrow payouts (releasing partial stakes per completed milestone).
- Automated plagiarism / similarity checks using lightweight AST token hashing upon submission.
- Optional Webhook notifications (Discord / Telegram bot alerts for timeout warnings).
- Cryptographic code attestations linking completed projects to verified GitHub repository commits.

---

## 10. Risks and Mitigations

| Risk | Likelihood / Impact | Mitigation Strategy |
|---|---|---|
| **Malicious Claim & Disappearance** | High / High | Mandatory upfront credit stake collateral; 14-day timeout automatically forfeits stake to project owner and adds a permanent ghost strike. |
| **Owner Bad-Faith Rejection** | Medium / High | Owners must provide concrete justification; if an owner ghosts, the 7-day review timeout auto-approves and releases funds to the taker. |
| **Identity De-anonymization** | Low / High | Strict API sanitization (`sanitizeUser`); database separates internal user credentials from public `Digger-XXXX` aliases. |
| **Database Concurrency Race Conditions** | Medium / Medium | Atomic database transactions and status checks prevent duplicate claiming or double stake deductions. |

---

## 11. Summary

This project proposes **Gravefin**, a production-ready, deployable web platform engineered to eliminate waste in student and developer software ecosystems. By replacing unstructured communication with a deterministic, escrow-backed state machine and immutable ledger accountability, Gravefin proves that collaborative software completion can be achieved without financial overhead or subjective dispute. The project adheres to core engineering evaluation criteria, emphasizes rapid time-to-value, and delivers a robust, fully tested foundation ready for campus-wide deployment.
