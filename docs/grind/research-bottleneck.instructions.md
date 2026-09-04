# Research one bottleneck — find the superior existing solution, then battle-test it

**Calling convention:** invoke with `effort: "high"` and the strongest model the caller has — this
is research, not a mechanical chore, and grind's cheap defaults are the wrong fit. Items are open
issues carrying the `bottleneck` label, passed as plain issue numbers (`"1318"`), so `{item}`
substitutes cleanly. Nothing is pushed; the deliverable is one comment on the issue plus a label,
so the outcome check is the comment's marker line, not a branch:

```json
{ "kind": "script", "command": "curl -sS -H \"Authorization: Bearer $GITHUB_TOKEN\" -H \"Accept: application/vnd.github+json\" \"https://api.github.com/repos/ejclark/skynet-capital/issues/{item}/comments?per_page=100\" | grep -q bottleneck-research" }
```

`isolation` is unnecessary (no checkout, no file edits). Run several items concurrently — they are
independent by construction; a bottleneck whose answer depends on another's is two issues that
should link each other, not one grind item.

## Goal

For one `bottleneck`-labelled issue — a measured constraint that now binds because something
upstream got faster (a rate limit, a WIP throttle, a shared file every lane races, a manual step
every session repeats) — find the **superior existing solution**, evaluate it against primary
sources and this repo's real constraints, battle-test the candidates, and leave a call sheet on the
issue that the next session can act on without re-deriving any of it. Bespoke builds are the last
resort, not the first idea (`docs/TECHNIQUES.md` → "Adopt elegant existing solutions — but read the
docs first").

## Steps

1. Read the issue and every comment on it:
   `curl -sS -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" https://api.github.com/repos/ejclark/skynet-capital/issues/<n>` and the same URL with `/comments?per_page=100`. Then read
   `docs/research-teams/PLAYBOOK.md` ("Don't make assumptions", "Battle-testing candidate
   solutions"), `docs/TECHNIQUES.md` ("Adopt elegant existing solutions", "Tool documentation is
   the authority"), and CLAUDE.md's "Research leads with the call" paragraph. These set the bar.
2. **Confirm the bottleneck is real and measured before researching a fix for it.** Find the
   evidence in the repo itself — the file, the scan output, the PR/issue history, the workflow log
   — not the issue's assertion of it. If you can't reproduce or locate the constraint, stop: report
   `status: "blocked"` with summary "not reproducible/measured — looked at <what>" and post that as
   the comment instead of a call sheet. A fix for an unmeasured bottleneck is speculation.
3. **Survey existing solutions — at least two genuinely different candidates**, plus "keep the
   status quo" as a candidate in its own right. Prefer proven tools and practices this repo could
   adopt over anything it would have to build. For each candidate, read the **primary source** —
   the vendor's/official docs via `context7` or the project's own site, the actual paper, the
   actual changelog — never a blog's summary of it. Record, per candidate: what it would take to
   integrate here (files, config, the exact API/flag), its stated limits and failure modes, its
   maintenance cost, and whether the integration touches anything in `envelope.json`'s protected
   class (`node scripts/envelope-scan.mjs --check <paths>`).
4. **Battle-test every candidate, including the status quo.** Red: the strongest reason it fails
   *here*, in this repo's actual shape. Tiger: blast radius if it's wrong once adopted at scale —
   what breaks, is it reversible, does it touch a protected path. A candidate with no stated
   weakness got insufficient scrutiny, not a clean bill of health. If the surface is wide enough
   that one honest pass can't cover it (a change to how every lane merges, say), report
   `status: "blocked"` with "needs a full team pass" — the orchestrator escalates to a bespoke
   red/blue/purple/tiger/yellow workflow per the playbook.
5. **Post exactly one comment**, whose first line is `<!-- bottleneck-research -->`, in call-sheet
   form (the shape `docs/process/EVENT-RESEARCH.md` uses, applied to solutions instead of events):
   - A table, one row per candidate (status quo included): **the call** (adopt · pilot · reject ·
     stand aside) · **confidence** (high · medium · low) · **the one-line why** · **the dated
     observation that would prove the call wrong**.
   - **Recommended next step**, one imperative line — the do, then the why after an em dash. If
     the best move is "don't", say that; refusals are first-class.
   - **Sources**, each labelled `[official]` / `[research]` / `[practitioner opinion]`. A claim
     with no checkable source doesn't get a row.
   - Fold anything longer (integration notes, the full attack list) in one `<details>` block so
     the comment reads in ten seconds and the build session still gets everything.
   Post it with `curl -sS -X POST -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" https://api.github.com/repos/ejclark/skynet-capital/issues/<n>/comments -d @comment.json` (`{"body": "..."}`). End the body with the standard Claude Code attribution
   footer (a blank line, `---`, then `_Generated by [Claude Code](https://claude.ai/code)_`).
6. **Apply the label the outcome implies** (`POST .../issues/<n>/labels` with `{"labels": [...]}`):
   `needs-eric` when the recommended step is his call (a protected path, spend, a policy choice);
   `feedback` when it's buildable now, in-envelope, by the Moneypenny lane; `next-slice` when it
   depends on something else landing first. Never remove `bottleneck`, never close the issue —
   the lane that acts on the call sheet does that.
7. Report `status: "done"` with the comment's `html_url` in `summary`.

## Guardrails

- **Research and one comment only.** No code, no PRs, no branch. If the answer is obvious and
  tiny, still just say so on the issue — the `feedback` label hands it to the build lane.
- **Confidence drives the call.** Low confidence is a stand-aside, never a "small pilot" — a pilot
  of something you don't believe in spends the constraint on a coin flip.
- **Reputable sources or nothing.** Apply the playbook's red flags (no author/date/citations, a
  number with no method, contradicts the primary source, one source dressed as consensus,
  undisclosed vendor interest, stale presented as current). If every source for a candidate fails
  them, the candidate's row says so and its confidence is low.
- **A policy question is not a research question.** If the bottleneck is genuinely a taste or
  governance call with no evidence to gather (which of two throttles Eric prefers, say), report
  `blocked` with "policy, not research", apply `needs-eric`, and don't manufacture a survey.
- **Don't widen the issue.** A second bottleneck you notice on the way is its own `bottleneck`
  issue (`/issue`), linked from your comment — not a paragraph in this one.
