import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import { cardEchoes, memberCard, rolesPacket } from "../../scripts/study/packets.mjs";
import { type AreaConfig, profileProblems } from "../../scripts/study/round-plan.mjs";
import { serverRead } from "../../scripts/study/server-reads.mjs";
import { buildBook, derivedFields } from "../../scripts/study/worlds/book.mjs";
import { WORLDS } from "../../scripts/study/worlds/index.mjs";
import { loadInput } from "../../scripts/study/worlds/inputs.mjs";
import { marketClient, modelMarks } from "../../scripts/study/worlds/market.mjs";
import { serverConfig, sessionFor } from "../../scripts/study/worlds/server-config.mjs";
import { createBoardChannel } from "../../src/server/board-patch-routes.js";

/**
 * The workbench worlds (#8005, Trade: `docs/IA.md` §5.3) and the world helpers they extend: a
 * layer that rewrites one account's book, figures derived rather than typed (an option's marks
 * from the house model the chain quotes, a share position's cost from its buys), and the trade
 * page's stores answered as production wires them — a working order, a watchlist, the alert and
 * split stores — never as a deployment with the service off.
 */

type Fill = { orderId: string; symbol: string; side: string; quantity: number; price: number };
type Layered = {
  humanFills: Record<string, Fill[]>;
  watchlists: Record<string, { symbol: string }[]>;
  workingOrders: Record<string, { orderId: string }[]>;
  bot: { subscribedAt: string; passes: { at: string; wheelSale?: unknown }[] };
};

describe("a layer that rewrites one account", () => {
  const today = loadInput("workbench-today") as Layered;
  const expiry = loadInput("workbench-expiry") as Layered;

  it("replaces the named account's fills and keeps every other account's", () => {
    expect(today.humanFills.eric?.map((f) => f.orderId)).toEqual([
      "eric-aapl-1",
      "eric-msft-1",
      "eric-aapl-2",
    ]);
    const base = loadInput("profile-today") as Layered;
    expect(today.humanFills.jordan).toEqual(base.humanFills.jordan);
  });

  it("carries the per-account blocks down a second layer, and the layer's own bot fields", () => {
    expect(expiry.watchlists.eric?.map((w) => w.symbol)).toEqual(["GOOG", "NVDA", "SPY"]);
    expect(expiry.workingOrders.eric?.map((o) => o.orderId)).toEqual(["eric-msft-2"]);
    expect(expiry.bot.subscribedAt).toBe("@-40d 09:00");
    expect(expiry.bot.passes.filter((p) => p.wheelSale)).toHaveLength(1);
  });
});

describe("derived, never typed", () => {
  const book = buildBook("workbench-today");
  const position = (id: string, symbol: string) =>
    book.participants.find((p) => p.id === id)?.positions.find((x) => x.symbol === symbol);

  it("costs a share position from the buys that opened it", () => {
    // 60 at $228.40 and 40 at $231.00.
    expect(position("eric", "AAPL")?.avgPrice).toBeCloseTo(229.44, 6);
  });

  it("refuses a share position whose buys do not add up to it", () => {
    const fills = [{ symbol: "X", side: "buy", quantity: 10, price: 5 }];
    expect(() => derivedFields({ symbol: "X", quantity: 11 }, fills, {})).toThrow(/add to 10/);
  });

  it("marks a held option at the price the chain quotes for the same contract", async () => {
    const expiryBook = buildBook("workbench-expiry");
    const put = expiryBook.participants
      .find((p) => p.id === "sauron")
      ?.positions.find((x) => x.symbol === "CRWV261009P00080000");
    const chain = await marketClient(expiryBook.market).getChain("CRWV", "2026-10-09", "put");
    const row = chain.find((r) => r.occSymbol === "CRWV261009P00080000");
    expect(row?.quoteSource).toBe("indicative");
    expect(put?.marketValue).toBeCloseTo(-100 * (row?.closePrice ?? Number.NaN), 6);
    const marks = modelMarks(expiryBook.market.symbols, "CRWV261009P00080000");
    expect(put?.lastdayPrice).toBeCloseTo(100 * (marks?.lastday ?? Number.NaN), 6);
    expect(modelMarks(expiryBook.market.symbols, "ZZZZ261009P00080000")).toBeUndefined();
  });

  it("sells the expiring put the wheel itself chose from the input's chain", () => {
    const expiryBook = buildBook("workbench-expiry");
    const sale = expiryBook.activity.sauron?.find((f) => f.orderId === "sauron-crwv-put-0");
    expect(sale?.symbol).toBe("CRWV261009P00080000");
  });
});

