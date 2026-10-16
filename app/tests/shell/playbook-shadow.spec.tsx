import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ShadowReportEntry } from "../../../src/autonomous/authored-shadow-wire";
import { emptyForm } from "../../../src/playbooks/authored-play-form";
import type { AuthoredPlayView } from "../../src/live/authored-plays";
import type { OwnedAccount } from "../../src/live/settings";
import { YourPlaybooks } from "../../src/shell/playbook-drafts";

/**
 * A DRAFT'S SHADOW TEST ON ITS ROW (#5457 slice 2).
 *
 * WHEN a draft is not in its test, its row SHALL offer to start one and say nothing is sent. WHEN it
 * is, the row SHALL show its status, how many sessions were watched, how many would-be trades there
 * are and the last few, in words — and SHALL say every time that nothing is sent. WHEN the bots have
 * not reported on this test yet, or cannot run it, the row SHALL say so rather than show zeros.
 */

const SAURON: OwnedAccount = {
  id: "sauron",
  name: "Sauron",
  kind: "bot",
  hostConfigured: true,
  profile: null,
};

const SINCE = "2026-10-17T12:00:00.000Z";

const base = (over: Partial<AuthoredPlayView> = {}): AuthoredPlayView => ({
  id: "U-sauron-my-nvda-run-up",
  name: "My NVDA run-up",
  status: "draft",
  runsOn: "sauron",
  symbol: "NVDA",
  settings: "buy 20 days before the report, sell 5 before",
  thesis: "Long the drift into the print, out before the dead final week.",
  form: { ...emptyForm("sauron"), name: "My NVDA run-up", symbol: "NVDA" },
  updatedAt: "2026-10-16T12:00:00.000Z",
  ...over,
});

const entry = (over: Partial<ShadowReportEntry> = {}): ShadowReportEntry => ({
  id: "U-sauron-my-nvda-run-up",
  since: SINCE,
  state: "watching",
  window: "long",
  sessions: 3,
  tradeCount: 2,
  roundTrips: 1,
  realized: 188.1,
  refused: 0,
  recent: [
    {
      at: Date.parse("2026-10-23T14:35:00Z"),
      side: "sell",
      symbol: "NVDA",
      quantity: 19,
      price: 109.95,
      bid: 109.95,
      ask: 110.05,
      realized: 188.1,
    },
    {
      at: Date.parse("2026-10-20T14:30:00Z"),
      side: "buy",
      symbol: "NVDA",
      quantity: 19,
      price: 100.05,
      bid: 99.95,
      ask: 100.05,
    },
  ],
  ...over,
});

const testing = (report?: ShadowReportEntry, over: Partial<AuthoredPlayView> = {}) =>
  base({ status: "shadow", shadow: { since: SINCE, ...(report ? { report } : {}) }, ...over });

const posts: { url: string; body: Record<string, unknown> }[] = [];
let listed: AuthoredPlayView[] = [];
let shadowReply: unknown;
const realFetch = globalThis.fetch;
beforeEach(() => {
  posts.length = 0;
  listed = [];
  shadowReply = { ok: true, play: testing() };
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    const json = (body: unknown) =>
      Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
    if (init?.method === "POST") {
      posts.push({ url: String(url), body: JSON.parse(String(init.body ?? "{}")) });
      return json(String(url).endsWith("/shadow") ? shadowReply : { ok: true });
    }
    return json({ plays: listed });
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <YourPlaybooks accounts={[SAURON]} />
    </QueryClientProvider>,
  );
}

describe("a draft offers its shadow test", () => {
  it("says what the test is and that nothing is sent, with one button to start it", async () => {
    listed = [base()];
    mount();
    expect(await screen.findByText(/Nothing is sent\./)).toBeInTheDocument();
    expect(screen.getByText(/Draft · doesn't trade/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start a shadow test" })).toBeEnabled();
  });

  it("starting sends the draft's id, once, and reads the list again", async () => {
    listed = [base()];
    mount();
    fireEvent.click(await screen.findByRole("button", { name: "Start a shadow test" }));
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0]).toEqual({
      url: "/api/authored-plays/shadow",
      body: { id: "U-sauron-my-nvda-run-up", on: true },
    });
  });

  it("a refusal is said in a line under the button", async () => {
    listed = [base()];
    shadowReply = { ok: false, error: "A playbook can only run on one of your own bots." };
    mount();
    fireEvent.click(await screen.findByRole("button", { name: "Start a shadow test" }));
    expect(
      await screen.findByText("A playbook can only run on one of your own bots."),
    ).toBeInTheDocument();
  });
});

