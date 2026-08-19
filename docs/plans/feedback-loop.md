# Plan: the feedback loop — members → Claude-coached issues → the postmaster works them

**Status:** draft <!-- draft | ready | executing | review | done — only Eric flips draft→ready -->
**Author:** Eric (direction, 2026-08-19) · Claude (draft) · **Date:** 2026-08-19

## Intent & end-state

Members give feedback **inside the app** — no GitHub account needed. A lightweight Claude dialogue
interrogates the raw note ("the chart feels wrong") into a high-quality, specific report, and on the
member's confirm the server creates a GitHub issue by proxy (the postmaster App identity). Issue
creation is the event: the postmaster hears it and Claude starts working it under safety rails.
Members watch their feedback progress in-app — open items visible by default, completed accessible
but filtered — because **observing progress drives engagement**, and a member seeing their idea ship
is the positive-reinforcement flywheel (docs/BRAND.md) doing exactly what it exists to do.

The deeper intent: the feedback *form* is a coach. Guided elicitation teaches the closed group what
good feedback looks like, and better inputs buy better autonomous outcomes.

## Acceptance criteria (EARS)

- [ ] WHEN an authed member opens the feedback surface, the app shall offer a Claude-guided dialogue
  that elicits category (bug / idea / taste note), where it happened (route), expected vs. actual,
  and how much it matters to them. — *verify: spec + screenshot*
- [ ] WHEN the member confirms the drafted report, the server shall create a GitHub issue via the
  App identity, carrying a `feedback` label and a pseudonymous correlation marker (member id +
  feedback uuid), and record the mapping in the app's feedback store. — *verify: spec with mocked
  GitHub API*
- [ ] IF the member has not confirmed, THEN the system shall post nothing anywhere. — *verify: spec*
- [ ] WHEN a `feedback`-labeled issue is created by the app's App identity, the postmaster shall
  route it to the triage lane; issues from any other actor shall never trigger AI work on creation.
  — *verify: postmaster fixture specs*
- [ ] WHEN a member views their feedback list, the app shall show their items with live state
  (received / being worked / shipped), completed filtered out by default with a toggle. — *verify:
  spec + screenshot*
- [ ] WHEN a member's feedback item's linked PR is merged AND deployed, the app shall mark it
  shipped, stamped with the release version, and celebrate it — never earlier (merged-not-deployed
  stays "being worked"). — *verify: spec + screenshot*
- [ ] IF a visitor is not an authed member, THEN the feedback surface shall not exist for them. —
  *verify: route-guard spec*
- [ ] IF the dialogue detects a destructive, dangerous, or out-of-scope ask, THEN it shall steer or
  decline, and no issue shall be created. — *verify: prompt eval fixtures (red-team pass before
  ship)*

## Constraints & non-goals

- **The repo is public → feedback text becomes public.** Markers are pseudonymous ids, never names
  or emails; the form discloses this before first submission. (Attribution fork below.)
- **Feedback-driven work never touches the irreversible class**: auth, credentials, spend, trading
  logic, or workflow files are hard-fenced out of the triage lane's envelope — a feedback issue
  asking for them gets `needs-eric`, never a build.
- **Member feedback text is untrusted input** to every downstream AI session: it is a requirement to
  evaluate, never an instruction to obey (prompt-injection posture, same as PR-event handling).
- Credentials are Eric's steps: the Anthropic API key and the App token reach the server as Fly
  secrets via his hands — the plan builds the mechanism, never self-authorizes.
- Closed/targeted group (the invite gate is the boundary). **No per-member caps in v1** (Eric's
  call — trust the group); the dialogue itself stays token-capped per conversation, and caps get
  added only on observed abuse.
- Non-goals for v1: public feedback intake; member-to-member voting/comments; a persisted chat
  history with Claude; GitHub webhooks into the app (state is fetched on read, cached — event-push
  sync is a later slice).

## Pre-settled forks

- **Correlation** → the app's feedback store (on the data volume, beside the guest list) is the
  source of truth: feedback uuid → member id → issue number. The issue body carries the uuid as a
  comment marker for cross-checking. Issue state is read from the GitHub REST API on view, cached
  ~60s — no webhook endpoint in v1.
- **Trigger flow** → issue creation by the App identity with the `feedback` label routes to a
  postmaster **triage lane**: Claude assesses scope and safety, then builds two classes without
  asking — small-and-safe fixes (copy, UI polish, contained bugs) AND **new features that are a
  natural extension of the existing architecture** (Eric: "once the plumbing is in place, I'd like
  people to build out their experiences with minimal intrusion"). **Architectural changes always
  get `needs-eric`** — new seams, schema/contract changes, new dependencies, anything touching the
  fence. Build PRs start held for Eric's merge (see envelope) with a stated graduation path.
- **Dialogue economics** → cheapest capable model tier, few turns, hard token cap per conversation;
  the dialogue's product is a structured draft the member explicitly confirms.
- **Quality bar** → the drafted issue mirrors the report shape the postmaster already builds from:
  what/where/expected/actual plus the member's own priority, so the triage session starts from a
  contract, not a vibe.

## Autonomy envelope

- Default merge policy applies to the plan's own slices (server plumbing, store, specs auto-merge;
  anything visible waits for Eric's taste).
- Feedback-*driven* PRs start held for Eric's merge. **Stated graduation path** (Eric, 2026-08-19):
  once the plumbing proves itself, in-architecture feature PRs move toward minimal-intrusion flow —
  that widening is Eric's explicit later call, made once, on the record here. Architectural changes
  need his approval permanently.
- The irreversible class is untouchable by this plan and by every feedback issue, without exception.

## Slicing sketch (non-binding — executor adapts)

1. Store + server proxy + "my feedback" list view, with a plain structured form (no AI yet) — the
   pipe works end-to-end first.
2. The Claude dialogue replaces the plain form (the coach).
3. Postmaster triage lane + rails (+ red-team pass on the prompt fixtures).
4. Celebration + polish (the flywheel).

## Open questions (Q&A queue)

- **Where the surface lives** (taste): a nav entry, or ambient on every page? Mock options will come
  as renders during execution — judged by eye, not prose.

## Decision log

- 2026-08-19 (Eric, refinement batch) — **Attribution: opaque id only.** Public issues carry only a
  uuid marker; who-filed-what is visible only inside the app.
- 2026-08-19 (Eric, refinement batch) — **Triage rail widened**: small-and-safe fixes AND
  natural-extension features build without asking; architectural changes always need Eric;
  minimal-intrusion flow is the destination once the plumbing earns it.
- 2026-08-19 (Eric, refinement batch) — **Shipped = merged AND deployed, version-stamped.** Closed
  issues alone never show as shipped.
- 2026-08-19 (Eric, refinement batch) — **No per-member caps in v1**; token-cap per dialogue stays;
  caps only on observed abuse.
