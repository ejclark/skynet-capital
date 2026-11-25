import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import type { DeskPosition, DeskSnapshot } from "../../src/live/desk";
import { SidePanels } from "../../src/shell/side-panels";

/**
 * #8500, rendered: the side panels' two post-merge defects, each pinned by a spec that fails on it.
 *
 *   - WHEN a held row shows a move, its ▲/▼ SHALL come from that same figure's sign, and "—"
 *     (a short's day percent: no positive base to divide by) SHALL wear no arrow and no tone.
 *   - WHEN the viewport crosses 1024px either way, the stage (`<main>`) SHALL stay mounted, and an
 *     unsent Journal draft typed into the right panel SHALL be there when the panel comes back.
 *
 * The panel's neighbours (Needs you, the clock, fleet health, the Scoreboard tile) are stubbed:
 * their own specs own them, and this one reads only the held rows, the stage and the composer.
 */

rstest.mock("@tanstack/react-router", () => ({
  Link: ({ children, className }: { children: ReactNode; className?: string }) => (
    <a href="/accounts" className={className}>
      {children}
    </a>
  ),
}));
rstest.mock("../../src/shell/needs-you", () => ({
  NeedsYou: () => null,
  ScoreboardTile: () => null,
}));
rstest.mock("../../src/shell/fleet-health", () => ({
  useFleet: () => ({}),
  FleetHealth: () => null,
}));
rstest.mock("../../src/shell/market-session", () => ({
  useNow: () => new Date("2026-11-25T15:00:00Z"),
  MarketSession: () => null,
}));
rstest.mock("../../src/shell/session-status", () => ({ HoursNotes: () => null }));
rstest.mock("../../src/live/settings", () => ({
  fetchSettings: () => Promise.resolve({ accounts: [{ id: "A" }] }),
}));
rstest.mock("../../src/live/desk", () => ({
  fetchDesk: () =>
    Promise.resolve({
      generatedAt: "2026-11-25T15:00:00Z",
      desk: { id: "A", name: "A", kind: "human", positions },
    } as unknown as DeskSnapshot),
}));
rstest.mock("../../src/live/feedback", () => ({
  fetchFeedbackIndex: () => Promise.resolve({ enabled: true, recent: [] }),
}));
rstest.mock("../../src/live/journal", () => ({
  fetchJournal: () => Promise.resolve({ available: true, wishesEnabled: true, notes: [] }),
  postJournal: () => Promise.resolve({ ok: false, error: "not in this spec" }),
}));

/** A row as the desk JSON serves it: only the fields the held list reads. */
const held = (symbol: string, dayPct: string, dayTone: DeskPosition["dayTone"]): DeskPosition =>
  ({ symbol, display: symbol, price: "$1.00", weightPct: 10, dayPct, dayTone }) as DeskPosition;

let positions: DeskPosition[] = [];

/** A live viewport for `matchMedia`: `resize(w)` flips every `(min-width: N)` query and tells its
 *  listeners, the way a browser does when the window crosses a breakpoint. */
function viewport(initial: number): { resize: (width: number) => void; restore: () => void } {
  let width = initial;
  const listeners = new Set<() => void>();
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => {
      const min = Number(/min-width:\s*(\d+)px/.exec(query)?.[1] ?? Number.NaN);
      return {
        get matches() {
          return width >= min;
        },
        addEventListener: (_: string, fn: () => void) => listeners.add(fn),
        removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
      };
    },
  });
  return {
    resize: (next) => {
      width = next;
      act(() => {
        for (const fn of [...listeners]) fn();
      });
    },
    restore: () => Reflect.deleteProperty(window, "matchMedia"),
  };
}

/** A stage with state of its own, so a remount shows: its box comes back empty. */
function Stage(): ReactElement {
  return (
    <main id="main" className="stage">
      <label>
        Stage state
        <input type="text" defaultValue="" />
      </label>
    </main>
  );
}

function mount(): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <SidePanels page="home">
        <Stage />
      </SidePanels>
    </QueryClientProvider>,
  );
}

describe("the held rows' arrow reads the figure beside it (#8500)", () => {
  let screenWidth: ReturnType<typeof viewport>;
  beforeEach(() => {
    screenWidth = viewport(1280);
  });
  afterEach(() => screenWidth.restore());

  it("shows no arrow and no tone beside '—' on a short, even when today's dollar P/L is up", async () => {
    // A short put whose price fell: dollar P/L up ("pos"), but no percent to show ("—").
    positions = [held("SPY 500P", "—", "pos")];
    mount();
    const move = (await screen.findByText(/—/)).closest(".dp-held-move");
    expect(move).not.toBeNull();
    expect(move?.textContent).not.toMatch(/[▲▼]/);
    expect(move?.className).toContain("tone-flat");
  });

  it("wears ▲ beside a rise and ▼ beside a fall, from the figure's own sign", async () => {
    positions = [held("NVDA", "+1.20%", "pos"), held("AMD", "-0.40%", "neg")];
    mount();
    const up = (await screen.findByText(/\+1\.20%/)).closest(".dp-held-move");
    const down = screen.getByText(/-0\.40%/).closest(".dp-held-move");
    expect(up?.textContent).toContain("▲");
    expect(up?.className).toContain("tone-pos");
    expect(down?.textContent).toContain("▼");
    expect(down?.className).toContain("tone-neg");
  });

  it("wears none beside +0.00%: a move that rounds to nothing is not shown as up", async () => {
    positions = [held("AAPL", "+0.00%", "pos")];
    mount();
    const flat = (await screen.findByText(/\+0\.00%/)).closest(".dp-held-move");
    expect(flat?.textContent).not.toMatch(/[▲▼]/);
  });
});

describe("crossing 1024px keeps the stage and the Journal draft (#8500)", () => {
  let screenWidth: ReturnType<typeof viewport>;
  beforeEach(() => {
    positions = [];
    screenWidth = viewport(1280);
  });
  afterEach(() => screenWidth.restore());

  it("leaves <main> mounted both ways: its own state survives", () => {
    mount();
    const stageBox = within(screen.getByRole("main")).getByLabelText("Stage state");
    fireEvent.change(stageBox, { target: { value: "kept" } });
    const before = screen.getByRole("main");

    screenWidth.resize(960);
    expect(screen.queryByRole("complementary")).toBeNull();
    expect(screen.getByRole("main")).toBe(before);
    expect(
      within(screen.getByRole("main")).getByLabelText<HTMLInputElement>("Stage state").value,
    ).toBe("kept");

    screenWidth.resize(1280);
    expect(screen.getAllByRole("complementary")).toHaveLength(2);
    expect(screen.getByRole("main")).toBe(before);
  });

  it("keeps an unsent Journal draft when the panel leaves at 960 and comes back at 1280", async () => {
    mount();
    const wish = await screen.findByPlaceholderText("I wish it…");
    fireEvent.change(wish, { target: { value: "a calmer chart at night" } });

    screenWidth.resize(960);
    expect(screen.queryByPlaceholderText("I wish it…")).toBeNull();

    screenWidth.resize(1280);
    expect(await screen.findByPlaceholderText<HTMLTextAreaElement>("I wish it…")).toHaveValue(
      "a calmer chart at night",
    );
  });
});
