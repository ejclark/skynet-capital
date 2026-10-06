import type { ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { resolveCondScoutReplication } from "../../src/autonomous/cond-scout-replication-client.js";
import {
  COND_SCOUT_KIND,
  type CondScoutSnapshot,
  MAX_RETROS,
  parseCondScoutSnapshot,
} from "../../src/autonomous/cond-scout-wire.js";
import {
  INSIGHTS_BRIDGE_SECRET_HEADER,
  INSIGHTS_BRIDGE_SHARED_SECRET,
} from "../../src/autonomous/insight-record.js";
import type { ProbeRetro } from "../../src/playbooks/cond-scout-retro.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveDeskJson } from "../../src/server/desk-json-routes.js";
import { createInsightsListener } from "../../src/server/insights-listener.js";

/**
 * COND-SCOUT's bots→app bridge (#3651 slice 7a): the fail-closed snapshot parser, the private
 * `/cond-scout` route, the `/api/desk/:id/probes` panel, and the bots-side sender.
 */

const retro: ProbeRetro = {
  probeId: "AMD@1",
  symbol: "AMD",
  hypothesis: "oversold-rebound",
  condition: "oversold",
  reason: "horizon",
  openedAt: 1,
  closedAt: 5 * 86_400_000,
  daysHeld: 5,
  roi: 0.03,
  roiPerDay: 0.006,
  directionRight: true,
  bestMarkRoi: 0.05,
  worstMarkRoi: -0.01,
  snapshotCount: 40,
  earlierExits: [{ label: "50%", at: 2, daysHeld: 2.5, roi: 0.04, roiPerDay: 0.016 }],
  soonerWasBetter: true,
  entryPrice: 100,
  laterExits: [
    {
      label: "1 week",
      horizonDays: 7,
      dueAt: 7,
      roi: 0.02,
      roiPerDay: 0.003,
      filledAt: 9,
      priceBasis: "daily close",
    },
    { label: "3 weeks", horizonDays: 21, dueAt: 21 },
  ],
  market: { symbol: "SPY", roi: 0.01, excess: 0.02 },
  rsiDelta: 12,
};

const snapshot: CondScoutSnapshot = {
  kind: COND_SCOUT_KIND,
  hostPersonaId: "sauron",
  at: 123,
  open: [
    {
      id: "MU@9",
      symbol: "MU",
      hypothesis: "trend-continuation",
      condition: "uptrend",
      openedAt: 9,
      expiresAt: 99,
      entryPrice: 70,
      stopPrice: 66.5,
      notional: 1_400,
      markRoi: 0.01,
    },
  ],
  retros: [retro],
};

/** A JSON copy of the snapshot, loose enough for a spec to break one field on purpose. */
type Loose = Record<string, unknown> & {
  open: Record<string, unknown>[];
  retros: (Record<string, unknown> & { laterExits: Record<string, unknown>[] })[];
};
/** The first element, asserted present — every fixture array here has one. */
const first = <T>(xs: T[]): T => xs[0] as T;
const cloneWith = (patch: (s: Loose) => void): unknown => {
  const copy = structuredClone(snapshot) as unknown as Loose;
  patch(copy);
  return copy;
};

describe("parseCondScoutSnapshot", () => {
  it("round-trips a real snapshot through JSON unchanged", () => {
    expect(parseCondScoutSnapshot(JSON.parse(JSON.stringify(snapshot)))).toEqual(snapshot);
  });

  it.each([
    ["the wrong kind", (s: Loose) => (s.kind = "decision.v1")],
    ["an unknown hypothesis", (s: Loose) => (first(s.open).hypothesis = "yolo")],
    ["a non-finite number", (s: Loose) => (first(s.retros).roi = null)],
    ["an over-long id", (s: Loose) => (s.hostPersonaId = "x".repeat(65))],
    [
      "a filled later exit with no fill time",
      (s: Loose) => delete first(first(s.retros).laterExits).filledAt,
    ],
    ["a malformed market benchmark", (s: Loose) => (first(s.retros).market = { symbol: "SPY" })],
    [
      "too many retros",
      (s: Loose) =>
        (s.retros = Array.from(
          { length: MAX_RETROS + 1 },
          () => structuredClone(retro) as unknown as Loose["retros"][number],
        )),
    ],
  ])("rejects %s", (_label, patch) => {
    expect(parseCondScoutSnapshot(cloneWith(patch as (s: Loose) => void))).toBeUndefined();
  });
});

describe("POST /cond-scout", () => {
  async function withListener(
    accept: ((s: CondScoutSnapshot) => void) | undefined,
    run: (base: string) => Promise<void>,
  ): Promise<void> {
    const server = createInsightsListener({
      record: () => Promise.resolve(),
      ...(accept ? { condScout: { accept } } : {}),
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    try {
      await run(`http://127.0.0.1:${port}`);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }
  const post = (base: string, body: unknown, auth = true) =>
    fetch(`${base}/cond-scout`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(auth ? { [INSIGHTS_BRIDGE_SECRET_HEADER]: INSIGHTS_BRIDGE_SHARED_SECRET } : {}),
      },
      body: JSON.stringify(body),
    });

  it("hands a valid, authenticated snapshot over whole", async () => {
    const got: CondScoutSnapshot[] = [];
    await withListener(
      (s) => got.push(s),
      async (base) => {
        const res = await post(base, snapshot);
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ ok: true, count: 2 });
      },
    );
    expect(got).toEqual([snapshot]);
  });

  it("refuses an unauthenticated or malformed snapshot, and 404s when not configured", async () => {
    const got: CondScoutSnapshot[] = [];
    await withListener(
      (s) => got.push(s),
      async (base) => {
        expect((await post(base, snapshot, false)).status).toBe(401);
        expect((await post(base, { ...snapshot, kind: "nope" })).status).toBe(400);
      },
    );
    expect(got).toEqual([]);
    await withListener(undefined, async (base) => {
      expect((await post(base, snapshot)).status).toBe(404);
    });
  });
});

