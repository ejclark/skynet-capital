import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import { resolveAuth } from "../../src/server/auth/resolve-auth.js";
import { type Session, signSession } from "../../src/server/auth/session.js";
import { createDashboardServer } from "../../src/server/dashboard-server.js";
import { opaqueMemberId } from "../../src/server/feedback-attribution.js";
import {
  APP_SCREENS,
  appScreenOf,
  createMemberVisitStore,
  JsonMemberVisitStore,
  type MemberVisitDay,
  type MemberVisitStore,
  memberActivity,
  noteAppVisit,
  VISIT_RETENTION_DAYS,
} from "../../src/server/member-visits.js";
import { ObservatoryHub } from "../../src/server/observatory-hub.js";

/**
 * Member visits (#8169): the day each member last opened the app and the screens they landed on,
 * so retention is measurable. One section per acceptance criterion on the issue.
 */

/** Noon in New York on `day` — far from either midnight, so the market day is unambiguous. */
const at = (day: string): Date => new Date(`${day}T17:00:00Z`);

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "member-visits-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("appScreenOf — a page load names a screen, never free text", () => {
  it("reduces a route to its top-level screen and drops ids and query strings", () => {
    expect(appScreenOf("/app")).toBe("/app");
    expect(appScreenOf("/app/")).toBe("/app");
    expect(appScreenOf("/app/trade")).toBe("/app/trade");
    expect(appScreenOf("/app/u/day-trader/pulse")).toBe("/app/u");
    expect(appScreenOf("/app/learn/trading")).toBe("/app/learn");
  });

  it("folds a segment the shell has no screen for into /app/other", () => {
    expect(appScreenOf("/app/AAPL")).toBe("/app/other");
    expect(appScreenOf("/app/anything-typed-here")).toBe("/app/other");
  });

  it("is not a page load for built assets or any file", () => {
    expect(appScreenOf("/app/static/js/index.abc123.js")).toBeUndefined();
    expect(appScreenOf("/app/favicon.ico")).toBeUndefined();
    expect(appScreenOf("/login")).toBeUndefined();
    expect(appScreenOf("/application")).toBeUndefined();
  });

  it("knows every top-level screen in app/src/routes (add the new word to APP_SCREENS)", async () => {
    const files = await readdir(join("app", "src", "routes"));
    const screens = new Set(
      files
        .filter((f) => f.endsWith(".tsx"))
        .map((f) => (f.split(".")[0] as string).replace(/_$/, ""))
        .filter((s) => !(s.startsWith("_") || s === "index")),
    );
    expect(screens.size).toBeGreaterThanOrEqual(10); // the scan must not go blind
    expect([...screens].sort()).toEqual([...APP_SCREENS].sort());
  });
});

describe("JsonMemberVisitStore — one row per member per day", () => {
  it("upserts the day's row: the count grows and the route set holds each screen once", () => {
    const store = new JsonMemberVisitStore(dir);
    store.record("m1", "/app/trade", at("2026-11-20"));
    store.record("m1", "/app/league", at("2026-11-20"));
    store.record("m1", "/app/trade", at("2026-11-20"));
    store.record("m2", "/app", at("2026-11-20"));
    expect(store.list(at("2026-11-20"))).toEqual([
      { memberId: "m1", day: "2026-11-20", loads: 3, routes: ["/app/league", "/app/trade"] },
      { memberId: "m2", day: "2026-11-20", loads: 1, routes: ["/app"] },
    ]);
  });

  it("starts a new row on the next market day and survives a fresh instance (a redeploy)", () => {
    new JsonMemberVisitStore(dir).record("m1", "/app", at("2026-11-20"));
    new JsonMemberVisitStore(dir).record("m1", "/app/trade", at("2026-11-21"));
    const rows = new JsonMemberVisitStore(dir).list(at("2026-11-21"));
    expect(rows.map((r) => [r.day, r.loads, r.routes])).toEqual([
      ["2026-11-20", 1, ["/app"]],
      ["2026-11-21", 1, ["/app/trade"]],
    ]);
  });

  it("dates a visit by the New York day, not UTC", () => {
    const store = new JsonMemberVisitStore(dir);
    // 02:00 UTC on the 21st is still the evening of the 20th in New York.
    store.record("m1", "/app", new Date("2026-11-21T02:00:00Z"));
    expect(store.list(at("2026-11-21"))[0]?.day).toBe("2026-11-20");
  });

  it(`keeps ${VISIT_RETENTION_DAYS} days and drops older rows`, async () => {
    const store = new JsonMemberVisitStore(dir);
    store.record("m1", "/app", at("2026-01-01"));
    store.record("m1", "/app", at("2026-05-30")); // 180th day back from 2026-11-25, kept
    store.record("m1", "/app", at("2026-05-29")); // 181st, dropped
    store.record("m1", "/app", at("2026-11-25")); // the first write of a new day prunes
    expect(store.list(at("2026-11-25")).map((r) => r.day)).toEqual(["2026-05-30", "2026-11-25"]);
    expect((await readdir(dir)).sort()).toEqual(["2026-05-30.json", "2026-11-25.json"]);
  });

  it("ignores rows past retention on read, even when no write has pruned them", () => {
    const store = new JsonMemberVisitStore(dir);
    store.record("m1", "/app", at("2026-01-01"));
    expect(store.list(at("2026-11-25"))).toEqual([]);
  });

  it("leaves a day's file it cannot read whole untouched, and says so", async () => {
    await writeFile(join(dir, "2026-11-20.json"), "{not json", "utf8");
    const warnings: string[] = [];
    const store = new JsonMemberVisitStore(dir, (m) => warnings.push(m));
    store.record("m1", "/app", at("2026-11-20"));
    expect(warnings.length).toBeGreaterThan(0);
    expect(store.list(at("2026-11-20"))).toEqual([]);
  });
});

