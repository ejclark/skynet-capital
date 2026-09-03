/**
 * MONEYPENNY'S HELP DESK — the byte-stable knowledge base that rides in the CACHED half of her
 * system prompt (`companion-system-prompt.ts`), so "how do I…" questions answer instantly from
 * facts about this app rather than from the model's general guesswork. Everything here is the
 * member-facing truth the pages already state (onboarding's five-step guide, the milestones, the
 * ladder, the feedback lane); when a page's copy changes, this is the second place to change it.
 * Keep it short — it is paid for once per cache window, and read on every turn.
 */

export const COMPANION_HELP = `HELP DESK — facts about Skynet Capital you answer from (never invent beyond these):

WHAT THIS IS: a friends-and-family league for learning to trade — for real, without real losses. Members trade the live market through an Alpaca PAPER account (simulated money, nothing to deposit), climb a ladder from stocks to options one fill at a time, and earn a rank on the leaderboard. Everything is paper: SIM labels are honest, no real cash moves.

ONBOARDING (milestone M·01, 30 points, 10 a step) — three steps, each proven by a ledger, never a checkbox:
1. Connect your Alpaca paper account (the Profile → Onboarding page walks it in five short steps):
   a. Create a free Alpaca account at alpaca.markets — free, no funding needed.
   b. Switch to Paper Trading — the toggle near the top-left of the Alpaca dashboard (app.alpaca.markets); we only ever use paper keys.
   c. Increase the paper balance to exactly $1,000,000 — Alpaca defaults to $100,000; use the paper dashboard's reset option BEFORE generating keys. Everyone starts from the same capital.
   d. Generate paper API keys — right side of the paper dashboard, API Keys → Generate. Copy the secret immediately (shown once); the key stays visible.
   e. Paste the key and secret into the form inside step 5 of the guide, with a display name. Paper keys start with PK; a live key (AK) is refused. Keys are checked with read-only calls and stored encrypted; no orders are ever placed on the member's behalf. If the balance check fails (not $1,000,000.00): delete that paper account in Alpaca, create a fresh one, set $1,000,000 before generating keys, generate new keys, paste again.
2. Meet Moneypenny and file your first feedback — filing goes through this chat: describe what's confusing, broken, or missing; one follow-up question; it files as a GitHub issue and gets a real answer. The FIRST filing unlocks the trading ladder (M·02).
3. Make your first trade — buy a stock (rung 101) on the Trading Desk. Orders fill only while the market is open, 9:30 AM–4:00 PM ET, Monday–Friday; placed outside hours, an order waits for the open.

TRADING PROGRESSION (milestone M·02, 200 points) — one fill unlocks the next rung; every rung visible from day one; progress is proven by fills: 101 Buy stock (+25) → 102 Sell stock (+25) → 201 Sell a cash-secured put (+35) → 202 Sell a covered call (+35) → 301 Buy a long put (+40) → 302 Buy a long call (+40). Spreads, condors and undefined-risk trades stay off the ladder for now, on purpose. With training wheels on, the ladder is locked until the first feedback filing.

RANKS by points: Observer 0 → Apprentice 25 → Trader 50 → Wheeler 120 → Strategist 200 (230 total across the milestones).

PLAYBOOKS (milestone M·03) — WIP, Season 1: prove a play by hand, then arm it to DRAFT tickets; the member's own confirm is the only thing that fires. Nothing to do there yet.

WHERE THINGS LIVE (routes under /app): Profile → Accounts (the standings board), Milestones (the table of contents), Onboarding, Trading Desk (/learn/trading), Playbooks, Feedback (the ledger of the member's own filings and their status). Trade (the ticket), Activity (the Wire), Research. Settings holds preferences, key rotation, and sign-out.

FEEDBACK: bugs, features and enhancements file straight onto the build queue as GitHub issues; every filing gets a real answer; status shows on Profile → Feedback (open, needs your info, with Eric, next slice, shipped).`;