describe("GET /api/desk/:id/probes", () => {
  const bot = {
    id: "sauron",
    kind: "bot" as const,
    cash: 0,
    equity: 0,
    positions: [],
    activity: [],
  };
  const other = { ...bot, id: "vader" };
  const config = (read?: () => CondScoutSnapshot | undefined) =>
    ({
      hub: { getState: () => ({ generatedAt: "t", participants: [bot, other], collisions: [] }) },
      ...(read ? { readCondScout: read } : {}),
    }) as unknown as DashboardServerConfig;
  async function probes(id: string, cfg: DashboardServerConfig): Promise<Record<string, unknown>> {
    let body = "";
    const res = {
      writeHead: () => res,
      end: (b?: string) => {
        body = b ?? "";
      },
    } as unknown as ServerResponse;
    await serveDeskJson(res, `/api/desk/${id}/probes`, `/api/desk/${id}/probes`, cfg);
    return JSON.parse(body);
  }

  it("shows the ledger, labelled simulated, with a verdict per hypothesis, on the host bot", async () => {
    const body = await probes(
      "sauron",
      config(() => snapshot),
    );
    expect(body).toMatchObject({ available: true, simulated: true, at: 123 });
    expect(body.open).toEqual(snapshot.open);
    expect(body.verdicts).toMatchObject([
      { hypothesis: "oversold-rebound", closes: 1, call: "unproven" },
    ]);
  });

  it("says unavailable on any other desk, and before the first snapshot arrives", async () => {
    expect(
      await probes(
        "vader",
        config(() => snapshot),
      ),
    ).toEqual({ available: false });
    expect(
      await probes(
        "sauron",
        config(() => undefined),
      ),
    ).toEqual({ available: false });
    expect(await probes("sauron", config())).toEqual({ available: false });
  });
});

describe("resolveCondScoutReplication", () => {
  it("is dark without a bridge URL, and sends nothing while the scout has no snapshot", async () => {
    let reads = 0;
    await resolveCondScoutReplication({}, () => {
      reads++;
      return snapshot;
    }).send();
    expect(reads).toBe(0);
  });

  it("posts the snapshot to the app's /cond-scout route", async () => {
    const got: CondScoutSnapshot[] = [];
    const server = createInsightsListener({
      record: () => Promise.resolve(),
      condScout: { accept: (s) => got.push(s) },
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    try {
      await resolveCondScoutReplication(
        { SKYNET_INSIGHTS_BRIDGE_URL: `http://127.0.0.1:${port}/` },
        () => snapshot,
      ).send();
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    expect(got).toEqual([snapshot]);
  });
});
