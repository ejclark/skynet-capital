/**
 * The two gates a pasted Alpaca key clears before an account joins the board — the checks the
 * onboarding redesign (2026-09-02, "Alpaca onboarding process streamline") made explicit so the
 * form can say exactly what went wrong instead of "rejected":
 *
 *   1. **Paper keys only.** Alpaca paper key ids start `PK`, live ids `AK`. A live key would fail
 *      against the paper endpoint anyway, but with a vague refusal; this names the mistake and the
 *      step that fixes it, before any network call.
 *   2. **The starting line.** Every account joins at exactly $1,000,000 so the standings compare
 *      like with like (docs/BRAND.md: "nations only compare cleanly when every cityscape is lit
 *      the same") and the doubling baseline means the same thing on every row. Alpaca's default
 *      paper balance is $100,000, which is why the guide walks a member through resetting it
 *      FIRST — and why the refusal carries the number they have to fix.
 *
 * Both apply at ADD only. A rotated key belongs to an account that has been trading, so its
 * equity has every right to have moved (`participant-service.ts`).
 */

export const LEAGUE_STARTING_EQUITY_USD = 1_000_000;

const PAPER_KEY_PREFIX = /^PK/i;

/** What `addParticipant` answers when a gate refuses. `reason: "balance"` is the one case the form
 *  renders as a reset walkthrough rather than a plain refusal; `found` is what Alpaca reported. */
export interface AddRefusal {
  readonly ok: false;
  readonly error: string;
  readonly reason?: "balance";
  readonly found?: number;
}

/** Missing or live credentials → the refusal; a paper key pair → undefined. */
export function refuseCredentials(apiKey: string, apiSecret: string): AddRefusal | undefined {
  if (!(apiKey.trim() && apiSecret.trim())) {
    return { ok: false, error: "Both an Alpaca key and secret are required." };
  }
  if (!PAPER_KEY_PREFIX.test(apiKey.trim())) {
    return {
      ok: false,
      error:
        "That looks like a live key. We only accept paper keys — they start with PK. Flip the Alpaca dashboard to Paper and generate a fresh pair.",
    };
  }
  return undefined;
}

/** True when `equity` sits on the starting line to the cent — Alpaca reports strings like `"1000000"`. */
export function atLeagueStartingLine(equity: number): boolean {
  return Math.abs(equity - LEAGUE_STARTING_EQUITY_USD) < 0.005;
}

/** Off the starting line → the refusal, with the balance found; on it → undefined. */
export function refuseOffStartingLine(equity: number): AddRefusal | undefined {
  if (atLeagueStartingLine(equity)) return undefined;
  return {
    ok: false,
    reason: "balance",
    found: equity,
    error: `Balance check failed. Your paper account reports ${formatUsd(equity)} — the league requires exactly ${formatUsd(LEAGUE_STARTING_EQUITY_USD)} so everyone starts from the same capital.`,
  };
}

/** `1000000` → `$1,000,000.00`, the way the form and the guide spell the starting line. */
export function formatUsd(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
