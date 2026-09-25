# Readers — who reads what we write, and how

Every artifact this repo produces has a reader, and the reader is not the author. A PR body, an
issue, a digest, a call sheet, a wake reply, a persona's thesis line, a bot's recap, a Machine-context
block — each lands on one of the readers below, and each reader decodes differently. This page is
the **living model** of those readers (Eric, 2026-09-25: *"a personalized living model of me… helps
close gaps in our communication"*). It is loaded on demand — by `/issue`, `/ship`, `/secretary`,
`/mermaid` and any session about to write *for* one of these readers — never by default.

**Living means:** every correction Eric makes to a format, and every `/retro` on a communication
miss, appends a dated row to the relevant reader's *corrections* table. The model sharpens as he
corrects it; a row is never rewritten, only superseded by a later one.

## Eric — the primary reader

**Where he is coming from** (synthesised from 23 dated decisions in issues, PRs, journeys and lessons, 2026-09-25):

> Eric runs this repo as a product owner who treats his own attention as the binding constraint and wants every artifact shaped so he can spend it in seconds, by eye. He does not read walls; he scans — the first line, the left edge, a table, a picture — and nearly all his corrections are about where something sits (above or below the fold, in a callout, in an issue rather than a file, in one platter rather than seven PRs) rather than about wording. He directs by outcome and places by reaction: he can say a render is a 30/100 or "the workbench is best", and expects the system to carry the technique, hand him 3–5 named shapes on the real surface, and give him the words (kind, section, bench, fog of war) that turn "feels out of place" into a precise ask — while refusing coined labels that hide what a thing does. He reacts against re-litigation, recurring blessing-asks, compliance without interrogation, and being made to arbitrate a mechanism; he reacts for honest pictures with captions and falsifiers, decisions written down before they are built, and process investments that compound. He rules fast when a call sheet recommends (21 minutes on #1740) and defers when a fork is thin on data. He came to diagrams early: in July 2026 he named ToC, roadmap and Mermaid system diagrams as his "spec surface", and that layer was never built — today the only architecture map is a code graph refreshed by hand, and every session re-derives the system by grep. His Mermaid/C4 pivot is the fridge rule pointed at the one layer he still cannot see.

### How he reads (the physical facts)

| Fact | Consequence for the author | Source |
|---|---|---|
| Phone first, often travelling; github.com in a **browser** (the GitHub mobile app renders no Mermaid) | 390px is the reading condition; `TD` over `LR`; ≤4 participants; big labels | PICTURES.md; 2026-09-04 (five approval taps on a phone) |
| ~10 seconds on the opening frame, F-pattern: first line, then left edges | the picture is the argument; the left edge of every list carries the verb | CLAUDE.md → fridge rule (2026-08-20) |
| Mild red/green colourblindness; dark mode | hue never carries meaning alone; ≥3:1 non-text contrast; shape/weight/word beside every colour | BRAND.md → Accessibility (2026-09-06) |
| Reads *reactions*, not checklists, on a live surface | hand him the route/URL; feedback comes back as reactions | 2026-08-16 |
| Digests over play-by-play as autonomy rises | tiered: needs-you · headlines · noise-absorbed | 2026-08-15 |

### How he thinks (the mental models he decodes fastest)

- **Lifecycles and mechanics.** A gate, a mode, a rung, a state machine — he asks "what state is it
  in and what flips it". A `stateDiagram-v2` lands faster than the same content as a flowchart.
- **Cinematic / visual metaphors** (tractor beam, telestrator, the Eye of Sauron) and **D&D lore** —
  a metaphor is a spec for mechanics, never a decoration; translate it faithfully.
- **Theory of Constraints, the Three Ways, Extreme Ownership** — "what is the binding constraint",
  "flow / feedback / learning", "intent and end-state". Frame a trade-off in those words and it is
  already half-decided.
- **Information architecture before implementation** — "what is this thing and how does it relate
  to everything else" comes before any route or file name (2026-08-29).
- **DX is UX** — a gate, a template, a skill is a product with users; he judges it by measured use,
  not by its age (2026-09-06).
- **Named shapes over described ones** — 3–5 options he can judge by eye, each pointing at its row in
  PATTERNS.md; a menu of unexplained names is not a question he can answer (2026-09-06, 2026-09-25).

### What he reacts against (the recurring corrections)

| Date | The miss | The correction, in his words | The rule it became |
|---|---|---|---|
| 2026-08-15 | play-by-play as autonomy rose | "the higher altitude of a report out/feedback i need" | `/secretary` tiers |
| 2026-08-19 | long summary bullets | "ONE SHORT LINE EACH" | checkbody's 120-char cap |
| 2026-08-20 | walls of text | "dumb this shit down and draw more pictures… to hang on the fridge" | the fridge rule |
| 2026-08-21 | plans as files | "plans belong in github issues, not in source code" | plan issues |
| 2026-08-23 | research that describes, never decides | (the call-sheet rule) | research leads with the call |
| 2026-08-29 | reshuffling around an existing route | "routes are implementation details of the IA… I will die on that hill" | IA decision written first |
| 2026-09-04 | compliance without pushback | "I feel like you inadequately interrogate my suggestions" | the interrogation step |
| 2026-09-04 | recurring blessing-asks | "the patterns that require my blessing for repetitious work is what doesn't scale" | one-time governance fixes |
| 2026-09-04 | a wake reply re-narrating a PR body | (one line, plus an optional why) | the PR-watch reply rule |
| 2026-09-06 | gates that fire on the wrong thing | "a smell now… removes a momentum breaker" | advisory unless it protects a constraint |
| 2026-09-25 | invented names in copy and questions | "another cute word you keep using that i've told you to stop" | name what the thing does |
| 2026-09-25 | primitive, dull PR charts | "the blandness requires more cognitive load… contrast, shapes, pictures, mental models, data structures" | the Mermaid grammar v2; this page |

### The full record (every dated correction with his words, from the lineage pass)

| Date | Where | His words | What it became |
|---|---|---|---|
| 2026-08-15 | docs/plans/secretary.md + docs/digests/2026-08-15.md (first digest) +  | "the more autonomously changes are getting in, the higher altitude of a report out/feedback i need.. the less play by play i can manage" (secretary.md:5-6); same day, LES | /secretary three-tier digest (Needs you · Headlines · Noise absorbed); Needs-you items as numbered, pre-verifi |
| 2026-08-16 | CLAUDE.md → "…but the bar is not silence" | "faster for me to just review the changes in the preview on desktop mode or live in the browser and adapt from there" | hand him the route/URL; feedback comes back as reactions; PR Summary bullet "Review live after deploy: /route" |
| 2026-08-17 | docs/LESSONS.md:1430-1458 (the severed workflow chain) | "I'm waiting.. when will i know?" · "waiting for commits to a doc file - seems flimsy af" · "we want event driven architecture, not polling (shit) architecture" | the hop was deleted (scan and build in one run); issues became receipts, never triggers; claim refs visible in |
| 2026-08-19 | Issues #429, #433 (Eric-authored) — the house plan format and the migr | #433: "scan for inappropriately committed documents/artifacts that belong in github issues and migrate them … the clean up could be used to test/validate the process is w | plan-as-issue in the house shape: Intent & end-state · EARS criteria · Constraints · Settled forks (decision l |
| 2026-08-20 | PR #446 (flagship fridge PR, merged by Eric) → PR #458 (hat-team commu | "dumb this shit down and draw more pictures... I want some god damn pictures to hang on the fridge" (CLAUDE.md:357); asked for "deeper red/yellow/blue/white hat research  | Every PR opens with a picture or an honest `Picture: waived — <reason>`; change-type → picture decision table; |
| 2026-08-20 | docs/plans/issue-centric-orchestration.md + CLAUDE.md idea routing (fa | "One advantage of creating new feedback issues.. those are launched in new claude sessions, unlike my rapid fire comment chain of ideas that conflat context in the same s | the FAN: route — every raw idea becomes a self-contained story-capsule issue built in a fresh session; #456 fi |
| 2026-08-20 | Issue #449 comments (Eric) → PR #474, label semantics | "The architecture/plumbing for the feedback system is in place. This request is polishing the system, not shifting architecture… who cares. Sidebar - having evals in plac | needs-eric as the single review signal; blanket hold replaced by the envelope carve-out (#474); auto-merge by  |
| 2026-08-21 | docs/LESSONS.md:1059-1070 + docs/ISSUES.md (born from the 71-issue aud | "plans belong in github issues, not in source code. This is an error you persistently make." · "GitHub issues seem like a system that is bound to become a constraint as m | CLAUDE.md Plans doctrine (issues only, never docs/plans/); the issue capsule — one-line imperative ask · metad |
| 2026-08-23 | PR #515 (docs: lead research with the call sheet) → CLAUDE.md:364-376  | a research TLDR should give a direct directional read — "expect pull back, bad time to buy" / "consider buying before this date" — not a description of the situation (PR  | the call sheet: one row per horizon/name — the call · confidence · one-line why · dated falsifier; confidence  |
| 2026-08-29 | PR #819, issue #895, issue #784 comments, PR #898 (docs/MONEYPENNY.md) | "routes are implementation details of the IA... better IA results in more intuitive and superior implementation. I will die on that hill" (CLAUDE.md:83-85) · #784: "Don't | IA drives implementation; the IA decision is written down (issue or surface-doc note) before an implementation |
| 2026-09-04 | CLAUDE.md:169-197, 260-272, 350-356, 428-436, 468-475; issues #1318, # | "I feel like you inadequately interrogate my suggestions/commands. It feels like we need event triggers and/or listeners to trigger interrogation process which organicall | the interrogation call sheet (verbatim · amended · reject · status quo, each with confidence and a dated falsi |
| 2026-09-05 | progressive-reveal exercise (#1461 'The Rail Over the Form' mock; docs | "I like the rail mechanic the best. This is light, and offers clickable components as a mechanic" · "we will practice mobile first design here to curate that experience t | propose-then-place: Claude renders named shapes on a candidate surface, Eric places; a rejected placement bank |
| 2026-09-06 | Issues #1713, #1740; docs/PATTERNS.md; docs/FOG-OF-WAR.md; docs/COACHE | "I see DX as UX for engineering/architecture roles… UX Operations… highly relevant to shaping our research" · "a decision towards the side of the spectrum where god files | a stance as a hypothesis table with falsifiers (#1713 comment 1: H1/H2/H3 · confidence · proves it wrong); mea |
| 2026-09-07 | CLAUDE.md:296-305 (a fork thin on data is not needs-eric yet) — from # | "I tend to defer these decisions. Completing other known work consistently provides extra insights that result in strong enough data points to make an informed decision;  | two written checks before needs-eric: erosion (name the slice whose landing reopens it → next-slice) and the d |
| 2026-09-08 | Issue #1977 (Eric-authored raw idea) + ISSUES.md 'Raw idea (verbatim)' | "would it make sense for a github projet board to be integrated into the issues board?… people can vote on which we can integrate back into the collaboration and engement | the capsule gains an optional 'Raw idea (verbatim)' subsection first inside the fold, Status: draft so lanes s |
| 2026-09-19 | Issue #3325 (Eric-authored) → PR #3327; #3333 (Playwright CT harness) | "Playwright gives our CI process a visual sense thus feels very important to integrate into our process." · "full page Playwright snapshots are brittle… This could be a p | full-page screenshots by default; AI-classified diff triage (intentional vs regression); a standing UX-audit s |
| 2026-09-21 → 2026-09-22 | PR #3406 (trading-parity study + lo-fi shapes) + issue #3407 (38 comme | "Think about ideal designs, don't constrain/limit designs based off the current design." · "the intent … was so that you had data points backed by research to build the d | research first with a 32-row call sheet and provenance grades; four greybox lo-fi shapes with real values, sha |
| 2026-09-22 | docs/LESSONS.md:2562-2600 + .claude/output-styles/orient.md:128-129 | "Why do you need my blessing? I ask so u can codify removal of the impediment you continue to add." | orient.md: end with the next step stated as taken, never as a question gating it; the phrasing tells ('say the |
| 2026-09-23 | docs/PATTERNS.md discovery ledger (Collections retired, #3623) | "collections feel of more interest if they are a derivative/byproduct of research. Otherwise… a relic design." | the page went; its ideas banked as rows with the commit that still holds the code |
| 2026-09-25 | CLAUDE.md:146-152 (no coined names) + PR #3732 (rename 'position brief | on 'the Brief': "another cute word you keep using that i've told you to stop because it's confusing" | describe a feature by its job; when asking his opinion, first state what each system does and what the join is |

### What engages him (the signal that we are aligned)

Engagement is his stated alignment indicator (2026-09-25). What has drawn it: a picture that makes
the causal argument (a before/after sequence, #3737); a mechanism rendered so he can judge by eye;
a counter-intuitive stance held as a hypothesis with a falsifier; a side quest that improves the
process; a named pattern he can ask for by name afterwards. - **PR #446 (2026-08-19, merged by Eric) — the flagship fridge PR** — Three screenshots (play picker, guided ticket, account) plus a `flowchart LR` of how an order moves with emoji-labelled  → He merged it; the same day he said "dumb this shit down and draw more pictures... I want some god damn pictures to hang on the fridge" — thi
- **docs/PICTURES.md (PR #458, 2026-08-20)** — The change-type → picture decision table (screenshots / flowchart LR / sequenceDiagram / stateDiagram-v2 / erDiagram / c → No direct quote; asked for the hat-team research that produced it; 2026-08-30 "likes the existing before/after diagrams"
- **docs/research/ai-hardware-constraints-aug-2026.md → The picture (2026-08-22, PR ** — The constraint clock — a `flowchart LR` with four phase subgraphs (EARLY / MID rent-collecting / LATE tells printed / DO → The doc had "regressed" into taxonomy — he wanted "expect pull back, bad time to buy" / "consider buying before this date"
- **PR #515 → CLAUDE.md:364-376, docs/process/EVENT-RESEARCH.md, /research renderer** — The call sheet as a GFM table: Name · The call · Confidence · (one-line why) · Proves me wrong — "That table is the chan → His correction produced it ("a research TLDR should give a direct directional read")
- **PR #965 (2026-08-30)** — A before/after table as the picture (Body position · Before · After) for where a needs-eric decision lives; the `> [!IMP → "He also flagged that he likes the existing before/after diagrams"; the callout answered his complaint that asks sat 3/4 down an accordion
- **PR #819 (2026-08-29)** — A four-node `flowchart LR` narrating the nav regression: before topbar → #815's swap → `/outpost` unreachable → this PR  → Merged by Eric; the IA-first principle ("I will die on that hill") was banked in this PR
- **docs/FOG-OF-WAR.md (2026-09-06)** — The five-question decision tree as a `flowchart TD` (does misuse cost capital → is safety info separable → is there an e → "a spot on / perfect scenario" for the research day lens; asked to inspect the criteria and illuminate what else checks them
- **Issue #1740 body (2026-09-06)** — A proposed `flowchart LR` Topbar → Rail → Tabs (proposed) → Content, captioned "proposed: the third navigation dimension → His ask was "tabs could be an organic boundary structure"; no reaction to the diagram itself

What has not: a module map that looks
the same on every PR; a paragraph in a table cell; a question that makes him arbitrate a technique.

## A member (invite-only, paper-trading)

Reads the app, not the repo. Plain words first, jargon glossed in parentheses; never a coined name;
honest `SIM` labels; positive reinforcement without distorting a loss. Mobile-first on the trading
surfaces. Diagrams in-app must render there (the `/research` page renders no Mermaid today).

## A zero-context build session

Reads the raw markdown, so folds cost it nothing. Needs: the one-line ask, EARS lines it can turn
into specs, the diagram as a contract (a `stateDiagram-v2` whose transitions are the EARS lines; a
C4 page naming the container it may touch), and the falsifier that tells it when it is wrong.
