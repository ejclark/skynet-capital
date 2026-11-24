import { mkdtempSync, rmSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { JsonlAlertDeliveryStore } from "../../src/adapters/jsonl-alert-delivery-store.js";
import { DELIVERY_OFF } from "../../src/alerts/alert-delivery.js";
import type { AlertDeliveryPort } from "../../src/ports/alert-delivery.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import {
  FILL_WATCH_PATH,
  MAX_WATCHES,
  serveFillWatchApi,
} from "../../src/server/fill-watch-route.js";

/**
 * "Email me when it fills" (#8251). The behaviours worth a spec are the ones a member or an
 * attacker would notice: the address comes off the session and never the body; another account's
 * order cannot be watched; the link is the configured origin or the tap's own, never a guess; the
 * account-wide choice does not move; a modify moves the watch; and every unavailable state answers
 * in a sentence.
 */

function fakeRes() {
  const out: { status?: number; body?: string } = {};
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

function request(
  method: string,
  url: string,
  body?: unknown,
  host = "app.example",
): IncomingMessage {
  const req = Readable.from(
    body === undefined ? [] : [JSON.stringify(body)],
  ) as unknown as IncomingMessage;
  req.method = method;
  req.url = url;
  req.headers = { "content-type": "application/json", host, "x-forwarded-proto": "https" };
  return req;
}

const json = (out: { body?: string }): Record<string, unknown> => JSON.parse(out.body ?? "{}");

const transport: AlertDeliveryPort = {
  channel: "email",
  from: "Skynet <alerts@x.com>",
  send: () => Promise.resolve({ ok: true }),
};

const owner = { email: "owner@x.com" } as never;
const stranger = { email: "stranger@x.com" } as never;
const loginOnly = { email: "no-address" } as never;

describe("/api/trade/alerts/fill-watch", () => {
  let dir: string;
  let store: JsonlAlertDeliveryStore;
  let nudged: string[];
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "fill-watch-route-"));
    store = new JsonlAlertDeliveryStore(dir);
    nudged = [];
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function config(over: Record<string, unknown> = {}): DashboardServerConfig {
    return {
      auth: {},
      resolveOwnerId: (email: string) => (email === "owner@x.com" ? "human-acct" : undefined),
      now: () => new Date("2026-11-24T02:00:00Z"),
      alertDeliveryStore: store,
      alertDelivery: transport,
      alertDeliveryNudge: (id: string) => nudged.push(id),
      ...over,
    } as unknown as DashboardServerConfig;
  }

  async function arm(
    body: Record<string, unknown>,
    cfg = config(),
    session = owner,
    host?: string,
  ) {
    const { res, out } = fakeRes();
    await serveFillWatchApi(
      request("POST", FILL_WATCH_PATH, body, host),
      res,
      FILL_WATCH_PATH,
      cfg,
      session,
    );
    return { status: out.status, body: json(out) };
  }

  async function read(orderId: string, cfg = config(), session = owner) {
    const { res, out } = fakeRes();
    const url = `${FILL_WATCH_PATH}?participantId=human-acct&orderId=${orderId}`;
    await serveFillWatchApi(request("GET", url), res, FILL_WATCH_PATH, cfg, session);
    return json(out);
  }

  it("arms a watch with the session's address — never the body's — and the tap's own origin", async () => {
    const answer = await arm({
      participantId: "human-acct",
      orderId: "ord-1",
      destination: "attacker@evil.example",
    });
    expect(answer.body).toEqual({ ok: true, watching: true, destination: "owner@x.com" });
    const { watches, prefs } = await store.load("human-acct");
    expect(watches).toEqual([
      {
        orderId: "ord-1",
        destination: "owner@x.com",
        link: "https://app.example/app/trade?desk=human-acct&section=orders",
        at: "2026-11-24T02:00:00.000Z",
      },
    ]);
    // The account-wide choice did not move.
    expect(prefs).toEqual(DELIVERY_OFF);
    expect(nudged).toEqual(["human-acct"]);
    expect(await read("ord-1")).toEqual({
      available: true,
      watching: true,
      destination: "owner@x.com",
    });
  });

  it("builds the link from the configured public origin when there is one", async () => {
    await arm(
      { participantId: "human-acct", orderId: "ord-1" },
      config({ publicUrl: "https://configured.example/" }),
      owner,
      "spoofed.example",
    );
    const [watch] = (await store.load("human-acct")).watches;
    expect(watch?.link).toBe("https://configured.example/app/trade?desk=human-acct&section=orders");
  });

  it("refuses another account's order", async () => {
    const answer = await arm({ participantId: "human-acct", orderId: "ord-1" }, config(), stranger);
    expect(answer.body).toEqual({
      ok: false,
      refusals: ["You can only watch orders on your own account."],
    });
    expect((await store.load("human-acct")).watches).toEqual([]);
  });

  it("rejects a malformed order id", async () => {
    const answer = await arm({ participantId: "human-acct", orderId: "../../etc" });
    expect(answer.status).toBe(400);
  });

  it.each([
    [
      "no transport (production until #6501)",
      { alertDelivery: undefined },
      owner,
      "Email isn't set up",
    ],
    ["no store", { alertDeliveryStore: undefined }, owner, "can't send email"],
    ["no address on the session", {}, loginOnly, "didn't give us an email address"],
  ])("answers in words when unavailable: %s", async (_label, over, session, words) => {
    const cfg = config(over);
    const { res, out } = fakeRes();
    const url = `${FILL_WATCH_PATH}?participantId=human-acct&orderId=ord-1`;
    // An address-less session still owns its account through the auth config.
    const ownedCfg = {
      ...cfg,
      resolveOwnerId: () => "human-acct",
    } as unknown as DashboardServerConfig;
    await serveFillWatchApi(request("GET", url), res, FILL_WATCH_PATH, ownedCfg, session);
    const body = json(out);
    expect(body.available).toBe(false);
    expect(String(body.reason)).toContain(words);
    const answer = await arm({ participantId: "human-acct", orderId: "ord-1" }, ownedCfg, session);
    expect(answer.body.ok).toBe(false);
  });

  it("moves the watch to a modify's new order id, and ignores a modify of an unwatched order", async () => {
    await arm({ participantId: "human-acct", orderId: "ord-1" });
    const moved = await arm({ participantId: "human-acct", orderId: "ord-2", replaces: "ord-1" });
    expect(moved.body).toMatchObject({ ok: true, watching: true });
    expect((await store.load("human-acct")).watches.map((w) => w.orderId)).toEqual(["ord-2"]);

    const untouched = await arm({
      participantId: "human-acct",
      orderId: "ord-9",
      replaces: "ord-8",
    });
    expect(untouched.body).toEqual({ ok: true, watching: false });
    expect((await store.load("human-acct")).watches.map((w) => w.orderId)).toEqual(["ord-2"]);
  });

  it(`holds at most ${MAX_WATCHES} open watches per account`, async () => {
    for (let i = 0; i < MAX_WATCHES; i += 1) {
      await arm({ participantId: "human-acct", orderId: `ord-${i}` });
    }
    const over = await arm({ participantId: "human-acct", orderId: "ord-extra" });
    expect(over.body.ok).toBe(false);
    // Re-arming one already held is not a new watch.
    const again = await arm({ participantId: "human-acct", orderId: "ord-0" });
    expect(again.body.ok).toBe(true);
  });
});
