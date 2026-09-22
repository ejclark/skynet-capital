import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import type { ChainAnswer, ChainData, PlayInfo } from "../../src/live/options";
import { OptionGate } from "../../src/shell/option-gate";

/**
 * `OptionGate`'s progressive disclosure (#2017 Phase 0 task 4d) — the five chain-gated fields
 * (Expiration/Strike/Contracts/Order/Limit) are withheld until the chain query settles, and then
 * branch three ways on the server's machine-readable `reason` rather than always falling back to
 * manual entry: idle (no symbol yet) shows nothing, loading shows a single note, a genuine dead
 * end (`reason: "no-options"`) stops with just its note, and everything else — a real chain, or a
 * degraded/unrecognized answer — shows the fields (plus the note, when there is one).
 */

let chainResult: ChainAnswer = { chainNote: "unset", reason: "failed" };
let chainNeverResolves = false;
let deskPositions: readonly { symbol: string; isOption: boolean }[] = [];

rstest.mock("../../src/live/options", () => ({
  fetchChain: () =>
    chainNeverResolves
      ? new Promise<ChainAnswer>(() => {
          // Deliberately never resolves — pins the "loading" state for the test to observe.
        })
      : Promise.resolve(chainResult),
  reviewOption: () => Promise.reject(new Error("not used in this spec")),
  submitOption: () => Promise.reject(new Error("not used in this spec")),
}));
// OptionGate also mounts QuoteHeader, which would otherwise fire a real fetch in jsdom.
rstest.mock("../../src/live/quote", () => ({
  fetchQuote: () => Promise.resolve({ quoteNote: "test fixture — no live quote" }),
}));
// ...and RecentOrdersStrip (#2017 Phase 1 slice 13) — fires once a chain-cell pick resolves an
// OCC symbol in the "chain cell picking" specs below — and the held-badge desk query (Eric,
// 2026-09-22), same reason.
rstest.mock("../../src/live/desk", () => ({
  fetchDeskActivity: () => Promise.resolve({ available: true, activity: [] }),
  fetchDesk: () =>
    Promise.resolve({
      generatedAt: "2026-09-21T00:00:00Z",
      desk: {
        id: "desk-1",
        name: "Desk",
        kind: "human",
        positions: deskPositions,
        considerations: [],
      },
    }),
}));

const unlockedCallPlay: PlayInfo = {
  code: "201",
  id: "201",
  name: "Buy Call",
  tldr: "",
  kind: "option",
  side: "buy",
  optionType: "call",
  gloss: "",
  locked: false,
  earned: true,
};

const fullChain: ChainData = {
  symbol: "NVDA",
  optionType: "call",
  expirations: ["2026-09-18"],
  expiration: "2026-09-18",
  spot: 180,
  rows: [
    {
      strike: 180,
      occSymbol: "NVDA260918C00180000",
      premium: 5,
      bid: 4.8,
      ask: 5.2,
      openInterest: 100,
    },
  ],
};

const LABELED_FIELDS = ["Strike", "Contracts (100 shares)", "Order"];

/** No `expect` in here — biome's `noMisplacedAssertion` wants assertions lexically inside an
 *  `it`, so this just reports the fact and the test itself asserts on the boolean.
 *
 *  `ExpirationField`'s tab-strip branch (rendered once a real chain loads) doesn't wire its
 *  buttons to the `<label htmlFor>` the way the plain date-input fallback does, so "Expiration"
 *  is checked either way: by label (manual/degraded entry) or by its `.exp-tabs` wrapper (a
 *  resolved chain) — a pre-existing gap in that component, out of scope for this slice. */
function fieldsPresent(): boolean {
  const labeled = LABELED_FIELDS.every((label) => screen.queryByLabelText(label) !== null);
  const expiration =
    screen.queryByLabelText("Expiration") !== null || document.querySelector(".exp-tabs") !== null;
  return labeled && expiration;
}

