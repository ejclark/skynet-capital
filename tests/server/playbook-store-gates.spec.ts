import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { BOTS_ONLY_NOTE } from "../../src/domain/playbook-bots-only.js";
import { DELEGATION_LOCKED_NOTE } from "../../src/domain/playbook-delegation.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveSubscriptionsApi } from "../../src/server/subscriptions-api-routes.js";

/**
 * Two rules the Playbook Store API gained in #4642 slice 7 (#4649), kept apart from
 * `subscriptions-api-routes.spec.ts` (at its size budget) so that file's specs stay unchanged:
 *
 *  - #4610 — WHEN a member subscribes an owned account that is not a bot, the server SHALL refuse
 *    with the one Season-1 sentence and SHALL NOT write; leaving (unsubscribe, pause, resume)
 *    stays open on every owned account; gate order is ownership → bot → the delegation fog.
 *  - #4649 — WHEN an owner edits a bot's subscription, the server SHALL save mode, capital and
 *    symbols WITHOUT un-pausing it, behind the same three gates.
 */

interface Answer {
  status?: number;
  body?: string;
}

function fakeRes(): { res: ServerResponse; out: Answer } {
  const out: Answer = {};
  const res = {
    writeHead(status: number) {
      out.status = status;
      return res;
    },
    end(body?: string) {
      out.body = body ?? "";
    },
  } as unknown as ServerResponse;
  return { res, out };
}

function request(method: "GET" | "POST", url: string, body?: unknown): IncomingMessage {
  const req = Readable.from([body === undefined ? "" : JSON.stringify(body)]) as IncomingMessage;
  req.method = method;
  req.url = url;
  req.headers = method === "POST" ? { "content-type": "application/json" } : {};
  return req;
}

const session = { email: "eric@example.com", name: "Eric Clark" } as never;

// Eric owns a human desk on the board, Sauron (a registered persona id, NOT on the board — its
// hub row has not loaded), a board bot with an id no persona carries, and a human account whose
// row has not loaded either.
const OWNED = ["human-eric", "sauron", "bot-on-board", "human-unloaded"];
const participants = [
  { id: "human-eric", kind: "human" },
  { id: "bot-on-board", kind: "bot" },
];

type Calls = { op: string; id: string; [k: string]: unknown }[];

function storeWith(calls: Calls, subscribed: Record<string, string[]> = {}) {
  return {
    load: () =>
      Object.fromEntries(
        OWNED.map((id) => [
          id,
          (subscribed[id] ?? []).map((playbookId) => ({
            accountId: id,
            playbookId,
            mode: "standard",
            capitalAllocated: 1_000,
            enabled: true,
            createdAt: "2026-10-01T00:00:00.000Z",
            updatedAt: "2026-10-01T00:00:00.000Z",
          })),
        ]),
      ),
    subscribe: (id: string, sub: unknown) => calls.push({ op: "subscribe", id, sub }),
    configure: (id: string, playbookId: string, tuning: unknown) => {
      calls.push({ op: "configure", id, playbookId, tuning });
      return subscribed[id]?.includes(playbookId) ? {} : undefined;
    },
    unsubscribe: (id: string, playbookId: string) =>
      calls.push({ op: "unsubscribe", id, playbookId }),
    setEnabled: (id: string, playbookId: string, enabled: boolean) =>
      calls.push({ op: "setEnabled", id, playbookId, enabled }),
  };
}

/** A viewer whose own ladder has the wheels on and rung 102 unearned — the fog is down. */
const fogDown = {
  resolveOwnerId: () => "human-eric",
  progression: {
    view: () => Promise.resolve({ wheels: true, earnedByCode: new Map() }),
  },
};

function configWith(store: unknown, over: Record<string, unknown> = {}): DashboardServerConfig {
  return {
    auth: { providerIds: ["google"] },
    resolveOwnerIds: () => OWNED,
    hub: { getState: () => ({ participants }) },
    subscriptions: store,
    ...over,
  } as unknown as DashboardServerConfig;
}

async function call(
  path: string,
  body: unknown,
  config: DashboardServerConfig,
): Promise<{ status?: number; json: Record<string, unknown> }> {
  const { res, out } = fakeRes();
  const isGet = path.startsWith("/api/playbook-store?");
  await serveSubscriptionsApi(
    request(isGet ? "GET" : "POST", path, body),
    res,
    isGet ? "/api/playbook-store" : path,
    config,
    session,
  );
  return { status: out.status, json: JSON.parse(out.body ?? "{}") };
}

const subscribe = (id: string) => ({
  id,
  playbookId: "S1-NVDA",
  mode: "standard",
  capitalAllocated: 1_000,
});

