# The event-research lane

You are in the skynet-capital repo, started by `postmaster.yml`. Run
`node scripts/event-scan.mjs --due`. If it prints `[]`, stop — nothing is due. Otherwise, for each
due event, follow the matching mode in `docs/process/EVENT-RESEARCH.md`:

- `never-assessed` → initial research producing `docs/research/events/<id>.md` from its TEMPLATE
  (initial research + stance + kill switches + first ledger row).
- `interval-elapsed` → pulse check appending ONE ledger row, including the mandatory adjacency sweep
  (peer prints, CPI/FOMC surprises, VIX regime moves, geopolitics touching the event's symbols) —
  any dated adjacent event you discover is PROPOSED as an `estimate` entry in
  `src/domain/market-events.ts` in the same PR, never `confirmed`. (Most `interval-elapsed` pulses
  never reach you — `postmaster.yml`'s deterministic screen already handled the quiet ones before
  this session started; you only see one because the probe found it material, or its own reference
  block was missing/stale, or the fetch failed. Research it exactly as any other pulse.)
- `event-passed-unscored` → closing outcome assessment, scoring registered forward tests from re-run
  instrument data (bust the instrument cache first:
  `rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`), never from memory.

**Refresh the probe-ref block on every ledger you touch.** Every ledger header carries a
`<!-- probe-ref: {...} -->` line right after `**Last assessed:**` (docs/process/EVENT-RESEARCH.md
→ "Deterministic screening") — the deterministic screen's reference state for this event. Whenever
you update `**Last assessed:**`, replace that line too with today's real readings: the current
price for each symbol in the event's table row, the current VIX, the cadence band
(`<impact>:<minDaysOut>+`, from `assessment-cadence.json`), the ids of other tracked events within 5
days of this one's date, and `"screenStreak": 0` (a full session always resets the streak — it is
never itself a screen). This is what lets the event's *next* pulse be screened instead of
automatically material; skipping it doesn't break anything today, it just spends one more session
than necessary next time.

Ship ONE PR per event, on a branch named EXACTLY `research/<event-id>` off `origin/main` — the
branch name is the dedupe key that stops the next push-triggered run re-researching an event whose
PR is still open, and it is what puts the branch inside the envelope gate. Never improvise it.

Before opening the PR, find its tracking issue: `gh issue list --label event-research --state open
--json number,title --jq '.[] | select(.title == "[event-research] <event-id>") | .number'`. If one
matches, add a Summary bullet containing `Closes #<issue-number>` — GitHub links it from anywhere,
so it is never line 1 (same convention as the feedback lane, `.github/prompts/feedback-build.md`).
If none matches (already closed, or none was ever opened), skip the bullet — do not fail the build
over it. This is belt only: the postmaster's push-driven sweep is the suspenders, since `Closes #`
does not reliably auto-close a PR a bot both opens and merges (docs/LESSONS.md, 2026-08-22).

Verify by exit status and never by tailed output (`npm run typecheck`, `npm run lint`, `npm test`),
push, open the PR with `gh pr create`, then arm auto-merge with `gh pr merge --auto --squash` —
research-ledger docs auto-merge per the governor's merge policy. If that arm is refused with **"Pull request is in clean status"**, the PR simply went green before you got to it (`verify` on a small PR takes ~45s) — auto-merge only takes while checks are still pending. That is not a failure and never a reason to leave it: **merge it directly** (`gh pr merge --squash`), which is the condition auto-merge was waiting for, met early. Leaving it stalled 16 research PRs on 2026-08-26. Conventional-Commit subjects,
lowercase-led and **≤100 characters** (commitlint's `header-max-length`, which fails `verify`). The PR body follows `.github/pull_request_template.md`: open with `## The picture` —
for a ledger row the honest picture is usually the line `Picture: waived — automated research
ledger` (never a decorative diagram); Summary bullets ≤120 chars (`docs/PICTURES.md`).

## Hard limits

The protected paths are `envelope.json`, enforced as a red check on your `research/` branch — run
`node scripts/envelope-scan.mjs --list` to see them, and `--check <path>` before editing anything
you are unsure about. On top of that list, and specific to this lane:

- No trades.
- No edits to earnings-calendar entries.
- No flipping any `estimate` to `confirmed` without a primary source (`IR:`/`BLS:`/`FED:`).
- Escalation ceiling is a PR.

Every trading-adjacent statement you write must carry the event's confirmed/estimate label honestly
— estimates widen caution, never trigger action.
