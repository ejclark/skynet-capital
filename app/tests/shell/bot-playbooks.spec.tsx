import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactElement } from "react";
import type { DeskHeartbeat, Heartbeat } from "../../src/live/heartbeat";
import { BotPlaybooksSection } from "../../src/shell/bot-playbooks";

let next: DeskHeartbeat = { available: false };
const realFetch = globalThis.fetch;
/** Every `/decisions` URL this section asked for — the folded log asks for none (#5073), and the
 *  trades filter is asserted from them (#3961). */
const askedForDecisions: string[] = [];
beforeEach(() => {
  askedForDecisions.length = 0;
  globalThis.fetch = ((url: string) => {
    const path = String(url);
    if (path.includes("/decisions")) askedForDecisions.push(path);
    const body = path.includes("/decisions")
      ? { available: true, kind: "bot", cycles: [] }
      : path.includes("/probes")
        ? { available: false }
        : next;
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
  window.location.hash = "";
});

function withClient(node: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

const since = "2026-10-09T13:31:00Z";
/** Sauron, #5037 round 2's world, in the server's own words: HC-SAURON is "can't fire" on the
 *  roll call and "trading on live signals" on the verdict table — the contradiction this ends. */
const sauron: Heartbeat = {
  state: "beating",
  marketOpen: true,
  lastPassAt: "2026-10-09T19:00:00Z",
  sinceLastPassMs: 20_000,
  cadenceMs: 15_000,
  staleAfterMs: 120_000,
  playbooks: [
    {
      playbookId: "SAURON",
      mode: "aggressive",
      state: "tactical",
      since,
      sinceIsLowerBound: false,
    },
    {
      playbookId: "HC-SAURON",
      mode: "standard",
      state: "tactical",
      since,
      sinceIsLowerBound: false,
    },
    { playbookId: "S1-NVDA", mode: "standard", state: "no-window", since, sinceIsLowerBound: true },
  ],
  rollCall: [
    {
      playbookId: "S1-NVDA",
      status: "armed",
      mode: "standard",
      reason:
        "On, but the next print date for NVDA (2026-11-18) is an estimate — only a confirmed date opens a position.",
    },
    {
      playbookId: "TACO-DJT",
      status: "blocked",
      reason: "No news feed is wired to it yet, so its trigger never arrives.",
    },
    {
      playbookId: "HC-SAURON",
      status: "blocked",
      mode: "standard",
      reason:
        "Arming it would run a second copy beside the Sauron persona, not replace it (#4227).",
    },
    {
      playbookId: "SAURON",
      status: "armed",
      mode: "aggressive",
      reason:
        "On, reading live price and sentiment every pass — there is no date window to wait for.",
    },
    {
      playbookId: "BETA-SCOUT",
      status: "off",
      reason: "Not switched on for this bot — no recorded pass ran it.",
    },
  ],
};
const desk: DeskHeartbeat = { available: true, heartbeat: sauron };

const cardOf = (name: string) => {
  const card = screen.getByText(name).closest("li");
  if (!card) throw new Error(`no card for ${name}`);
  return card;
};

describe("BotPlaybooksSection — the bot's checks on top, one card per playbook", () => {
  it("draws each playbook once, under the counted line", async () => {
    next = desk;
    render(withClient(<BotPlaybooksSection deskId="sauron" botName="Sauron" />));
    expect(await screen.findByText("HC-SAURON")).toBeInTheDocument();
    for (const id of ["SAURON", "HC-SAURON", "S1-NVDA", "TACO-DJT"]) {
      expect(screen.getAllByText(id)).toHaveLength(1);
    }
    const line = document.querySelector(".pbb-count")?.textContent ?? "";
    expect(line).toContain("● 1 trading on live signals");
    expect(line).toContain("◷ 1 waiting for a window");
    expect(line).toContain("⊘ 2 can't fire");
    // No second list: no verdict table, no roll call.
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByText("Which playbooks this bot runs")).toBeNull();
  });

  it("says Can't fire on HC-SAURON's card, never trading on live signals", async () => {
    next = desk;
    render(withClient(<BotPlaybooksSection deskId="sauron" botName="Sauron" />));
    await screen.findByText("HC-SAURON");
    const hc = cardOf("HC-SAURON");
    expect(hc.getAttribute("data-state")).toBe("blocked");
    expect(hc.textContent).toContain("Can't fire");
    expect(hc.textContent).not.toMatch(/trading on live signals/i);
    // Its "since" belongs to the verdict it no longer shows, so it never borrows that clock.
    expect(hc.textContent).not.toMatch(/since/);
  });

  it("heads the cards with the bot's checks: running, how often, and what each check asks", async () => {
    next = desk;
    render(withClient(<BotPlaybooksSection deskId="sauron" botName="Sauron" />));
    const strip = await screen.findByRole("region", { name: "Sauron's checks" });
    expect(strip.textContent).toContain("● Running · last check 20s ago");
    expect(strip.textContent).toContain("✓ on time");
    expect(strip.textContent).toContain(
      "Sauron checks the market about every 15 seconds while it's open.",
    );
    expect(strip.textContent).toContain("Each check asks the 4 playbooks below what to do.");
  });

  it("explains Not checking, and claims no on-time check, when the loop has gone quiet", async () => {
    next = { available: true, heartbeat: { ...sauron, state: "stale", sinceLastPassMs: 420_000 } };
    render(withClient(<BotPlaybooksSection deskId="sauron" botName="Sauron" />));
    const strip = await screen.findByRole("region", { name: "Sauron's checks" });
    expect(strip.textContent).toContain("▲ Not checking · last check 7 min ago");
    expect(strip.textContent).toContain("Not checking means no check for 2 min");
    expect(strip.textContent).not.toContain("on time");
    expect(strip.getAttribute("data-state")).toBe("stale");
  });

  it("opens a card in place: the rest of its reason, mode, since, and the way to change it", async () => {
    next = desk;
    render(withClient(<BotPlaybooksSection deskId="sauron" botName="Sauron" />));
    await screen.findByText("SAURON");
    const card = cardOf("SAURON");
    expect(
      within(card).getByText("Reading live price and sentiment every pass"),
    ).toBeInTheDocument();
    const details = card.querySelector("details");
    expect(details?.open).toBe(false);
    fireEvent.click(within(card).getByText("SAURON"));
    expect(details?.open).toBe(true);
    expect(within(card).getAllByText(/^aggressive · since /).length).toBeGreaterThan(0);
    // The sentence goes on where the closed card stopped — its first clause is never said twice.
    expect(within(card).getByText("There is no date window to wait for.")).toBeInTheDocument();
    expect(within(card).getAllByText(/Reading live price/)).toHaveLength(1);
    expect(within(card).getByRole("link", { name: /Change or pause it in R&D/ })).toHaveAttribute(
      "href",
      "/app/research?section=playbooks&account=sauron",
    );
  });

  it("names an off playbook once, in the footer, beside the way to change it", async () => {
    next = desk;
    render(withClient(<BotPlaybooksSection deskId="sauron" botName="Sauron" />));
    expect(await screen.findByText(/BETA-SCOUT is off on this bot/)).toBeInTheDocument();
    expect(screen.queryByText("BETA-SCOUT", { selector: ".pbb-name" })).toBeNull();
    expect(screen.getByRole("link", { name: "Change in R&D ›" })).toHaveAttribute(
      "href",
      "/app/research?section=playbooks&account=sauron",
    );
  });

  it("lists a held ticker nothing on this bot will sell, with a glyph and a word", async () => {
    next = { available: true, heartbeat: { ...sauron, unmanaged: ["GOOG"] } };
    render(withClient(<BotPlaybooksSection deskId="sauron" botName="Sauron" />));
    await screen.findByText("GOOG shares");
    const card = cardOf("GOOG shares");
    expect(card.getAttribute("data-state")).toBe("unmanaged");
    expect(card.textContent).toContain("◇ Nothing sells it");
  });
});

describe("BotPlaybooksSection — the check log, folded behind the strip", () => {
  it("asks for no check until the reader unfolds the log", async () => {
    next = desk;
    render(withClient(<BotPlaybooksSection deskId="sauron" botName="Sauron" />));
    const toggle = await screen.findByRole("button", { name: /Every check/ });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    await new Promise((r) => setTimeout(r, 20));
    expect(askedForDecisions).toEqual([]);
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById(toggle.getAttribute("aria-controls") ?? "")).not.toBeNull();
    await waitFor(() => expect(askedForDecisions.length).toBeGreaterThan(0));
    expect(askedForDecisions.every((url) => url.includes("trades=none"))).toBe(true);
    expect(
      screen.getByText("Checks that placed no trade — idle, blocked, halted"),
    ).toBeInTheDocument();
  });

  it("arrives with the log open when an old Heartbeat link asked for it", async () => {
    next = desk;
    render(withClient(<BotPlaybooksSection deskId="sauron" botName="Sauron" checksOpen />));
    expect(await screen.findByRole("button", { name: /Every check/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await waitFor(() => expect(askedForDecisions.length).toBeGreaterThan(0));
  });

  /** #3961 — a fill's "the whole pass" link names its round; that round traded, so the log opens
   *  with the traded checks already included. */
  it("arrives with the traded checks included when a fill's link named a round", async () => {
    next = desk;
    window.location.hash = "#cycle-1790000000000";
    render(withClient(<BotPlaybooksSection deskId="sauron" botName="Sauron" />));
    await waitFor(() => expect(askedForDecisions.length).toBeGreaterThan(0));
    expect(askedForDecisions.every((url) => !url.includes("trades=none"))).toBe(true);
    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.getByText("Every check, newest first")).toBeInTheDocument();
  });
});

/** #885 — a bot the viewer does not own: the strip and each card's state, no names. */
describe("BotPlaybooksSection — someone else's bot", () => {
  it("keeps the names, the roll call and the way to change them off", async () => {
    next = desk;
    render(
      withClient(<BotPlaybooksSection deskId="sauron" botName="Sauron" showPlaybooks={false} />),
    );
    expect(await screen.findByText(/is the bot owner's to see/)).toBeInTheDocument();
    for (const id of ["SAURON", "HC-SAURON", "S1-NVDA", "TACO-DJT", "BETA-SCOUT"]) {
      expect(screen.queryByText(new RegExp(id))).toBeNull();
    }
    expect(screen.queryByRole("link", { name: /R&D/ })).toBeNull();
    // One card per verdict, read by its state and its mode.
    expect(document.querySelectorAll(".pbb-card")).toHaveLength(3);
    expect(screen.getAllByText("Trading on live signals")).toHaveLength(2);
    expect(screen.getByText("Aggressive mode")).toBeInTheDocument();
  });

  it("reads the wire a non-owner receives — no ids, no roll call", async () => {
    const { rollCall: _withheld, ...rest } = sauron;
    const anonymous = (sauron.playbooks ?? []).map(({ playbookId: _id, ...v }) => v);
    next = { available: true, heartbeat: { ...rest, playbooks: anonymous } };
    render(withClient(<BotPlaybooksSection deskId="sauron" showPlaybooks={false} />));
    expect(await screen.findByText(/This bot checks the market/)).toBeInTheDocument();
    expect(document.querySelectorAll(".pbb-card")).toHaveLength(3);
  });
});

describe("BotPlaybooksSection — honest empty states", () => {
  it("says plainly when no playbook has answered a check yet", async () => {
    const { rollCall: _none, ...rest } = sauron;
    next = { available: true, heartbeat: { ...rest, playbooks: null } };
    render(withClient(<BotPlaybooksSection deskId="sauron" />));
    expect(await screen.findByText("No playbook has answered a check yet.")).toBeInTheDocument();
  });

  it("says plainly when no decision trail is wired", async () => {
    next = { available: false };
    render(withClient(<BotPlaybooksSection deskId="sauron" />));
    expect(
      await screen.findByText("No decision trail is wired in this deployment."),
    ).toBeInTheDocument();
  });
});

/** #5073 slice 2 — the week on one clock: Mon–Fri Oct 5–9 2026, now Fri 3:00 PM New York. Every
 *  session is 13 half hours; Friday's last one has not begun. */
const DAYS = ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09"];
const NOW = Date.parse("2026-10-09T19:00:00Z");
function grid<T>(begun: T, future: T): T[][] {
  return DAYS.map((_, d) =>
    Array.from({ length: 13 }, (_, b) => (d === 4 && b > 11 ? future : begun)),
  );
}
const week: NonNullable<Heartbeat["week"]> = {
  bucketMs: 1_800_000,
  now: NOW,
  sessions: DAYS.map((date) => ({
    date,
    openAt: Date.parse(`${date}T13:30:00Z`),
    closeAt: Date.parse(`${date}T20:00:00Z`),
  })),
  checks: grid<number | null>(120, null),
  gaps: [],
  lanes: [
    { playbookId: "SAURON", mode: "aggressive", slot: 0, states: grid("tactical", null) },
    { playbookId: "HC-SAURON", mode: "standard", slot: 1, states: grid("tactical", null) },
    { playbookId: "S1-NVDA", mode: "standard", slot: 2, states: grid("no-window", null) },
  ],
  trades: [
    {
      at: Date.parse("2026-10-05T15:20:00Z"),
      symbol: "NVDA",
      side: "buy",
      playbookId: "SAURON",
      mode: "aggressive",
    },
    {
      at: Date.parse("2026-10-06T14:31:00Z"),
      symbol: "CRWV",
      side: "sell",
      playbookId: "CRWV-WHEEL",
      mode: "aggressive",
    },
  ],
};
const withWeek = (over: Partial<NonNullable<Heartbeat["week"]>> = {}): DeskHeartbeat => ({
  available: true,
  heartbeat: { ...sauron, week: { ...week, ...over } },
});

describe("BotPlaybooksSection — the week on one clock", () => {
  it("draws the week of checks under the strip, and counts none missed instead of 'on time'", async () => {
    next = withWeek();
    render(withClient(<BotPlaybooksSection deskId="sauron" botName="Sauron" />));
    const strip = await screen.findByRole("region", { name: "Sauron's checks" });
    expect(strip.textContent).toContain("✓ none missed");
    expect(strip.textContent).not.toContain("on time");
    const drawn = within(strip).getByRole("figure", { name: /Sauron's checks this week/ });
    expect(drawn.getAttribute("aria-label")).toContain("none missed. 2 trades placed.");
    expect(drawn.querySelectorAll(".wk-day")).toHaveLength(5);
    expect(drawn.querySelectorAll('.wk-cell[data-c="checked"]')).toHaveLength(64);
    expect(drawn.querySelectorAll('.wk-cell[data-c="future"]')).toHaveLength(1);
    // Both trades sit on the bot's own strip, whichever playbook placed them.
    expect([...drawn.querySelectorAll(".wk-mark")].map((m) => m.textContent)).toEqual([
      "▲NVDA",
      "▼CRWV",
    ]);
    expect(drawn.querySelectorAll(".wk-now")).toHaveLength(1);
  });

  it("names a span the market was open with no check, and never says none missed", async () => {
    const from = Date.parse("2026-10-07T14:02:00Z");
    next = withWeek({ gaps: [{ from, to: from + 34 * 60_000 }] });
    render(withClient(<BotPlaybooksSection deskId="sauron" botName="Sauron" />));
    const strip = await screen.findByRole("region", { name: "Sauron's checks" });
    expect(strip.textContent).toContain("✕ 1 gap with no check");
    expect(strip.textContent).toContain("for 34 min");
    expect(strip.textContent).not.toContain("none missed");
    expect(strip.querySelectorAll('.wk-cell[data-c="gap"]')).toHaveLength(2);
  });

  it("gives each card its lane on the same clock, said in words for a screen reader", async () => {
    next = withWeek();
    render(withClient(<BotPlaybooksSection deskId="sauron" botName="Sauron" />));
    await screen.findByText("SAURON");
    const lane = within(cardOf("SAURON")).getByRole("img");
    expect(lane.getAttribute("aria-label")).toBe(
      "This week: trading on live signals in 64 of 64 half hours asked. 1 trade placed.",
    );
    expect(lane.querySelectorAll('.wk-cell[data-s="tactical"]')).toHaveLength(64);
    expect(lane.querySelectorAll(".wk-mark")).toHaveLength(1);
    expect(
      within(cardOf("S1-NVDA")).getByRole("img").querySelectorAll('[data-s="no-window"]'),
    ).toHaveLength(64);
  });

  it("hatches a can't-fire card's lane, whatever its checks recorded", async () => {
    next = withWeek();
    render(withClient(<BotPlaybooksSection deskId="sauron" botName="Sauron" />));
    await screen.findByText("HC-SAURON");
    const lane = within(cardOf("HC-SAURON")).getByRole("img");
    expect(lane.getAttribute("aria-label")).toBe("This week: can't fire.");
    expect(lane.querySelectorAll('[data-s="blocked"]')).toHaveLength(64);
    expect(lane.querySelectorAll('[data-s="tactical"]')).toHaveLength(0);
    // TACO-DJT never ran, so it has no lane rows of its own — still hatched, still on the clock.
    expect(
      within(cardOf("TACO-DJT")).getByRole("img").querySelectorAll('[data-s="blocked"]'),
    ).toHaveLength(64);
  });

  it("opens a card to the key to its shapes and its trades in words", async () => {
    next = withWeek();
    render(withClient(<BotPlaybooksSection deskId="sauron" botName="Sauron" />));
    await screen.findByText("SAURON");
    const card = cardOf("SAURON");
    fireEvent.click(within(card).getByText("SAURON"));
    expect(within(card).getByText("Waiting for its window")).toBeInTheDocument();
    expect(card.querySelector(".wk-trades")?.textContent).toMatch(/^▲ Buy NVDA placed /);
  });

  it("matches a nameless card to its lane by slot, and keeps trades to the strip", async () => {
    const { rollCall: _withheld, ...rest } = sauron;
    const anonymous = (sauron.playbooks ?? []).map(({ playbookId: _id, ...v }) => v);
    next = {
      available: true,
      heartbeat: {
        ...rest,
        playbooks: anonymous,
        week: {
          ...week,
          lanes: week.lanes.map(({ playbookId: _id, ...l }) => l),
          trades: week.trades.map(({ playbookId: _p, mode: _m, ...t }) => t),
        },
      },
    };
    render(withClient(<BotPlaybooksSection deskId="sauron" showPlaybooks={false} />));
    await screen.findByText("Aggressive mode");
    const lanes = [...document.querySelectorAll(".pbb-card .wk-lane")];
    expect(lanes).toHaveLength(3);
    expect(lanes.map((l) => l.querySelectorAll('[data-s="tactical"]').length)).toEqual([64, 64, 0]);
    expect(document.querySelectorAll(".pbb-card .wk-mark")).toHaveLength(0);
    expect(document.querySelectorAll(".wk-strip .wk-mark")).toHaveLength(2);
  });
});