describe("createMemberVisitStore — on the volume in production, local data/ otherwise", () => {
  it("defaults to a local path and honours the explicit override", () => {
    const store = createMemberVisitStore({ SKYNET_MEMBER_VISITS_DIR: dir });
    store.record("m1", "/app", at("2026-11-20"));
    expect(new JsonMemberVisitStore(dir).list(at("2026-11-20"))).toHaveLength(1);
  });
});

describe("noteAppVisit — never fails the request", () => {
  const session: Session = { email: "Member@Gmail.com", provider: "google", exp: 0 };

  it("records the session's opaque id, never the email", () => {
    const store = new JsonMemberVisitStore(dir);
    noteAppVisit(store, session, "/app/trade", at("2026-11-20"));
    const [row] = store.list(at("2026-11-20"));
    expect(row?.memberId).toBe(opaqueMemberId("member@gmail.com"));
    expect(JSON.stringify(row)).not.toContain("gmail");
  });

  it("records nothing without a session or for an asset", () => {
    const store = new JsonMemberVisitStore(dir);
    noteAppVisit(store, undefined, "/app/trade", at("2026-11-20"));
    noteAppVisit(store, session, "/app/static/js/x.js", at("2026-11-20"));
    expect(store.list(at("2026-11-20"))).toEqual([]);
  });

  it("swallows a store error", () => {
    const broken: MemberVisitStore = {
      record: () => {
        throw new Error("disk full");
      },
      list: () => [],
    };
    const warn = rstest.spyOn(process, "emitWarning").mockImplementation(() => undefined);
    expect(() => noteAppVisit(broken, session, "/app", at("2026-11-20"))).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("disk full"));
    warn.mockRestore();
  });
});

describe("memberActivity — last seen and days active in the last 7 / 30", () => {
  const row = (memberId: string, day: string): MemberVisitDay => ({
    memberId,
    day,
    loads: 1,
    routes: ["/app"],
  });

  it("counts distinct days inside each window, today included", () => {
    const rows = [
      row("m1", "2026-11-24"),
      row("m1", "2026-11-18"), // 6 days back: inside 7
      row("m1", "2026-11-17"), // 7 days back: outside 7, inside 30
      row("m1", "2026-10-26"), // 29 days back: inside 30
      row("m1", "2026-10-25"), // 30 days back: outside both
      row("m2", "2026-09-01"),
    ];
    const activity = memberActivity(rows, at("2026-11-24"));
    expect(activity.get("m1")).toEqual({ lastSeen: "2026-11-24", activeDays7: 2, activeDays30: 4 });
    expect(activity.get("m2")).toEqual({ lastSeen: "2026-09-01", activeDays7: 0, activeDays30: 0 });
    expect(activity.has("m3")).toBe(false);
  });
});

describe("the dashboard server records signed-in shell loads only", () => {
  const SECRET = "sess";
  const auth = resolveAuth({
    SKYNET_SESSION_SECRET: SECRET,
    SKYNET_GOOGLE_CLIENT_ID: "gid",
    SKYNET_GOOGLE_CLIENT_SECRET: "gsecret",
    SKYNET_ALLOWED_EMAILS: "member@gmail.com",
  });
  const board = (): DashboardData => ({ generatedAt: "t", participants: [], collisions: [] });

  it("counts a member's /app load and nothing from a visitor", async () => {
    const store = new JsonMemberVisitStore(dir);
    const now = at("2026-11-20");
    const server = createDashboardServer({
      hub: new ObservatoryHub(board()),
      ...(auth ? { auth } : {}),
      memberVisits: store,
      now: () => now,
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const cookie = `skynet_session=${encodeURIComponent(
      signSession(
        { email: "member@gmail.com", provider: "google", exp: Date.now() + 60_000 },
        SECRET,
      ),
    )}`;
    try {
      const anon = await fetch(`${base}/app/trade`, { redirect: "manual" });
      expect(anon.status).toBe(302);
      expect(store.list(now)).toEqual([]);

      await fetch(`${base}/app/trade?symbol=AAPL`, { headers: { cookie }, redirect: "manual" });
      await fetch(`${base}/app/static/js/x.js`, { headers: { cookie }, redirect: "manual" });
      expect(store.list(now)).toEqual([
        {
          memberId: opaqueMemberId("member@gmail.com"),
          day: "2026-11-20",
          loads: 1,
          routes: ["/app/trade"],
        },
      ]);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
