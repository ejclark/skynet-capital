import type { AddressInfo } from "node:net";
import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import { resolveAuth } from "../../src/server/auth/resolve-auth.js";
import { type Session, signSession } from "../../src/server/auth/session.js";
import { createDashboardServer } from "../../src/server/dashboard-server.js";
import type { FeedbackInput, FeedbackResult } from "../../src/server/feedback-service.js";
import { ObservatoryHub } from "../../src/server/observatory-hub.js";
import type { AddParticipantInput, AddResult } from "../../src/server/participant-service.js";

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

describe("dashboard-server OAuth gate", () => {
  const SECRET = "sess";
  const auth = resolveAuth({
    SKYNET_SESSION_SECRET: SECRET,
    SKYNET_GOOGLE_CLIENT_ID: "gid",
    SKYNET_GOOGLE_CLIENT_SECRET: "gsecret",
    SKYNET_ALLOWED_EMAILS: "eric@gmail.com",
  });
  const validCookie = (): string => {
    const session: Session = {
      email: "eric@gmail.com",
      provider: "google",
      exp: Date.now() + 60_000,
    };
    return `skynet_session=${encodeURIComponent(signSession(session, SECRET))}`;
  };

  it("redirects an unauthenticated visitor to /login and serves the login page", async () => {
    await withServer(
      { hub: new ObservatoryHub(board()), ...(auth ? { auth } : {}) },
      async (base) => {
        const home = await fetch(`${base}/`, { redirect: "manual" });
        expect(home.status).toBe(302);
        expect(home.headers.get("location")).toBe("/login");

        const login = await fetch(`${base}/login`);
        expect(login.status).toBe(200);
        expect(await login.text()).toContain("Continue with Google");
      },
    );
  });

  it("401s the SSE stream without a session", async () => {
    await withServer(
      { hub: new ObservatoryHub(board()), ...(auth ? { auth } : {}) },
      async (base) => {
        expect((await fetch(`${base}/events`)).status).toBe(401);
      },
    );
  });

  it("lets a valid session cookie through to the board", async () => {
    await withServer(
      { hub: new ObservatoryHub(board()), ...(auth ? { auth } : {}) },
      async (base) => {
        const home = await fetch(`${base}/`, { headers: { cookie: validCookie() } });
        expect(home.status).toBe(200);
        expect(await home.text()).toContain("Sign out");
      },
    );
  });
});

describe("dashboard-server /pulse", () => {
  const snap = (
    id: string,
    kind: "human" | "bot",
    equity: number,
    error?: string,
  ): DashboardData["participants"][number] => ({
    id,
    displayName: id,
    kind,
    cash: equity,
    equity,
    positions: [],
    ...(error ? { error } : {}),
  });

  it("serves public cohort aggregates before any auth gate, omitting individuals", async () => {
    const auth = resolveAuth({
      SKYNET_SESSION_SECRET: "s",
      SKYNET_GOOGLE_CLIENT_ID: "g",
      SKYNET_GOOGLE_CLIENT_SECRET: "gs",
    });
    const data: DashboardData = {
      generatedAt: "t",
      participants: [
        snap("Ann", "human", 5_200_000),
        snap("Bo", "human", 4_900_000),
        snap("Bot-1", "bot", 5_500_000),
        snap("Bot-Down", "bot", 0, "unreachable"), // excluded: errored account
      ],
      collisions: [],
    };
    await withServer({ hub: new ObservatoryHub(data), ...(auth ? { auth } : {}) }, async (base) => {
      const res = await fetch(`${base}/pulse`); // no session cookie — must still work
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("application/json");
      const body = await res.json();
      expect(body).toEqual({
        humans: 2,
        bots: 1, // the errored bot is dropped
        humanEquity: 10_100_000,
        botEquity: 5_500_000,
      });
      // Never leaks an individual account's name.
      expect(JSON.stringify(body)).not.toContain("Ann");
    });
  });
});

describe("dashboard-server /add", () => {
  it("serves the form on GET and registers on POST", async () => {
    const calls: AddParticipantInput[] = [];
    const addParticipant = (input: AddParticipantInput): Promise<AddResult> => {
      calls.push(input);
      return Promise.resolve({ ok: true, id: "human-joe", displayName: "Joe" });
    };
    await withServer({ hub: new ObservatoryHub(board()), addParticipant }, async (base) => {
      const form = await fetch(`${base}/add`);
      expect(form.status).toBe(200);
      expect(await form.text()).toContain("Connect your Alpaca account");

      const post = await fetch(`${base}/add`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ displayName: "Joe", apiKey: "k", apiSecret: "s" }).toString(),
      });
      expect(post.status).toBe(200);
      expect(await post.text()).toContain("on the board");
      expect(calls[0]).toMatchObject({ displayName: "Joe", apiKey: "k", kind: "human" });
    });
  });

  it("offers a persona class picker instead of a free-text persona id", async () => {
    await withServer(
      {
        hub: new ObservatoryHub(board()),
        addParticipant: () => Promise.resolve({ ok: true, id: "a", displayName: "a" }),
      },
      async (base) => {
        const html = await (await fetch(`${base}/add`)).text();
        // radio-cards driven by the registry, not a bare text input
        expect(html).toContain('class="classpick"');
        expect(html).toContain('type="radio" name="personaId" value="day-trader"');
        expect(html).toContain('value="banker"');
        expect(html).toContain("The Duelist"); // a persona legend surfaces on its card
        expect(html).not.toContain('name="personaId" placeholder');
      },
    );
  });

  it("returns 400 with the error when the handler rejects", async () => {
    const addParticipant = (): Promise<AddResult> => Promise.resolve({ ok: false, error: "nope" });
    await withServer({ hub: new ObservatoryHub(board()), addParticipant }, async (base) => {
      const post = await fetch(`${base}/add`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ displayName: "x", apiKey: "k", apiSecret: "s" }).toString(),
      });
      expect(post.status).toBe(400);
      expect(await post.text()).toContain("nope");
    });
  });

  it("gates /add behind the password and 404s when the feature is off", async () => {
    await withServer(
      {
        hub: new ObservatoryHub(board()),
        password: "pw",
        addParticipant: () => Promise.resolve({ ok: true, id: "a", displayName: "a" }),
      },
      async (base) => {
        expect((await fetch(`${base}/add`)).status).toBe(401);
        expect((await fetch(`${base}/add?key=pw`)).status).toBe(200);
      },
    );
    // No handler wired → /add is not a route.
    await withServer({ hub: new ObservatoryHub(board()) }, async (base) => {
      expect((await fetch(`${base}/add`)).status).toBe(404);
    });
  });
});

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
      expect(await post.text()).toContain("#7");
      expect(calls[0]).toMatchObject({ kind: "bug", title: "It broke", details: "here's how" });
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
