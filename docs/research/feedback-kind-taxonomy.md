# Research: does "What kind?" need more than Bug / Feature / Idea?

**Date:** 2026-08-28 · **Trigger:** #644 (split out of #455's "seed feedback categories that match
user needs/intent" ask — the other three asks in #455 shipped as #452, #502, #629; this is the one
that needed real request data before any code, so it was deferred rather than built inline).

## TL;DR — decisions needed

| # | Item | Recommendation | Your call |
|---|------|-----------------|-----------|
| 1 | **Bug** | Keep as-is — grounded: 2/14 real submissions (14%), both clean bug reports | ✅ confirm |
| 2 | **Feature** | Keep as one bucket — grounded: 12/14 (86%), but see below; not enough data to split it further without guessing | ✅ confirm |
| 3 | **Idea** | **Zero real submissions, ever** — every filed "idea"-labeled issue in the repo's history was Claude-authored, not member feedback | needs a decision: keep, drop, or reposition — see §3 |
| 4 | Add a new 4th "kind" | **Don't** — the one real cluster big enough to deserve its own bucket (feedback about the feedback tool itself, 43%) is a *topic*, already served by "Where in the app? → This feedback form" (#629 shipped it) | no action — confirming a non-build |

---

## Where the data came from (and what wasn't reachable)

Two sources per #644's own open question:

1. **Historical `/feedback` submissions**, the live record. `src/server/feedback-log.ts` keeps one
   append-only JSONL file per member under `SKYNET_FEEDBACK_LOG_DIR` (default `data/feedback-log`,
   pinned to the mounted Fly volume in production). **Not reachable from this sandboxed research
   session** — no local `data/feedback-log` directory exists here and `SKYNET_FEEDBACK_LOG_DIR` is
   unset, which is expected: that volume only exists on the deployed app. Falling back to source #2
   alone, as the issue's own contingency says to.
