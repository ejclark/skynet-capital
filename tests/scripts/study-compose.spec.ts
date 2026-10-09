import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "@rstest/core";
import { guardNetwork } from "../../scripts/study/no-network.mjs";
import { serverRead } from "../../scripts/study/server-reads.mjs";
import { buildBook } from "../../scripts/study/worlds/book.mjs";
import { loadInput } from "../../scripts/study/worlds/inputs.mjs";
import { INSTANT, msOf, resolveTokens } from "../../scripts/study/worlds/instant.mjs";
import { marketClient } from "../../scripts/study/worlds/market.mjs";
import { serverConfig, sessionFor } from "../../scripts/study/worlds/server-config.mjs";
import { createBoardChannel } from "../../src/server/board-patch-routes.js";

/**
 * The study composer's own logic (#4943 slice 2): how an input file becomes a book, how the book
 * answers the server's seams, and the two promises a composed world makes — the same world hashes
 * identically however it was composed, and it carries nothing written after its instant.
 */

const DAY = INSTANT.slice(0, 10);

describe("resolveTokens", () => {
  it("walks arrays and objects, resolving every token and keeping every other value", () => {
    expect(resolveTokens({ a: ["@now", 3, null], b: { at: "@-1h", day: "2026-11-06" } })).toEqual({
      a: ["2026-10-08T19:00:00.000Z", 3, null],
      b: { at: "2026-10-08T18:00:00.000Z", day: "2026-11-06" },
    });
  });
});

describe("loadInput layering", () => {
  const bad = loadInput("profile-bad-day") as {
    participants: { id: string; cash: number }[];
    bot: { passes: { at: string; wheelSale?: unknown }[] };
    corpus: { commit: string };
  };

  it("replaces a base participant's fields by id and keeps the rest of the base", () => {
    expect(bad.participants.find((p) => p.id === "sauron")?.cash).toBe(998512);
    expect(bad.participants.map((p) => p.id)).toEqual(
      (loadInput("profile-today") as { participants: { id: string }[] }).participants.map(
        (p) => p.id,
      ),
    );
    expect(bad.corpus.commit).toMatch(/^[0-9a-f]{40}$/);
  });

  it("cuts the bot's passes to those before `passesBefore` and puts the prepended pass first", () => {
    const [first, ...rest] = bad.bot.passes;
    expect(first?.at).toBe("@-2d 09:35");
    expect(rest.every((p) => msOf(p.at) < msOf("@-2d 09:35"))).toBe(true);
    expect(bad.bot.passes.some((p) => p.wheelSale)).toBe(false);
  });

  it("swaps the member list wholesale", () => {
    const none = loadInput("no-account") as { members: { email: string; owns: string[] }[] };
    expect(none.members.find((m) => m.email.startsWith("casey"))?.owns).toEqual([]);
  });
});

describe("buildBook", () => {
  const today = buildBook("profile-today");

  it("derives every equity from cash plus market value, and ends the history on it", () => {
    for (const p of today.participants) {
      const held = p.positions.reduce((s, x) => s + x.marketValue, 0);
      expect(p.equity).toBeCloseTo(p.cash + held, 6);
      const history = today.history[p.id] ?? [];
      if (history.length > 0) expect(history[history.length - 1]?.equity).toBe(p.equity);
    }
  });

  it("keeps the decision store newest first and stamps the book at the instant", () => {
    const at = (today.decisions.sauron ?? []).map((r) => r.at);
    expect(at).toEqual([...at].sort((a, b) => b - a));
    expect(today.generatedAt).toBe(new Date(INSTANT).toISOString());
  });

  it("records each pass's verdicts as the playbooks gave them at that pass, never typed", () => {
    const wheel = (book: ReturnType<typeof buildBook>) =>
      book.decisions.sauron?.[0]?.playbookVerdicts?.find((v) => v.playbookId === "CRWV-WHEEL");
    // Thursday sits outside the wheel's sale window; the stopped bot's Tuesday pass sat inside it.
    expect(wheel(today)?.state).toBe("no-window");
    expect(wheel(buildBook("profile-bad-day"))?.state).toBe("long");
  });
});

describe("serverConfig over a book", () => {
  const book = buildBook("profile-bad-day");
  const config = serverConfig(book);

  it("pages the decision store by keyset, newest first", async () => {
    const all = await config.readDecisions("sauron");
    const page = await config.readDecisions("sauron", { limit: 2 });
    expect(page).toEqual(all.slice(0, 2));
    const older = await config.readDecisions("sauron", { before: all[0]?.at });
    expect(older).toEqual(all.slice(1));
  });

  it("finds a placed order's decision by its order id", () => {
    expect(config.findByOrderId("sauron-nvda-4")?.record.at).toBe(msOf("@-2d 09:35"));
    expect(config.findByOrderId("nope")).toBeUndefined();
  });

  it("answers the broker's history as the tail of the book's month, ending on equity", async () => {
    const client = config.tradingClientFor("sauron");
    const week = await client?.getPortfolioHistory("1W");
    const sauron = book.participants.find((p) => p.id === "sauron");
    expect(week?.equity).toHaveLength(6);
    expect(week?.equity.at(-1)).toBe(sauron?.equity);
    expect(week?.profit_loss[0]).toBe(0);
    expect(week?.base_value).toBe(week?.equity[0]);
    expect(config.tradingClientFor("nobody")).toBeUndefined();
  });

  it("reads its clock and the session from the instant, not the wall", async () => {
    expect(config.now().toISOString()).toBe(new Date(INSTANT).toISOString());
    expect(await config.tradingClientFor("sauron")?.isMarketOpen()).toBe(true);
  });
});

