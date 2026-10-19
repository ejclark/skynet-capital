import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SAMPLE_BUCKET_MS } from "../../src/observatory/book-health-history.js";
import { BookHealthHistoryStore } from "../../src/server/book-health-history-store.js";
import { deskHealthPayload } from "../../src/server/book-health-payload.js";
import { sampleBookHealth } from "../../src/server/book-health-sampler.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";

/** #5493 slice 5 — the hourly sampler records what stands, and the desk payload reads it back as
 *  how long and which way. */

/** A human book with `cash` and `held` dollars spread over four names (none near the
 *  concentration line), so the only finding is how much of the book sits idle. */
const human = (id: string, cash: number, held: number) => ({
  id,
  displayName: id,
  kind: "human" as const,
  cash,
  equity: cash + held,
  positions: ["AAPL", "MSFT", "KO", "PG"].map((symbol) => ({
    symbol,
    quantity: 1,
    avgPrice: held / 4,
    marketValue: held / 4,
  })),
  activity: [],
});

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "bhs-"));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("the book-health sampler and the standing it serves", () => {
  it("records each account's findings, and an unreadable account records nothing", async () => {
    const history = new BookHealthHistoryStore(join(dir, "h.json"));
    const failed = { ...human("human-b", 0, 0), error: "broker read failed" };
    const config = {
      healthHistory: history,
      now: () => new Date("2026-10-16T12:00:00.000Z"),
    } as unknown as DashboardServerConfig;
    const n = await sampleBookHealth({
      config,
      participants: () => [human("human-a", 9_000, 1_000), failed],
    });
    expect(n).toBe(1);
    expect(history.samples("human-a")[0]?.f.map((f) => f.k)).toEqual(["idle|||"]);
    expect(history.samples("human-b")).toEqual([]);
  });

  it("does nothing when no history is wired", async () => {
    const config = {} as unknown as DashboardServerConfig;
    expect(await sampleBookHealth({ config, participants: () => [human("a", 1, 1)] })).toBe(0);
  });

  it("serves the owner how long a finding has stood and its direction, and a non-owner no standing", async () => {
    const history = new BookHealthHistoryStore(join(dir, "h.json"));
    let now = new Date("2026-10-14T12:00:00.000Z");
    const config = { healthHistory: history, now: () => now } as unknown as DashboardServerConfig;
    await sampleBookHealth({ config, participants: () => [human("human-a", 6_500, 3_500)] });
    now = new Date(now.getTime() + 48 * SAMPLE_BUCKET_MS + SAMPLE_BUCKET_MS);
    const owner = await deskHealthPayload(human("human-a", 9_000, 1_000), config, true, undefined);
    const finding = owner.available && "findings" in owner ? owner.findings[0] : undefined;
    expect(finding?.standing?.trend).toBe("worse");
    expect(finding?.standing?.standingMs).toBe(49 * SAMPLE_BUCKET_MS);
    const other = await deskHealthPayload(human("human-a", 9_000, 1_000), config, false, undefined);
    expect(JSON.stringify(other)).not.toContain("standing");
    expect(other).toEqual({ available: true, counts: expect.objectContaining({ signal: 1 }) });
  });

  it("leaves findings unannotated when no history is wired", async () => {
    const config = {
      now: () => new Date("2026-10-16T12:00:00.000Z"),
    } as unknown as DashboardServerConfig;
    const owner = await deskHealthPayload(human("human-a", 9_000, 1_000), config, true, undefined);
    expect(JSON.stringify(owner)).not.toContain("standing");
  });
});
