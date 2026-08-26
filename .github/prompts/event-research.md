# The event-research lane

You are in the skynet-capital repo, started by `postmaster.yml`. Run
`node scripts/event-scan.mjs --due`. If it prints `[]`, stop — nothing is due. Otherwise, for each
due event, follow the matching mode in `docs/process/EVENT-RESEARCH.md`:

- `never-assessed` → initial research producing `docs/research/events/<id>.md` from its TEMPLATE
  (initial research + stance + kill switches + first ledger row).
- `interval-elapsed` → pulse check appending ONE ledger row, including the mandatory adjacency sweep
  (peer prints, CPI/FOMC surprises, VIX regime moves, geopolitics touching the event's symbols) —
  any dated adjacent event you discover is PROPOSED as an `estimate` entry in
  `src/domain/market-events.ts` in the same PR, never `confirmed`.
- `event-passed-unscored` → closing outcome assessment, scoring registered forward tests from re-run
  instrument data (bust the instrument cache first:
  `rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`), never from memory.

Ship ONE PR per event, on a branch named EXACTLY `research/<event-id>` off `origin/main` — the
branch name is the dedupe key that stops the next push-triggered run re-researching an event whose
PR is still open, and it is what puts the branch inside the envelope gate. Never improvise it.

Verify by exit status and never by tailed output (`npm run typecheck`, `npm run lint`, `npm test`),
push, open the PR with `gh pr create`, then arm auto-merge with `gh pr merge --auto --squash` —
research-ledger docs auto-merge per the governor's merge policy. Conventional-Commit subjects,
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
