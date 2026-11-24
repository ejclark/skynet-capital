import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import type { DeskPosition } from "../../src/live/desk";
import { timing, useMoneypenny } from "../../src/live/moneypenny";
import { keyFor } from "../../src/live/moneypenny-storage";
import type { RowMark } from "../../src/shell/use-row-marks";
import { flush, json, onboarding } from "./moneypenny-dock-harness";

/**
 * A SIDE THREAD ON A POSITION'S ROW (#7167 criterion 11, after #7275's story and event rows). A
 * question asked from a holding's opened guidance opens a thread named by the row's own anchor,
 * `pos-<symbol>` — the key her links already land on — with no wiring of its own. The row shows it
 * behind one closed line; the dock's conversation names the row and links back to it. Offered on the member's own
 * trading account only, the book her positions tool reads.
 */

rstest.mock("@tanstack/react-router", () => ({
  Link: ({ children, className }: { children: ReactNode; className?: string }) => (
    <a href="/app/trade" className={className}>
      {children}
    </a>
  ),
  useRouter: () => undefined,
  // one page here, so the address never moves
  useRouterState: () => "/app/accounts",
  useSearch: () => ({}),
  useNavigate: () => () => Promise.resolve(),
}));

const { GuidanceSlot } = await import("../../src/shell/position-guidance-slot");
const { MoneypennyDock } = await import("../../src/shell/moneypenny-dock");
const { RowThread } = await import("../../src/shell/row-thread");
const { PositionAsk, positionQuestion, positionThread, useOwnTradingAccount } = await import(
  "../../src/shell/position-thread"
);

const PUT: DeskPosition = {
  symbol: "CRWV261106P00080000",
  display: "CRWV $80 PUT · 6 NOV 26",
  detail: "",
  isOption: true,
  quantity: "-1",
  costPerShare: "$2.55",
  price: "$5.50",
  costBasis: "-$255",
  value: "-$550",
  dayPl: "+$0",
  dayPct: "+0.0%",
  dayTone: "flat",
  totalPl: "-$295",
  totalPlRaw: -295,
  returnPct: "-116%",
  totalTone: "neg",
  weightPct: 1,
};
const KEY = `pos-${PUT.symbol}`;
const ROW: RowMark = { mark: { kind: "review", fact: "$2.60 above strike" }, past: 0 };

const stream = (text: string) =>
  new Response(`event: delta\ndata: ${JSON.stringify({ text })}\n\nevent: done\ndata: {}\n\n`, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
  });

