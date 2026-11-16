import { mkdtempSync, rmSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { BOOK_WAIT_PATH, serveBookWaitApi } from "../../src/server/book-wait-routes.js";
import { BookWaitStore } from "../../src/server/book-wait-store.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";

/**
 * #4608 slice 1, through the routes: the owner records a wait on their book with the day it
 * reopens; it reads as standing until that day and as reopened from it; nobody else can read it,
 * set it or clear it; and a wait with no reopen day is refused.
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

function request(method: "GET" | "POST", url: string, body?: unknown): IncomingMessage {
  const req = Readable.from(
    body === undefined ? [] : [JSON.stringify(body)],
  ) as unknown as IncomingMessage;
  req.method = method;
  req.url = url;
  req.headers = { "content-type": "application/json" };
  return req;
}

let dir: string;
let now: Date;
let config: DashboardServerConfig;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "book-wait-routes-"));
  // 10:00 ET on Tuesday 2026-11-10.
  now = new Date("2026-11-10T15:00:00Z");
  const desk = (id: string) => ({ id, kind: "human", cash: 1_000, equity: 1_000, positions: [] });
  config = {
    hub: { getState: () => ({ participants: [desk("ann-1"), desk("bob-1")] }) },
    auth: { providerIds: ["google"] },
    resolveOwnerId: (email: string) => ({ "ann@x.com": "ann-1", "bob@x.com": "bob-1" })[email],
    now: () => now,
    bookWaits: new BookWaitStore(join(dir, "book-waits.json")),
  } as unknown as DashboardServerConfig;
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const ann = { email: "ann@x.com" } as never;
const bob = { email: "bob@x.com" } as never;

async function call(
  method: "GET" | "POST",
  path: string,
  session: never,
  body?: unknown,
  query = "",
) {
  const { res, out } = fakeRes();
  const answered = await serveBookWaitApi(
    request(method, `${path}${query}`, body),
    res,
    path,
    config,
    session,
  );
  const text = out.body ?? "";
  return { answered, status: out.status, body: text.startsWith("{") ? JSON.parse(text) : text };
}

const read = (session: never, query = "") => call("GET", BOOK_WAIT_PATH, session, undefined, query);
const set = (session: never, body: unknown) => call("POST", `${BOOK_WAIT_PATH}/set`, session, body);
const clear = (session: never, body: unknown) =>
  call("POST", `${BOOK_WAIT_PATH}/clear`, session, body);

const wait = { participantId: "ann-1", reopensOn: "2026-11-20", reason: "CPI first" };

describe("/api/book-wait", () => {
  it("claims only its own paths", async () => {
    const { res } = fakeRes();
    expect(
      await serveBookWaitApi(request("GET", "/api/quests"), res, "/api/quests", config, ann),
    ).toBe(false);
  });

  it("reads no wait on a book that has none", async () => {
    expect(await read(ann)).toMatchObject({ answered: true, status: 200, body: { wait: null } });
  });

  it("records the owner's wait and reads it back as standing, with the days left", async () => {
    const saved = await set(ann, wait);
    expect(saved.status).toBe(200);
    expect(saved.body).toEqual({
      ok: true,
      wait: {
        state: "standing",
        daysLeft: 10,
        wait: { reopensOn: "2026-11-20", reason: "CPI first", setAt: now.toISOString() },
      },
    });
    expect((await read(ann)).body).toEqual({ wait: saved.body.wait });
    expect((await read(ann, "?participantId=ann-1")).body).toEqual({ wait: saved.body.wait });
  });

  it("retires the wait on its reopen day: the question is open again", async () => {
    await set(ann, wait);
    // 09:00 ET on 2026-11-20 — the reopen day, before the open.
    now = new Date("2026-11-20T14:00:00Z");
    expect((await read(ann)).body.wait).toMatchObject({ state: "reopened" });
    // 23:30 ET on 2026-11-19 is still the day before in market time.
    now = new Date("2026-11-20T04:30:00Z");
    expect((await read(ann)).body.wait).toMatchObject({ state: "standing", daysLeft: 1 });
  });

  it("refuses a wait with no reopen day, saying why, and records nothing", async () => {
    const refused = await set(ann, { participantId: "ann-1", reason: "just because" });
    expect(refused.status).toBe(400);
    expect(refused.body).toEqual({
      ok: false,
      error: "Pick the day the question opens again — a wait needs a date.",
    });
    expect((await read(ann)).body).toEqual({ wait: null });
  });

  it("refuses a reopen day that is not ahead of today in market time", async () => {
    const refused = await set(ann, { ...wait, reopensOn: "2026-11-10" });
    expect(refused).toMatchObject({ status: 400, body: { ok: false } });
  });

  it("clears the owner's wait", async () => {
    await set(ann, wait);
    expect((await clear(ann, { participantId: "ann-1" })).body).toEqual({ ok: true });
    expect((await read(ann)).body).toEqual({ wait: null });
  });

  it("never shows, sets or clears a wait on a book the viewer does not own", async () => {
    await set(ann, wait);
    expect(await read(bob, "?participantId=ann-1")).toMatchObject({ status: 404 });
    expect(await set(bob, { ...wait, reason: "not yours" })).toMatchObject({ status: 404 });
    expect(await clear(bob, { participantId: "ann-1" })).toMatchObject({ status: 404 });
    expect((await read(ann)).body.wait.wait.reason).toBe("CPI first");
    // Bob's own book is still his to wait on.
    expect((await read(bob)).body).toEqual({ wait: null });
  });

  it("answers 404 for an account that does not exist, even to its would-be owner", async () => {
    config = { ...config, resolveOwnerId: () => "ghost-1" } as DashboardServerConfig;
    expect(await read(ann)).toMatchObject({ status: 404 });
    expect(await set(ann, { ...wait, participantId: "ghost-1" })).toMatchObject({ status: 404 });
  });

  it("says plainly when the store is not wired, and reads no wait", async () => {
    config = { ...config, bookWaits: undefined } as DashboardServerConfig;
    expect((await read(ann)).body).toEqual({ wait: null });
    expect((await set(ann, wait)).body).toEqual({
      ok: false,
      error: "Waits aren't wired in this deployment.",
    });
  });

  it("is GET to read and POST to write", async () => {
    expect(await call("POST", BOOK_WAIT_PATH, ann, {})).toMatchObject({ status: 405 });
    expect(await call("GET", `${BOOK_WAIT_PATH}/set`, ann)).toMatchObject({ status: 405 });
  });
});