describe("the trade page's stores, as production wires them", () => {
  const book = buildBook("workbench-today");
  const config = serverConfig(book);
  const read = async (url: string, email = "eric@study.world") =>
    (await serverRead(url, config, createBoardChannel(), sessionFor(email)))?.body as Record<
      string,
      unknown
    >;

  it("lists a working order beside the filled ones, newest first", async () => {
    const orders = await config.tradingClientFor("eric")?.listOrders();
    expect(orders?.[0]).toMatchObject({ id: "eric-msft-2", status: "new" });
    const view = await read("/api/trade/orders?participantId=eric");
    expect((view.working as { id: string }[]).map((o) => o.id)).toEqual(["eric-msft-2"]);
  });

  it("answers each member's own watchlist, stored, and an empty one for a member with none", async () => {
    const eric = await read("/api/trade/watchlist");
    expect(eric.available).toBe(true);
    expect((eric.watching as { symbol: string }[]).map((w) => w.symbol)).toEqual([
      "GOOG",
      "NVDA",
      "SPY",
    ]);
    const jordan = await read("/api/trade/watchlist", "jordan@study.world");
    expect(jordan).toMatchObject({ available: true, watching: [] });
  });

  it("keeps the split, wait and alert stores switched on and empty", async () => {
    // The split and wait routes are families a pin may predate, imported dynamically by
    // server-reads.mjs; the spec runner does not resolve those, so their seams are read directly
    // (compose, under tsx, answers both routes: `{wired:true,target:null}` and `{wait:null}`).
    const seams = config as unknown as {
      targetSplits: { get(key: string): unknown };
      bookWaits: { wait(id: string): unknown };
    };
    expect(seams.targetSplits.get("any member")).toBeUndefined();
    expect(seams.bookWaits.wait("eric")).toBeUndefined();
    expect(() => (seams.targetSplits as unknown as { clear(): void }).clear()).toThrow(/a write/);
    const delivery = await read("/api/trade/alerts/delivery?participantId=eric");
    expect(String(delivery.reason)).not.toMatch(/keeps no delivery settings/);
    const alerts = await read("/api/trade/alerts?participantId=eric");
    expect(alerts.available).toBe(true);
  });

  it("quotes every chain strike from the feed, so the chain never reads as unquoted", async () => {
    const chain = await read("/api/trade/chain?symbol=AAPL&type=call");
    expect((chain.quotes as { source: string }).source).toBe("indicative");
  });
});

// The workbench's area config (#8005 slice 5): what scripts/study/round.mjs reads to run Trade's
// round. Checked against the worlds it names, so it can never point a member at a world, a viewer
// or a route the worlds do not serve, and its roles never carry a member card's words.
describe("the workbench area config", () => {
  const ROOT = join(import.meta.dirname, "../..");
  const config = JSON.parse(
    readFileSync(join(ROOT, "scripts/study/tasks/workbench.json"), "utf8"),
  ) as AreaConfig & { census: { world: string; viewer: string; for: string[] }[] };
  const world = (name: string) => WORLDS.find((w) => w.name === name);

  it("passes its own checks", () => {
    expect(profileProblems(config)).toEqual([]);
  });

  it("puts every member and every census on a workbench world, as one of its viewers", () => {
    for (const r of [...config.matrix, ...config.census]) {
      expect(r.world).toMatch(/^workbench-/);
      expect(Object.keys(world(r.world)?.viewers ?? {})).toContain(r.viewer);
    }
  });

  it("runs phone first, the thin cut included", () => {
    const frames = config.matrix.flatMap((r) => r.viewports);
    expect(frames.filter((v) => v === "phone").length).toBeGreaterThan(frames.length / 2);
    expect(config.thin.viewport).toBe("phone");
  });

  it("starts the thin cut's experts on a route its world's own surfaces name", () => {
    const viewer = config.matrix.find((r) => r.member === config.thin.member)?.viewer;
    const routes = (world(config.thin.world)?.surfaces ?? [])
      .filter((s) => s.viewer === viewer && !s.struck)
      .map((s) => s.route);
    expect(routes).toContain(config.thin.expertRoute);
  });

  it("ships roles that repeat no member card", () => {
    const members = [...new Set(config.matrix.map((r) => r.member))];
    const cards = Object.fromEntries(
      members.map((m) => [
        m,
        memberCard(readFileSync(join(ROOT, "docs/members", `${m}.md`), "utf8"), {
          cutoff: config.cutoff,
          name: m,
        }).text,
      ]),
    );
    expect(cardEchoes(rolesPacket(config.roles, members).text, cards)).toEqual([]);
  });
});
