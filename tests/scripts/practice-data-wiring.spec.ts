import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Participant } from "../../src/participants/participant.js";
import {
  LIVE_SOURCE,
  OFFLINE_SOURCE,
  wirePracticeData,
} from "../../src/scripts/practice-data-wiring.js";

/** The puzzle reads on a house login, never a member's; offline it reads labelled fixture bars. */

const bot = {
  id: "sauron",
  kind: "bot",
  credentials: { apiKey: "k", apiSecret: "s" },
} as Participant;
const human = {
  id: "human-a",
  kind: "human",
  credentials: { apiKey: "k", apiSecret: "s" },
} as Participant;

describe("wirePracticeData", () => {
  it("live: reads adjusted daily bars on the first house bot's client", async () => {
    const asked: string[] = [];
    const data = wirePracticeData({
      dataSource: {
        mode: "live",
        optionsClientFactory: (p) => {
          asked.push(p.id);
          return {
            getBars: (_s: string, _a: string, _b: string, _l: number, adj: string) =>
              Promise.resolve(adj === "all" ? [] : undefined),
          } as never;
        },
      },
      envRoster: [human, bot],
    });
    expect(data?.source).toBe(LIVE_SOURCE);
    expect(asked).toEqual(["sauron"]);
    expect(await data?.bars("NVDA", "a", "b")).toEqual([]);
  });

  it("live with no house bot: no data login, never a member's", () => {
    const data = wirePracticeData({
      dataSource: { mode: "live", optionsClientFactory: () => ({}) as never },
      envRoster: [human],
    });
    expect(data).toBeUndefined();
  });

  it("offline: fixture bars, labelled as invented, on the pinned clock", async () => {
    const dir = mkdtempSync(join(tmpdir(), "practice-"));
    const path = join(dir, "bars.json");
    writeFileSync(path, JSON.stringify({ bars: { MSFT: [{ t: "2026-10-28", c: 1 }] } }));
    const now = () => new Date("2026-11-09T14:00:00Z");
    const data = wirePracticeData({
      dataSource: { mode: "offline", optionsClientFactory: () => ({}) as never },
      envRoster: [],
      offlineNow: now,
      fixturePath: path,
    });
    expect(data?.source).toBe(OFFLINE_SOURCE);
    expect(data?.now?.()).toEqual(now());
    expect((await data?.bars("MSFT", "", ""))?.length).toBe(1);
    expect(await data?.bars("NVDA", "", "")).toBeUndefined();
  });
});
