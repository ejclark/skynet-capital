import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import type { Heartbeat } from "../../src/live/heartbeat";
import { BotPlaybooksSection } from "../../src/shell/bot-playbooks";

/**
 * #5073 slice 3 — a playbook card opened in full (#5037 round 2's R2-open): the rule as a picture
 * with "you are here", what the bot holds in its ticker, and whose say-so it runs on. Sauron's
 * paper book from the round's study: CRWV 55 sh at $82.60, a sold CRWV $80 put to Nov 6.
 */

// No router here: a held position's card is a link to it on Trade.
rstest.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/app/trade">{children}</a>,
}));

const PUT = "CRWV261106P00080000";
const since = "2026-10-09T13:31:00Z";
const sauron: Heartbeat = {
  state: "beating",
  marketOpen: true,
  lastPassAt: "2026-10-09T19:00:00Z",
  sinceLastPassMs: 20_000,
  cadenceMs: 15_000,
  staleAfterMs: 120_000,
  playbooks: [
    {
      playbookId: "CRWV-WHEEL",
      mode: "aggressive",
      state: "no-window",
      since,
      sinceIsLowerBound: false,
    },
    { playbookId: "S1-NVDA", mode: "standard", state: "no-window", since, sinceIsLowerBound: true },
    {
      playbookId: "SAURON",
      mode: "aggressive",
      state: "tactical",
      since,
      sinceIsLowerBound: false,
    },
  ],
  rollCall: [
    {
      playbookId: "CRWV-WHEEL",
      status: "armed",
      mode: "aggressive",
      reason: "On and waiting for its own window to open.",
    },
    {
      playbookId: "S1-NVDA",
      status: "armed",
      mode: "standard",
      reason: "On and waiting for its own window to open.",
    },
    {
      playbookId: "SAURON",
      status: "armed",
      mode: "aggressive",
      reason:
        "On, reading live price and sentiment every pass — there is no date window to wait for.",
    },
  ],
};

const row = (symbol: string, quantity: string, over: Record<string, unknown> = {}) => ({
  symbol,
  display: symbol,
  detail: "",
  isOption: symbol.length > 6,
  quantity,
  costPerShare: "$90.09",
  price: "$82.60",
  costBasis: "$4,955",
  value: "$4,543",
  dayPl: "$12",
  dayPct: "0.3%",
  dayTone: "pos",
  totalPl: "-$412",
  totalPlRaw: -412,
  returnPct: "-8.3%",
  totalTone: "neg",
  weightPct: 1,
  ...over,
});

const desk = {
  generatedAt: "2026-10-09T19:00:00Z",
  desk: {
    id: "sauron",
    name: "Sauron",
    kind: "bot",
    tiles: {},
    considerations: [],
    positions: [
      row("NVDA", "130", { price: "$232.10" }),
      row("CRWV", "55"),
      row(PUT, "-1", {
        value: "-$550",
        totalPl: "-$295",
        returnPct: "-116%",
        breakeven: "$77.45",
        expiresInDays: 28,
      }),
    ],
  },
};

const pair = (id: string, over: Record<string, unknown>) => ({
  id,
  symbols: [id === "CRWV-WHEEL" ? "CRWV" : "NVDA"],
  stale: false,
  ...over,
});

const store = {
  cards: [{ id: "S1-NVDA", window: "20 to 6 sessions before the print" }, { id: "CRWV-WHEEL" }],
  strategies: [
    {
      strategy: "wheel",
      name: "the wheel",
      summary: "Sells one cash-secured put about a month out.",
      pairs: [
        pair("CRWV-WHEEL", {
          status: "conviction",
          statusLabel: "◆ conviction",
          call: "Runs as its owner's conviction against the study's stand-aside (#4642).",
          checkOn: "2027-01-29",
          studyHref: "/research/crwv-premium-fit",
          subscription: {
            mode: "aggressive",
            enabled: true,
            conviction: { reason: "The premium pays me to wait.", checkOn: "2027-01-29" },
          },
        }),
      ],
    },
    {
      strategy: "pre-print-run-up",
      name: "the pre-print run-up",
      summary: "Buys shares in the weeks before a confirmed earnings report.",
      pairs: [
        pair("S1-NVDA", {
          status: "researched",
          statusLabel: "✓ researched, weakened",
          call: "Long from 20 trading sessions before a confirmed print to 6 before.",
          shelfOn: "2027-03-31",
        }),
      ],
    },
    {
      strategy: "persona-rules",
      name: "Sauron's own rules",
      summary: "Sauron's own rules over the bots' ten names.",
      pairs: [
        {
          id: "SAURON",
          symbols: ["AAPL", "NVDA", "CRWV"],
          stale: false,
          status: "not-studied",
          statusLabel: "? not studied",
          call: "Sauron's own rules, unchanged.",
        },
      ],
    },
  ],
  capitalUnderManagement: 0,
  canManage: true,
  delegation: { locked: false, unlocksAfter: "", unlocksAfterName: "", note: "" },
};

const optionBook = {
  available: true,
  asOf: "2026-10-09T19:00:00Z",
  rows: [
    {
      symbol: PUT,
      display: "CRWV $80 put",
      underlying: "CRWV",
      type: "put",
      strike: 80,
      expiration: "2026-11-06",
      daysToExpiry: 28,
      contracts: -1,
      spot: 82.6,
    },
  ],
  book: { delta: 0, gamma: 0, theta: 0, vega: 0, covered: 1, total: 1, uncovered: [] },
  representative: true,
};

