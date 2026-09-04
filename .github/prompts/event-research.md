# The event-research lane

You are in the skynet-capital repo, started by `moneypenny-events.yml`. **You are one matrix leg,
pre-assigned exactly one event id** by the workflow that invoked you (given earlier in this
prompt) — process only that one, never the whole due list, even though the due list will keep
listing every event that's due right now. Each other due event has its own sibling matrix job
running in parallel, responsible only for its own id (2026-08-29: this used to be one session
looping over every due event in a shared turn budget, and a busy week's batch could hit
`--max-turns` mid-run and orphan whichever events it hadn't finished yet — #799/#800/#801. One
event per session removes that failure mode entirely: this session's turn budget only ever has to
cover one event's work.)

Run `node scripts/event-scan.mjs --due` as a cross-check — confirm your assigned id is still in
that list. If it prints `[]`, or your id isn't in it, stop: someone else already handled it (a
concurrent run, a manual fix), and that is a normal outcome, not an error. Otherwise, follow the
matching mode in `docs/process/EVENT-RESEARCH.md` for your assigned event only:

- `never-assessed` → initial research producing `docs/research/events/<id>.md` from its TEMPLATE
  (initial research + stance + kill switches + first ledger row).
- `interval-elapsed` → pulse check appending ONE ledger row, including the mandatory adjacency sweep
  (peer prints, CPI/FOMC surprises, VIX regime moves, geopolitics touching the event's symbols) —
  any dated adjacent event you discover is PROPOSED as an `estimate` entry in
  `src/domain/market-events.ts` in the same PR, never `confirmed`. (Most `interval-elapsed` pulses
  never reach you — `moneypenny-events.yml`'s deterministic screen already handled the quiet ones before
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

Ship ONE PR for your assigned event, on a branch named EXACTLY `research/<event-id>` off `origin/main` — the
branch name is the dedupe key that stops the next push-triggered run re-researching an event whose
PR is still open, and it is what puts the branch inside the envelope gate. Never improvise it.

Before opening the PR, find its tracking issue: `gh issue list --label event-research --state open
--json number,title --jq '.[] | select(.title == "[event-research] <event-id>") | .number'`. If one
matches, add a Summary bullet containing `Closes #<issue-number>` — GitHub links it from anywhere,
so it is never line 1 (same convention as the feedback lane, `.github/prompts/feedback-build.md`).
If none matches (already closed, or none was ever opened), skip the bullet — do not fail the build
over it. This is belt only: Moneypenny's push-driven sweep is the suspenders, since `Closes #`
does not reliably auto-close a PR a bot both opens and merges (docs/LESSONS.md, 2026-08-22).

Verify by exit status and never by tailed output (`npm run typecheck`, `npm run lint`, `npm test`).

Before you commit, lint the message you are ABOUT to make — not after `verify` catches it in CI
(docs/LESSONS.md, 2026-09-04: eight research PRs sat red on commitlint at once, none caught before
push, because this lane commits from inside a GitHub Actions job where `npm ci`'s `prepare` script
never installs the local git hook — `test -n "$CI" || husky` treats every CI runner as "skip", and
this lane's runner IS the one place that also runs `git commit`). Write the message to a file and
run `npx commitlint --edit <file>` before `git commit -F <file>`; fix and re-check on any failure.
The three rules that have actually fired here:
- **type** must be `docs` — never invent a `research(...)` type; the scope is `(research)`, e.g.
  `docs(research): fomc 2026-12-09 — base case flips`.
- **header** (the first line) lowercase-led, Conventional-Commit, **≤100 characters** total.
- **body** lines ≤100 characters each — wrap your prose; a paragraph copy-pasted from your own
  analysis will usually run long.

Push, open the PR with `gh pr create`, then arm auto-merge with `bash scripts/ship.sh automerge
<pr-number>` — never hand-roll `gh pr merge --auto --squash`, which has none of the script's
safeguards (a PR going green before you arm it, a GraphQL proxy that won't serve the arm mutation,
rate-limit exhaustion, a read-back check that the arm actually took — see #659 and the 16 research
PRs stalled by the clean-status race on 2026-08-26). Research-ledger docs auto-merge per the
governor's merge policy. The PR body follows `.github/pull_request_template.md`: open with
`## The picture` — for a ledger row the honest picture is usually the line `Picture: waived —
automated research ledger` (never a decorative diagram); Summary bullets ≤120 chars
(`docs/PICTURES.md`).

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
