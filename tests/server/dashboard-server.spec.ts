import type { AddressInfo } from "node:net";
import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import { resolveAuth } from "../../src/server/auth/resolve-auth.js";
import { type Session, signSession } from "../../src/server/auth/session.js";
import { createDashboardServer } from "../../src/server/dashboard-server.js";
import { ObservatoryHub } from "../../src/server/observatory-hub.js";
import type { AddParticipantInput, AddResult } from "../../src/server/participant-service.js";

// Sibling: dashboard-server-routes.spec.ts (split 2026-08-26 to stay under the per-file line
// cap) — that half covers /feedback, /u/:id performance history, desk settings (#475), and
// /rotate identity resolution. This file keeps the auth gate, the Standings-fold redirects,
// /pulse, and /add.

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

/** Reads `count` SSE `data:` frames off a streaming `/events` response, JSON-decoded. */
async function readSseFrames(res: Response, count: number): Promise<string[]> {
  const reader = res.body?.getReader();
  if (!reader) throw new Error("no readable body");
  const decoder = new TextDecoder();
  let buf = "";
  const frames: string[] = [];
  while (frames.length < count) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx = buf.indexOf("\n\n");
    while (idx !== -1) {
      const raw = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const line = raw.split("\n").find((l) => l.startsWith("data: "));
      if (line) frames.push(JSON.parse(line.slice("data: ".length)));
      idx = buf.indexOf("\n\n");
    }
  }
  await reader.cancel();
  return frames;
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

  it("stamps the guest list's joined status the first time a session lands on the board", async () => {
    const joined: string[] = [];
    const store = {
      entries: () => [],
      emails: () => new Set<string>(),
      logins: () => new Set<string>(),
      canStoreSecurely: () => true,
      add: () => false,
      remove: () => false,
      markJoined: (value: string) => {
        joined.push(value);
        return true;
      },
    };
    await withServer(
      {
        hub: new ObservatoryHub(board()),
        ...(auth ? { auth } : {}),
        invite: { store, isOwner: () => false },
      },
      async (base) => {
        await fetch(`${base}/`, { headers: { cookie: validCookie() } });
        expect(joined).toEqual(["eric@gmail.com"]);
      },
    );
  });

  it("serves the Portfolio index at /u listing every account the session owns", async () => {
    const hub = new ObservatoryHub({
      generatedAt: "t",
      collisions: [],
      participants: [
        {
          id: "human-eric",
          displayName: "Eric",
          kind: "human",
          cash: 1_000,
          equity: 10_000,
          positions: [],
        },
        {
          id: "news-fader",
          displayName: "News Fader",
          kind: "bot",
          cash: 0,
          equity: 5_000,
          positions: [],
        },
      ],
    });
    await withServer(
      {
        hub,
        ...(auth ? { auth } : {}),
        resolveOwnerIds: (email: string) => (email === "eric@gmail.com" ? ["human-eric"] : []),
      },
      async (base) => {
        const res = await fetch(`${base}/u`, { headers: { cookie: validCookie() } });
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain("Your accounts");
        expect(html).toContain('href="/u/human-eric"');
        // The bot isn't owned by this session, so the index never lists it.
        expect(html).not.toContain('href="/u/news-fader"');
      },
    );
  });

  it("gates /u behind the login redirect like every member page", async () => {
    await withServer(
      { hub: new ObservatoryHub(board()), ...(auth ? { auth } : {}) },
      async (base) => {
        const res = await fetch(`${base}/u`, { redirect: "manual" });
        expect(res.status).toBe(302);
        expect(res.headers.get("location")).toBe("/login");
      },
    );
  });
});

describe("dashboard-server — Standings fold (2026-08-25)", () => {
  it("redirects the old /leaderboard route to Standings, carrying ?by= forward", async () => {
    await withServer({ hub: new ObservatoryHub(board()) }, async (base) => {
      const bare = await fetch(`${base}/leaderboard`, { redirect: "manual" });
      expect(bare.status).toBe(302);
      expect(bare.headers.get("location")).toBe("/");

      const withMetric = await fetch(`${base}/leaderboard?by=return`, { redirect: "manual" });
      expect(withMetric.status).toBe(302);
      expect(withMetric.headers.get("location")).toBe("/?by=return");
    });
  });

  it("redirects the old /bots-vs-humans route to Standings", async () => {
    await withServer({ hub: new ObservatoryHub(board()) }, async (base) => {
      const res = await fetch(`${base}/bots-vs-humans`, { redirect: "manual" });
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("/");
    });
  });

  it("threads the connecting request's ?by= into every live SSE push, not just the first frame", async () => {
    // The SSE-threading decision the plan called for explicitly: `nav` (and now `metric`) are
    // fixed at connect time, so the client forwards the WHOLE query string to /events — a viewer
    // who picked Return % must keep seeing it on every live push, never silently reset to Equity.
    const hub = new ObservatoryHub(board());
    await withServer({ hub }, async (base) => {
      const res = await fetch(`${base}/events?by=return`);
      expect(res.status).toBe(200);
      const framesPromise = readSseFrames(res, 2);
      hub.apply({
        type: "participant_added",
        at: "2026-08-25T00:00:00.000Z",
        participant: {
          id: "p1",
          displayName: "Push Test",
          kind: "human",
          cash: 0,
          equity: 1,
          positions: [],
        },
      });
      const [initial, pushed] = await framesPromise;
      expect(initial).toContain('class="msel active" href="/?by=return"');
      expect(pushed).toContain('class="msel active" href="/?by=return"');
    });
  });

  it("redirects the old /compare route to Standings, carrying ?a=&b= forward", async () => {
    await withServer({ hub: new ObservatoryHub(board()) }, async (base) => {
      const bare = await fetch(`${base}/compare`, { redirect: "manual" });
      expect(bare.status).toBe(302);
      expect(bare.headers.get("location")).toBe("/");

      const withPair = await fetch(`${base}/compare?a=p1&b=p2`, { redirect: "manual" });
      expect(withPair.status).toBe(302);
      expect(withPair.headers.get("location")).toBe("/?a=p1&b=p2");
    });
  });

  it("threads the connecting request's ?a=&b= into every live SSE push, not just the first frame", async () => {
    const hub = new ObservatoryHub({
      generatedAt: "t",
      collisions: [],
      participants: [
        {
          id: "p1",
          displayName: "Alice",
          kind: "human",
          cash: 0,
          equity: 1,
          positions: [],
        },
        {
          id: "p2",
          displayName: "Bob",
          kind: "human",
          cash: 0,
          equity: 1,
          positions: [],
        },
      ],
    });
    await withServer({ hub }, async (base) => {
      const res = await fetch(`${base}/events?a=p1&b=p2`);
      expect(res.status).toBe(200);
      const framesPromise = readSseFrames(res, 2);
      hub.apply({
        type: "participant_added",
        at: "2026-08-25T00:00:00.000Z",
        participant: {
          id: "p3",
          displayName: "Push Test",
          kind: "human",
          cash: 0,
          equity: 1,
          positions: [],
        },
      });
      const [initial, pushed] = await framesPromise;
      expect(initial).toContain('Alice <span class="cmp-vs">vs</span> Bob');
      expect(pushed).toContain('Alice <span class="cmp-vs">vs</span> Bob');
    });
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
