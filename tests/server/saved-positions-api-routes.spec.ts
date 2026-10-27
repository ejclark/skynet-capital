import { mkdtemp, rm } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { opaqueMemberId } from "../../src/server/feedback-issue.js";
import { serveSavedPositionsApi } from "../../src/server/saved-positions-api-routes.js";
import { SavedPositionsStore } from "../../src/server/saved-positions-store.js";

/**
 * The saved positions API's contract: identity from the session only (a member sees and touches only
 * their own positions), every write body judged strictly (a 400 names the endpoint and writes
 * nothing), a stake that is always scrubbed through the shared whitelist, and a deployment without
 * the store degrading to an honest "not wired" answer rather than a crash.
 */

interface Answer {
  status?: number;
  body?: string;
  headers?: Record<string, string>;
}

function fakeRes(): { res: ServerResponse; out: Answer } {
  const out: Answer = {};
  const res = {
    writeHead(status: number, headers?: Record<string, string>) {
      out.status = status;
      out.headers = headers;
      return res;
    },
    end(body?: string) {
      out.body = body ?? "";
    },
  } as unknown as ServerResponse;
  return { res, out };
}

function request(method: string, body: unknown, contentType?: string): IncomingMessage {
  const chunks = typeof body === "string" ? body : JSON.stringify(body ?? "");
  const req = Readable.from([chunks]) as unknown as IncomingMessage;
  req.method = method;
  req.headers = contentType ? { "content-type": contentType } : {};
  return req;
}

const post = (body: unknown, contentType = "application/json"): IncomingMessage =>
  request("POST", body, contentType);
const get = (): IncomingMessage => request("GET", "");

const ada = { email: "ada@example.com", name: "Ada Lovelace" } as never;
const grace = { email: "grace@example.com", name: "Grace" } as never;
const ADA = opaqueMemberId("ada@example.com");
const GRACE = opaqueMemberId("grace@example.com");

