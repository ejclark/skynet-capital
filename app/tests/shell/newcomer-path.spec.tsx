import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import type { JoinIndex } from "../../src/live/join";
import { readPick, sharesFor } from "../../src/live/practice";
import { CONNECT_REASON, NewcomerPath } from "../../src/shell/newcomer-path";

/**
 * The newcomer's three cards (#8250). BDD, as everywhere: tap what a newcomer taps, read what
 * they read. Every digit asserted here comes from the puzzle response the fake server returns.
 */

const puzzle = {
  question: "Which of these moved most after its last earnings report?",
  names: [
    {
      symbol: "AMZN",
      reportDate: "2026-10-29",
      timing: "after-close",
      beforeDate: "2026-10-29",
      beforeClose: 200,
      afterDate: "2026-10-30",
      afterClose: 218,
      movePct: 9,
      lastClose: 220.5,
      lastCloseDate: "2026-11-06",
    },
    {
      symbol: "META",
      reportDate: "2026-10-21",
      timing: "after-close",
      beforeDate: "2026-10-21",
      beforeClose: 600,
      afterDate: "2026-10-22",
      afterClose: 576,
      movePct: -4,
      lastClose: 590,
      lastCloseDate: "2026-11-06",
    },
    {
      symbol: "MSFT",
      reportDate: "2026-10-28",
      timing: "after-close",
      beforeDate: "2026-10-28",
      beforeClose: 400,
      afterDate: "2026-10-29",
      afterClose: 406,
      movePct: 1.5,
      lastClose: 410.25,
      lastCloseDate: "2026-11-06",
    },
  ],
  answer: "AMZN",
  source: "Offline fixture bars, not market data",
  readAt: "2026-11-09T14:00:00.000Z",
};

const join = (connect: boolean): JoinIndex => ({
  wired: true,
  connect,
  canAddBots: false,
  classes: [],
  timezones: [{ value: "America/New_York", label: "Eastern" }],
});

const realFetch = globalThis.fetch;
const posts: { url: string; body: unknown }[] = [];

function serve(routes: Record<string, unknown>): void {
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    if (init?.method === "POST") posts.push({ url, body: JSON.parse(String(init.body)) });
    const key = Object.keys(routes).find((k) => url.startsWith(k));
    return Promise.resolve(
      new Response(JSON.stringify(key ? routes[key] : {}), {
        status: key ? 200 : 404,
        headers: { "content-type": "application/json" },
      }),
    );
  }) as typeof fetch;
}

function wrap(ui: ReactElement): ReactElement {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

describe("NewcomerPath", () => {
  beforeEach(() => {
    localStorage.clear();
    posts.length = 0;
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("leads with the puzzle, and a tap answers at once with each move, its dates and source", async () => {
    serve({ "/api/practice/puzzle": puzzle, "/api/connect/alpaca": { result: null } });
    render(wrap(<NewcomerPath join={join(true)} onJoined={() => undefined} />));
    await screen.findByRole("heading", { name: puzzle.question });
    fireEvent.click(screen.getByRole("button", { name: /META/ }));
    expect(screen.getByText("Moved most")).toBeInTheDocument();
    expect(screen.getByText("Your answer")).toBeInTheDocument();
    expect(screen.getByText(/Not this time: AMZN moved most/)).toBeInTheDocument();
    // Up and down carry a word, not hue alone.
    expect(screen.getByText(/up \+9\.0%/)).toBeInTheDocument();
    expect(screen.getByText(/down −4\.0%/)).toBeInTheDocument();
    expect(
      screen.getByText(/\$200\.00 on 2026-10-29 → \$218\.00 on 2026-10-30/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Offline fixture bars, not market data · read/)).toBeInTheDocument();
  });

  it("a practice pick shows PRACTICE PICK, whole shares at the quoted close, and stays in the browser", async () => {
    serve({ "/api/practice/puzzle": puzzle, "/api/connect/alpaca": { result: null } });
    render(wrap(<NewcomerPath join={join(true)} onJoined={() => undefined} />));
    fireEvent.click(await screen.findByRole("button", { name: /AMZN/ }));
    expect(screen.getByText("PRACTICE PICK")).toBeInTheDocument();
    expect(screen.getByText("not saved to an account yet")).toBeInTheDocument();
    expect(screen.getByText(/AMZN last close \$220\.50 on 2026-11-06/)).toBeInTheDocument();
    const shares = sharesFor(0.005, 220.5);
    fireEvent.click(screen.getByRole("button", { name: `${shares} sh ~0.5%` }));
    expect(readPick()).toMatchObject({ symbol: "AMZN", shares, price: 220.5 });
    expect(posts).toEqual([]);
  });

  it("with Connect on: the reason line, then one button that starts the paper-only connect", async () => {
    serve({
      "/api/practice/puzzle": puzzle,
      "/api/connect/alpaca": {
        result: null,
        ok: true,
        authorizeUrl: "https://app.alpaca.markets/oauth/authorize?env=paper",
      },
    });
    const assign = rs.fn();
    const original = window.location;
    Object.defineProperty(window, "location", {
      value: { ...original, assign },
      configurable: true,
    });
    render(wrap(<NewcomerPath join={join(true)} onJoined={() => undefined} />));
    expect(screen.getByText(CONNECT_REASON)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/^Display name/), { target: { value: "Pat" } });
    fireEvent.click(screen.getByRole("button", { name: "Connect with Alpaca" }));
    await waitFor(() => expect(assign).toHaveBeenCalled());
    expect(String(assign.mock.calls[0]?.[0])).toContain("env=paper");
    expect(posts).toEqual([{ url: "/api/connect/alpaca", body: { displayName: "Pat" } }]);
    Object.defineProperty(window, "location", { value: original, configurable: true });
  });

  it("with Connect off: today's key-paste guide, unchanged", () => {
    serve({ "/api/practice/puzzle": puzzle });
    render(wrap(<NewcomerPath join={join(false)} onJoined={() => undefined} />));
    expect(screen.queryByRole("button", { name: "Connect with Alpaca" })).not.toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Five steps to connect" })).toBeInTheDocument();
  });

  it("says why when the last connect came back refused", async () => {
    serve({
      "/api/practice/puzzle": { note: "x" },
      "/api/connect/alpaca": {
        result: {
          ok: false,
          reason: "balance",
          found: 100000,
          error: "Your paper account reports $100,000.00.",
        },
      },
    });
    render(wrap(<NewcomerPath join={join(true)} onJoined={() => undefined} />));
    expect(await screen.findByRole("alert")).toHaveTextContent("$100,000.00");
  });
});

describe("sharesFor", () => {
  it("rounds a stake of the starting line to whole shares, at least one", () => {
    expect(sharesFor(0.001, 220.5)).toBe(5);
    expect(sharesFor(0.01, 410.25)).toBe(24);
    expect(sharesFor(0.001, 5000)).toBe(1);
    expect(sharesFor(0.01, 0)).toBe(0);
  });
});
