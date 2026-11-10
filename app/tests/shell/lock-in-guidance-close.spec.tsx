import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import type { DeskPosition } from "../../src/live/desk";
import * as actualTicket from "../../src/live/ticket" with { rstest: "importActual" };
import type { TicketDraft, TicketPreview } from "../../src/live/ticket";
import { LockInMoments, useLockInMoments } from "../../src/shell/lock-in-ceremony";
import { PositionActs } from "../../src/shell/position-act";

/**
 * The guidance sheet's own Close (#4609 slice 2): the j2 s3 walk takes profit from Trade → Guidance,
 * not from the blotter row, so a close placed there celebrates the same way.
 *
 * WHEN a close placed from a position's guidance fills at a gain on a position marked Consider,
 * THE app SHALL celebrate once beside the reason; a position that was not marked SHALL get nothing.
 */

rstest.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/trade">{children}</a>,
}));

rstest.mock("../../src/live/ticket", () => ({
  ...actualTicket,
  reviewTicket: (draft: TicketDraft) => {
    const preview: TicketPreview = {
      ok: true,
      action: draft.action,
      symbol: draft.symbol,
      quantity: draft.quantity,
      orderType: "limit",
      timeInForce: "day",
      limitPrice: draft.limitPrice,
      estNotional: draft.quantity * (draft.limitPrice ?? 0),
      refusals: [],
      warnings: [],
    };
    return Promise.resolve({ preview });
  },
  submitTicket: () =>
    Promise.resolve({ ok: true, orderId: "g-1", status: "accepted", symbol: "AMD" }),
}));

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

const amd = (over: Partial<DeskPosition>): DeskPosition => ({
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

beforeEach(() => {
  window.localStorage.clear();
  useLockInMoments.setState({ queue: [] });
  FakeEventSource.instances.length = 0;
  (globalThis as { EventSource?: unknown }).EventSource = FakeEventSource;
});
afterEach(() => {
  (globalThis as { EventSource?: unknown }).EventSource = undefined;
});

async function sellAllAndFill(position: DeskPosition): Promise<void> {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PositionActs deskId="human-eric" position={position} positions={[position]} />
      <LockInMoments />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Sell" }));
  fireEvent.change(screen.getByLabelText("Limit $"), { target: { value: "130" } });
  fireEvent.click(screen.getByRole("button", { name: "Review sale" }));
  const recap = await screen.findByRole("dialog");
  fireEvent.click(within(recap).getByRole("button", { name: "Place sale" }));
  await screen.findByText(/Order g-1 accepted/);
  act(() => {
    for (const source of FakeEventSource.instances) {
      source.emit(
        "order",
        JSON.stringify({
          id: "g-1:order.filled",
          eventType: "order.filled",
          orderId: "g-1",
          at: "2026-11-10T15:00:00Z",
          outcome: "success",
          payload: { status: "filled", filledQuantity: 10, price: 130 },
        }),
      );
    }
  });
}

describe("PositionActs — a close from the guidance sheet", () => {
  it("celebrates a position marked Consider once its close fills at a gain", async () => {
    await sellAllAndFill(amd({}));
    const dialog = screen.getByRole("dialog", { name: /Profit locked in \+\$300/ });
    expect(dialog).toHaveTextContent("on 10 shares of AMD");
    expect(dialog).toHaveTextContent("winners can give it back");
  });

  it("stays quiet for a position that was never marked Consider", async () => {
    await sellAllAndFill(amd({ returnPct: "+3.0%", totalPlRaw: 30 }));
    expect(screen.queryByRole("dialog", { name: /Profit locked in/ })).not.toBeInTheDocument();
  });
});
