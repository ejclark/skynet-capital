import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import type { DeskHealth, HealthFinding, PlayHealth } from "../../src/live/book-health";
import { BalanceSection } from "../../src/shell/balance-section";

/**
 * #5493 slice 3 — the Balance section. WHEN the owner opens it, the section SHALL list every
 * finding gate first, each with its level as a glyph AND a word, the server's sentence, the measure
 * against its line and — when a play is behind it — a link to that play's card; then the plays,
 * most idle first; then the closed trades (the scoreboard moved off R&D → Playbooks, #5451 P3).
 * A book the server could not read says nothing about its balance, and one with nothing found says
 * so in words.
 */

rstest.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    search,
    className,
    ...rest
  }: {
    children: ReactNode;
    to: string;
    search?: Record<string, string>;
    className?: string;
    "aria-label"?: string;
  }) => {
    const query = new URLSearchParams(search ?? {}).toString();
    return (
      <a
        className={className}
        href={`${to}${query ? `?${query}` : ""}`}
        aria-label={rest["aria-label"]}
      >
        {children}
      </a>
    );
  },
}));

const finding = (
  over: Partial<HealthFinding> & Pick<HealthFinding, "detector">,
): HealthFinding => ({
  level: "signal",
  reading: 0.5,
  threshold: 0.25,
  words: "A sentence.",
  ...over,
});

const play = (over: Partial<PlayHealth> & Pick<PlayHealth, "playbookId">): PlayHealth => ({
  mode: "standard",
  enabled: true,
  openPositions: 0,
  refusalsLastSession: {},
  ...over,
});

const CONCENTRATED = finding({
  detector: "concentrated",
  level: "gate",
  symbol: "CRWV",
  reading: 0.46,
  threshold: 0.4,
  words: "CRWV is 46% of this account's equity — over the 40% line.",
});
const LOOPING = finding({
  detector: "looping",
  playbookId: "CRWV-LONG-CALL",
  reading: 6,
  threshold: 6,
  loop: "options-level",
  words: "The long call asked to trade on 6 checks and was refused every time.",
});
const IDLE = finding({
  detector: "idle",
  reading: 0.61,
  threshold: 0.6,
  words: "61% of this account's equity is cash nothing has claimed.",
});

const PLAYS: PlayHealth[] = [
  play({
    playbookId: "CRWV-WHEEL",
    allocation: 50_000,
    committed: 45_000,
    idle: 5_000,
    openPositions: 2,
    oldestOpenSessions: 3,
    lastEntryAt: "2026-10-14T15:00:00.000Z",
  }),
  play({
    playbookId: "CRWV-LONG-CALL",
    mode: "aggressive",
    allocation: 20_000,
    committed: 0,
    idle: 20_000,
    refusalsLastSession: { "options-level": 6 },
  }),
  play({ playbookId: "NBIS-WHEEL", enabled: false }),
];

let health: DeskHealth | undefined;
let performance: unknown;
const realFetch = globalThis.fetch;
const urls: string[] = [];