describe("marketClient", () => {
  const market = marketClient(buildBook("profile-today").market);

  it("lays a 13-strike ladder around spot, priced before the instant", async () => {
    const spot = (await market.getUnderlyingPrice("NVDA")) ?? 0;
    const rows = await market.getChain("NVDA", "2026-11-20", "put");
    expect(rows).toHaveLength(13);
    expect(rows[6]?.strike).toBe(Math.round(spot / 5) * 5);
    expect(rows.every((r) => r.bid < r.ask && Date.parse(r.quotedAt) < Date.parse(INSTANT))).toBe(
      true,
    );
    expect(await market.getChain("ZZZZ", "2026-11-20", "put")).toEqual([]);
  });

  it("walks weekday bars up to the previous close, oldest first", async () => {
    const bars = (await market.getBars("CRWV")) ?? [];
    const days = bars.map((b) => b.t.slice(0, 10));
    expect(days).toEqual([...days].sort());
    expect((days.at(-1) ?? DAY) < DAY).toBe(true);
    expect(bars.every((b) => ![0, 6].includes(new Date(b.t).getUTCDay()))).toBe(true);
    expect(await market.getBars("ZZZZ")).toBeUndefined();
  });

  it("lists expirations on or after a day", async () => {
    expect(await market.getExpirations("NVDA", "2026-10-10", 2)).toEqual([
      "2026-10-16",
      "2026-10-23",
    ]);
  });
});

describe("guardNetwork", () => {
  it("answers what the world holds, refuses and records everything else", async () => {
    const real = globalThis.fetch;
    try {
      const log = guardNetwork((url) => (url === "https://held/" ? { ok: 1 } : undefined));
      expect(await (await fetch("https://held/")).json()).toEqual({ ok: 1 });
      await expect(fetch("https://elsewhere/")).rejects.toThrow(/no network/);
      expect(log).toEqual({ answered: ["https://held/"], refused: ["https://elsewhere/"] });
    } finally {
      globalThis.fetch = real;
    }
  });
});

describe("serverRead", () => {
  const book = buildBook("profile-bad-day");
  const config = serverConfig(book);
  const session = sessionFor("eric@study.world");

  it("answers a GET through the real handlers, parsed", async () => {
    const read = await serverRead("/api/desk/sauron", config, createBoardChannel(), session);
    expect(read?.status).toBe(200);
    expect(read?.body).toMatchObject({ desk: { id: "sauron" } });
  });

  it("is undefined for a path no handler claims", async () => {
    expect(await serverRead("/api/no-such-read", config, createBoardChannel(), session)).toBe(
      undefined,
    );
  });
});

describe("a composed world", () => {
  type Manifest = { payloads: { world: string; viewer: string; key: string; sha256: string }[] };
  const compose = (...names: string[]) => {
    const dir = mkdtempSync(join(tmpdir(), "study-compose-"));
    const out = spawnSync("npx", ["tsx", "scripts/study/worlds/compose.mjs", dir, ...names], {
      encoding: "utf8",
    });
    if (out.status !== 0) throw new Error(`compose exited ${out.status}: ${out.stderr}`);
    return dir;
  };
  const hashes = (dir: string, world: string) => {
    const m = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")) as Manifest;
    return Object.fromEntries(
      m.payloads.filter((r) => r.world === world).map((r) => [`${r.viewer} ${r.key}`, r.sha256]),
    );
  };
  // One compose alone, one after another world: a world must not see what an earlier one cached.
  let alone = "";
  let after = "";
  beforeAll(() => {
    alone = compose("profile-bad-day");
    after = compose("profile-today", "profile-bad-day");
  }, 120_000);

  it("hashes identically composed alone and after another world", () => {
    const a = hashes(alone, "profile-bad-day");
    expect(Object.keys(a).length).toBeGreaterThan(100);
    expect(hashes(after, "profile-bad-day")).toEqual(a);
  });

  it("serves no research assessed after its instant", () => {
    const eric = JSON.parse(readFileSync(join(alone, "profile-bad-day", "eric.json"), "utf8"));
    const shelf = JSON.stringify(eric["/api/research"].body);
    const assessed = [...shelf.matchAll(/"lastAssessed":"(\d{4}-\d{2}-\d{2})"/g)].map((m) => m[1]);
    expect(assessed.length).toBeGreaterThan(0);
    expect(assessed.filter((d) => (d ?? "") > DAY)).toEqual([]);
  });
});
