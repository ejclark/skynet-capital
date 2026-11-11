import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { serveCompanionApi } from "../../src/server/companion-routes.js";
import { SCREENSHOT_LIMIT_LINE } from "../../src/server/companion-screenshot-routes.js";
import type {
  CompanionScreenshotStore,
  ScreenshotType,
} from "../../src/server/companion-screenshots-store.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { opaqueMemberId } from "../../src/server/feedback-issue.js";

/**
 * The chat screenshot routes (#6007 slice 1), through the companion dispatcher a request really
 * takes: who may upload and fetch (criteria 7, 8), the type and size checks (11), what a log line
 * carries (9), and a failed write (19).
 */

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 9, 9]);

function fakeRes() {
  const out: { status?: number; headers?: Record<string, string>; body?: string | Buffer } = {};
  const res = {
    writeHead: (status: number, headers?: Record<string, string>) => {
      out.status = status;
      out.headers = headers;
      return res;
    },
    end: (body?: string | Buffer) => {
      if (body !== undefined) out.body = body;
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
const session = (email: string) => ({ email, name: "A Member" }) as never;
const upload = (data: Buffer, type = "image/png") => ({
  name: "shot.png",
  type,
  dataUrl: `data:${type};base64,${data.toString("base64")}`,
});

class MemoryStore implements CompanionScreenshotStore {
  /** What the routes logged through `config.logLine` while serving this store. */
  readonly lines: string[] = [];
  readonly shots = new Map<string, { member: string; type: ScreenshotType; data: Buffer }>();
  failWith: Error | undefined;
  save(member: string, type: ScreenshotType, data: Buffer) {
    if (this.failWith) return Promise.reject(this.failWith);
    const id = (this.shots.size + 1).toString(16).padStart(32, "a");
    this.shots.set(id, { member, type, data });
    return Promise.resolve({ id });
  }
  load(id: string) {
    const shot = this.shots.get(id);
    return Promise.resolve(shot ? { type: shot.type, data: shot.data } : undefined);
  }
}

const configWith = (store: CompanionScreenshotStore | undefined): DashboardServerConfig =>
  ({
    hub: { getState: () => ({ participants: [] }) },
    ...(store ? { companionScreenshots: store } : {}),
    ...(store instanceof MemoryStore ? { logLine: (l: string) => store.lines.push(l) } : {}),
  }) as never;

const PATH = "/api/companion/screenshots";

async function uploadAs(store: MemoryStore, email: string | undefined, body: unknown) {
  const { res, out } = fakeRes();
  const handled = await serveCompanionApi(
    post(body),
    res,
    PATH,
    configWith(store),
    email ? session(email) : undefined,
  );
  const json = typeof out.body === "string" ? JSON.parse(out.body) : undefined;
  return { handled, status: out.status, json };
}

async function fetchAs(store: MemoryStore, email: string | undefined, id: string) {
  const { res, out } = fakeRes();
  const handled = await serveCompanionApi(
    get(),
    res,
    `${PATH}/${id}`,
    configWith(store),
    email ? session(email) : undefined,
  );
  return { handled, ...out };
}

describe("chat screenshots — who may upload and open one", () => {
  it("keeps a signed-in member's PNG under their opaque id and answers with its id only", async () => {
    const store = new MemoryStore();
    const { handled, status, json } = await uploadAs(store, "a@example.com", upload(PNG));
    expect(handled).toBe(true);
    expect(status).toBe(200);
    expect(Object.keys(json)).toEqual(["ok", "id"]);
    expect(store.shots.get(json.id)?.member).toBe(opaqueMemberId("a@example.com"));
  });

  it("serves it to a different signed-in member, with its type, nosniff and private caching (criterion 7)", async () => {
    const store = new MemoryStore();
    const { json } = await uploadAs(store, "a@example.com", upload(JPEG, "image/jpeg"));
    const got = await fetchAs(store, "b@example.com", json.id);
    expect(got.status).toBe(200);
    expect(got.headers).toMatchObject({
      "content-type": "image/jpeg",
      "x-content-type-options": "nosniff",
      "cache-control": "private",
    });
    expect(Buffer.isBuffer(got.body) && got.body.equals(JPEG)).toBe(true);
  });

  it("does not exist for a visitor with no session — upload or fetch (criterion 8)", async () => {
    const store = new MemoryStore();
    const up = await uploadAs(store, undefined, upload(PNG));
    expect(up).toEqual({ handled: false, status: undefined, json: undefined });
    expect(store.shots.size).toBe(0);
    const { json } = await uploadAs(store, "a@example.com", upload(PNG));
    const got = await fetchAs(store, undefined, json.id);
    expect(got.handled).toBe(false);
    expect(got.status).toBeUndefined();
    expect(got.body).toBeUndefined();
  });

  it("says a removed or unknown screenshot is no longer kept, never a broken image", async () => {
    const got = await fetchAs(new MemoryStore(), "a@example.com", "f".repeat(32));
    expect(got.status).toBe(404);
    expect(JSON.parse(String(got.body)).error).toBe("Screenshot no longer kept");
    expect((await fetchAs(new MemoryStore(), "a@example.com", "../index.json")).status).toBe(404);
  });

  it("does not exist when no store is wired (offline)", async () => {
    const { res, out } = fakeRes();
    const handled = await serveCompanionApi(
      post(upload(PNG)),
      res,
      PATH,
      configWith(undefined),
      session("a@example.com"),
    );
    expect(handled).toBe(false);
    expect(out.status).toBeUndefined();
  });
});

describe("chat screenshots — type and size (criterion 11)", () => {
  it("refuses bytes that are not a PNG or JPEG, whatever type was declared, and keeps nothing", async () => {
    const store = new MemoryStore();
    const gif = Buffer.from("GIF89a-not-a-png");
    const { status, json } = await uploadAs(store, "a@example.com", upload(gif, "image/png"));
    expect(status).toBe(400);
    expect(json.error).toBe(SCREENSHOT_LIMIT_LINE);
    expect(store.shots.size).toBe(0);
  });

  it("refuses a declared type outside PNG and JPEG", async () => {
    const store = new MemoryStore();
    const { status } = await uploadAs(store, "a@example.com", upload(PNG, "image/gif"));
    expect(status).toBe(400);
    expect(store.shots.size).toBe(0);
  });

  it("refuses an image over 1.5 MB with a 4xx and keeps nothing", async () => {
    const store = new MemoryStore();
    const big = Buffer.concat([PNG, Buffer.alloc(1_500_001)]);
    const { status } = await uploadAs(store, "a@example.com", upload(big));
    expect(status).toBeGreaterThanOrEqual(400);
    expect(status).toBeLessThan(500);
    expect(store.shots.size).toBe(0);
  });

  it("refuses a body that is not JSON-shaped as one image", async () => {
    const store = new MemoryStore();
    expect((await uploadAs(store, "a@example.com", { images: [upload(PNG)] })).status).toBe(400);
    expect((await uploadAs(store, "a@example.com", "just text")).status).toBe(400);
    expect(store.shots.size).toBe(0);
  });
});

describe("chat screenshots — logs and a failed write", () => {
  it("logs the id and size only — never the bytes or who sent it (criterion 9)", async () => {
    const store = new MemoryStore();
    const { json } = await uploadAs(store, "a@example.com", upload(PNG));
    expect(store.lines).toEqual([`[companion-screenshots] kept ${json.id} (${PNG.length} bytes)`]);
  });

  it("refuses with a plain line when the disk write fails (criterion 19)", async () => {
    const store = new MemoryStore();
    store.failWith = Object.assign(new Error("no space left on device"), { code: "ENOSPC" });
    const { status, json } = await uploadAs(store, "a@example.com", upload(PNG));
    expect(status).toBe(507);
    expect(json.error).toMatch(/still go without it/);
    expect(store.lines).toEqual([`[companion-screenshots] not kept (${PNG.length} bytes): ENOSPC`]);
  });
});
