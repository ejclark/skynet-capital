import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import type { DeskPosition } from "../../src/live/desk";
import type { DeskOrderRow, DeskOrders } from "../../src/live/orders";
import { LockInMoments, useLockInMoments } from "../../src/shell/lock-in-ceremony";
import { LateLockIns } from "../../src/shell/lock-in-late";
import {
  lockInOfRow,
  REMEMBER_MS,
  rememberedCloses,
  rememberLockIn,
} from "../../src/shell/lock-in-memory";
import { lockInFlag } from "../../src/shell/locked-in";
import { usePrefs } from "../../src/shell/prefs";
import { WorkingOrders } from "../../src/shell/working-orders";

/**
 * A locked-in profit that fills late (#7383 slice 2).
 *
 * WHEN a close the member sent while a position was marked Consider fills after the sending page
 * is gone, THE app SHALL celebrate it once on the member's next Profile → Overview load, and SHALL
 * first show it as a plain line in Working orders.
 * THE app SHALL NOT celebrate a loss, a close of a position that was not marked, or an order that
 * ended unfilled; and a moment already seen SHALL NOT replay.
 * THE flag SHALL be the Consider mark as the close was sent, never re-read at the fill.
 */

let nextOrders: DeskOrders = { available: true, asOf: "", working: [], recent: [] };
let fetches = 0;
rstest.mock("../../src/live/orders", () => ({
  fetchOrders: () => {
    fetches += 1;
    return Promise.resolve(nextOrders);
  },
  cancelOrder: () => Promise.resolve({ ok: true, orderId: "x" }),
  replaceOrder: () => Promise.resolve({ ok: true, orderId: "x", replaces: "y", status: "new" }),
}));

const pos = (over: Partial<DeskPosition>): DeskPosition => ({
  symbol: "AMD",
  display: "AMD",
  detail: "",
  isOption: false,
  quantity: "10",
  costPerShare: "$100.00",
  price: "$130.00",
  costBasis: "$1,000",
  value: "$1,300",
  dayPl: "+$10",
  dayPct: "+1.0%",
  dayTone: "pos",
  totalPl: "+$300",
  totalPlRaw: 300,
  returnPct: "+30.0%",
  totalTone: "pos",
  weightPct: 50,
  ...over,
});

const DESK = "human-eric";
const flag = lockInFlag(pos({}));

const send = (orderId: string, count = 10) =>
  rememberLockIn(DESK, {
    orderId,
    symbol: "AMD",
    display: "AMD",
    side: "sell",
    count,
    ...(flag ? { lockIn: flag } : {}),
  });

const row = (over: Partial<DeskOrderRow>): DeskOrderRow => ({
  id: "o-1",
  symbol: "AMD",
  display: "AMD",
  side: "sell",
  orderType: "limit",
  quantity: 10,
  filledQuantity: 10,
  limitPrice: 130,
  avgFillPrice: 130,
  submittedAt: "2026-11-24T14:00:00Z",
  settledAt: "2026-11-24T15:00:00Z",
  state: "filled",
  cancelable: false,
  ...over,
});

const orders = (recent: DeskOrderRow[], working: DeskOrderRow[] = []): DeskOrders => ({
  available: true,
  asOf: "2026-11-24T16:00:00Z",
  working,
  recent,
});

function withClient(ui: ReactElement): ReactElement {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

/** The Overview's check and the root shell's one host, as the app mounts them. */
const overview = () =>
  render(
    withClient(
      <>
        <LateLockIns deskIds={[DESK]} />
        <LockInMoments />
      </>,
    ),
  );

beforeEach(() => {
  window.localStorage.clear();
  useLockInMoments.setState({ queue: [] });
  usePrefs.setState({ crest: "live" });
  nextOrders = orders([]);
  fetches = 0;
});

describe("remembering a flagged close", () => {
  it("is precondition-checked: the fixture position is marked Consider", () => {
    expect(flag).toBeDefined();
  });

  it("keeps a flagged close with its order id, and never an unflagged one", () => {
    send("o-1");
    rememberLockIn(DESK, { orderId: "o-2", symbol: "AMD", display: "AMD", side: "sell", count: 1 });
    expect(rememberedCloses(DESK).map((c) => c.orderId)).toEqual(["o-1"]);
  });

  it("forgets a close past the age limit", () => {
    send("o-1");
    expect(rememberedCloses(DESK, Date.now() + REMEMBER_MS + 1)).toEqual([]);
  });

  it("reads the reason from the flag remembered at send, with no position to re-read", () => {
    send("o-1");
    const kept = lockInOfRow(rememberedCloses(DESK), row({}));
    expect(kept?.why).toContain(flag?.fact ?? "missing");
  });
});

describe("lockInOfRow — the broker's settled record, through the live path's rule", () => {
  beforeEach(() => send("o-1"));

  it("reads a fill at a gain as the locked-in dollars", () => {
    expect(lockInOfRow(rememberedCloses(DESK), row({}))?.headline).toBe(
      "Locked in $300 on 10 shares of AMD",
    );
  });

  it("says nothing for a loss, an order still working, one cancelled, or one never remembered", () => {
    const remembered = rememberedCloses(DESK);
    expect(lockInOfRow(remembered, row({ avgFillPrice: 90 }))).toBeUndefined();
    expect(lockInOfRow(remembered, row({ state: "partial", filledQuantity: 4 }))).toBeUndefined();
    expect(lockInOfRow(remembered, row({ state: "cancelled" }))).toBeUndefined();
    expect(lockInOfRow(remembered, row({ id: "o-9" }))).toBeUndefined();
  });
});

describe("LateLockIns — the next Overview load", () => {
  it("celebrates a remembered close that filled at a gain after its page was gone", async () => {
    send("o-1");
    nextOrders = orders([row({})]);
    overview();
    expect(
      await screen.findByRole("dialog", { name: /Profit locked in \+\$300/ }),
    ).toHaveTextContent("on 10 shares of AMD");
  });

  it("never replays a moment already seen", async () => {
    send("o-1");
    window.localStorage.setItem("skynet.lockin.seen.o-1", "2026-11-24T15:00:01Z");
    nextOrders = orders([row({})]);
    overview();
    await waitFor(() => expect(fetches).toBe(1));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("celebrates nothing for a loss", async () => {
    send("o-1");
    nextOrders = orders([row({ avgFillPrice: 90 })]);
    overview();
    await waitFor(() => expect(fetches).toBe(1));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("forgets a close that ended unfilled, and keeps one still working", async () => {
    send("o-1");
    send("o-2");
    nextOrders = orders(
      [row({ state: "cancelled", avgFillPrice: undefined })],
      [
        row({
          id: "o-2",
          state: "working",
          filledQuantity: 0,
          avgFillPrice: undefined,
          cancelable: true,
        }),
      ],
    );
    overview();
    await waitFor(() => expect(rememberedCloses(DESK).map((c) => c.orderId)).toEqual(["o-2"]));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not read the order list for an account with nothing remembered", async () => {
    overview();
    await new Promise((r) => setTimeout(r, 20));
    expect(fetches).toBe(0);
  });
});

describe("WorkingOrders — said plainly first", () => {
  it("puts one plain line under the settled row of a remembered close that filled at a gain", async () => {
    send("o-1");
    nextOrders = orders([row({}), row({ id: "o-7", symbol: "NVDA", display: "NVDA" })]);
    render(withClient(<WorkingOrders deskId={DESK} />));
    expect(await screen.findByText("Locked in $300 on 10 shares of AMD.")).toBeInTheDocument();
    expect(screen.getAllByText(/Locked in/)).toHaveLength(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
