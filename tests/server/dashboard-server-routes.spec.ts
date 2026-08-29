import type { AddressInfo } from "node:net";
import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import { resolveAuth } from "../../src/server/auth/resolve-auth.js";
import { signSession } from "../../src/server/auth/session.js";
import type { BotControlsStore } from "../../src/server/bot-controls-store.js";
import { createDashboardServer } from "../../src/server/dashboard-server.js";
import { ObservatoryHub } from "../../src/server/observatory-hub.js";

// Sibling of dashboard-server.spec.ts (split 2026-08-26 to stay under the per-file line cap) —
// this half covers /feedback, the /u/:id performance history seam, Mission Control's desk
// settings routing (#475), and /rotate identity resolution. The auth gate, Standings fold
// redirects, /pulse, and /add live in dashboard-server.spec.ts.

const board = (): DashboardData => ({ generatedAt: "t", participants: [], collisions: [] });

async function withServer(
  config: Parameters<typeof createDashboardServer>[0],
  run: (base: string) => Promise<void>,
): Promise<void> {
  const server = createDashboardServer(config);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe("dashboard-server /feedback", () => {
  it("serves coach turns as JSON, and reports 'not switched on' without a coach", async () => {
    const coach = () =>
      Promise.resolve({ ok: true as const, done: false as const, question: "Where?" });
    await withServer({ hub: new ObservatoryHub(board()), coachFeedback: coach }, async (base) => {
      // Both doors share the coach; the API reports it wired for the shell page.
      expect((await (await fetch(`${base}/api/feedback`)).json()).coachEnabled).toBe(true);

      const post = await fetch(`${base}/feedback/coach`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "bug", messages: [{ role: "user", content: "hm" }] }),
      });
      expect(post.status).toBe(200);
      expect(await post.json()).toEqual({ ok: true, done: false, question: "Where?" });

      const bad = await fetch(`${base}/feedback/coach`, { method: "POST", body: "not json" });
      expect(bad.status).toBe(400);
    });
    await withServer({ hub: new ObservatoryHub(board()) }, async (base) => {
      const off = await fetch(`${base}/feedback/coach`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "bug", messages: [] }),
      });
      expect((await off.json()).ok).toBe(false);
    });
  });

  it("redirects the bare page into the shell even with no token wired", async () => {
    await withServer({ hub: new ObservatoryHub(board()) }, async (base) => {
      // Phase 9d: the page lives in the shell (the shell page states the unwired truth via the
      // API, tested in feedback-api-routes.spec.ts).
      const form = await fetch(`${base}/feedback`, { redirect: "manual" });
      expect(form.status).toBe(302);
      expect(form.headers.get("location")).toBe("/app/feedback");
    });
  });

  it("is behind the auth gate", async () => {
    const auth = resolveAuth({
      SKYNET_SESSION_SECRET: "s",
      SKYNET_GOOGLE_CLIENT_ID: "g",
      SKYNET_GOOGLE_CLIENT_SECRET: "gs",
      SKYNET_ALLOWED_EMAILS: "eric@gmail.com",
    });
    const cookie = `skynet_session=${encodeURIComponent(
      signSession({ email: "eric@gmail.com", provider: "google", exp: Date.now() + 60_000 }, "s"),
    )}`;
    await withServer(
      {
        hub: new ObservatoryHub(board()),
        ...(auth ? { auth } : {}),
        submitFeedback: () => Promise.resolve({ ok: true, url: "u", number: 1 }),
      },
      async (base) => {
        const anon = await fetch(`${base}/feedback`, { redirect: "manual" });
        expect(anon.status).toBe(302);
        expect(anon.headers.get("location")).toBe("/login");

        const authed = await fetch(`${base}/feedback`, {
          headers: { cookie },
          redirect: "manual",
        });
        expect(authed.status).toBe(302);
        expect(authed.headers.get("location")).toBe("/app/feedback");
      },
    );
  });
});

describe("dashboard-server /u/:id (phase 9a)", () => {
  it("redirects the legacy desk into the shell — history renders on Pulse now", async () => {
    await withServer({ hub: new ObservatoryHub(board()) }, async (base) => {
      const desk = await fetch(`${base}/u/day-trader`, { redirect: "manual" });
      expect(desk.status).toBe(302);
      expect(desk.headers.get("location")).toBe("/app/u/day-trader");
      const perf = await fetch(`${base}/u/day-trader?tab=performance`, { redirect: "manual" });
      expect(perf.headers.get("location")).toBe("/app/u/day-trader/pulse");
    });
  });
});

/**
 * Mission Control's relocation onto the desk (#475) — the ROUTING half. The switchboard's own
 * behavior is `tests/server/controls-form.spec.ts`; what's asserted here is that the URL an owner
 * lands on serves it, that the retired `/controls` bookmark still gets there, and that a member
 * asking for the tab by hand is answered exactly like a typo'd tab.
 */