2. **GitHub issues carrying the `feedback` label.** This turned out to be a complete stand-in for
   source #1, not a weaker substitute: `feedback-service.ts` posts the member's raw submission
   (kind, area, and their own words) as the GitHub issue body via `issueBody()` in
   `feedback-issue.ts`, and `feedback-log.ts` records an entry for the exact same event (a
   successful filing) — so every historical submission that source #1 would show is already sitting
   in the issue body, verbatim, on GitHub. Neither source can see a draft a member abandoned before
   hitting submit (the coach only ever produces a *draft*; nothing is posted until the member's
   explicit send, per `feedback-coach.ts`'s header) — but an abandoned draft was never a
   categorization decision to begin with, so that gap doesn't bias this taxonomy.

## The corpus

`label:feedback` across `ejclark/skynet-capital` returns **17 issues**. Read all 17 in full (title +
body; skipped comment threads — the categorization question is about what the member asked for at
submission time, not how it was triaged afterward). Of those 17, **3 are not member submissions** and
were excluded:

- **#567** — a Claude-authored spinoff (a milestone/gamification idea Claude filed off an inline
  Eric comment on PR #566). No "Submitted from the app by member…" footer; author is `claude[bot]`.
- **#494** — a Claude-authored engineering bug about the postmaster sweep's own close-out logic. Same
  reason.
- **#674** — a Claude-authored **plan** issue (the house plan capsule format — "Type · Surface ·
  Size" table, EARS criteria, settled forks) that Claude wrote as the build response to #716. It
  carries the `feedback` label for triage continuity but is not the member's own words.

All three carry `feedback`/`bug`/`enhancement` labels purely so the existing triage tooling
(`scripts/postmaster.mjs`'s sweep, the stall audit) treats them consistently — not because a member
picked a "kind" for them. Excluding them isn't a judgment call on their content; it's the difference
between "what did the taxonomy tool present to a member" and "what got labeled `feedback` for
unrelated reasons."

**Real corpus: 14 genuine member submissions**, each ending in the app's own
`_Submitted from the app by [member ]<name-or-id>._` footer:
`#716, #704, #702, #591, #562, #546, #507, #475, #455, #449, #447, #443, #436, #435`. All 14 came
from two distinct members (opaque ids `d7037b4107` and `341de5cb0e`) — the whole friends-and-family
league is small, so 14 is a real, if modest, sample; every count below is stated as a raw fraction of
14, not a percentage that implies more precision than 14 data points support.

## 1. The existing three kinds, as actually used

Every one of the 14 carries a title tag (`[bug]` / `[enhancement]`) that `titleFor()` derives
directly from the kind the member (or the AI coach, on their behalf) recorded at submission:

| Kind | Count | Which issues |
|---|---|---|
| 🐞 **Bug** | 2 / 14 | #702 (feedback coach got stuck in a reply loop), #591 (bought assets missing from the portfolio screen) |
| ✨ **Feature** | 12 / 14 | #716, #704, #562, #546, #507, #475, #455, #449, #447, #443, #436, #435 |
| 🗺️ **Idea** | **0 / 14** | none |

Both real bugs are exactly what the category is for — a concrete, reproducible thing that broke.
**Feature** is doing nearly all the work (86%): it covers everything from a large trading-mechanics
ask (#716, stop-limit orders) to a one-line joke about adding crypto (#562, "Wen moon? Wen Lambo?
HODL!!"). That's a wide range of *how developed* the ask is, but I could not find a second axis in
the actual text that would split "Feature" into two or more groups without inventing categories
that only 1–2 of the 12 would map to — which is exactly what #644's own EARS criteria says not to
do. **Recommendation: leave Feature as one bucket** until the corpus is bigger.

## 2. Idea: a category with no real submissions to ground it

Zero of the 14 real submissions used "idea." Widening the check to the whole repo (not just the
14) makes the finding stronger, not weaker: `label:idea` across the entire repo returns exactly
**one** issue, ever (#456, "landing meter — measure whether PR pictures and reports actually land"),
and that one is a Claude-authored fan-out issue, not a member submission (no app footer). **No
member has ever used the "idea" kind, on this app or via GitHub directly.**

This doesn't mean "idea" is a bad category in the abstract — a 🗺️ "side quest, worth exploring" kind
is a reasonable thing to offer. It means the data cannot ground keeping it, and per #644's EARS
criteria ("WHERE a proposed category maps to zero or very few historical submissions THE SYSTEM
SHALL say so rather than including it on assumption") it has to be named as unvalidated rather than
carried forward quietly. One real clue toward *why* it's unused: #562 (the crypto ask) reads exactly
like an "idea" in spirit — informal, no acceptance criteria, closer to a wish than a spec — and yet
the member filed it as **Feature**. That suggests "Feature" is already absorbing loosely-formed asks
that a stricter reading might call ideas, which would explain the 0-count without "idea" being a bad
concept.

This is a genuine fork, not something the data alone settles — three honest options, in order of how
much they change:

- **Keep it.** Costs nothing to leave in place; a low-volume friends-and-family app may simply not
  have produced an idea-shaped submission yet in 14 tries.
- **Drop it**, collapsing the selector to Bug / Feature — matches 100% of real usage today, and is
  the simpler UI. Reversible: adding it back later if real idea-shaped submissions start showing up
  costs one code change.
- **Reposition it** — e.g. relabel or re-describe it so it reads as distinct from "Feature" rather
  than a softer version of the same thing (the crypto ask suggests members don't currently
  distinguish "a wish" from "a feature ask" the way the label implies they should).

## 3. Why no 4th kind is being proposed

Grouping the 14 by *what they're actually about* (not their bug/feature label) turns up one real
cluster big enough to matter: **6 of 14 (43%) are feedback about the `/feedback` flow itself** —
#702 (coach got stuck), #455 (the ask that split into #644), #449 (AI-first redesign), #443 (form
layout), #436 (link issues + attach images), #435 (the original AI-coach ask). That is a strong,
real signal — but it's a signal about *where* the member's attention was, not *what kind* of report
they were filing (three of the six are literally tagged `[enhancement]`, one `[bug]`). The "Where in
the app?" selector already has an option for exactly this — `"This feedback form"` — added in #629,
which shipped from this same parent issue (#455) already. Adding a "meta-feedback" *kind* would
duplicate a dimension that's already correctly modeled as a location, not a type; per #644's own
constraint against long-tail sprawl on a single-screen select, that's a clear "don't."

The other four remaining are one-offs or two-item pairs with no group large enough to name as a
category without over-fitting 14 data points: trading-mechanics asks (#716, #704 — order types and
order-review UX), account/data-sync bugs (#591, #546 — both about an account not behaving as
"connected"), layout/navigation asks (#507, #475), and one onboarding-instruction ask (#447). None
of these clear even 3/14 on their own, so none earns a dedicated *kind* — though they're worth
naming as candidate journeys to watch (trading-mechanics asks especially: #716 and #704 both came in
the same week from the same member and both concern the order ticket / review screen).

## Bottom line

The current three-kind selector is **two-thirds validated and one-third unproven**: Bug and Feature
both have real, distinct submissions behind them and should stay as-is; Idea has never once been
used by a real member across the app's whole history, and that needs an explicit call (§3) rather
than staying on the form by default. No 4th kind is warranted by the data — the one large real
cluster (feedback about the feedback tool itself) is already correctly served by the "Where in the
app?" list, not the "What kind?" one. Per #644's own slicing sketch, wiring any of this into the
actual select (`src/server/feedback-issue.ts`, `src/observatory/feedback-view.ts`) is a follow-up PR,
not this one — this document is the grounding for that follow-up, not the change itself.