describe("serveSavedPositionsApi", () => {
  let dir: string;
  let store: SavedPositionsStore;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-saved-positions-api-"));
    store = new SavedPositionsStore(join(dir, "saved-positions.json"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const config = (withStore = true): DashboardServerConfig =>
    ({ ...(withStore ? { savedPositions: store } : {}) }) as unknown as DashboardServerConfig;

  async function call(
    req: IncomingMessage,
    path: string,
    session: unknown = ada,
    cfg: DashboardServerConfig = config(),
  ): Promise<{ handled: boolean; out: Answer; json: unknown }> {
    const { res, out } = fakeRes();
    const handled = await serveSavedPositionsApi(req, res, path, cfg, session as never);
    let json: unknown;
    try {
      json = out.body ? JSON.parse(out.body) : undefined;
    } catch {
      json = undefined;
    }
    return { handled, out, json };
  }

  describe("when the request does not belong to this route", () => {
    it("answers false and writes nothing for an unauthenticated caller", async () => {
      const { handled, out } = await call(get(), "/api/saved-positions", null);
      expect(handled).toBe(false);
      expect(out.status).toBeUndefined();
    });

    it("answers false for a path outside /api/saved-positions", async () => {
      const { handled, out } = await call(get(), "/api/companion");
      expect(handled).toBe(false);
      expect(out.status).toBeUndefined();
    });

    it("answers false for a near-miss path such as a trailing segment", async () => {
      const { handled } = await call(post({}), "/api/saved-positions/save/extra");
      expect(handled).toBe(false);
    });

    it("does not touch the store for an unauthenticated write", async () => {
      const body = { symbol: "NVDA", name: "sneaky" };
      const { handled } = await call(post(body), "/api/saved-positions/save", null);
      expect(handled).toBe(false);
      expect(store.load()).toEqual({});
    });
  });

  describe("when listing positions", () => {
    it("returns an empty list for a member who has saved nothing", async () => {
      const { handled, out, json } = await call(get(), "/api/saved-positions");
      expect(handled).toBe(true);
      expect(out.status).toBe(200);
      expect(json).toEqual({ positions: [] });
    });

    it("returns only the signed-in member's own positions", async () => {
      store.save(ADA, { symbol: "NVDA", name: "Ada's NVDA", stake: { shares: 10 } });
      store.save(GRACE, { symbol: "AMD", name: "Grace's AMD", stake: { shares: 5 } });

      const { json } = await call(get(), "/api/saved-positions", ada);
      const names = (json as { positions: { name: string }[] }).positions.map((p) => p.name);
      expect(names).toEqual(["Ada's NVDA"]);

      const theirs = await call(get(), "/api/saved-positions", grace);
      const theirNames = (theirs.json as { positions: { name: string }[] }).positions.map(
        (p) => p.name,
      );
      expect(theirNames).toEqual(["Grace's AMD"]);
    });

    it("refuses a non-GET method with a 405 that names GET", async () => {
      const { handled, out } = await call(post({}), "/api/saved-positions");
      expect(handled).toBe(true);
      expect(out.status).toBe(405);
      expect(out.headers?.allow).toBe("GET");
    });
  });

  describe("when saving a position", () => {
    it("stores it under the member and returns the created position", async () => {
      const { out, json } = await call(
        post({ symbol: "NVDA", name: "My NVDA shares", stake: { shares: 100, costBasis: 120.5 } }),
        "/api/saved-positions/save",
      );
      expect(out.status).toBe(200);
      const answer = json as { ok: boolean; position: Record<string, unknown> };
      expect(answer.ok).toBe(true);
      expect(answer.position).toMatchObject({
        symbol: "NVDA",
        name: "My NVDA shares",
        stake: { shares: 100, costBasis: 120.5 },
      });
      expect(typeof answer.position.id).toBe("string");
      expect(store.list(ADA)).toHaveLength(1);
      expect(store.list(GRACE)).toHaveLength(0);
    });

    it("appends rather than replaces when the same symbol is saved twice", async () => {
      await call(post({ symbol: "CRWV", name: "real calls" }), "/api/saved-positions/save");
      await call(post({ symbol: "CRWV", name: "what-if" }), "/api/saved-positions/save");
      expect(store.list(ADA).map((p) => p.name)).toEqual(["real calls", "what-if"]);
    });

    it("trims the name", async () => {
      const { json } = await call(
        post({ symbol: "AMD", name: "  padded name  " }),
        "/api/saved-positions/save",
      );
      expect((json as { position: { name: string } }).position.name).toBe("padded name");
    });

    it("accepts a class-share ticker such as BRK.B", async () => {
      const { out } = await call(
        post({ symbol: "BRK.B", name: "berkshire" }),
        "/api/saved-positions/save",
      );
      expect(out.status).toBe(200);
      expect(store.list(ADA)[0]?.symbol).toBe("BRK.B");
    });

    it("scrubs the stake: only whitelisted, valid fields survive", async () => {
      const { json } = await call(
        post({
          symbol: "NVDA",
          name: "dirty stake",
          stake: {
            shares: 10.9,
            costBasis: -5,
            goal: "yolo",
            openCalls: [{ strike: 1 }],
            evil: "<script>",
          },
        }),
        "/api/saved-positions/save",
      );
      expect((json as { position: { stake: unknown } }).position.stake).toEqual({ shares: 10 });
    });

    it("saves an empty stake when none is supplied", async () => {
      const { json } = await call(
        post({ symbol: "NVDA", name: "no stake yet" }),
        "/api/saved-positions/save",
      );
      expect((json as { position: { stake: unknown } }).position.stake).toEqual({});
    });

    it.each([
      ["a lowercase symbol", { symbol: "nvda", name: "x" }],
      ["a symbol with an injection", { symbol: "NVDA; DROP", name: "x" }],
      ["a symbol that is too long", { symbol: "ABCDEFG", name: "x" }],
      ["a non-string symbol", { symbol: 42, name: "x" }],
      ["a missing symbol", { name: "x" }],
      ["a missing name", { symbol: "NVDA" }],
      ["an empty name", { symbol: "NVDA", name: "" }],
      ["a whitespace-only name", { symbol: "NVDA", name: "   " }],
      ["a name over 60 characters", { symbol: "NVDA", name: "n".repeat(61) }],
      ["a non-string name", { symbol: "NVDA", name: 7 }],
    ])("answers 400 and writes nothing for %s", async (_label, body) => {
      const { out, json } = await call(post(body), "/api/saved-positions/save");
      expect(out.status).toBe(400);
      expect(json).toEqual({ error: "malformed save body" });
      expect(store.load()).toEqual({});
    });

    it("accepts a name of exactly 60 characters", async () => {
      const { out } = await call(
        post({ symbol: "NVDA", name: "n".repeat(60) }),
        "/api/saved-positions/save",
      );
      expect(out.status).toBe(200);
    });

    it.each([
      ["invalid JSON", "{not json"],
      ["a JSON array", "[1,2]"],
      ["a JSON scalar", "42"],
      ["JSON null", "null"],
    ])("answers 400 for a body that is %s", async (_label, raw) => {
      const { out } = await call(post(raw), "/api/saved-positions/save");
      expect(out.status).toBe(400);
    });
  });

  describe("when updating a position", () => {
    async function seed(): Promise<string> {
      const { json } = await call(
        post({ symbol: "NVDA", name: "original", stake: { shares: 10 } }),
        "/api/saved-positions/save",
      );
      return (json as { position: { id: string } }).position.id;
    }

    it("renames it and leaves the stake untouched", async () => {
      const id = await seed();
      const { out, json } = await call(
        post({ id, name: "  renamed  " }),
        "/api/saved-positions/update",
      );
      expect(out.status).toBe(200);
      expect(json).toEqual({ ok: true });
      expect(store.list(ADA)[0]).toMatchObject({ name: "renamed", stake: { shares: 10 } });
    });

    it("replaces the stake (scrubbed) and leaves the name untouched", async () => {
      const id = await seed();
      await call(
        post({ id, stake: { shares: 25, goal: "income", junk: true } }),
        "/api/saved-positions/update",
      );
      expect(store.list(ADA)[0]).toMatchObject({
        name: "original",
        stake: { shares: 25, goal: "income" },
      });
      expect(store.list(ADA)[0]?.stake).not.toHaveProperty("junk");
    });

    it("updates name and stake together", async () => {
      const id = await seed();
      await call(post({ id, name: "both", stake: { cash: 500 } }), "/api/saved-positions/update");
      expect(store.list(ADA)[0]).toMatchObject({ name: "both", stake: { cash: 500 } });
    });

    it("cannot reach another member's position", async () => {
      const graceId = store.save(GRACE, {
        symbol: "AMD",
        name: "hers",
        stake: { shares: 1 },
      }).id;
      const { out } = await call(
        post({ id: graceId, name: "hijacked" }),
        "/api/saved-positions/update",
        ada,
      );
      expect(out.status).toBe(200);
      expect(store.list(GRACE)[0]?.name).toBe("hers");
    });

    it.each([
      ["no id", { name: "x" }],
      ["an empty id", { id: "", name: "x" }],
      ["an id over 40 characters", { id: "i".repeat(41), name: "x" }],
      ["a non-string id", { id: 5, name: "x" }],
      ["neither a name nor a stake", { id: "abc" }],
      ["a blank name", { id: "abc", name: "   " }],
      ["an over-long name", { id: "abc", name: "n".repeat(61) }],
      ["a non-string name", { id: "abc", name: 3 }],
    ])("answers 400 for %s", async (_label, body) => {
      const { out, json } = await call(post(body), "/api/saved-positions/update");
      expect(out.status).toBe(400);
      expect(json).toEqual({ error: "malformed update body" });
    });

    it("rejects a bad name even when a valid stake rides along", async () => {
      const id = await seed();
      const { out } = await call(
        post({ id, name: "   ", stake: { shares: 99 } }),
        "/api/saved-positions/update",
      );
      expect(out.status).toBe(400);
      expect(store.list(ADA)[0]).toMatchObject({ name: "original", stake: { shares: 10 } });
    });

    it("accepts an id of exactly 40 characters", async () => {
      const { out } = await call(
        post({ id: "i".repeat(40), name: "nobody home" }),
        "/api/saved-positions/update",
      );
      expect(out.status).toBe(200);
    });

    it("treats an unknown id as a harmless no-op", async () => {
      await seed();
      const { out, json } = await call(
        post({ id: "does-not-exist", name: "ghost" }),
        "/api/saved-positions/update",
      );
      expect(out.status).toBe(200);
      expect(json).toEqual({ ok: true });
      expect(store.list(ADA).map((p) => p.name)).toEqual(["original"]);
    });
  });

  describe("when deleting a position", () => {
    it("removes the member's own position", async () => {
      const id = store.save(ADA, { symbol: "NVDA", name: "mine", stake: {} }).id;
      const { out, json } = await call(post({ id }), "/api/saved-positions/delete");
      expect(out.status).toBe(200);
      expect(json).toEqual({ ok: true });
      expect(store.list(ADA)).toHaveLength(0);
    });

    it("cannot delete another member's position", async () => {
      const graceId = store.save(GRACE, { symbol: "AMD", name: "hers", stake: {} }).id;
      await call(post({ id: graceId }), "/api/saved-positions/delete", ada);
      expect(store.list(GRACE)).toHaveLength(1);
    });

    it.each([
      ["no id", {}],
      ["an empty id", { id: "" }],
      ["an id over 40 characters", { id: "i".repeat(41) }],
      ["a non-string id", { id: 12 }],
    ])("answers 400 for %s", async (_label, body) => {
      const { out, json } = await call(post(body), "/api/saved-positions/delete");
      expect(out.status).toBe(400);
      expect(json).toEqual({ error: "malformed delete body" });
    });
  });

  describe("when a write is malformed at the transport level", () => {
    it.each([
      "/api/saved-positions/save",
      "/api/saved-positions/update",
      "/api/saved-positions/delete",
    ])("refuses a GET to %s with a 405 that names POST", async (path) => {
      const { handled, out } = await call(get(), path);
      expect(handled).toBe(true);
      expect(out.status).toBe(405);
      expect(out.headers?.allow).toBe("POST");
    });

    it("refuses a non-JSON content type with a 415", async () => {
      const { out } = await call(
        post({ symbol: "NVDA", name: "x" }, "text/plain"),
        "/api/saved-positions/save",
      );
      expect(out.status).toBe(415);
      expect(store.load()).toEqual({});
    });

    it("refuses a body over the 4 KB cap with a 413", async () => {
      const { out } = await call(
        post({ symbol: "NVDA", name: "x", stake: { pad: "p".repeat(5_000) } }),
        "/api/saved-positions/save",
      );
      expect(out.status).toBe(413);
      expect(store.load()).toEqual({});
    });
  });

  describe("when the deployment has no saved-positions store", () => {
    it("lists an empty set rather than failing", async () => {
      const { handled, out, json } = await call(get(), "/api/saved-positions", ada, config(false));
      expect(handled).toBe(true);
      expect(out.status).toBe(200);
      expect(json).toEqual({ positions: [] });
    });

    it("still enforces GET-only on the list route", async () => {
      const { out } = await call(post({}), "/api/saved-positions", ada, config(false));
      expect(out.status).toBe(405);
    });

    it.each([
      "/api/saved-positions/save",
      "/api/saved-positions/update",
      "/api/saved-positions/delete",
    ])("answers a write to %s with ok:false and an honest reason", async (path) => {
      const { out, json } = await call(
        post({ symbol: "NVDA", name: "x" }),
        path,
        ada,
        config(false),
      );
      expect(out.status).toBe(200);
      expect(json).toEqual({
        ok: false,
        error: "Saved positions aren't wired in this deployment.",
      });
    });

    it("still enforces the JSON content type on writes", async () => {
      const { out } = await call(
        post("x", "text/plain"),
        "/api/saved-positions/save",
        ada,
        config(false),
      );
      expect(out.status).toBe(415);
    });
  });
});