describe("dashboard-server desk settings (#475)", () => {
  const SECRET = "sess";
  const auth = resolveAuth({
    SKYNET_SESSION_SECRET: SECRET,
    SKYNET_GOOGLE_CLIENT_ID: "gid",
    SKYNET_GOOGLE_CLIENT_SECRET: "gsecret",
    SKYNET_ALLOWED_EMAILS: "eric@gmail.com,member@gmail.com",
  });
  const cookieFor = (email: string): string =>
    `skynet_session=${encodeURIComponent(
      signSession({ email, provider: "google", exp: Date.now() + 60_000 }, SECRET),
    )}`;
  const fleet = (): DashboardData => ({
    generatedAt: "t",
    participants: [
      {
        id: "sauron",
        displayName: "Sauron",
        kind: "bot",
        personaId: "sauron",
        cash: 1_000,
        equity: 1_000,
        positions: [],
      },
    ],
    collisions: [],
  });
  const config = () => ({
    hub: new ObservatoryHub(fleet()),
    ...(auth ? { auth } : {}),
    resolveOwnerId: (email: string) => (email === "eric@gmail.com" ? "sauron" : undefined),
    controls: {
      // A stub store: this block asserts ROUTING, and the real store is covered by its own spec.
      store: {
        load: () => ({ bots: {} }),
        setBot: () => undefined,
        setAllSuspended: () => undefined,
      } as unknown as BotControlsStore,
      isOwner: (email: string) => email === "eric@gmail.com",
      bots: () => [{ id: "sauron", displayName: "Sauron" }],
    },
  });

  it("redirects the desk settings tab to app Settings — Mission Control's shell home", async () => {
    await withServer(config(), async (base) => {
      const res = await fetch(`${base}/u/sauron?tab=settings`, {
        headers: { cookie: cookieFor("eric@gmail.com") },
        redirect: "manual",
      });
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("/app/settings");
    });
  });

  it("answers a member's ?tab=settings with the same redirect — no owner-shaped tell", async () => {
    await withServer(config(), async (base) => {
      const res = await fetch(`${base}/u/sauron?tab=settings`, {
        headers: { cookie: cookieFor("member@gmail.com") },
        redirect: "manual",
      });
      expect(res.status).toBe(302);
      // Identical to the owner's answer; whether the card exists is decided by /api/controls.
      expect(res.headers.get("location")).toBe("/app/settings");
    });
  });

  // The old per-viewer "whose desk" resolution retired with the fleet switchboard landing on app
  // Settings for every viewer — /controls is now a flat redirect (legacy-redirects.spec.ts covers
  // the mapping itself); this just proves the auth-gated dispatcher actually reaches it.
  it("redirects the retired /controls bookmark into app Settings", async () => {
    await withServer(config(), async (base) => {
      const res = await fetch(`${base}/controls`, {
        headers: { cookie: cookieFor("eric@gmail.com") },
        redirect: "manual",
      });
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("/app/settings");
    });
  });
});

/**
 * `/rotate` identity resolution (Eric, 2026-08-25: "ensure the email is used as the unique
 * identifier — they know email, they don't know their account ID"). A link that names an id
 * still wins, but absent one, a viewer whose sign-in already resolves to an account gets it
 * prefilled automatically — no id typed, no id clicked-through, just their email via the session.
 */
describe("dashboard-server /rotate identity resolution (2026-08-25)", () => {
  const SECRET = "sess";
  const auth = resolveAuth({
    SKYNET_SESSION_SECRET: SECRET,
    SKYNET_GOOGLE_CLIENT_ID: "gid",
    SKYNET_GOOGLE_CLIENT_SECRET: "gsecret",
    SKYNET_ALLOWED_EMAILS: "eric@gmail.com",
  });
  const cookieFor = (email: string): string =>
    `skynet_session=${encodeURIComponent(
      signSession({ email, provider: "google", exp: Date.now() + 60_000 }, SECRET),
    )}`;
  const config = () => ({
    hub: new ObservatoryHub(board()),
    ...(auth ? { auth } : {}),
    resolveOwnerId: (email: string) => (email === "eric@gmail.com" ? "human-eric" : undefined),
    rotateCredentials: () => Promise.reject(new Error("unused")),
  });

  it("redirects into app Settings, where rotation lives on the account card", async () => {
    await withServer(config(), async (base) => {
      const res = await fetch(`${base}/rotate?id=sauron`, {
        headers: { cookie: cookieFor("eric@gmail.com") },
        redirect: "manual",
      });
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("/app/settings?id=sauron");
    });
  });
});
