import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { MARKET_CLOSURES } from "../../../src/domain/market-calendar";
import { dayLensFog } from "../live/fog";
import { useHorizonRange } from "../live/horizon-params";
import { fetchPlays } from "../live/options";
import { CalendarHead } from "./calendar-head";
import { useMediaQuery } from "./use-media";

/**
 * THE COCKPIT CLOCK (#3807 slice 2·1; the design panel 2026-09-26, shape 2 — "the calendar head
 * as a row of the Cockpit's sticky identity"): the market calendar's head on the Profile page —
 * range · arrows · lens row · fog line — under the section switch, on every section, so the
 * book's "when" is the same control R&D drives its board with, and the range a member picks here
 * is the range R&D and Trade open on (`live/horizon-params.ts`). Eric's own acceptance line:
 * docs/members/eric.md j1 step 3 — "the week's events that touch the tickers held, on the same
 * page"; the line under the net-worth card (`held-events-line.tsx`) is the other half.
 *
 * LIFT AND SHIFT, NOT A REDESIGN (Eric's order of operations, 2026-09-26): the head is the
 * calendar AS IT IS, moved. The grid does not render here yet — phase 3's popover (≥861) or
 * bottom sheet (≤860), never in flow — and tapping the range label is inert this slice. The
 * falsifier for leaving it inert: Eric taps the range label on the live route expecting the
 * grid, or asks for it, before phase 3 opens — then the popover/sheet lands as its own slice
 * ahead of the tower work.
 *
 * WHERE IT STANDS. At ≥861 it is the last row of `.cockpit-head`, so it sticks with the switcher
 * and the section switch; at ≤860 it renders OUTSIDE the sticky block, directly under it — the
 * phone's topbar is already three rows (brand · the market clock · the views) and the stuck
 * chrome at 390 must not grow (the panel's probe: >253px with the row is the falsifier for this
 * placement; `scripts/shoot/accounts.mjs` prints the number on every run). The split is one
 * media query read as state (`use-media.ts`) — one instance, never a hidden twin. Sessions count
 * from the exchange's own closure table (`src/domain/market-calendar.ts`, the one the topbar
 * clock reads) — no research payload, no endpoint.
 *
 * Held as a hypothesis with the panel's falsifier: Eric reads the row as a second topbar on the
 * live route by 2026-10-10 — then it leaves the head for the stage's first row.
 */

/** ≤860px — the phone's shell (`shell.css`), where the head sits under the sticky block. */
export const PHONE_QUERY = "(max-width: 860px)";

export function usePhoneWidth(): boolean {
  return useMediaQuery(PHONE_QUERY);
}

export function CockpitClock(): ReactElement {
  // The day lens's fog reads the ladder the trade page already fetches (same key, shared cache).
  const plays = useQuery({ queryKey: ["plays"], queryFn: fetchPlays, retry: false });
  const fog = dayLensFog(plays.data);
  const horizon = useHorizonRange({ fogged: fog.fogged });
  return (
    <section className="cal-head" aria-label="Market calendar">
      <CalendarHead
        lens={horizon.lens}
        range={horizon.range}
        closures={MARKET_CLOSURES}
        all={{ name: "any date", count: "everything dated on your book" }}
        onLens={horizon.setLens}
        onStep={horizon.step}
        {...(fog.fogged ? { dayFog: { door: fog.door, reason: fog.reason } } : {})}
      />
    </section>
  );
}
