# Plan: the research lab — studies on the site, requests from the members

**Status:** draft <!-- draft | ready | executing | review | done — only Eric flips draft→ready -->
**Author:** Claude (proposing, from Eric's direction) · **Date:** 2026-08-12

## Intent & end-state

Eric: *"weave our research back to the skynet-capital site in a way that others can use and
benefit… GitHub issues submitted through the interface could drive more research on topics people
submit — essentially a research lab on stock market opportunities for everyone to benefit."*

The repo now holds a real research shelf — five studies with red-team verdicts
(`docs/research/`), a repeatable method ([`constraint-watch.md`](../research/constraint-watch.md)),
a forward-test register, and a parameterized research engine
(`.claude/workflows/symbol-sweep.js`). Today all of it is invisible to the league. End-state: an
authed member reads every study on the site in the house style, submits a research topic from
inside the app (no GitHub account needed), and sees the commissioned study published with their
name on it — the full loop: **request → study → red team → published doc → the requester reads it
on the site.** Research becomes a shared product of the league, and the fun flywheel gets a new
surface (commissioning a study is a thing members *do*).

Eric has said he'll eventually plug in Claude-driven design iteration on the reading experience —
slice 1 deliberately ships the smallest honest substrate for that pass to improve.

## Acceptance criteria (EARS)

- [ ] WHEN an authed member visits `/research`, the observatory shall list published studies
      (title, date, one-line verdict) and render each markdown doc in the house shell. —
      *verify: spec + screenshot*
- [ ] IF a visitor is not authed, THEN the observatory shall serve no research content (the
      invite gate holds). — *verify: spec*
- [ ] WHEN a research doc renders, it shall carry the standing educational framing (paper
      trading; research, not investment advice) — the honesty invariant applied to published
      research. — *verify: spec asserting the banner on every research page*
- [ ] WHEN a member submits a research request (topic + optional tickers + question), the system
      shall file a labelled `research-request` GitHub issue attributing the submitter, reusing
      the feedback funnel. — *verify: spec on `feedback-service` with the new kind*
- [ ] WHEN a commissioned study is published, its doc shall name the requester and link the
      originating issue, and the issue shall close with a link to the published page. —
      *verify: process rule in the study workflow; checked at publish*

## Constraints & non-goals

- **Git stays the CMS.** Studies are markdown in `docs/research/`, versioned, reviewed, and
  deployed like everything else. No editor UI, no database.
- **Member-gated first.** Research sits behind the invite gate like the rest of the shared
  universe. A public teaser is an open question, not a default.
- **No member-triggered compute without Eric's envelope.** A request files an issue; a *session*
  (Claude + Eric's normal loop) runs the study. Auto-running the sweep on member submissions is
  explicitly deferred (open question 2).
- **Not the design pass.** Slice 1 is a clean, minimal reading surface; Eric's Claude-design
  iteration comes later and should find nothing to unwind.

## Pre-settled forks

- **Markdown rendering** → server-side with a small GFM-capable renderer (the studies are
  table-heavy), output escaped through the existing HTML helpers. One small dependency beats a
  hand-rolled parser that will half-support tables forever.
- **Where requests land** → the existing feedback funnel (`src/server/feedback-service.ts`).
  `FeedbackKind` gains `"research"`; labels `["research-request", "feedback"]`; title tag
  `[research]`. The `/feedback` form gains the category + an optional tickers field. No new
  service, no new token.
- **How studies run** → the named `symbol-sweep` workflow for ticker studies; bespoke workflows
  (energy-map shape) for thematic ones. The kill list is checked before any study runs — a
  request that re-asks a killed hypothesis gets the kill-list citation as its answer (fast,
  honest, and teaches the method).
- **Attribution** → "Commissioned by <displayName>" on the published doc, mirroring the funnel's
  existing submitter attribution. Anonymous allowed (the funnel already permits it).

## Slices

1. **`/research` shelf + doc rendering** — route, index page, server-side markdown → house
   shell, invite-gated, honesty banner. Content exists today, so this ships value immediately.
   *Plumbing auto-merges on green; the rendered look gets Eric's eye before the link is shared.*
2. **`research` feedback kind** — the three-line service extension + form category + tickers
   field. *Auto-merge on green.*
3. **The lab loop as process** — a short `docs/` runbook: how a `research-request` issue becomes
   a study (sweep args or bespoke), lands as a doc PR linking the issue, closes the issue on
   publish. This is doctrine + labels, not code. *Auto-merge on green.*
4. **Contributor surface (fun flywheel)** — requester credit beyond the doc byline: a
   "commissioned studies" element on profiles or the leaderboard. *Visual/taste — waits for
   Eric, and pairs naturally with his design-iteration pass.*

## Autonomy envelope

- Slices 1–3 build autonomously; default merge policy. Slice 4 waits for Eric's taste.
- **Never widenable here:** the invite gate's placement, any public exposure of research
  content, and any auto-run of compute from member submissions.

## Open questions (Q&A queue)

1. **Gate placement** — member-only, or a public teaser page (titles + one-line verdicts, docs
   gated)? Member-only is the default until you say otherwise.
2. **Request → study policy** — queue-for-your-approval (default), or let sessions auto-pick
   requests up to N per week?
3. **Contributor credit on the leaderboard** — worth a slice 4 design pass, or byline-only for
   now?

## Decision log

_(none yet)_
