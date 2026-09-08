import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import type { WireFeed, WireTrade } from "../../src/live/wire";
import { WireRow } from "../../src/shell/wire-row";

// `WireRow` renders a `<Link to="/u/$id">` per member row — no route tree is mounted in this
// component-level spec, so `Link` is stubbed to a plain anchor (only export this file needs).
rstest.mock("@tanstack/react-router", () => ({
  Link: ({
    params,
    children,
    ...rest
  }: {
    readonly params?: { readonly id?: string };
    readonly children?: ReactNode;
  }) => (
    <a href={`/u/${params?.id ?? ""}`} {...rest}>
      {children}
    </a>
  ),
}));

/**
 * `WireRow` (#2017 Phase 1 slice 12) — the options ticket's who-else-traded intel: nothing for an
 * uncommitted symbol, the viewer's own fills excluded (`deskId` match), a display cap of 5 with a
 * "+N more" note, an honest empty state when nobody else has traded it, and real member names with
 * a kind chip (bot vs. human) per the consent doctrine — never anonymized, never a min-N gate.
 */

let nextFeed: WireFeed = { trades: [], pnl: [], feedbackEnabled: false, feedback: [] };
let neverResolves = false;

rstest.mock("../../src/live/wire", () => ({
  fetchWireForSymbol: () =>
    neverResolves
      ? new Promise<WireFeed>(() => {
          // Deliberately never resolves — pins the "no data yet" state for the test to observe.
        })
      : Promise.resolve(nextFeed),
}));

function withClient(node: ReactElement) {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

const trade = (overrides: Partial<WireTrade> = {}): WireTrade => ({
  key: overrides.key ?? `k-${Math.random()}`,
  side: "buy",
  symbol: "NVDA",
  quantity: 1,
  price: "5.00",
  who: "Ann",
  whoId: "human-ann",
  kind: "human",
  reconstructed: false,
  when: "2:30p",
  ...overrides,
});

describe("WireRow", () => {
  beforeEach(() => {
    neverResolves = false;
  });

  it("renders nothing for an uncommitted symbol", () => {
    const { container } = render(withClient(<WireRow symbol="" deskId="desk-1" />));
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing while the query hasn't resolved yet", () => {
    neverResolves = true;
    const { container } = render(withClient(<WireRow symbol="NVDA" deskId="desk-1" />));
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the empty-state copy when nobody else has traded it", async () => {
    nextFeed = { trades: [], pnl: [], feedbackEnabled: false, feedback: [] };
    render(withClient(<WireRow symbol="NVDA" deskId="desk-1" />));

    expect(await screen.findByText("No one else has traded NVDA yet.")).toBeInTheDocument();
  });

  it("excludes the viewer's own trades (deskId match)", async () => {
    nextFeed = {
      trades: [
        trade({ key: "mine", whoId: "desk-1", who: "Me" }),
        trade({ key: "theirs", whoId: "human-ann", who: "Ann" }),
      ],
      pnl: [],
      feedbackEnabled: false,
      feedback: [],
    };
    render(withClient(<WireRow symbol="NVDA" deskId="desk-1" />));

    expect(await screen.findByText("Ann")).toBeInTheDocument();
    expect(screen.queryByText("Me")).not.toBeInTheDocument();
  });

  it("caps display at 5 with a +N more note when more remain", async () => {
    nextFeed = {
      trades: Array.from({ length: 7 }, (_, i) =>
        trade({ key: `t${i}`, whoId: `human-${i}`, who: `Trader ${i}` }),
      ),
      pnl: [],
      feedbackEnabled: false,
      feedback: [],
    };
    render(withClient(<WireRow symbol="NVDA" deskId="desk-1" />));

    await screen.findByText("Trader 0");
    expect(screen.getAllByText(/^Trader \d$/)).toHaveLength(5);
    expect(screen.getByText("+2 more")).toBeInTheDocument();
  });

  it("shows a bot's chip vs. a human's chip correctly", async () => {
    nextFeed = {
      trades: [
        trade({ key: "b", whoId: "bot-sauron", who: "Sauron", kind: "bot" }),
        trade({ key: "h", whoId: "human-ann", who: "Ann", kind: "human" }),
      ],
      pnl: [],
      feedbackEnabled: false,
      feedback: [],
    };
    render(withClient(<WireRow symbol="NVDA" deskId="desk-1" />));

    const botRow = (await screen.findByText("Sauron")).closest("li");
    const humanRow = screen.getByText("Ann").closest("li");
    expect(botRow?.querySelector(".chip-bot")).toHaveTextContent("BOT");
    expect(humanRow?.querySelector(".chip-human")).toHaveTextContent("HUMAN");
  });
});