describe("a play in its test shows how it is going", () => {
  it("shows the standing, the count and the last would-be trades in words", async () => {
    listed = [testing(entry())];
    mount();
    expect(await screen.findByText(/Shadow test · doesn't trade/)).toBeInTheDocument();
    expect(screen.getByText("3 sessions")).toBeInTheDocument();
    expect(screen.getByText("2 would-be trades")).toBeInTheDocument();
    expect(screen.getByText(/1 round trip/)).toBeInTheDocument();
    expect(screen.getAllByText("$188.10")).toHaveLength(2); // the summary and the sell row
    expect(screen.getByText(/Its window is open\./)).toBeInTheDocument();

    const trades = within(screen.getByRole("list", { name: "Last would-be trades" }));
    const rows = trades.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Sell 19 NVDA at $109.95");
    expect(rows[0]).toHaveTextContent("won $188.10");
    expect(rows[1]).toHaveTextContent("Buy 19 NVDA at $100.05");
  });

  it("says every time that nothing is sent, and that a change ends the test", async () => {
    listed = [testing(entry())];
    mount();
    expect(
      await screen.findByText(/Nothing is sent — no order, and Sauron's account doesn't change\./),
    ).toBeInTheDocument();
    expect(screen.getByText(/Saving a change to this play ends the test/)).toBeInTheDocument();
  });

  it("says a loss as a loss, and what it would hold now", async () => {
    listed = [
      testing(
        entry({
          realized: -42,
          holding: { quantity: 19, avgPrice: 100.05 },
          recent: [],
        }),
      ),
    ];
    mount();
    expect(await screen.findByText(/lost/)).toBeInTheDocument();
    expect(screen.getByText("$42.00")).toBeInTheDocument();
    expect(screen.getByText(/Would hold/)).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Last would-be trades" })).toBeNull();
  });

  it("says singular counts as singular", async () => {
    listed = [
      testing(entry({ sessions: 1, tradeCount: 1, roundTrips: 0, realized: 0, recent: [] })),
    ];
    mount();
    expect(await screen.findByText("1 session")).toBeInTheDocument();
    expect(screen.getByText("1 would-be trade")).toBeInTheDocument();
  });

  it("says what the limits would have refused, in the server's words", async () => {
    listed = [
      {
        ...testing(entry({ refused: 2, tradeCount: 0, roundTrips: 0, recent: [] })),
        shadow: {
          since: SINCE,
          report: entry({ refused: 2, tradeCount: 0, roundTrips: 0, recent: [] }),
          refusalSentence: "2026-10-20: a buy of NVDA was refused — insufficient cash.",
        },
      },
    ];
    mount();
    expect(
      await screen.findByText(
        /The limits would have refused it 2 times — 2026-10-20: a buy of NVDA/,
      ),
    ).toBeInTheDocument();
  });

  it("explains an empty window by the kind of play it is", async () => {
    listed = [testing(entry({ window: "no-window", tradeCount: 0, roundTrips: 0, recent: [] }))];
    mount();
    expect(await screen.findByText(/no confirmed report date is on file/)).toBeInTheDocument();

    listed = [
      testing(entry({ window: "no-window", tradeCount: 0, roundTrips: 0, recent: [] }), {
        form: { ...emptyForm("sauron", "event-window"), name: "News", symbol: "NVDA" },
      }),
    ];
    document.body.innerHTML = "";
    mount();
    expect(await screen.findByText(/no news about the stock has opened one/)).toBeInTheDocument();
  });

  it("shows the server's caveat when the test cannot show much", async () => {
    listed = [
      {
        ...testing(entry({ tradeCount: 0, roundTrips: 0, recent: [] })),
        shadow: {
          since: SINCE,
          report: entry({ tradeCount: 0, roundTrips: 0, recent: [] }),
          caveat: "No news feed reaches the bots yet.",
        },
      },
    ];
    mount();
    expect(await screen.findByText("No news feed reaches the bots yet.")).toBeInTheDocument();
  });

  it("stopping sends the id with the test off", async () => {
    listed = [testing(entry())];
    mount();
    fireEvent.click(await screen.findByRole("button", { name: "Stop the test" }));
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0]?.body).toEqual({ id: "U-sauron-my-nvda-run-up", on: false });
  });
});

describe("it does not show zeros it does not have", () => {
  it("before the bots have reported on this test, it says it is waiting for the first pass", async () => {
    listed = [testing()];
    mount();
    expect(
      await screen.findByText("Starting — waiting for Sauron's next pass."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/would-be trade/)).toBeNull();
  });

  it("when the bot has no live book yet, it says it is waiting for the bot", async () => {
    listed = [testing(entry({ state: "waiting", sessions: 0, tradeCount: 0, recent: [] }))];
    mount();
    expect(await screen.findByText("Waiting for Sauron to come online.")).toBeInTheDocument();
  });

  it("when the play is out of bounds in this build, it says it is not being tested", async () => {
    listed = [testing(entry({ state: "invalid" }))];
    mount();
    expect(await screen.findByText(/isn't being tested/)).toBeInTheDocument();
  });
});