describe("bots-only subscriptions (#4610)", () => {
  it("refuses a human account with the Season-1 sentence and writes nothing", async () => {
    const calls: Calls = [];
    const answer = await call(
      "/api/playbook-store/subscribe",
      subscribe("human-eric"),
      configWith(storeWith(calls)),
    );
    expect(answer.json).toEqual({ ok: false, error: BOTS_ONLY_NOTE });
    expect(calls).toEqual([]);
  });

  it("refuses a human account whose board row has not loaded, by its human- id", async () => {
    const calls: Calls = [];
    const answer = await call(
      "/api/playbook-store/subscribe",
      subscribe("human-unloaded"),
      configWith(storeWith(calls)),
    );
    expect(answer.json).toEqual({ ok: false, error: BOTS_ONLY_NOTE });
    expect(calls).toEqual([]);
  });

  it("lets a bot through when its board row has not loaded — a persona id is a bot", async () => {
    const calls: Calls = [];
    const answer = await call(
      "/api/playbook-store/subscribe",
      subscribe("sauron"),
      configWith(storeWith(calls)),
    );
    expect(answer.json).toEqual({ ok: true });
    expect(calls).toMatchObject([{ op: "subscribe", id: "sauron" }]);
  });

  it("lets a bot the board knows through, persona or not", async () => {
    const calls: Calls = [];
    const answer = await call(
      "/api/playbook-store/subscribe",
      subscribe("bot-on-board"),
      configWith(storeWith(calls)),
    );
    expect(answer.json).toEqual({ ok: true });
  });

  it("reads no hub as an empty board, never a throw", async () => {
    const calls: Calls = [];
    const answer = await call(
      "/api/playbook-store/subscribe",
      subscribe("sauron"),
      configWith(storeWith(calls), { hub: undefined }),
    );
    expect(answer.json).toEqual({ ok: true });
  });

  describe("gate order: ownership → bot account → the delegation fog", () => {
    it("an account the session does not own hears ownership first", async () => {
      const answer = await call(
        "/api/playbook-store/subscribe",
        subscribe("human-someone-else"),
        configWith(storeWith([]), fogDown),
      );
      expect(answer.json).toEqual({ ok: false, error: "You can only subscribe your own account." });
    });

    it("a human account hears the Season-1 sentence even while the fog is down", async () => {
      const answer = await call(
        "/api/playbook-store/subscribe",
        subscribe("human-eric"),
        configWith(storeWith([]), fogDown),
      );
      expect(answer.json).toEqual({ ok: false, error: BOTS_ONLY_NOTE });
    });

    it("a bot account under a fogged viewer hears the delegation sentence", async () => {
      const answer = await call(
        "/api/playbook-store/subscribe",
        subscribe("sauron"),
        configWith(storeWith([]), fogDown),
      );
      expect(answer.json).toEqual({ ok: false, error: DELEGATION_LOCKED_NOTE });
    });
  });

  it("keeps every exit open on a human account: unsubscribe, pause and resume", async () => {
    const calls: Calls = [];
    const config = configWith(storeWith(calls, { "human-eric": ["S1-NVDA"] }), fogDown);
    const ref = { id: "human-eric", playbookId: "S1-NVDA" };
    expect(
      (await call("/api/playbook-store/set-enabled", { ...ref, enabled: false }, config)).json,
    ).toEqual({ ok: true });
    expect(
      (await call("/api/playbook-store/set-enabled", { ...ref, enabled: true }, config)).json,
    ).toEqual({ ok: true });
    expect((await call("/api/playbook-store/unsubscribe", ref, config)).json).toEqual({ ok: true });
    expect(calls.map((c) => c.op)).toEqual(["setEnabled", "setEnabled", "unsubscribe"]);
  });

  describe("GET index", () => {
    const index = (id: string, store = storeWith([])) =>
      call(`/api/playbook-store?id=${id}`, undefined, configWith(store));

    it("draws the door on an owned human account, with the same sentence", async () => {
      const { json } = await index("human-eric");
      expect(json.botsOnly).toEqual({ locked: true, note: BOTS_ONLY_NOTE });
      expect(json.canManage).toBe(true);
    });

    it("keeps an owned bot account open", async () => {
      expect((await index("sauron")).json.botsOnly).toMatchObject({ locked: false });
    });

    it("still lists a human account's existing subscription, so it can be left", async () => {
      const { json } = await index("human-eric", storeWith([], { "human-eric": ["S1-NVDA"] }));
      const cards = json.cards as { id: string; subscription?: unknown }[];
      expect(cards.find((c) => c.id === "S1-NVDA")?.subscription).toMatchObject({ enabled: true });
    });

    it("counts no human account's saved subscription as an active subscriber — it never trades", async () => {
      const { json } = await index(
        "sauron",
        storeWith([], { "human-eric": ["S1-NVDA"], sauron: ["S1-NVDA"] }),
      );
      const cards = json.cards as { id: string; subscribers?: number }[];
      expect(cards.find((c) => c.id === "S1-NVDA")?.subscribers).toBe(1);
    });

    it("says nothing about the kind of an account the viewer does not own", async () => {
      expect((await index("human-someone-else")).json.botsOnly).toMatchObject({ locked: false });
    });
  });
});

