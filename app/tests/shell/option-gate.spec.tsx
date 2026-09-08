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

beforeEach(() => {
  chainNeverResolves = false;
  chainResult = { chainNote: "unset", reason: "failed" };
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
    const callCells = await screen.findAllByRole("button", { name: "Pick the 180 call" });
    fireEvent.click(callCells[0] as HTMLElement);

    expect(presets).toEqual([]);
    await waitFor(() => expect(screen.getByLabelText("Strike")).toHaveValue(180));
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

    const putCells = await screen.findAllByRole("button", { name: "Pick the 180 put" });
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

    const putCells = await screen.findAllByRole("button", { name: "Pick the 180 put" });
    fireEvent.click(putCells[0] as HTMLElement);

    // Safety-critical: a chain click must never open a rung the member hasn't earned. Locked
    // means locked — regardless of what the strike or the clicked side would otherwise target.
    expect(presets).toEqual([]);
    expect(committedStrikes).toEqual([]);
    await waitFor(() => expect(screen.getByLabelText("Strike")).toHaveValue(180));
  });
});
