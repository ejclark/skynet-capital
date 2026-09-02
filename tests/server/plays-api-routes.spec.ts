import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { servePlaysApi } from "../../src/server/plays-api-routes.js";

/**
 * The catalog-and-ladder endpoint: the six plays ship verbatim with the VIEWER's locked state
 * (a locked rung names the one that opens it), and the wheels toggle writes only the session's
 * own record.
 */

function fakeRes() {
  const out: { status?: number; body?: string } = {};
  const res = {
    writeHead: (status: number) => {
      out.status = status;
      return res;
    },
    end: (body?: string) => {
      out.body = body;
    },
  } as unknown as ServerResponse;
  return { res, out };
}

function post(body: unknown): IncomingMessage {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": "application/json" };
  return req;
}

const get = (): IncomingMessage => ({ method: "GET", headers: {} }) as unknown as IncomingMessage;

const ann = { email: "ann@x.com" } as never;

function config(overrides: Record<string, unknown> = {}): DashboardServerConfig {
  return {
    auth: {},
    resolveOwnerId: (email: string) => (email === "ann@x.com" ? "human-ann" : undefined),
    ...overrides,
  } as unknown as DashboardServerConfig;
}

describe("servePlaysApi plays", () => {
  it("behaves as wheels-off when no progression service is wired — nothing restricted", async () => {
    const { res, out } = fakeRes();
    await servePlaysApi(get(), res, "/api/trade/plays", config(), ann);
    const body = JSON.parse(out.body ?? "{}");
    expect(body.wheels).toBe(false);
    expect(body.plays).toHaveLength(6);
    expect(body.plays.every((p: { locked: boolean }) => !p.locked)).toBe(true);
  });

  it("locks the un-earned rungs with wheels on, each naming the rung that opens it", async () => {
    const cfg = config({
      progression: {
        view: () =>
          Promise.resolve({ wheels: true, unlocked: new Set(["101", "102"]), nextUp: "201" }),
      },
    });
    const { res, out } = fakeRes();
    await servePlaysApi(get(), res, "/api/trade/plays", cfg, ann);
    const body = JSON.parse(out.body ?? "{}");
    expect(body.wheels).toBe(true);
    expect(body.nextUp).toBe("201");
    const play = (code: string) =>
      body.plays.find((p: { code: string }) => p.code === code) as {
        locked: boolean;
        opensAfter?: { code: string };
      };
    expect(play("101").locked).toBe(false);
    expect(play("201").locked).toBe(true);
    expect(play("201").opensAfter?.code).toBe("102");
    expect(play("302").opensAfter?.code).toBe("301");
  });
});

describe("servePlaysApi wheels", () => {
  it("writes the SESSION's own preference and echoes the new state", async () => {
    const calls: unknown[][] = [];
    const cfg = config({
      progression: {
        setWheels: (id: string, wheels: boolean) => {
          calls.push([id, wheels]);
          return Promise.resolve();
        },
      },
    });
    const { res, out } = fakeRes();
    await servePlaysApi(post({ wheels: false }), res, "/api/trade/wheels", cfg, ann);
    expect(calls).toEqual([["human-ann", false]]);
    expect(JSON.parse(out.body ?? "{}")).toEqual({ ok: true, wheels: false });
  });

  it("tells an unlinked session honestly instead of writing anywhere", async () => {
    const calls: unknown[] = [];
    const cfg = config({
      progression: {
        setWheels: (id: string) => {
          calls.push(id);
          return Promise.resolve();
        },
      },
    });
    const { res, out } = fakeRes();
    await servePlaysApi(post({ wheels: true }), res, "/api/trade/wheels", cfg, {
      email: "stranger@x.com",
    } as never);
    expect(JSON.parse(out.body ?? "{}").error).toContain("isn't linked to a desk yet");
    expect(calls).toEqual([]);
  });

  it("400s a body that isn't a boolean rather than coercing it", async () => {
    const { res, out } = fakeRes();
    await servePlaysApi(post({ wheels: "on" }), res, "/api/trade/wheels", config(), ann);
    expect(out.status).toBe(400);
  });

  it("carries the feedback gate and withholds the per-rung 'opens after' while it holds", async () => {
    const { res, out } = fakeRes();
    await servePlaysApi(
      get(),
      res,
      "/api/trade/plays",
      config({
        progression: {
          view: () =>
            Promise.resolve({ wheels: true, unlocked: new Set(), ladderGate: "first-feedback" }),
        },
      }),
      ann,
    );
    const body = JSON.parse(out.body ?? "{}");
    expect(body.gate.reason).toBe("first-feedback");
    expect(body.gate.note).toContain("first feedback filing");
    expect(body.plays.every((p: { locked: boolean }) => p.locked)).toBe(true);
    expect(body.plays.some((p: { opensAfter?: unknown }) => p.opensAfter)).toBe(false);
  });
});
