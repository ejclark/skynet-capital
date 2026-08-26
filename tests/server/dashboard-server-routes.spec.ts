import type { AddressInfo } from "node:net";
import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import { resolveAuth } from "../../src/server/auth/resolve-auth.js";
import { signSession } from "../../src/server/auth/session.js";
import type { BotControlsStore } from "../../src/server/bot-controls-store.js";
import { createDashboardServer } from "../../src/server/dashboard-server.js";
import type { FeedbackInput, FeedbackResult } from "../../src/server/feedback-service.js";
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
  it("serves the form and files an issue on POST", async () => {
    const calls: FeedbackInput[] = [];
    const submitFeedback = (input: FeedbackInput): Promise<FeedbackResult> => {
      calls.push(input);
      return Promise.resolve({ ok: true, url: "https://github.com/x/y/issues/7", number: 7 });
    };
    await withServer({ hub: new ObservatoryHub(board()), submitFeedback }, async (base) => {
      const form = await fetch(`${base}/feedback`);
      expect(form.status).toBe(200);
      expect(await form.text()).toContain("Share feedback");

      const post = await fetch(`${base}/feedback`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          kind: "bug",
          title: "It broke",
          details: "here's how",
        }).toString(),
      });
      expect(post.status).toBe(200);
      const success = await post.text();
      expect(success).toContain("#7");
      // The filed issue must be linkable so the member can follow its progress (#436).
      expect(success).toContain("https://github.com/x/y/issues/7");
      expect(calls[0]).toMatchObject({ kind: "bug", title: "It broke", details: "here's how" });
    });
  });

  it("serves coach turns as JSON, and reports 'not switched on' without a coach", async () => {
    const coach = () =>
      Promise.resolve({ ok: true as const, done: false as const, question: "Where?" });
    await withServer({ hub: new ObservatoryHub(board()), coachFeedback: coach }, async (base) => {
      // The form offers the coach only when it's wired — plain form otherwise.
      expect(await (await fetch(`${base}/feedback`)).text()).toContain("coach-box");

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
      expect(await (await fetch(`${base}/feedback`)).text()).not.toContain("coach-box");
      const off = await fetch(`${base}/feedback/coach`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "bug", messages: [] }),
      });
      expect((await off.json()).ok).toBe(false);
    });
  });

  it("shows a friendly error when filing fails", async () => {
    const submitFeedback = (): Promise<FeedbackResult> =>
      Promise.resolve({ ok: false, error: "GitHub said no" });
    await withServer({ hub: new ObservatoryHub(board()), submitFeedback }, async (base) => {
      const post = await fetch(`${base}/feedback`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ kind: "idea", title: "hi" }).toString(),
      });
      expect(post.status).toBe(502);
      expect(await post.text()).toContain("GitHub said no");
    });
  });

  it("renders the form but reports 'not switched on' when no token is wired", async () => {
    await withServer({ hub: new ObservatoryHub(board()) }, async (base) => {
      expect((await fetch(`${base}/feedback`)).status).toBe(200); // form still renders
      const post = await fetch(`${base}/feedback`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ kind: "bug", title: "x" }).toString(),
      });
      expect(post.status).toBe(200);
      expect(await post.text()).toContain("isn't switched on");
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

        const authed = await fetch(`${base}/feedback`, { headers: { cookie } });
        expect(authed.status).toBe(200);
        expect(await authed.text()).toContain("Share feedback");
      },
    );
  });
});

