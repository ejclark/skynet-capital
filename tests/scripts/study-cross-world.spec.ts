import { describe, expect, it } from "@rstest/core";
import { guardNetwork } from "../../scripts/study/no-network.mjs";
import { pinArgs } from "../../scripts/study/pin-plan.mjs";
import { researchRootOf } from "../../scripts/study/session-world.mjs";
import { crossReads } from "../../scripts/study/worlds/cross-reads.mjs";
import crossToday from "../../scripts/study/worlds/cross-today.mjs";
import { loadInput, vixAnswer, worldNetwork } from "../../scripts/study/worlds/inputs.mjs";
import { marketClient } from "../../scripts/study/worlds/market.mjs";

// The cross-feature world (#8005 slice 4): the profile league moved six weeks to Thursday
// 2026-11-19, so the landing edition, campaigns, quests and convictions a cross-feature goal walks
// through exist; Moneypenny's chat in hand; parity over every one-tap hop between features.

type Input = {
  instant: string;
  corpus: { commit: string };
  members: { email: string; owns: string[] }[];
  participants: { id: string; positions: { symbol: string }[] }[];
  market: {
    expirations: string[];
    barDays?: number;
    symbols: Record<string, { spot: number; prevClose: number; iv: number }>;
  };
  vix: { session: string; close: number };
  bot: { passes: { at: string; wheelSale?: { listed: string[] } }[] };
};
const input = loadInput("cross-feature") as unknown as Input;

describe("the cross-feature world's input", () => {
  it("stands on its own Thursday, with a corpus from that morning", () => {
    expect(input.instant).toBe("2026-11-19T15:00:00-05:00");
    expect(input.corpus.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(input.members.map((m) => m.owns.length)).toEqual([2, 1, 0]);
  });

  it("moves every expiry six weeks, a holiday's to the session before it", () => {
    expect(input.market.expirations).toEqual([
      "2026-11-20",
      "2026-11-27",
      "2026-12-04",
      "2026-12-11",
      "2026-12-18",
      "2026-12-24",
      "2026-12-31",
      "2027-01-29",
    ]);
  });

  it("holds the put the wheel sells a session later, outside CRWV's print blackout", () => {
    const sauron = input.participants.find((p) => p.id === "sauron");
    expect(sauron?.positions.map((p) => p.symbol)).toContain("CRWV261231P00080000");
    const sale = input.bot.passes.find((p) => p.wheelSale);
    expect(sale?.at).toBe("@-1d 10:31");
  });

  it("answers the quests' two reads: the VIX close and a year of each index", async () => {
    expect(input.vix).toEqual(expect.objectContaining({ session: "2026-11-18", close: 24.56 }));
    expect(input.market.barDays).toBe(400);
    expect(input.market.symbols).toHaveProperty("QQQ");
    const bars = (await marketClient(input.market).getBars("QQQ")) as { t: string }[];
    expect(bars.length).toBeGreaterThan(252);
    // Sessions only, by market-calendar.ts's closures (listed from 2026): no Good Friday bar.
    expect(bars.some((b) => b.t.startsWith("2026-04-03"))).toBe(false);
    expect(bars.some((b) => b.t.startsWith("2026-04-02"))).toBe(true);
  });
});

describe("what the world answers off the machine", () => {
  const VIX = "https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv";

  it("serves the VIX history as Cboe's CSV, its last row the input's close", () => {
    expect(vixAnswer({ vix: { session: "2026-11-18", close: 24.56 } })(VIX)).toEqual({
      raw: "DATE,OPEN,HIGH,LOW,CLOSE\n11/18/2026,24.56,24.56,24.56,24.56\n",
      contentType: "text/csv",
    });
    expect(vixAnswer({})(VIX)).toBeUndefined();
  });

  it("answers a non-JSON document as text and still refuses everything else", async () => {
    const realFetch = globalThis.fetch;
    try {
      const log = guardNetwork(worldNetwork(input as unknown as Record<string, unknown>));
      const res = await fetch(VIX);
      expect(res.headers.get("content-type")).toBe("text/csv");
      expect((await res.text()).trim().split("\n").at(-1)).toBe(
        "11/18/2026,24.56,24.56,24.56,24.56",
      );
      await expect(fetch("https://example.com/")).rejects.toThrow(/no network/);
      expect(log.refused).toEqual(["https://example.com/"]);
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});

describe("the world's definition", () => {
  it("puts the chat in members' hands and lists every hop, struck ones with their reason", () => {
    expect(crossToday.chat).toBe(true);
    expect(Object.keys(crossToday.viewers)).toEqual(["eric", "jordan", "casey"]);
    for (const s of [...crossToday.surfaces, ...crossToday.oneTap]) {
      expect(s.viewer).toBeTruthy();
      if (s.struck) expect(String(s.struck).length).toBeGreaterThan(40);
      else expect(s.expect.length).toBeGreaterThan(0);
    }
    const ids = [...crossToday.surfaces, ...crossToday.oneTap].map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("is prepared at a pin on its own, so another area's worlds cannot fail its parity", () => {
    expect(
      pinArgs(["prepare", "--commit", "5dadb49", "--dir", "/tmp/pin", "--worlds", "cross-today"]),
    ).toEqual({ command: "prepare", commit: "5dadb49", dir: "/tmp/pin", worlds: ["cross-today"] });
    expect(() => pinArgs(["remove", "--dir", "/tmp/pin", "--worlds", "x"])).toThrow(/--dir only/);
  });
});

describe("what the thin slice's census found unanswered (#8005)", () => {
  it("serves a world's research write-ups from its own corpus, not today's tree", () => {
    const manifest = { corpora: { "cross-today": ".corpus/3c02e6831376" } };
    expect(researchRootOf("/run", manifest, "cross-today")).toBe(
      "/run/.corpus/3c02e6831376/docs/research",
    );
    expect(researchRootOf("/run", {}, "cross-today")).toBeNull();
  });

  it("reads the held put's chain at its own expiry, and the board's outlook per symbol", () => {
    const reads = crossReads("eric");
    expect(reads).toContain("/api/trade/chain?symbol=CRWV&type=put&exp=2026-12-31");
    expect(reads).toContain("/api/research/outlook?symbol=CRWV");
    expect(reads).toContain("/api/research/fit?symbol=NVDA");
  });
});
