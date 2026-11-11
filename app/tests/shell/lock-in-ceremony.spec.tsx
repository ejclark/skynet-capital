import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import type { DeskPosition } from "../../src/live/desk";
import type { DeskOrderEvent } from "../../src/live/desk-events";
import { CloseReceipt, type SentClose } from "../../src/shell/close-receipt";
import { celebrateLockIn, LockInMoments, useLockInMoments } from "../../src/shell/lock-in-ceremony";
import { lockedIn, lockInFlag } from "../../src/shell/locked-in";
import { usePrefs } from "../../src/shell/prefs";
import { setVantageFrame, useTowerBus } from "../../src/shell/tower-bus";

/**
 * The locked-in ceremony (#4609 slice 2).
 *
 * WHEN an order the viewer owns fills and closes part or all of a position the app had marked
 * Consider for its gain, THE app SHALL celebrate once beside the plain-text reason the call was right.
 * WHERE the close realized a loss, THE app SHALL render it honestly, with no celebration.
 * WHILE Tower motion is Still, or the device asks for reduced motion, THE celebration SHALL draw at rest.
 * WHEN a partial close fills, THE celebration SHALL say plainly that the rest is still running.
 * THE celebration SHALL state the realized dollars and SHALL NOT imply what the rest will do.
 */

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

/** The receipt's Dismiss is the row's job (`close-panel.spec.tsx`); nothing to do here. */
const dismiss = (): void => undefined;

const SHARES = pos({});
const flag = lockInFlag(SHARES);

const sentOf = (orderId: string, count: number): SentClose => ({
  orderId,
  status: "accepted",
  symbol: "AMD",
  display: "AMD",
  side: "sell",
  count,
  ...(flag ? { lockIn: flag } : {}),
});

const fillOf = (orderId: string, count: number, price: number): DeskOrderEvent => ({
  id: `${orderId}:order.filled`,
  eventType: "order.filled",
  orderId,
  at: "2026-11-10T15:00:00Z",
  outcome: "success",
  payload: { status: "filled", filledQuantity: count, price },
});

const keptOf = (orderId: string, count: number, price: number) => {
  const kept = lockedIn(sentOf(orderId, count), fillOf(orderId, count, price));
  if (!kept) throw new Error("expected a locked-in profit");
  return kept;
};

function emitFill(orderId: string, count: number, price: number): void {
  act(() => {
    for (const source of FakeEventSource.instances) {
      source.emit("order", JSON.stringify(fillOf(orderId, count, price)));
    }
  });
}

function withClient(ui: ReactElement): ReactElement {
  return <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>;
}

function crest() {
  const flares: unknown[] = [];
  const frame = document.createElement("iframe");
  Object.defineProperty(frame, "contentWindow", {
    value: { postMessage: (m: { type: string }) => m.type === "tower:flare" && flares.push(m) },
  });
  setVantageFrame(frame);
  useTowerBus.setState({ on: true });
  return flares;
}

beforeEach(() => {
  window.localStorage.clear();
  useLockInMoments.setState({ queue: [] });
  usePrefs.setState({ crest: "live" });
  FakeEventSource.instances.length = 0;
  (globalThis as { EventSource?: unknown }).EventSource = FakeEventSource;
});
afterEach(() => {
  (globalThis as { EventSource?: unknown }).EventSource = undefined;
  setVantageFrame(null);
  useTowerBus.setState({ on: false });
});