beforeEach(() => {
  urls.length = 0;
  performance = {
    house: [],
    mine: [
      {
        playbookId: "CRWV-WHEEL",
        trades: 4,
        wins: 3,
        losses: 1,
        winRate: 75,
        netRealized: 120,
      },
    ],
    accounts: ["bot-sauron"],
    byInitiator: {
      house: {
        rows: [
          { initiator: "playbook", trades: 2, wins: 1, losses: 1, winRate: 50, netRealized: 30 },
          { initiator: "forced", trades: 11, wins: 5, losses: 6, winRate: 45, netRealized: -84.5 },
          { initiator: "persona", trades: 0, wins: 0, losses: 0, winRate: null, netRealized: 0 },
        ],
        untraced: 0,
      },
      mine: {
        rows: [
          { initiator: "playbook", trades: 4, wins: 3, losses: 1, winRate: 75, netRealized: 120 },
          { initiator: "forced", trades: 0, wins: 0, losses: 0, winRate: null, netRealized: 0 },
          { initiator: "persona", trades: 0, wins: 0, losses: 0, winRate: null, netRealized: 0 },
        ],
        untraced: 0,
      },
    },
  };
  globalThis.fetch = ((input: RequestInfo | URL) => {
    const url = String(input);
    urls.push(url);
    const body = url.startsWith("/api/outpost/performance")
      ? performance
      : {
          generatedAt: "2026-10-16T15:00:00Z",
          desk: {
            id: "bot-sauron",
            name: "Sauron",
            kind: "bot",
            positions: [],
            considerations: [],
          },
          ...(health ? { health } : {}),
        };
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <BalanceSection deskId="bot-sauron" accountName="Sauron" />
    </QueryClientProvider>,
  );
}

const owner = (findings: HealthFinding[], plays: PlayHealth[] = PLAYS): DeskHealth => ({
  available: true,
  counts: {
    gate: findings.filter((f) => f.level === "gate").length,
    signal: findings.filter((f) => f.level === "signal").length,
    byDetector: {},
  },
  findings,
  plays,
});

describe("BalanceSection findings", () => {
  it("lists each finding with its level as a glyph and a word, gate first", async () => {
    health = owner([CONCENTRATED, LOOPING, IDLE]);
    mount();
    await screen.findByText(/CRWV is 46% of this account's equity/);
    const rows = [...document.querySelectorAll(".bal-finding")];
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.getAttribute("data-level"))).toEqual(["gate", "signal", "signal"]);
    const head = rows[0]?.querySelector(".bal-finding-head");
    expect(head?.textContent).toBe("■ GateConcentrated");
    expect(rows[1]?.querySelector(".bal-finding-head")?.textContent).toBe("◆ SignalLooping");
  });

  it("shows how long each finding has stood and which way it is going, in a glyph and words", async () => {
    const stood = (
      f: HealthFinding,
      trend: "worse" | "better" | "steady" | "new",
      days: number,
    ) => ({
      ...f,
      standing: { since: "2026-10-12T12:00:00.000Z", standingMs: days * 86_400_000, trend },
    });
    health = owner([
      stood(CONCENTRATED, "worse", 3),
      stood(LOOPING, "better", 5),
      stood(IDLE, "new", 0),
    ]);
    mount();
    await screen.findByText(/CRWV is 46% of this account's equity/);
    const trends = [...document.querySelectorAll(".bal-trend")];
    expect(trends.map((t) => t.textContent)).toEqual([
      "▲ Worse · standing 3 days",
      "▼ Easing · standing 5 days",
      "✦ New · first seen just now",
    ]);
    expect(trends[0]).toHaveAccessibleName("Worse, standing 3 days");
  });

  it("draws no trend for a finding the server kept no history of", async () => {
    health = owner([CONCENTRATED]);
    mount();
    await screen.findByText(/CRWV is 46% of this account's equity/);
    expect(document.querySelector(".bal-trend")).toBeNull();
  });

  it("says the server's sentence and the measure against its line", async () => {
    health = owner([CONCENTRATED, LOOPING, IDLE]);
    mount();
    await screen.findByText(/CRWV is 46% of this account's equity/);
    expect(screen.getByText("46% · over the 40% line")).toBeInTheDocument();
    expect(screen.getByText("refused on all 6 checks")).toBeInTheDocument();
    expect(screen.getByText("61% · over the 60% line")).toBeInTheDocument();
  });

  it("links a finding to the play behind it, on its mode, and links nothing for a book-level one", async () => {
    health = owner([CONCENTRATED, LOOPING]);
    mount();
    const loopRow = (await screen.findByText(/long call asked to trade/)).closest("li");
    const link = within(loopRow as HTMLElement).getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "/accounts?account=bot-sauron&section=playbooks&card=CRWV-LONG-CALL&mode=aggressive",
    );
    expect(link).toHaveAccessibleName("The long call on CRWV — open its card on Playbooks");
    const concentrated = screen.getByText(/CRWV is 46%/).closest("li");
    expect(within(concentrated as HTMLElement).queryByRole("link")).toBeNull();
  });

  it("counts the findings in the heading, as the head line does", async () => {
    health = owner([CONCENTRATED, LOOPING, IDLE]);
    mount();
    const count = await screen.findByTitle("Book health: 1 gate, 2 signals");
    expect(count.textContent).toBe("■ 1 gate · ◆ 2 signals");
  });

  it("says what a level means and that nothing is blocked yet — a gate is not a stop today", async () => {
    health = owner([CONCENTRATED]);
    mount();
    expect(
      await screen.findByText(/Gates are the stronger level; nothing is blocked yet/),
    ).toBeInTheDocument();
  });

  it("says Balanced in words when nothing is found, and draws no list", async () => {
    health = owner([]);
    mount();
    const clear = await screen.findByText("Balanced");
    expect(clear.closest(".bal-clear")?.textContent).toBe(
      "● Balanced — nothing found on this book.",
    );
    expect(document.querySelector(".bal-findings")).toBeNull();
    expect(screen.queryByText(/nothing is blocked yet/)).toBeNull();
  });
});

describe("BalanceSection plays", () => {
  it("draws one row per play, the most idle budget first, and a play with no budget last", async () => {
    health = owner([]);
    mount();
    await screen.findByText("Balanced");
    const names = [...document.querySelectorAll(".bal-play .bal-play-link")].map(
      (a) => a.textContent,
    );
    expect(names).toEqual(["The long call on CRWV ›", "The wheel on CRWV ›", "NBIS-WHEEL ›"]);
  });

  it("says what each play has committed and left idle, with the bar's share in words", async () => {
    health = owner([]);
    mount();
    const wheel = (await screen.findAllByText(/committed of/))[1]?.closest("li") as HTMLElement;
    expect(within(wheel).getByText("$45,000")).toBeInTheDocument();
    expect(wheel.querySelector(".bal-budget-words")?.textContent).toBe(
      "$45,000 committed of $50,000 · $5,000 idle (10%)",
    );
    expect(within(wheel).getByRole("img")).toHaveAccessibleName("90% of the budget committed");
    expect(within(wheel).getByText("On · standard")).toBeInTheDocument();
  });

  it("says uncapped for a play with no budget, never a zero bar, and Paused for a play that is off", async () => {
    health = owner([]);
    mount();
    const nbis = (await screen.findByText("Paused · standard")).closest("li") as HTMLElement;
    expect(within(nbis).getByText("No budget set — uncapped.")).toBeInTheDocument();
    expect(nbis.querySelector(".bal-meter")).toBeNull();
    expect(nbis).toHaveAttribute("data-on", "false");
  });

  it("prints a dash, never a zero, for a figure the server could not derive", async () => {
    health = owner([]);
    mount();
    const nbis = (await screen.findByText("Paused · standard")).closest("li") as HTMLElement;
    const cell = (label: string) => within(nbis).getByText(label).nextElementSibling?.textContent;
    expect(cell("Oldest open")).toBe("—");
    expect(cell("Last entry")).toBe("—");
  });

  it("flags a play's findings on its row, gate before signal, in words as well as a glyph", async () => {
    health = owner([CONCENTRATED, LOOPING]);
    mount();
    await screen.findByText(/long call asked to trade/);
    const call = document.querySelectorAll(".bal-play")[0] as HTMLElement;
    expect(call.querySelector(".bal-play-flag")?.textContent).toBe("◆ 1 signal");
    expect(document.querySelectorAll(".bal-play")[1]?.querySelector(".bal-play-flag")).toBeNull();
  });

  it("brings the closed trades per play from this account's own numbers", async () => {
    health = owner([]);
    mount();
    const wheel = (await screen.findAllByText(/committed of/))[1]?.closest("li") as HTMLElement;
    await within(wheel).findByText("4 · +$120.00");
    expect(within(wheel).getByText("75%")).toBeInTheDocument();
    const call = document.querySelectorAll(".bal-play")[0] as HTMLElement;
    expect(within(call).getByText("none yet")).toBeInTheDocument();
  });

  it("draws no plays block for an account that runs none (a human's book)", async () => {
    health = owner([IDLE], []);
    mount();
    await screen.findByText(/cash nothing has claimed/);
    expect(document.querySelector(".bal-plays")).toBeNull();
    expect(screen.queryByText(/most idle first/)).toBeNull();
  });
});

describe("BalanceSection closed trades — the scoreboard's one home", () => {
  it("draws who started the closed trades: this account's, then every bot's, kept apart", async () => {
    health = owner([]);
    mount();
    const mine = await screen.findByRole("region", { name: "Who started Sauron's closed trades" });
    const house = screen.getByRole("region", {
      name: "Who started the bots' closed trades — every bot",
    });
    expect(within(mine).getByText("4 closed trades")).toBeInTheDocument();
    expect(within(house).getByText("11 closed trades")).toBeInTheDocument();
    expect(within(mine).queryByText("11 closed trades")).toBeNull();
  });

  it("asks for this account's numbers only, the cache key the Playbooks cards share", async () => {
    health = owner([]);
    mount();
    await screen.findByText("Balanced");
    expect(urls).toContain("/api/outpost/performance?accounts=bot-sauron");
  });

  it("draws no scoreboard where the server cannot trace trades to decisions", async () => {
    health = owner([]);
    performance = { house: [], mine: null, accounts: [], byInitiator: null };
    mount();
    await screen.findByText("Balanced");
    expect(screen.queryByText("Closed trades")).toBeNull();
  });
});

describe("BalanceSection when the book can't speak", () => {
  it("says nothing about balance — not even that it is balanced — for a book the server could not read", async () => {
    health = { available: false };
    mount();
    expect(await screen.findByText(/can't be read right now/)).toBeInTheDocument();
    expect(screen.queryByText("Balanced")).toBeNull();
  });

  it("says the same for an older server that serves no health field", async () => {
    health = undefined;
    mount();
    expect(await screen.findByText(/can't be read right now/)).toBeInTheDocument();
  });

  it("explains counts-only rather than drawing an empty list that reads as all clear", async () => {
    health = {
      available: true,
      counts: { gate: 0, signal: 2, byDetector: { idle: 1, looping: 1 } },
    };
    mount();
    expect(await screen.findByText(/only the counts are shared/)).toBeInTheDocument();
    expect(screen.queryByText("Balanced")).toBeNull();
    expect(document.querySelector(".bal-findings")).toBeNull();
  });

  it("says the book is unreachable when the desk read fails", async () => {
    globalThis.fetch = (() => Promise.resolve(new Response("{}", { status: 500 }))) as typeof fetch;
    mount();
    expect(await screen.findByText("Sauron's book is unreachable right now.")).toBeInTheDocument();
  });
});
