# Delegation & background agents — the safety rails

> The GitHub-issue/PR-orchestration slice of this — what the event router routes, what the coordinator
> hands off — now operates under **Moneypenny's** mandate — see [`docs/MONEYPENNY.md`](MONEYPENNY.md).
> The rails below are unchanged; she directs within them, never around them.

How Claude runs work in the background (subagents) while the foreground thread stays free for Eric's
dialog — and the rails that make it safe to expand. This is the Second Way (overlapping feedback) and
Theory of Constraints (delegate the subordinate work; keep the constraint's attention on the load-bearing
and irreversible) applied to autonomy itself.

## How it runs

The foreground thread (Eric + Claude) dispatches **subagents**, each in its **own isolated git
worktree**, to build a scoped item to completion — build → verify → screenshot → open a PR — then report.
They run concurrently with the dialog; a completion notification brings the result back. Eric keeps
feeding thoughts; work moves underneath.

## The rails (addressing single-point-of-failure & oversight)

1. **Bounded delegation.** Agents get only **cheap + reversible + no-governance** tasks with a clear
   spec. The irreversible/sensitive class (credentials, spend, real money, anything outward-facing and
   hard to undo) is **never delegated** — it stays foreground, Eric-gated. Blast radius of a bad agent =
   one un-merged PR.
2. **Isolation & disposability.** Each agent works in its own worktree with no shared mutable state. A
   failed, stuck, or wrong agent blocks nothing — it's abandoned, not merged. Agents don't run forever;
   they complete and notify.
3. **Verify-before-merge gate (the oversight checkpoint).** Agents **open PRs; they never merge.** A
   reviewer (Claude foreground now; Eric whenever he wants) brings the PR onto green `main`, re-runs
   typecheck + lint + test, glances at the diff, then merges. Nothing reaches `main` unreviewed.
4. **Overlapping nets — no single check is the SPOF.** Agent's own tests/lint + reviewer re-verify + CI
   + later passes. Drift is caught by *some* net. (Proven live: a background agent's lint caught a format
   drift the foreground check had missed; the foreground then corrected it — Detect · Correct · Maintain.)
5. **Durable state = no record SPOF.** Everything is externalized: the backlog in [`IDEAS.md`](IDEAS.md),
   branches + PRs on GitHub, the conventions in [`../CLAUDE.md`](../CLAUDE.md). If the session dies,
   work-in-flight survives on branches/PRs and a fresh session resumes from the docs. The coordinator is
   replaceable, not a point of failure for the *record* — only for in-the-moment orchestration.
6. **Escalation & circuit breakers.** A red PR never merges; a genuine design fork or ambiguity escalates
   to Eric rather than being guessed; a tripped rail halts and reports.

## Reliability — do we need Routines to keep agents working?

- **Present mode (Eric is here, dialoguing):** No. The foreground dispatches agents as ready work
  exists, reviews + merges results, and coordinates. The rails above are sufficient.
- **Unattended continuous mode (Eric is "napping in the skies"):** Yes — a **Routine / scheduled
  trigger** re-invokes the session to dispatch and review more work when the foreground is idle. That's a
  larger autonomy step, so it's **governance-gated and built rails-first**, exactly like the
  autonomous-issue system in [`LIVING-UNIVERSE.md`](LIVING-UNIVERSE.md). Not enabled by default.

## Expanding autonomous responsibility (the trust ladder)

Autonomy widens by Eric's explicit decision, one rung at a time, after the prior rung has a track record:

- **Rung 1 (current):** agents build cheap/reversible items → open PRs → Claude foreground verifies +
  merges. Eric watches.
- **Rung 2:** agents' PRs that pass all nets auto-merge on green (Claude reviews post-hoc), for a
  narrowed task class.
- **Rung 3:** a Routine keeps the pipeline running unattended, within the bounded class, with Eric
  reviewing a digest.

Every rung keeps the irreversible class Eric-gated and the overlapping nets intact. The ladder is how
"confidence to expand autonomous responsibilities" is *earned*, not assumed.