const realFetch = globalThis.fetch;
const asked: string[] = [];
beforeEach(() => {
  asked.length = 0;
  globalThis.fetch = ((url: string) => {
    const path = String(url);
    asked.push(path);
    const body = path.includes("/heartbeat")
      ? { available: true, heartbeat: sauron }
      : path.includes("/api/playbook-store")
        ? store
        : path.includes("/option-positions")
          ? optionBook
          : path.includes("/probes")
            ? { available: false }
            : path.startsWith("/api/desk/")
              ? desk
              : {};
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

function withClient(node: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

const cardOf = (name: string) => {
  const card = screen.getByText(name, { selector: ".pbb-name" }).closest("li");
  if (!card) throw new Error(`no card for ${name}`);
  return card as HTMLElement;
};

/** Open a card the way a tap does: the summary toggles `<details>`, which fires `toggle`. */
function open(card: HTMLElement, name: string) {
  fireEvent.click(within(card).getByText(name));
  const details = card.querySelector("details");
  if (details && !details.open) details.open = true;
  details?.dispatchEvent(new Event("toggle"));
}

describe("a playbook card opened in full (#5073 slice 3)", () => {
  it("reads the Store and the book only once a card is opened", async () => {
    render(withClient(<BotPlaybooksSection deskId="sauron" botName="Sauron" />));
    await screen.findByText("CRWV-WHEEL", { selector: ".pbb-name" });
    expect(asked.some((p) => p.includes("/api/playbook-store"))).toBe(false);
    expect(asked.some((p) => p === "/api/desk/sauron")).toBe(false);
  });

  it("draws the wheel as a loop, rings step 1, and lays the price on the strike", async () => {
    render(withClient(<BotPlaybooksSection deskId="sauron" botName="Sauron" />));
    await screen.findByText("CRWV-WHEEL", { selector: ".pbb-name" });
    const card = cardOf("CRWV-WHEEL");
    open(card, "CRWV-WHEEL");
    const loop = await within(card).findByRole("img", { name: /^The wheel on CRWV/ });
    expect(loop.getAttribute("aria-label")).toMatch(/It is on step 1\.$/);
    expect(loop.querySelector("[data-here]")?.textContent).toContain("● you are here");
    const strip = await within(card).findByRole("img", { name: /^CRWV at \$82\.60/ });
    expect(strip.getAttribute("aria-label")).toBe(
      "CRWV at $82.60: the sold put keeps its premium above $80 and loses below $77.45.",
    );
    expect(card.querySelector(".pbr-caption")?.textContent).toMatch(
      /^1 put sold, 28 days left\. Above \$80 at expiry, it keeps the premium/,
    );
  });

  it("shows what the bot holds in the ticker, in the row spec, and nothing on another", async () => {
    render(withClient(<BotPlaybooksSection deskId="sauron" botName="Sauron" />));
    await screen.findByText("CRWV-WHEEL", { selector: ".pbb-name" });
    const card = cardOf("CRWV-WHEEL");
    open(card, "CRWV-WHEEL");
    const holds = await within(card).findByRole("region", { name: "This bot's CRWV" });
    const links = await within(holds).findAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]?.textContent).toMatch(/^CRWV/);
    expect(links[1]?.textContent).toContain("SHORT PUT");
    expect(holds.textContent).not.toContain("NVDA");
  });

  it("says whose say-so it runs on: the owner's conviction, their words, its check day", async () => {
    render(withClient(<BotPlaybooksSection deskId="sauron" botName="Sauron" />));
    await screen.findByText("CRWV-WHEEL", { selector: ".pbb-name" });
    const card = cardOf("CRWV-WHEEL");
    open(card, "CRWV-WHEEL");
    const say = await within(card).findByRole("region", { name: "Whose say-so it runs on" });
    expect(say.textContent).toContain("◆ Your conviction, run in aggressive mode");
    expect(say.textContent).toContain("“The premium pays me to wait.”");
    expect(say.textContent).toMatch(/Checked again Jan 29, 2027/);
    // The Store's call, minus the issue number written for the code's readers.
    expect(say.textContent).toContain("against the study's stand-aside.");
    expect(say.textContent).not.toContain("(#4642)");
    expect(within(say).getByRole("link", { name: "Read the study ›" })).toHaveAttribute(
      "href",
      "/research/crwv-premium-fit",
    );
  });

  it("lays a pre-print window on the calendar with the print and today", async () => {
    render(withClient(<BotPlaybooksSection deskId="sauron" botName="Sauron" />));
    await screen.findByText("S1-NVDA", { selector: ".pbb-name" });
    const card = cardOf("S1-NVDA");
    open(card, "S1-NVDA");
    const timeline = await within(card).findByRole("img", { name: /^NVDA's window: holds from / });
    expect(timeline.querySelector(".pbr-print")?.textContent).toBe("◆");
    expect(timeline.textContent).toContain("● today");
    expect(
      within(card).getByRole("region", { name: "Whose say-so it runs on" }).textContent,
    ).toContain("✓ Researched, weakened");
  });

  it("says a basket's rule in its one sentence, with no ticker to hold", async () => {
    render(withClient(<BotPlaybooksSection deskId="sauron" botName="Sauron" />));
    await screen.findByText("SAURON", { selector: ".pbb-name" });
    const card = cardOf("SAURON");
    open(card, "SAURON");
    const rule = await within(card).findByRole("region", { name: "The rule" });
    expect(rule.textContent).toContain("Sauron's own rules over the bots' ten names.");
    expect(within(card).queryByRole("region", { name: /^This bot's / })).toBeNull();
  });
});