describe("a side thread on a position's row", () => {
  let realFetch: typeof globalThis.fetch;
  let chats: { messages: { role: string; content: string }[] }[];
  beforeEach(() => {
    realFetch = globalThis.fetch;
    timing.typingMs = 0;
    timing.opsMs = 0;
    localStorage.clear();
    useMoneypenny.getState().reset();
    useMoneypenny.setState({ member: undefined, expanded: false });
    chats = [];
    let turn = 0;
    globalThis.fetch = ((url: string, init?: RequestInit) => {
      if (url === "/api/onboarding")
        return Promise.resolve(json({ ...onboarding(true), viewerId: "member-1" }));
      if (url === "/api/companion") return Promise.resolve(json({ enabled: true, disclosure: "" }));
      if (url === "/api/companion/chat") {
        chats.push(JSON.parse(String(init?.body)));
        turn++;
        return Promise.resolve(stream(`answer ${turn}`));
      }
      return Promise.resolve(new Response("{}", { status: 404 }));
    }) as typeof globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  const mount = (threaded: boolean) =>
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <div data-testid="row">
          <GuidanceSlot
            position={PUT}
            row={ROW}
            deskId="member-desk"
            canTrade={false}
            initialOpen
            {...(threaded
              ? {
                  ask: <PositionAsk position={PUT} accountId="member-desk" />,
                  thread: <RowThread thread={positionThread(PUT, "member-desk")} />,
                }
              : {})}
            onAside={() => undefined}
            onUndo={() => undefined}
          />
        </div>
        <MoneypennyDock />
      </QueryClientProvider>,
    );
  const askOnRow = async (text: string) => {
    fireEvent.change(screen.getByRole("textbox", { name: "Ask Moneypenny about this" }), {
      target: { value: text },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));
    await flush();
    await flush();
  };
  const row = () => screen.getByTestId("row");
  /** The dock's conversation pane, expanded by hand: asking on a row never changes its size. */
  const sheet = () => {
    act(() => useMoneypenny.setState({ expanded: true }));
    return screen.getByRole("region", { name: "Conversation with Moneypenny" });
  };

  it("asks on the position's thread, keyed by its row; the pane names the row with the way back", async () => {
    mount(true);
    await askOnRow("should I roll this?");
    // asking never changes the pane's size: her answer arrives in it, compact
    expect(useMoneypenny.getState().expanded).toBe(false);
    expect(useMoneypenny.getState().thread?.key).toBe(KEY);
    const lines = useMoneypenny.getState().messages.filter((m) => m.role !== "sys");
    expect(lines.map((m) => [m.role, m.thread])).toEqual([
      ["user", KEY],
      ["mp", KEY],
    ]);
    // the question names the holding and its exact contract, so her row link can match it
    expect(lines[0]?.text).toBe(
      "About my CRWV $80 PUT · 6 NOV 26 position (CRWV261106P00080000): should I roll this?",
    );
    expect(chats.at(-1)?.messages.map((m) => m.content)).toEqual([lines[0]?.text]);
    expect(within(sheet()).getByRole("link", { name: PUT.display })).toHaveAttribute(
      "href",
      `/app/accounts?account=member-desk#${KEY}`,
    );
    expect(within(sheet()).getByRole("button", { name: "Main conversation" })).toBeEnabled();
  });

  it("shows the thread on its row, collapsed, with a way to continue it in the chat", async () => {
    mount(true);
    await askOnRow("should I roll this?");
    act(() => useMoneypenny.getState().collapse());
    expect(within(row()).getByText(/Your thread with Moneypenny/)).toHaveTextContent(
      "Your thread with Moneypenny · 2 messages",
    );
    expect(row().querySelector("details.row-thread")).not.toHaveAttribute("open");
    act(() => useMoneypenny.getState().closeThread());
    fireEvent.click(within(row()).getByRole("button", { name: "Continue in the chat" }));
    expect(useMoneypenny.getState().thread?.key).toBe(KEY);
  });

  it("keeps the thread, by its row, in the member's own saved conversation", async () => {
    mount(true);
    await askOnRow("should I roll this?");
    const saved = JSON.parse(localStorage.getItem(keyFor("member-1")) ?? "{}");
    expect(saved.threads).toEqual([
      { key: KEY, title: PUT.display, path: `/accounts?account=member-desk#${KEY}` },
    ]);
  });

  it("offers no ask on an account her positions tool doesn't read", () => {
    mount(false);
    expect(screen.queryByRole("textbox", { name: "Ask Moneypenny about this" })).toBeNull();
  });

  it("threads only the member's own trading account, the one onboarding names", async () => {
    // The harness's connected member trades `human-joe`; a bot they own, or anyone else's, is not it.
    const Probe = ({ deskId }: { readonly deskId: string }) => (
      <p>{`${deskId}: ${useOwnTradingAccount(deskId) ? "threaded" : "not threaded"}`}</p>
    );
    render(
      <QueryClientProvider client={new QueryClient()}>
        <Probe deskId="human-joe" />
        <Probe deskId="sauron" />
      </QueryClientProvider>,
    );
    expect(await screen.findByText("human-joe: threaded")).toBeInTheDocument();
    expect(screen.getByText("sauron: not threaded")).toBeInTheDocument();
  });

  it("names a share by its symbol alone, even when its display differs", () => {
    const share = { ...PUT, symbol: "BRK.B", display: "BRK B", isOption: false };
    expect(positionQuestion(share, " how's it doing? ")).toBe(
      "About my BRK B position: how's it doing?",
    );
  });

  it("names a share by its symbol alone", () => {
    const share = { ...PUT, symbol: "NVDA", display: "NVDA", isOption: false };
    expect(positionQuestion(share, " how's it doing? ")).toBe(
      "About my NVDA position: how's it doing?",
    );
  });
});
