# PROJECT GRAVEYARD — OVERVIEW & APPROACH

# 1. What This Project Is
Project Graveyard is a platform where unfinished/abandoned software projects get a second life. **Owners** upload projects they can't finish; anonymous **Takers** claim and complete them. The whole exchange is trust-less by design — no chat, no identity exposure, no manual negotiation. The system itself (via aliases, point-escrow, and automatic penalties) is what makes two strangers safe to work together.

One-liner: *"A blind, escrow-backed marketplace for finishing other people's abandoned code."*

# 2. The Problem
Every year, thousands of side-projects, hackathon builds, course projects, and startup attempts stall out — not because the idea was bad, but because the owner ran out of time, motivation, or skill. Meanwhile other developers keep re-building similar things from zero, and would happily finish someone else's work *if* they could trust the exchange: get credit/payment for real effort, not get ghosted, not have their work stolen.
Two unsolved trust problems block this today:
- **Owner's fear**: "If I let a stranger touch my project, will they disappear, do bad work, or steal it?"
- **Taker's fear**: "If I put in real effort, will the owner ghost me and refuse to pay/credit me?"

# 3. Our Approach
Rather than solving trust through *reputation-building relationships* (reviews, profiles, DMs — the usual marketplace playbook), we solve it by **removing the need for trust entirely**:
- **Anonymity** — neither side ever knows who the other is (alias-only). Nothing personal to exploit, nothing social to negotiate.
- **Escrow (points, not money)** — a Taker's stake is locked the moment they're approved. Skin in the game, systemically enforced.
- **Deterministic penalties** — every failure mode (ghosting, missed milestones, bad-faith work, early cancellation) has a pre-defined, automatic consequence. No manual disputes, no "he said/she said."
- **Append-only ledger** — every credit/reputation change is logged permanently, so the system's own history is the audit trail — not a moderator's judgment call.

This is a deliberate pivot from a "consent-based, attribution-preserving handover" model (documenting projects, owner picks a successor, relationship continues post-handover) toward a **fully automated, adversarial-safe marketplace**: assume zero trust, let the backend be the only enforcer.

# 4. What We're Building (MVP)
A minimal but complete loop:
1. Owner uploads a project (zip) + sets a stake requirement.
2. Taker discovers it, commits, gets approved, stake locks.
3. Taker works **off-platform, blind** — no messaging, no visibility into who's on the other end.
4. Taker submits → Owner reviews → system releases stake + reward, or the timeout/ghost/penalty rules kick in automatically.

Deliberately excluded from v1: real money, chat, GitHub integration, team/bounty projects, human moderators/dispute resolution, automated code testing. The MVP is intentionally narrow so the trust-enforcement core can be proven before anything else is layered on.

# 5. Core Differentiators
| Instead of... | We do... |
|---|---|
| Profiles, ratings, reviews | Pure alias + system-tracked reputation number |
| Manual dispute resolution | Fixed, automatic penalty rules for every failure mode |
| Real payments/escrow services | Internal points economy (no PCI/legal payments complexity) |
| Chat-based negotiation | No communication channel at all — the system mediates everything |
| Trusting the other person | Trusting the platform's rules |

# 6. Why This Approach (Rationale)
- Anonymity + no-chat removes the two biggest abuse vectors (harassment, off-platform deal-making, social pressure) with the least engineering effort.
- Points-based escrow sidesteps payment regulation/legal overhead entirely while still creating real stakes.
- Fully deterministic penalties mean the system is legible and fair by construction — every user can predict the exact consequence of every action before taking it, which is what makes trusting a stranger unnecessary.
- Keeping v1 to strict 1:1, no-chat, no-CI keeps the surface area small enough to actually validate the core trust mechanic before investing in richer features.

# 7. Roadmap
| Phase | Scope | Trigger to move forward |
|---|---|---|
| **Campus MVP** | This doc's scope. ~dozens–100 users, 1:1, points-only, manual review. | Prove ghosting/escrow rules hold up with real users |
| **Trust Layer Hardening** | Add basic anti-abuse (rate limits, ban logic already in MVP, better plagiarism detection) | MVP loop runs cleanly for a full cycle |
| **Enrichment (future/optional)** | Ideas inherited from earlier concept deck: GitHub-based Autopsy Report (decline timeline), Revival Score, Project DNA Card, architecture scanner — useful for *discovery*, not required for the trust mechanic | Post-MVP, if platform needs richer project profiles |
| **Community/Global (future)** | Contributor marketplace, leaderboards, revival bounties, public clone-report registry, real payments | Only after trust core is validated and scale demands it |

# 8. What Success Looks Like (MVP)
- Owners actually get stalled projects finished without getting burned.
- Takers actually get credited/rewarded without getting ghosted.
- Ghosting and bad-faith behavior measurably drop off after a few strikes (the penalty system is doing its job).
- Zero cases where a manual human had to step in to resolve a dispute (proves the system is genuinely trust-less, not just trust-lite).

# 9. Who This Is For
- **Owners**: developers/students/founders with a half-built project they can't finish but don't want to see die.
- **Takers**: developers who'd rather extend real, imperfect code than start from a blank file — and want a fair, low-stakes way to prove it.
- Not for: teams needing ongoing collaboration/communication, projects needing real-money payment, or anyone wanting credit/attribution as a public "case study" (that's the old concept's model, not this one).

# 10. What This Is NOT
- Not an open-source hosting platform (code stays private in escrow, not publicly browsable pre-release).
- Not a freelance marketplace with negotiation, chat, or portfolios.
- Not a code-review/CI/QA service — verification is a manual, binary Owner call.
- Not (yet) a real-money marketplace — credits only, no withdrawals/payouts in MVP.
