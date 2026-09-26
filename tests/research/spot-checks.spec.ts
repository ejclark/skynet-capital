import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createSpotChecks,
  jsonlSpotChecks,
  SPOT_CHECK_MIN_READS,
  type SpotCheck,
  summarizeSpotChecks,
} from "../../src/research/spot-checks.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveSpotChecks } from "../../src/server/spot-checks-route.js";

/**
 * The spot cross-check count (#3729): how often last trade and option prices disagree, measured
 * before the guidance's warning is ever hardened into a refusal.
 */

const check = (over: Partial<SpotCheck> = {}): SpotCheck => ({
  at: "2026-09-26T15:00:00Z",
  symbol: "CRWV",
  open: true,
  last: 80,
  basis: "parity",
  gap: 0.002,
  flagged: false,
  ...over,
});

describe("summarizeSpotChecks", () => {
  it("splits the share by session, and keeps unchecked reads out of it", () => {
    const s = summarizeSpotChecks([
      check({ at: "2026-09-26T15:00:00Z" }),
      check({ gap: 0.03, flagged: true, at: "2026-09-25T15:00:00Z" }),
      check({ open: false, gap: 0.02, flagged: true }),
      check({ basis: "none", gap: undefined }),
    ]);
    expect(s).toMatchObject({
      reads: 4,
      since: "2026-09-25T15:00:00Z",
      unchecked: 1,
      open: { checked: 2, flagged: 1 },
      closed: { checked: 1, flagged: 1 },
      gapMedian: 0.02,
    });
  });

  it("refuses to state a share off too few reads — a warning stays a warning", () => {
    expect(summarizeSpotChecks([check()]).note).toMatch(/too few to judge/);
    const many = Array.from({ length: SPOT_CHECK_MIN_READS }, (_, i) =>
      check({ flagged: i < 5, gap: i < 5 ? 0.02 : 0.001 }),
    );
    expect(summarizeSpotChecks(many).note).toBe(
      `10% of ${SPOT_CHECK_MIN_READS} checked in-session reads disagreed by more than 1%.`,
    );
  });

  it("says nothing false about an empty count", () => {
    expect(summarizeSpotChecks([])).toMatchObject({ reads: 0, unchecked: 0 });
  });
});

describe("the count's store", () => {
  it("is off whenever the IV clock's store is off — never counted onto a disk a deploy erases", () => {
    expect(createSpotChecks({})).toBeUndefined();
    expect(
      createSpotChecks({ SKYNET_IV_HISTORY_DIR: "/tmp/iv", FLY_APP_NAME: "skynet" }),
    ).toBeUndefined();
    expect(createSpotChecks({ SKYNET_IV_HISTORY_DIR: "/data/iv-history" })).toBeDefined();
  });

  it("appends a line per read and lists them back, per symbol", async () => {
    const dir = mkdtempSync(join(tmpdir(), "spot-checks-"));
    try {
      const store = jsonlSpotChecks(dir);
      await store.save(check());
      await store.save(check({ symbol: "NVDA" }));
      expect(await store.list("CRWV")).toEqual([check()]);
      expect(await store.list()).toHaveLength(2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("GET /api/trade/guidance/spot-checks", () => {
  const fakeRes = () => {
    const out: { status?: number; body?: string } = {};
    const res = {
      writeHead: (status: number) => {
        out.status = status;
        return res;
      },
      end: (body?: string) => {
        out.body = body;
      },
    };
    return { res: res as never, out, json: () => JSON.parse(out.body ?? "{}") };
  };
  const cfg = (checks: SpotCheck[]) =>
    ({
      spotChecks: { save: () => Promise.resolve(), list: () => Promise.resolve(checks) },
    }) as unknown as DashboardServerConfig;

  it("answers a signed-in member with the summary only", async () => {
    const r = fakeRes();
    await serveSpotChecks(r.res, "/", cfg([check()]), "ann");
    expect(r.json().summary.reads).toBe(1);
  });

  it("refuses a session with no member, and says when the count is off", async () => {
    const a = fakeRes();
    await serveSpotChecks(a.res, "/", cfg([]), undefined);
    expect(a.out.status).toBe(401);
    const b = fakeRes();
    await serveSpotChecks(b.res, "/", {} as DashboardServerConfig, "ann");
    expect(b.json().reason).toBe("off");
  });
});
