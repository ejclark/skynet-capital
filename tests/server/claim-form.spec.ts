import { mkdtemp, rm } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { NavContext } from "../../src/observatory/dashboard-shell.js";
import { type ClaimAccount, handleClaim } from "../../src/server/claim-form.js";
import { OwnerLinkStore } from "../../src/server/owner-link-store.js";

const nav: NavContext = { active: "add", canAdd: true, authed: true };

/**
 * `/claim` — the owner's account-link table (#546). Exercised over a real socket, like the other
 * route specs, against a real store on a temp path: the behavior worth pinning is what ends up
 * durable, not which methods got called.
 *
 * Two properties matter. The PRIVILEGE SPLIT, same as `/invite`: linking an account grants the
 * power to trade it, so only env-configured owners may do it. And the NON-REASSIGNMENT rule: an
 * account that already names an owner is never re-pointed here — this page fills a gap, it does
 * not transfer accounts.
 */
const OWNERS = new Set(["owner@example.com"]);
const MEMBERS = new Set(["member@example.com"]);

const ACCOUNTS: ClaimAccount[] = [
  { id: "human-apala", displayName: "Apala", kind: "human" },
  { id: "sauron", displayName: "Sauron", kind: "bot" },
  {
    id: "human-uncle_joe",
    displayName: "Uncle Joe",
    kind: "human",
    ownerEmail: "joe@example.com",
  },
];

async function withClaim(
  viewer: string | undefined,
  store: OwnerLinkStore,
  run: (base: string) => Promise<void>,
): Promise<void> {
  const server: Server = createServer((req, res) => {
    void handleClaim(
      req,
      res,
      req.method ?? "GET",
      viewer,
      {
        store,
        isOwner: (email) => OWNERS.has(email),
        accounts: () => ACCOUNTS,
        canSignIn: (email) => OWNERS.has(email) || MEMBERS.has(email),
        now: () => new Date("2026-08-24T12:00:00.000Z"),
      },
      nav,
    );
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

const post = (base: string, body: string): Promise<Response> =>
  fetch(`${base}/claim`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

describe("handleClaim", () => {
  let dir: string;
  let store: OwnerLinkStore;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-claim-"));
    store = new OwnerLinkStore(join(dir, "owner-links.json"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("shows an owner which accounts have nobody, and offers only those", async () => {
    await withClaim("owner@example.com", store, async (base) => {
      const res = await fetch(base);
      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).toContain("nobody — can't trade");
      expect(body).toContain('<option value="human-apala">');
      // Already owned: listed for context, never offered as a link target.
      expect(body).toContain("joe@example.com");
      expect(body).not.toContain('<option value="human-uncle_joe">');
    });
  });

  // 2026-08-25 (Eric: pointed at an env-var workaround, because this — the actual zero-typing
  // fix — was reachable only by typing the URL, with no nav link and no rails anywhere).
  it("renders inside the app shell now, not a bare card", async () => {
    await withClaim("owner@example.com", store, async (base) => {
      const body = await (await fetch(base)).text();
      expect(body).toContain('<aside class="drawer"');
      expect(body).toContain("Standings");
    });
  });

  it("links an unowned account to a member who can sign in", async () => {
    await withClaim("owner@example.com", store, async (base) => {
      const res = await post(base, "id=human-apala&email=Member%40Example.com");
      expect(res.status).toBe(200);
      expect(store.emailFor("human-apala")).toBe("member@example.com");
      expect(store.load().links[0]?.linkedBy).toBe("owner@example.com");
    });
  });

  // The one that matters most: linking is a trading grant.
  it("refuses a member who is on the allowlist but is not an owner", async () => {
    await withClaim("member@example.com", store, async (base) => {
      const res = await post(base, "id=human-apala&email=member%40example.com");
      expect(res.status).toBe(403);
      expect(store.emailFor("human-apala")).toBeUndefined();
    });
  });

  it("refuses an anonymous request, and tells it nothing a member isn't told", async () => {
    const bodies: string[] = [];
    await withClaim(undefined, store, async (base) => {
      const res = await fetch(base);
      expect(res.status).toBe(403);
      bodies.push(await res.text());
    });
    await withClaim("member@example.com", store, async (base) => {
      bodies.push(await (await fetch(base)).text());
    });
    expect(bodies[0]).toBe(bodies[1]);
  });

  it("never reassigns an account that already names an owner", async () => {
    await withClaim("owner@example.com", store, async (base) => {
      const res = await post(base, "id=human-uncle_joe&email=member%40example.com");
      expect(res.status).toBe(400);
      expect(store.emailFor("human-uncle_joe")).toBeUndefined();
    });
  });

  it("refuses an address that cannot sign in, so no link is left unusable", async () => {
    await withClaim("owner@example.com", store, async (base) => {
      const res = await post(base, "id=human-apala&email=stranger%40example.com");
      expect(res.status).toBe(400);
      expect(await res.text()).toContain("can't sign in yet");
      expect(store.emailFor("human-apala")).toBeUndefined();
    });
  });

  it("refuses a malformed address and an account that isn't on the board", async () => {
    await withClaim("owner@example.com", store, async (base) => {
      expect((await post(base, "id=human-apala&email=not-an-email")).status).toBe(400);
      expect((await post(base, "id=ghost&email=member%40example.com")).status).toBe(400);
      expect(store.load().links).toEqual([]);
    });
  });

  it("unlinks an account an owner linked by mistake", async () => {
    store.link("sauron", "member@example.com", "owner@example.com");
    await withClaim("owner@example.com", store, async (base) => {
      const res = await post(base, "id=sauron&unlink=1");
      expect(res.status).toBe(200);
      expect(store.emailFor("sauron")).toBeUndefined();
    });
  });
});