describe("configure (#4649) — edit without un-pausing", () => {
  const edit = (over: Record<string, unknown> = {}) => ({
    id: "sauron",
    playbookId: "HC-SAURON",
    mode: "aggressive",
    capitalAllocated: 8_000,
    symbols: ["nvda", "CRWV"],
    compoundAllocation: true,
    ...over,
  });
  const subscribed = { sauron: ["HC-SAURON", "S1-NVDA"], "human-eric": ["S1-NVDA"] };

  it("hands the store the four tunables and nothing about enabled", async () => {
    const calls: Calls = [];
    const answer = await call(
      "/api/playbook-store/configure",
      edit(),
      configWith(storeWith(calls, subscribed)),
    );
    expect(answer.json).toEqual({ ok: true });
    expect(calls).toEqual([
      {
        op: "configure",
        id: "sauron",
        playbookId: "HC-SAURON",
        tuning: {
          mode: "aggressive",
          capitalAllocated: 8_000,
          symbols: ["NVDA", "CRWV"],
          compoundAllocation: true,
        },
      },
    ]);
  });

  it("reads null capital as uncapped and an empty symbol list as the whole basket", async () => {
    const calls: Calls = [];
    await call(
      "/api/playbook-store/configure",
      edit({ capitalAllocated: null, symbols: [], compoundAllocation: false }),
      configWith(storeWith(calls, subscribed)),
    );
    expect(calls[0]?.tuning).toEqual({ mode: "aggressive" });
  });

  it.each([
    ["capital left out — never uncapped by omission", { capitalAllocated: undefined }],
    ["negative capital", { capitalAllocated: -1 }],
    ["a malformed symbol filter — never widened by dropping it", { symbols: "NVDA" }],
    ["a non-string ticker", { symbols: ["NVDA", 7] }],
    ["compounding that is not a boolean", { compoundAllocation: "yes" }],
    ["an unknown mode", { mode: "reckless" }],
  ])("answers 400 for %s", async (_label, over) => {
    const calls: Calls = [];
    const answer = await call(
      "/api/playbook-store/configure",
      edit(over),
      configWith(storeWith(calls, subscribed)),
    );
    expect(answer.status).toBe(400);
    expect(calls).toEqual([]);
  });

  it("refuses a ticker outside the playbook's basket, in words", async () => {
    const calls: Calls = [];
    const answer = await call(
      "/api/playbook-store/configure",
      edit({ playbookId: "S1-NVDA", symbols: ["CRWV"] }),
      configWith(storeWith(calls, subscribed)),
    );
    expect(answer.json).toEqual({
      ok: false,
      error: "CRWV isn't in S1-NVDA's basket — a symbol filter can only narrow it.",
    });
    expect(calls).toEqual([]);
  });

  it("never creates a subscription — an unsubscribed playbook is refused in words", async () => {
    const answer = await call(
      "/api/playbook-store/configure",
      edit({ playbookId: "G1-GOOG", symbols: [] }),
      configWith(storeWith([], subscribed)),
    );
    expect(answer.json).toEqual({
      ok: false,
      error: "Not subscribed to G1-GOOG — subscribe first.",
    });
  });

  it("lets a fogged viewer LOWER a bot's exposure — reducing risk is never gated", async () => {
    const calls: Calls = [];
    // The stored S1-NVDA subscription is standard · $1,000; this edit is conservative · $500.
    const answer = await call(
      "/api/playbook-store/configure",
      edit({
        playbookId: "S1-NVDA",
        mode: "conservative",
        capitalAllocated: 500,
        symbols: [],
        compoundAllocation: false,
      }),
      configWith(storeWith(calls, subscribed), fogDown),
    );
    expect(answer.json).toEqual({ ok: true });
    expect(calls).toHaveLength(1);
  });

  it("still refuses a fogged viewer's edit that uncaps a bot", async () => {
    const calls: Calls = [];
    const answer = await call(
      "/api/playbook-store/configure",
      edit({
        playbookId: "S1-NVDA",
        mode: "standard",
        capitalAllocated: null,
        symbols: [],
        compoundAllocation: false,
      }),
      configWith(storeWith(calls, subscribed), fogDown),
    );
    expect(answer.json).toMatchObject({ ok: false, error: DELEGATION_LOCKED_NOTE });
    expect(calls).toEqual([]);
  });

  it.each([
    ["an account the session does not own", "bot-elsewhere", {}, "You can only change"],
    ["a human account", "human-eric", {}, BOTS_ONLY_NOTE],
    ["a bot account under a fogged viewer", "sauron", fogDown, DELEGATION_LOCKED_NOTE],
  ])("is gated like subscribe: refuses %s", async (_label, id, over, sentence) => {
    const calls: Calls = [];
    const answer = await call(
      "/api/playbook-store/configure",
      edit({ id, playbookId: "S1-NVDA", symbols: [] }),
      configWith(storeWith(calls, subscribed), over),
    );
    expect(answer.json).toMatchObject({ ok: false });
    expect(String(answer.json.error)).toContain(sentence);
    expect(calls).toEqual([]);
  });
});
