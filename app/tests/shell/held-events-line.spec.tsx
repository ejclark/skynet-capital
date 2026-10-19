import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import type { BookDesk } from "../../src/live/book-events";
import type { PositionEvent } from "../../src/live/desk";
import { horizonSearch } from "../../src/live/horizon-params";
import { HeldEventsLine } from "../../src/shell/held-events-line";

/**
 * The Overview's line (#3807 slice 2·1; reshaped by #5074, the calendar's V1 from #5037 round 2):
 * it names the next date on what you hold FROM TODAY and never reads the range — the Overview has
 * no calendar to drive it, so the same book reads the same line whatever `?on=&span=` says. Today
 * is pinned to Thu Oct 8, 2026, the study's day: Sauron's CRWV $80 put expires Fri Nov 6 with a
 * decision due on it, and CRWV's print is estimated for Nov 10.
 */

const PUT = "CRWV261106P00080000";
const jobs: PositionEvent = {
  label: "Jobs report Oct 2",
  at: "2026-10-02",
  beforeExpiry: false,
  scope: "market",
};
const SAURON: BookDesk = {
  desk: {
    id: "sauron",
    positions: [
      {
        symbol: "CRWV",
        quantity: "55",
        isOption: false,
        nextPrint: { status: "estimate", at: "2026-11-10", label: "Earnings Nov 10 (estimated)" },
      },
      { symbol: PUT, quantity: "-1", isOption: true },
    ],
    decisions: [
      {
        id: "crwv-put",
        symbol: PUT,
        display: "CRWV Nov 6 $80 Put",
        title: "Expires in 29 days: keep, roll or buy back",
        due: { at: "2026-11-06", reason: "expiry", label: "Expires Nov 6" },
      },
    ],
  },
};
const EEM: BookDesk = {
  desk: {
    id: "human-eric",
    positions: [{ symbol: "EEM", quantity: "100", isOption: false, nextEvent: jobs }],
  },
};

function mount(initialPath: string, desks: readonly BookDesk[]) {
  const rootRoute = createRootRoute({ component: () => <Outlet />, validateSearch: horizonSearch });
  const accounts = createRoute({
    getParentRoute: () => rootRoute,
    path: "/accounts",
    component: () => <HeldEventsLine desks={desks} />,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([accounts]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  render(<RouterProvider router={router} />);
}

const line = async (): Promise<string> =>
  (await screen.findByText("Next date on what you hold")).nextElementSibling?.textContent ?? "";

beforeEach(() => {
  rstest.useFakeTimers({ toFake: ["Date"] });
  rstest.setSystemTime(new Date("2026-10-08T19:00:00Z"));
});
afterEach(() => {
  rstest.useRealTimers();
});

describe("HeldEventsLine — the next date on what you hold, never a range's output (#5074)", () => {
  it("names the put's decide-by day, how far off it is, and links to Events on that date", async () => {
    mount("/accounts", [SAURON]);
    // The link is the line's own flex item, so no space separates it in the text.
    expect(await line()).toBe(
      "decide by: Fri, Nov 6 · CRWV $80 short put expires · in 29 daysEvents ›",
    );
    expect(screen.getByRole("link", { name: "Events ›" }).getAttribute("href")).toMatch(
      /section=events.*on=2026-11-06|on=2026-11-06.*section=events/,
    );
  });

  it("reads the same whatever range the shared params name", async () => {
    mount("/accounts?on=2026-10-05&span=week", [SAURON]);
    expect(await line()).toMatch(/^decide by: Fri, Nov 6 · CRWV \$80 short put expires/);
  });

  it("says so in words when nothing on the book is dated — a market print never counts", async () => {
    mount("/accounts", [EEM]);
    expect(await line()).toBe("Nothing dated on what you hold yet.Events ›");
  });

  it("says so when the book holds nothing", async () => {
    mount("/accounts", [{ desk: { id: "human-eric", positions: [] } }]);
    expect(await line()).toMatch(/^No open positions — nothing dated\./);
  });
});

/** A held name whose next print is dated, and nothing due: the line names the print itself. */
const printed = (status: "confirmed" | "estimate"): BookDesk => ({
  desk: {
    id: "human-eric",
    positions: [
      {
        symbol: "CRWV",
        quantity: "55",
        isOption: false,
        nextPrint: { status, at: "2026-11-10", label: "Earnings Nov 10" },
      },
    ],
  },
});

/** The drawn date glyph on the line: its kind and the outline it draws. */
async function drawnGlyph(): Promise<{ kind: string; outline: string; corners: number }> {
  const text = await screen.findByText("Next date on what you hold");
  const svg = text.nextElementSibling?.querySelector("svg.lane-glyph");
  const outline = svg?.querySelector("polygon")?.getAttribute("points") ?? "";
  const kind = /lane-glyph--(\w+)/.exec(svg?.getAttribute("class") ?? "")?.[1] ?? "";
  return { kind, outline, corners: outline.trim().split(/\s+/).length };
}

describe("HeldEventsLine — its date glyph is never a row mark's shape (#5093)", () => {
  // The rows under this line wear ◆ Review and ◇ Not now: a diamond, four corners. The date
  // language draws a hexagon instead — ⬢ confirmed, ⬡ estimated — one kind, filled and hollow.
  // The row marks themselves are pinned where they live: `live/position-mark.spec.ts` (◆ ▲ ○) and
  // `positions-guidance.spec.tsx` (◇ Not now).
  it("draws a confirmed print as a six-cornered shape, not the Review diamond", async () => {
    mount("/accounts", [printed("confirmed")]);
    const glyph = await drawnGlyph();
    expect(glyph.kind).toBe("confirmed");
    expect(glyph.corners).toBe(6);
  });

  it("draws an estimated print as the same outline, hollow — not the Not now diamond", async () => {
    mount("/accounts", [printed("confirmed")]);
    const confirmed = await drawnGlyph();
    cleanup();
    mount("/accounts", [printed("estimate")]);
    const estimated = await drawnGlyph();
    expect(estimated.kind).toBe("estimated");
    expect(estimated.corners).toBe(6);
    expect(estimated.outline).toBe(confirmed.outline);
  });
});
