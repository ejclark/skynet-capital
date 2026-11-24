import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import type { DeskPosition } from "../../src/live/desk";
import * as actualOptions from "../../src/live/options" with { rstest: "importActual" };
import type { OptionDraft, OptionPositions, OptionPreview } from "../../src/live/options";
import { LockInMoments, useLockInMoments } from "../../src/shell/lock-in-ceremony";
import { PositionActs } from "../../src/shell/position-act";

/**
 * A sold option's buy-back, celebrated (#7383 slice 1). A written option's Consider badge is judged
 * on its stock's price before its premium, so the close has to carry that price into the flag.
 *
 * WHEN a buy-back of a sold option the app had marked Consider for its gain fills at a gain, THE
 * app SHALL celebrate it exactly as it does a sale. WHERE the stock's price is not known when the
 * close is sent, THE app SHALL celebrate nothing (a badge it cannot confirm).
 */

rstest.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/trade">{children}</a>,
}));

rstest.mock("../../src/live/options", () => ({
  ...actualOptions,
  fetchChain: () => Promise.reject(new Error("no chain in this spec")),
  reviewOption: (draft: OptionDraft) => {
    const preview = {
      code: "",
      underlying: "AMD",
      occSymbol: PUT,
      optionType: "put",
      side: "buy",
      positionIntent: "buy_to_close",
      contracts: draft.contracts,
      strike: 150,
      expiration: "2026-11-20",
      orderType: "limit",
      limitPrice: draft.limitPrice,
      timeInForce: "day",
      ok: true,
      refusals: [],
      warnings: [],
    } as unknown as OptionPreview;
    return Promise.resolve({ preview });
  },
  submitOption: () =>
    Promise.resolve({ ok: true, orderId: "bb-1", status: "accepted", symbol: PUT }),
}));

const PUT = "AMD261120P00150000";

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  readonly listeners = new Map<string, Array<(event: MessageEvent<string>) => void>>();
  constructor(readonly url: string) {
    FakeEventSource.instances.push(this);
  }
  addEventListener(type: string, listener: (event: MessageEvent<string>) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  emit(type: string, data: string) {
    for (const l of this.listeners.get(type) ?? []) l({ data } as MessageEvent<string>);
  }
  close() {
    // nothing to release in a test DOM
  }
}

/** Two AMD $150 puts written for $3.00 ($300 per contract, Alpaca's scale), now $1.00: 67% kept. */
const soldPut: DeskPosition = {
  symbol: PUT,
  display: "AMD $150 put",
  detail: "",
  isOption: true,
  quantity: "-2",
  costPerShare: "$300.00",
  price: "$100.00",
  costBasis: "-$600",
  value: "-$200",
  dayPl: "+$10",
  dayPct: "+1.0%",
  dayTone: "pos",
  totalPl: "+$400",
  totalPlRaw: 400,
  returnPct: "+67.0%",
  totalTone: "pos",
  weightPct: 10,
};

/** The option book as the blotter already read it: the put's stock at `spot`, or no price. */
const book = (spot: number | undefined): OptionPositions =>
  ({
    available: true,
    asOf: "2026-11-10T15:00:00Z",
    rows: [
      {
        symbol: PUT,
        display: "AMD $150 put",
        underlying: "AMD",
        type: "put",
        strike: 150,
        expiration: "2026-11-20",
        daysToExpiry: 10,
        contracts: -2,
        ...(spot === undefined ? {} : { spot }),
      },
    ],
    book: {},
    representative: true,
  }) as unknown as OptionPositions;

beforeEach(() => {
  window.localStorage.clear();
  useLockInMoments.setState({ queue: [] });
  FakeEventSource.instances.length = 0;
  (globalThis as { EventSource?: unknown }).EventSource = FakeEventSource;
});
afterEach(() => {
  (globalThis as { EventSource?: unknown }).EventSource = undefined;
});

/** `watched`: the close is one the app celebrates, so wait for its fill listener before the fill
 *  (the same gap `lock-in-guidance-close.spec.tsx` closes). */
async function buyBackAndFill(spot: number | undefined, watched: boolean): Promise<void> {
  const client = new QueryClient();
  client.setQueryData(["option-positions", "human-eric"], book(spot));
  render(
    <QueryClientProvider client={client}>
      <PositionActs deskId="human-eric" position={soldPut} positions={[soldPut]} />
      <LockInMoments />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Buy back" }));
  fireEvent.change(screen.getByLabelText("Limit $"), { target: { value: "1.00" } });
  fireEvent.click(screen.getByRole("button", { name: "Review buy-back" }));
  const recap = await screen.findByRole("dialog");
  const opened = FakeEventSource.instances.length;
  fireEvent.click(within(recap).getByRole("button", { name: "Place buy-back" }));
  await screen.findByText(/Order bb-1 accepted/);
  if (watched) {
    await waitFor(() => expect(FakeEventSource.instances.length).toBeGreaterThan(opened));
  }
  act(() => {
    for (const source of FakeEventSource.instances) {
      source.emit(
        "order",
        JSON.stringify({
          id: "bb-1:order.filled",
          eventType: "order.filled",
          orderId: "bb-1",
          at: "2026-11-10T15:00:00Z",
          outcome: "success",
          payload: { status: "filled", filledQuantity: 2, price: 1 },
        }),
      );
    }
  });
}

describe("PositionActs — buying back a sold option from the guidance sheet", () => {
  it("celebrates a buy-back marked Consider once it fills at a gain, as a sale is", async () => {
    await buyBackAndFill(170, true);
    const dialog = await screen.findByRole("dialog", { name: /Profit locked in \+\$400/ });
    expect(dialog).toHaveTextContent("on 2 contracts of AMD $150 put");
    expect(dialog).toHaveTextContent("67% of premium kept");
  });

  it("stays quiet when the stock's price was not known as the buy-back was sent", async () => {
    await buyBackAndFill(undefined, false);
    expect(screen.queryByRole("dialog", { name: /Profit locked in/ })).not.toBeInTheDocument();
  });
});