function renderGate(initialSymbol?: string): ReactElement {
  const client = new QueryClient();
  return (
    <QueryClientProvider client={client}>
      <OptionGate deskId="desk-1" play={unlockedCallPlay} initialSymbol={initialSymbol} />
    </QueryClientProvider>
  );
}

function renderGateWithStrike(initialSymbol: string, initialStrike: string): ReactElement {
  const client = new QueryClient();
  return (
    <QueryClientProvider client={client}>
      <OptionGate
        deskId="desk-1"
        play={unlockedCallPlay}
        initialSymbol={initialSymbol}
        initialStrike={initialStrike}
      />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  chainNeverResolves = false;
  chainResult = { chainNote: "unset", reason: "failed" };
  deskPositions = [];
});

describe("OptionGate — progressive disclosure", () => {
  it("idle: renders no fields and no note before a symbol is committed", () => {
    render(renderGate(""));

    expect(fieldsPresent()).toBe(false);
    expect(screen.queryByText(/Looking up options/)).not.toBeInTheDocument();
    expect(screen.queryByText(/No listed options/)).not.toBeInTheDocument();
  });

  it("loading: renders only the looking-up note while the chain query is pending", async () => {
    chainNeverResolves = true;
    render(renderGate("NVDA"));

    await waitFor(() =>
      expect(screen.getByText("Looking up options for NVDA…")).toBeInTheDocument(),
    );
    expect(fieldsPresent()).toBe(false);
  });

  it("stopped: a no-options reason renders only the dead-end note", async () => {
    chainResult = {
      chainNote: "No listed options found for ZZZZ. Check the symbol.",
      reason: "no-options",
    };
    render(renderGate("NVDA"));

    await waitFor(() =>
      expect(
        screen.getByText("No listed options found for ZZZZ. Check the symbol."),
      ).toBeInTheDocument(),
    );
    expect(fieldsPresent()).toBe(false);
  });

  it("resolved: a real chain renders the fields with no note", async () => {
    chainResult = fullChain;
    render(renderGate("NVDA"));

    await waitFor(() => expect(fieldsPresent()).toBe(true));
    expect(screen.queryByText(/Looking up options/)).not.toBeInTheDocument();
    expect(screen.queryByText(/No listed options/)).not.toBeInTheDocument();
  });

  it("withholds Review on a limit with no premium and says why (#3407 P0)", async () => {
    chainResult = fullChain;
    render(renderGateWithStrike("NVDA", "190")); // 190 is not on the chain — nothing to seed from
    await waitFor(() => expect(fieldsPresent()).toBe(true));
    expect(screen.getByRole("button", { name: "Review order" })).toBeDisabled();
    expect(screen.getByText(/needs a premium per share/)).toBeInTheDocument();
  });

  it("seeds the limit from the chain's mid for a strike that arrived before the chain, enabling Review", async () => {
    chainResult = fullChain;
    render(renderGateWithStrike("NVDA", "180")); // on the chain at premium 5
    await waitFor(() => expect(screen.getByLabelText("Limit /share")).toHaveValue(5));
    expect(screen.getByRole("button", { name: "Review order" })).toBeEnabled();
    expect(screen.queryByText(/needs a premium per share/)).not.toBeInTheDocument();
  });

  it("degraded (failed): renders both the note and the fields", async () => {
    chainResult = {
      chainNote: "Couldn't load the option chain right now — feed down. The ticket still works.",
      reason: "failed",
    };
    render(renderGate("NVDA"));

    await waitFor(() =>
      expect(
        screen.getByText(
          "Couldn't load the option chain right now — feed down. The ticket still works.",
        ),
      ).toBeInTheDocument(),
    );
    expect(fieldsPresent()).toBe(true);
  });

  it("degraded (unlinked): renders both the note and the fields", async () => {
    chainResult = {
      chainNote:
        "Live option chains load through your own connected account, and your session isn't linked to one yet.",
      reason: "unlinked",
    };
    render(renderGate("NVDA"));

    await waitFor(() => expect(screen.getByText(/isn't linked to one yet/)).toBeInTheDocument());
    expect(fieldsPresent()).toBe(true);
  });
});

/**
 * Chain cell picking (#2017 Phase 0 task 4e) — a call/put chain cell can fill strike AND, when
 * it's safe, switch the ticket's Side/Type. The current ticket is course 202 (Sell a covered
 * call: sell/call per `plays.ts`'s NAV table), so per the resolution rule
 * (`playForNav({ ...navForPlay(play.code), optionType: clickedSide })`):
 *   - clicking the CALL cell targets 202 itself (same rung, since the ticket is already on call).
 *   - clicking the PUT cell targets 201 (sell/put) — a different rung, whose lock state each case
 *     below controls.
 */
const chainPickPlay: PlayInfo = {
  code: "202",
  id: "202",
  name: "Sell a covered call",
  tldr: "",
  kind: "option",
  side: "sell",
  optionType: "call",
  gloss: "",
  locked: false,
  earned: true,
};

const playsWithUnlockedTarget: readonly PlayInfo[] = [
  chainPickPlay,
  { ...chainPickPlay, code: "201", id: "201", name: "Sell a cash-secured put", locked: false },
];

const playsWithLockedTarget: readonly PlayInfo[] = [
  chainPickPlay,
  { ...chainPickPlay, code: "201", id: "201", name: "Sell a cash-secured put", locked: true },
];

// Fail-safe coverage (review fix): the target code (201) is simply ABSENT from `plays` — not
// present with `locked: true`, just missing entirely. A lookup miss must resolve to locked, never
// to the old fail-open `undefined` (falsy).
const playsMissingTarget: readonly PlayInfo[] = [chainPickPlay];

function renderChainPickGate({
  plays,
  onPreset,
  onStrikeCommit,
}: {
  readonly plays?: readonly PlayInfo[];
  readonly onPreset?: (code: string) => void;
  readonly onStrikeCommit?: (strike: string) => void;
}): ReactElement {
  const client = new QueryClient();
  return (
    <QueryClientProvider client={client}>
      <OptionGate
        deskId="desk-1"
        play={chainPickPlay}
        initialSymbol="NVDA"
        plays={plays}
        onPreset={onPreset}
        onStrikeCommit={onStrikeCommit}
      />
    </QueryClientProvider>
  );
}

describe("OptionGate — chain cell picking", () => {
  beforeEach(() => {
    chainResult = fullChain;
  });

  it("same rung: fills strike locally and never calls onPreset", async () => {
    const presets: string[] = [];
    render(
      renderChainPickGate({
        plays: playsWithUnlockedTarget,
        onPreset: (code) => presets.push(code),
      }),
    );

    // Both bid and ask cells for a strike/side share the same aria-label — click the bid cell.
    // findAllByRole throws (rather than returning []) when nothing matches, so index 0 is safe.
    const callCells = await screen.findAllByRole("button", { name: /^Pick the 180 call/ });
    fireEvent.click(callCells[0] as HTMLElement);

    expect(presets).toEqual([]);
    await waitFor(() => expect(screen.getByLabelText("Strike")).toHaveValue(180));
  });

  it("a chain-cell pick flashes the Strike field (Eric, 2026-09-22)", async () => {
    render(renderChainPickGate({ plays: playsWithUnlockedTarget }));

    const callCells = await screen.findAllByRole("button", { name: /^Pick the 180 call/ });
    fireEvent.click(callCells[0] as HTMLElement);

    const strikeInput = screen.getByLabelText("Strike");
    await waitFor(() => expect(strikeInput).toHaveValue(180));
    expect(strikeInput.className).toContain("strike-flash");
  });

  it("a hand-typed strike never flashes the field it's typed into", async () => {
    render(renderChainPickGate({ plays: playsWithUnlockedTarget }));

    const strikeInput = await screen.findByLabelText("Strike");
    fireEvent.change(strikeInput, { target: { value: "182.5" } });

    expect(strikeInput).toHaveValue(182.5);
    expect(strikeInput.className).not.toContain("strike-flash");
  });

  it("different, unlocked rung: commits the strike then presets the target rung", async () => {
    const presets: string[] = [];
    const committedStrikes: string[] = [];
    render(
      renderChainPickGate({
        plays: playsWithUnlockedTarget,
        onPreset: (code) => presets.push(code),
        onStrikeCommit: (s) => committedStrikes.push(s),
      }),
    );

    const putCells = await screen.findAllByRole("button", { name: /^Pick the 180 put/ });
    fireEvent.click(putCells[0] as HTMLElement);

    expect(committedStrikes).toEqual(["180"]);
    expect(presets).toEqual(["201"]);
  });

  it("different, LOCKED rung: never widens the lock — fills strike only, no onPreset/onStrikeCommit", async () => {
    const presets: string[] = [];
    const committedStrikes: string[] = [];
    render(
      renderChainPickGate({
        plays: playsWithLockedTarget,
        onPreset: (code) => presets.push(code),
        onStrikeCommit: (s) => committedStrikes.push(s),
      }),
    );

    const putCells = await screen.findAllByRole("button", { name: /^Pick the 180 put/ });
    fireEvent.click(putCells[0] as HTMLElement);

    // Safety-critical: a chain click must never open a rung the member hasn't earned. Locked
    // means locked — regardless of what the strike or the clicked side would otherwise target.
    // The strike fills locally (proven below) but never reaches the URL for a refused switch.
    expect(presets).toEqual([]);
    expect(committedStrikes).toEqual([]);
    await waitFor(() => expect(screen.getByLabelText("Strike")).toHaveValue(180));
  });

  it("target ABSENT from plays: fails SAFE (treated as locked) — never onPreset, never onStrikeCommit", async () => {
    const presets: string[] = [];
    const committedStrikes: string[] = [];
    render(
      renderChainPickGate({
        plays: playsMissingTarget,
        onPreset: (code) => presets.push(code),
        onStrikeCommit: (s) => committedStrikes.push(s),
      }),
    );

    const putCells = await screen.findAllByRole("button", { name: /^Pick the 180 put/ });
    fireEvent.click(putCells[0] as HTMLElement);

    // A lookup miss must never read as "unlocked, go ahead" — the old fail-open bug (a missing
    // play's `?.locked` reads `undefined`, i.e. falsy) would have let this switch rungs.
    expect(presets).toEqual([]);
    expect(committedStrikes).toEqual([]);
    await waitFor(() => expect(screen.getByLabelText("Strike")).toHaveValue(180));
  });
});

/**
 * The chain accordion (Eric, 2026-09-22 — "is it possible to have that table be expandable in the
 * same form after stock symbol is selected... an intuitive path... to collapse the table"): open
 * with nothing picked, collapsed to a one-line summary the instant a strike is picked, reopenable
 * via "Change". Replaces the old `hideChain` docked-pane split (`option-gate.tsx`'s header comment).
 */
describe("OptionGate — the chain accordion (Eric, 2026-09-22)", () => {
  beforeEach(() => {
    chainResult = fullChain;
  });

  it("opens once the chain resolves, collapses to a summary the instant a strike is picked, reopens on Change", async () => {
    render(renderGate("NVDA"));

    // Open: the real chain table is on screen, nothing picked yet — bid and ask cells for the
    // strike share an aria-label, so this is an AllBy query (see "chain cell picking" above).
    const callCells = await screen.findAllByRole("button", { name: /^Pick the 180 call/ });
    expect(screen.queryByText("Change")).not.toBeInTheDocument();

    fireEvent.click(callCells[0] as HTMLElement);

    // Collapsed: the table is gone, replaced by a one-line summary naming the pick.
    await waitFor(() =>
      expect(screen.queryAllByRole("button", { name: /^Pick the 180 call/ })).toHaveLength(0),
    );
    const summary = document.querySelector(".tkt-chain-summary");
    expect(summary?.textContent).toContain("180");
    expect(screen.getByRole("button", { name: "Change" })).toBeInTheDocument();

    // Reopened: the table is back.
    fireEvent.click(screen.getByRole("button", { name: "Change" }));
    expect(
      (await screen.findAllByRole("button", { name: /^Pick the 180 call/ })).length,
    ).toBeGreaterThan(0);
  });

  it("starts collapsed when a strike arrives already committed (a rung switch, or a shared link)", async () => {
    render(renderGateWithStrike("NVDA", "180")); // 180 is a real row on fullChain — seedable

    await waitFor(() => expect(document.querySelector(".tkt-chain-summary")).toBeInTheDocument());
    expect(screen.queryAllByRole("button", { name: /^Pick the 180 call/ })).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Change" })).toBeInTheDocument();
  });

  it("reopens on a fresh symbol commit even while collapsed", async () => {
    render(renderGateWithStrike("NVDA", "180"));
    await waitFor(() => expect(screen.getByRole("button", { name: "Change" })).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("Symbol"), { target: { value: "AMD" } });
    fireEvent.blur(screen.getByLabelText("Symbol"));

    expect(
      (await screen.findAllByRole("button", { name: /^Pick the 180 call/ })).length,
    ).toBeGreaterThan(0);
  });
});

/**
 * The locked-pick note (review fix) — the house rule ("Locked = visible, disabled, explained…
 * never hidden, never silently dead", `ticket-nav.tsx`) applies to a chain-cell click too: a
 * locked-target pick used to be a silent no-op beyond filling strike. It now surfaces a `.tkt-note`
 * explaining why the ticket didn't switch, and the note clears on the next unrelated edit.
 */
describe("OptionGate — locked-pick note", () => {
  beforeEach(() => {
    chainResult = fullChain;
  });

  it("clicking a locked-target cell surfaces an explanatory note", async () => {
    // onPreset MUST be wired for onChainCellPick to reach the locked-rung branch at all — with it
    // absent, the handler degrades to same-rung behavior for every click (no lock lookup happens).
    render(renderChainPickGate({ plays: playsWithLockedTarget, onPreset: () => undefined }));

    const putCells = await screen.findAllByRole("button", { name: /^Pick the 180 put/ });
    fireEvent.click(putCells[0] as HTMLElement);

    await waitFor(() =>
      expect(
        screen.getByText("Strike filled — the put side isn't unlocked yet."),
      ).toBeInTheDocument(),
    );
  });

  it("clears the note on a subsequent unrelated edit", async () => {
    render(renderChainPickGate({ plays: playsWithLockedTarget, onPreset: () => undefined }));

    const putCells = await screen.findAllByRole("button", { name: /^Pick the 180 put/ });
    fireEvent.click(putCells[0] as HTMLElement);
    await waitFor(() =>
      expect(
        screen.getByText("Strike filled — the put side isn't unlocked yet."),
      ).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByLabelText("Contracts (100 shares)"), { target: { value: "2" } });

    await waitFor(() =>
      expect(
        screen.queryByText("Strike filled — the put side isn't unlocked yet."),
      ).not.toBeInTheDocument(),
    );
  });
});

describe("OptionGate — held position badge (Eric, 2026-09-22)", () => {
  it("marks a strike the desk already holds a matching contract on", async () => {
    chainResult = fullChain;
    deskPositions = [{ symbol: "NVDA260918C00180000", isOption: true }];
    render(renderGate("NVDA"));

    await waitFor(() => expect(fieldsPresent()).toBe(true));
    await waitFor(() =>
      expect(
        document.querySelector(".straddle-held-badge:not(.straddle-held-empty)"),
      ).not.toBeNull(),
    );
    expect(
      document.querySelector(".straddle-held-badge:not(.straddle-held-empty)")?.textContent,
    ).toBe("C");
  });

  it("never marks a strike when nothing held matches this underlying/expiration", async () => {
    chainResult = fullChain;
    deskPositions = [{ symbol: "MSFT260918C00180000", isOption: true }]; // different underlying
    render(renderGate("NVDA"));

    await waitFor(() => expect(fieldsPresent()).toBe(true));
    expect(document.querySelector(".straddle-held-badge:not(.straddle-held-empty)")).toBeNull();
  });

  it("ignores a held stock position — badges are option-only", async () => {
    chainResult = fullChain;
    deskPositions = [{ symbol: "NVDA", isOption: false }];
    render(renderGate("NVDA"));

    await waitFor(() => expect(fieldsPresent()).toBe(true));
    expect(document.querySelector(".straddle-held-badge:not(.straddle-held-empty)")).toBeNull();
  });
});

/**
 * `chartSlot` (Eric, 2026-09-22: "the options table needs access to all available screen width…
 * the bottom part of the trade form… requires little room — appropriate place to have two columns
 * with the right column being the candlestick chart"): passed only by the docked bench
 * (`trade.tsx`'s `ticketOwnsChart`) — this component just has to place it correctly.
 */
describe("OptionGate — chartSlot (Eric, 2026-09-22)", () => {
  function renderGateWithChart(chartSlot: ReactElement): ReactElement {
    const client = new QueryClient();
    return (
      <QueryClientProvider client={client}>
        <OptionGate
          deskId="desk-1"
          play={unlockedCallPlay}
          initialSymbol="NVDA"
          chartSlot={chartSlot}
        />
      </QueryClientProvider>
    );
  }

  it("renders chartSlot beside the order-detail block, not beside the symbol/chain", async () => {
    chainResult = fullChain;
    render(renderGateWithChart(<div data-testid="fixture-chart">chart fixture</div>));

    await waitFor(() => expect(fieldsPresent()).toBe(true));
    const chart = screen.getByTestId("fixture-chart");
    const split = chart.closest(".tkt-review-split");
    expect(split).not.toBeNull();
    // The Strike field (order-detail) shares the split with the chart; the Symbol field
    // (top-of-ticket) does not — proving the split starts at Strike, not at the very top.
    expect(split?.contains(screen.getByLabelText("Strike"))).toBe(true);
    expect(split?.contains(screen.getByLabelText("Symbol"))).toBe(false);
  });

  it("renders the order-detail block plainly, with no split wrapper, when chartSlot is absent", async () => {
    chainResult = fullChain;
    render(renderGate("NVDA"));

    await waitFor(() => expect(fieldsPresent()).toBe(true));
    expect(document.querySelector(".tkt-review-split")).toBeNull();
  });

  it("survives chartSlot toggling on (a window resized across the bench width) without losing field state", async () => {
    // Regression: an earlier version picked between a bare Fragment and a nested <div><div> for
    // the order-detail block depending on chartSlot's presence — a real tree-shape change React
    // remounts across, silently dropping everything inside (caught via the trade.mjs shoot script
    // crashing on a resize, not a review pass). One `QueryClient`, one `rerender` on the SAME
    // component instance — exactly the DOM-level effect of `trade.tsx`'s `docked` flipping.
    chainResult = fullChain;
    const client = new QueryClient();
    const withChart = (chartSlot: ReactElement | undefined) => (
      <QueryClientProvider client={client}>
        <OptionGate
          deskId="desk-1"
          play={unlockedCallPlay}
          initialSymbol="NVDA"
          chartSlot={chartSlot}
        />
      </QueryClientProvider>
    );
    const { rerender } = render(withChart(undefined));
    await waitFor(() => expect(fieldsPresent()).toBe(true));

    fireEvent.change(screen.getByLabelText("Contracts (100 shares)"), { target: { value: "7" } });
    expect(screen.getByLabelText("Contracts (100 shares)")).toHaveValue(7);

    rerender(withChart(<div data-testid="fixture-chart">chart fixture</div>));
    await waitFor(() => expect(screen.getByTestId("fixture-chart")).toBeInTheDocument());
    expect(screen.getByLabelText("Contracts (100 shares)")).toHaveValue(7);
  });
});