describe("LockInMoments — the celebration", () => {
  it("shows nothing until a moment arrives", () => {
    render(<LockInMoments />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("states the realized dollars, what they were on, and the reason the call was right", () => {
    render(<LockInMoments />);
    act(() => celebrateLockIn({ orderId: "o-1", kept: keptOf("o-1", 10, 130) }));
    const dialog = screen.getByRole("dialog", { name: /Profit locked in \+\$300/ });
    expect(dialog).toHaveTextContent("on 10 shares of AMD");
    expect(dialog).toHaveTextContent("Closed in full.");
    expect(dialog).toHaveTextContent(
      "✦ it was marked Consider, up 30%, and winners can give it back. you closed it, so the gain is locked in.",
    );
  });

  it("on a partial close says the rest is still running, and nothing about what it will do", () => {
    render(<LockInMoments />);
    act(() => celebrateLockIn({ orderId: "o-2", kept: keptOf("o-2", 4, 130) }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("+$120");
    expect(dialog).toHaveTextContent("The other 6 shares are still running.");
    expect(dialog.textContent).not.toMatch(/will |keep (rising|climbing)|more to come/i);
  });

  it("shows once per order: leaving it, a reconnect handing the fill back replays nothing", () => {
    render(<LockInMoments />);
    const moment = { orderId: "o-3", kept: keptOf("o-3", 10, 130) };
    act(() => celebrateLockIn(moment));
    act(() => celebrateLockIn(moment));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    act(() => celebrateLockIn(moment));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("flares the tower once, as the member leaves — never while it covers the page", () => {
    const flares = crest();
    render(<LockInMoments />);
    act(() => celebrateLockIn({ orderId: "o-4", kept: keptOf("o-4", 10, 130) }));
    expect(flares).toEqual([]);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(flares).toEqual([{ type: "tower:flare", kind: "fill" }]);
  });

  it("draws at rest when the member's Tower motion is Still", () => {
    usePrefs.setState({ crest: "still" });
    render(<LockInMoments />);
    act(() => celebrateLockIn({ orderId: "o-5", kept: keptOf("o-5", 10, 130) }));
    expect(screen.getByRole("dialog")).toHaveClass("nh-overlay--still");
  });

  it("moves when Tower motion is Moving", () => {
    render(<LockInMoments />);
    act(() => celebrateLockIn({ orderId: "o-6", kept: keptOf("o-6", 10, 130) }));
    expect(screen.getByRole("dialog")).not.toHaveClass("nh-overlay--still");
  });
});

describe("CloseReceipt hands the moment to the shell", () => {
  it("celebrates a flagged close's fill at a gain, and the celebration outlives the row", () => {
    const flares = crest();
    const view = render(
      withClient(
        <>
          <CloseReceipt deskId="human-eric" sent={sentOf("o-7", 10)} onDismiss={dismiss} />
          <LockInMoments />
        </>,
      ),
    );
    emitFill("o-7", 10, 130);
    expect(screen.getByRole("dialog", { name: /Profit locked in \+\$300/ })).toBeInTheDocument();
    // The fill's own flare waits for the celebration's leaving, not under its backdrop.
    expect(flares).toEqual([]);
    // A full close refetches the desk and the row goes; the celebration stays.
    view.rerender(withClient(<LockInMoments />));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders a loss honestly: the plain receipt line, no celebration", () => {
    render(
      withClient(
        <>
          <CloseReceipt deskId="human-eric" sent={sentOf("o-8", 10)} onDismiss={dismiss} />
          <LockInMoments />
        </>,
      ),
    );
    emitFill("o-8", 10, 90);
    expect(screen.getByRole("status")).toHaveTextContent("Sold 10 AMD · $900");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not celebrate a close of a position that was not marked Consider", () => {
    const plain: SentClose = { ...sentOf("o-9", 10) };
    const { lockIn: _dropped, ...unflagged } = plain;
    render(
      withClient(
        <>
          <CloseReceipt deskId="human-eric" sent={unflagged} onDismiss={dismiss} />
          <LockInMoments />
        </>,
      ),
    );
    emitFill("o-9", 10, 130);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not celebrate another order's fill", () => {
    render(
      withClient(
        <>
          <CloseReceipt deskId="human-eric" sent={sentOf("o-10", 10)} onDismiss={dismiss} />
          <LockInMoments />
        </>,
      ),
    );
    emitFill("someone-else", 10, 130);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