describe("dashboard-server /u/:id performance history", () => {
  const withBot = (): DashboardData => ({
    generatedAt: "t",
    participants: [
      {
        id: "day-trader",
        displayName: "JARVIS",
        kind: "bot",
        personaId: "day-trader",
        cash: 900,
        equity: 1100,
        realizedPl: 240,
        positions: [],
      },
    ],
    collisions: [],
  });

  it("lights up the sparkline when readHistory returns samples", async () => {
    await withServer(
      {
        hub: new ObservatoryHub(withBot()),
        readHistory: () =>
          Promise.resolve([
            {
              at: "2026-07-26T14:00:00Z",
              participantId: "day-trader",
              equity: 1000,
              cash: 900,
              realizedPl: 0,
            },
            {
              at: "2026-07-26T15:00:00Z",
              participantId: "day-trader",
              equity: 1100,
              cash: 900,
              realizedPl: 240,
            },
          ]),
      },
      async (base) => {
        const html = await (await fetch(`${base}/u/day-trader`)).text();
        expect(html).toContain('<svg class="equity-spark"');
        expect(html).toContain("Realized P/L");
      },
    );
  });

  it("keeps the honest accruing seam when no history is wired", async () => {
    await withServer({ hub: new ObservatoryHub(withBot()) }, async (base) => {
      const html = await (await fetch(`${base}/u/day-trader`)).text();
      expect(html).not.toContain('<svg class="equity-spark"');
      expect(html).toContain("once we've recorded your history");
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

  it("serves Mission Control on the owner's desk, inside the app shell", async () => {
    await withServer(config(), async (base) => {
      const res = await fetch(`${base}/u/sauron?tab=settings`, {
        headers: { cookie: cookieFor("eric@gmail.com") },
      });
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("Mission Control");
      expect(html).toContain('<aside class="drawer"');
      expect(html).toContain('href="/u/sauron?tab=settings"');
    });
  });

  it("answers a member's ?tab=settings with the plain overview — no owner-shaped tell", async () => {
    await withServer(config(), async (base) => {
      const res = await fetch(`${base}/u/sauron?tab=settings`, {
        headers: { cookie: cookieFor("member@gmail.com") },
      });
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).not.toContain("Mission Control");
      expect(html).not.toContain("Suspend ALL autonomous trading");
      // Identical to any unrecognized tab: the overview, with no Settings entry in the strip.
      const typo = await (
        await fetch(`${base}/u/sauron?tab=nonsense`, {
          headers: { cookie: cookieFor("member@gmail.com") },
        })
      ).text();
      expect(html).toBe(typo);
    });
  });

  it("redirects the retired /controls bookmark to the viewer's own desk settings", async () => {
    await withServer(config(), async (base) => {
      const res = await fetch(`${base}/controls`, {
        headers: { cookie: cookieFor("eric@gmail.com") },
        redirect: "manual",
      });
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("/u/sauron?tab=settings");
    });
  });

  // 2026-08-25: an owner with no linked desk of their own is a real, expected state (exactly the
  // bug that motivated this fallback) — Mission Control controls the whole fleet, not one
  // account, so it must stay reachable even then. Falling back to ANY bot's desk is safe for
  // ANY viewer, owner or not: the destination re-checks ownership independently on arrival
  // (see the two tests above), so a non-owner just lands on that desk's plain overview.
  it("falls back to any bot's desk when the viewer has no linked account of their own", async () => {
    const noOwnAccount = {
      ...config(),
      resolveOwnerId: () => undefined,
    };
    await withServer(noOwnAccount, async (base) => {
      const owner = await fetch(`${base}/controls`, {
        headers: { cookie: cookieFor("eric@gmail.com") },
        redirect: "manual",
      });
      expect(owner.status).toBe(302);
      expect(owner.headers.get("location")).toBe("/u/sauron?tab=settings");

      const member = await fetch(`${base}/controls`, {
        headers: { cookie: cookieFor("member@gmail.com") },
        redirect: "manual",
      });
      expect(member.status).toBe(302);
      expect(member.headers.get("location")).toBe("/u/sauron?tab=settings");
    });
  });

  it("sends a viewer to the board when no fallback desk exists either (no bots on the fleet)", async () => {
    const noFallback = {
      ...config(),
      resolveOwnerId: () => undefined,
      controls: { ...config().controls, bots: () => [] },
    };
    await withServer(noFallback, async (base) => {
      const res = await fetch(`${base}/controls`, {
        headers: { cookie: cookieFor("member@gmail.com") },
        redirect: "manual",
      });
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("/");
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

  it("prefills and locks the viewer's own account when their sign-in already resolves to one", async () => {
    await withServer(config(), async (base) => {
      const res = await fetch(`${base}/rotate`, {
        headers: { cookie: cookieFor("eric@gmail.com") },
      });
      const body = await res.text();
      expect(body).toContain('value="human-eric" readonly');
      expect(body).toContain("resolved from your sign-in");
      expect(body).not.toContain('name="id" required');
    });
  });

  it("still asks for an id when the viewer's sign-in resolves to nothing", async () => {
    await withServer(config(), async (base) => {
      // Nobody in this fixture resolves to someone-unlinked@gmail.com — the exact unlinked
      // state this whole area is about.
      const res = await fetch(`${base}/rotate`, {
        headers: { cookie: cookieFor("someone-unlinked@gmail.com") },
      });
      const body = await res.text();
      expect(body).toContain('name="id" required');
      expect(body).not.toContain("readonly");
    });
  });

  it("a link's explicit ?id= still wins over the session's own resolved account", async () => {
    await withServer(config(), async (base) => {
      const res = await fetch(`${base}/rotate?id=sauron`, {
        headers: { cookie: cookieFor("eric@gmail.com") },
      });
      const body = await res.text();
      expect(body).toContain('value="sauron" readonly');
      expect(body).not.toContain("resolved from your sign-in");
    });
  });
});
