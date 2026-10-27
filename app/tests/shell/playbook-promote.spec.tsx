import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { promotionVerdict } from "../../../src/autonomous/authored-promotion";
import type { ShadowReportEntry } from "../../../src/autonomous/authored-shadow-wire";
import { emptyForm } from "../../../src/playbooks/authored-play-form";
import type { AuthoredPlayView } from "../../src/live/authored-plays";
import type { OwnedAccount } from "../../src/live/settings";
import { YourPlaybooks } from "../../src/shell/playbook-drafts";

/**
 * PROMOTING A PLAY THAT PASSED ITS SHADOW TEST (#5457 slice 3).
 *
 * WHILE a test has not met the bar, the row SHALL list what is left, one line per check with a glyph
 * AND a word, and SHALL NOT offer to trade it. WHEN it has, the row SHALL offer one button that names
 * the bot, and SHALL say paper money, SIM, and not researched. WHEN a play is promoted, the row SHALL
 * show it as trading or paused with "SIM · unvalidated", and offer Pause or Resume.
 */

const SAURON: OwnedAccount = {
  id: "sauron",
  name: "Sauron",
  kind: "bot",
  hostConfigured: true,
  profile: null,
};
const SINCE = "2026-10-17T12:00:00.000Z";
const ID = "U-sauron-my-nvda-run-up";

const report = (over: Partial<ShadowReportEntry> = {}): ShadowReportEntry => ({
  id: ID,
  since: SINCE,
  state: "watching",
  window: "long",
  sessions: 10,
  tradeCount: 2,
  roundTrips: 1,
  realized: 20,
  refused: 0,
  recent: [],
  ...over,
});

const base = (over: Partial<AuthoredPlayView> = {}): AuthoredPlayView => ({
  id: ID,
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
const testing = (entry: ShadowReportEntry): AuthoredPlayView =>
  base({
    status: "shadow",
    shadow: { since: SINCE, report: entry },
    promotion: promotionVerdict(entry),
  });
const promoted = (running: boolean): AuthoredPlayView =>
  base({ status: "promoted", trading: { running } });

const posts: { url: string; body: Record<string, unknown> }[] = [];
let listed: AuthoredPlayView[] = [];
let reply: unknown;
const realFetch = globalThis.fetch;
beforeEach(() => {
  posts.length = 0;
  listed = [];
  reply = { ok: true, play: promoted(true) };
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    const json = (body: unknown) =>
      Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
    if (init?.method === "POST") {
      posts.push({ url: String(url), body: JSON.parse(String(init.body ?? "{}")) });
      return json(reply);
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

describe("a test that has not met the bar", () => {
  it("lists what is left, a glyph and a word per check, and offers nothing to trade", async () => {
    listed = [testing(report({ sessions: 6, roundTrips: 0, refused: 1 }))];
    mount();
    const checks = within(
      await screen.findByRole("list", { name: "What the shadow test must show" }),
    );
    const rows = checks.getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent("Not yet · 6 of 10 sessions watched");
    expect(rows[1]).toHaveTextContent("Not yet · 0 closed round trips, 1 needed");
    expect(rows[2]).toHaveTextContent("Not yet · 1 guard refusal, 0 allowed");
    expect(screen.getByText("Before it can trade")).toBeInTheDocument();
    expect(screen.getByText(/4 more sessions to watch/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /trade it/ })).toBeNull();
  });
});

describe("a test that passed", () => {
  it("offers one button that names the bot, and says it is paper money and not researched", async () => {
    listed = [testing(report())];
    mount();
    expect(await screen.findByText("Passed its shadow test")).toBeInTheDocument();
    const rows = within(screen.getByRole("list", { name: "What the shadow test must show" }));
    for (const row of rows.getAllByRole("listitem")) expect(row).toHaveTextContent(/^✓?\s?Met/);
    expect(screen.getByText(/Paper money only \(SIM\), on Sauron alone/)).toBeInTheDocument();
    expect(
      screen.getByText(/isn't researched, so it stays marked unvalidated/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Let Sauron trade it" }));
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0]).toEqual({ url: "/api/authored-plays/promote", body: { id: ID, on: true } });
  });

  it("a refusal is said in a line under the button", async () => {
    listed = [testing(report())];
    reply = { ok: false, error: "S1-NVDA already trades NVDA on this bot." };
    mount();
    fireEvent.click(await screen.findByRole("button", { name: "Let Sauron trade it" }));
    expect(await screen.findByText("S1-NVDA already trades NVDA on this bot.")).toBeInTheDocument();
  });
});

describe("a promoted play", () => {
  it("shows as trading, SIM and unvalidated, with Pause that says exits keep running", async () => {
    listed = [promoted(true)];
    mount();
    expect(await screen.findAllByText(/Trading · SIM · unvalidated/)).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Start a shadow test" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Pause (exits keep running)" }));
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0]).toEqual({ url: "/api/authored-plays/promote", body: { id: ID, on: false } });
  });

  it("shows paused as exits only, with Resume", async () => {
    listed = [promoted(false)];
    mount();
    expect(await screen.findByText(/Paused · exits only · SIM · unvalidated/)).toBeInTheDocument();
    expect(screen.getByText(/opens nothing new for this play/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Resume trading" }));
    await waitFor(() => expect(posts[0]?.body).toEqual({ id: ID, on: true }));
  });
});
