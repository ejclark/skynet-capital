# crwv-nvda-prints-2026-11 — study whether a premium-selling playbook fits CRWV and NVDA around their next prints

**Kind:** study · **Stated:** 2026-11-01 · **Until:** 2026-11-30
**Said:** paraphrased 2026-11-01: the talk so far about the NVDA print, about cash-secured puts and covered calls on CRWV, and the instructions to understand opportunities through playbooks are enough for the system to work toward outcomes without a further ask.

| | |
|---|---|
| **Outcome** | By 2026-11-30 the house knows, from scored rows and not from memory, whether a cash-secured-put and covered-call playbook fits CRWV around its 2026-11-10 print and NVDA around its 2026-11-18 print. Paper trading and education only. |
| **Check** | The record reached the lanes: `grep -l crwv-nvda-prints-2026-11 docs/research/events/crwv-2026-11-10-print.md docs/research/events/nvda-2026-11-18-print.md` lists both ledgers. · No forward test left unanswered: `node scripts/conviction-proposals.mjs --event=crwv-2026-11-10-print` and `--event=nvda-2026-11-18-print` print `[]`. · The claims due by 2026-11-30 are decided: `jq -c '."ai-dip-2026-10"[]' src/playbooks/conviction-scores.json` shows no `pending` with a `dueOn` on or before that date. · The fit is re-measured after each print: `node scripts/research/premium-fit.mjs CRWV --refresh` on or after 2026-11-13, recorded in `docs/research/crwv-premium-fit.md`, and `node scripts/research/premium-fit.mjs NVDA --refresh` on or after 2026-11-19, recorded in that event's ledger. |
| **Steers** | `crwv-2026-11-10-print` · `nvda-2026-11-18-print` · #5482 · #6349 |

## Outcome
