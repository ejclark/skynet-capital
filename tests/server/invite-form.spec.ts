import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { AllowlistEntry, AllowlistStore } from "../../src/server/auth/allowlist-store.js";
import { handleInvite } from "../../src/server/invite-form.js";

/**
 * `/invite` — the owner's guest list. Exercised over a real socket, like the other route specs.
 *
 * The property under test is the PRIVILEGE SPLIT: owners (env-configured, host access required)
 * may invite; members (invited into the volume store) may sign in but never widen the gate. Without
 * that, one invited friend could invite anyone and a friends-and-family gate becomes a public one
 * in a couple of hops.
 */
function memoryStore(seed: AllowlistEntry[] = []): AllowlistStore & { added: string[] } {
  const entries = [...seed];
  const added: string[] = [];
  return {
    added,
    entries: () => entries,
    emails: () => new Set(entries.filter((e) => e.kind === "email").map((e) => e.value)),
    logins: () => new Set(entries.filter((e) => e.kind === "login").map((e) => e.value)),
    canStoreSecurely: () => true,
    add(entry) {
      if (entries.some((e) => e.value === entry.value)) return false;
      entries.push(entry);
      added.push(entry.value);
      return true;
    },
    remove: () => false,
  };
}

const OWNERS = new Set(["owner@example.com"]);

async function withInvite(
  viewer: string | undefined,
  store: AllowlistStore,
  run: (base: string) => Promise<void>,
): Promise<void> {
  const server: Server = createServer((req, res) => {
    void handleInvite(req, res, req.method ?? "GET", viewer, {
      store,
      isOwner: (email) => OWNERS.has(email),
      now: () => new Date("2026-08-14T12:00:00.000Z"),
    });
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe("handleInvite", () => {
  it("shows the guest list to an owner", async () => {
    const store = memoryStore([
      {
        value: "guest@example.com",
        kind: "email",
        addedAt: "2026-08-01T00:00:00.000Z",
        addedBy: "owner@example.com",
      },
    ]);
    await withInvite("owner@example.com", store, async (base) => {
      const res = await fetch(base);
      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).toContain("guest@example.com");
      expect(body).toContain('name="email"');
    });
  });

  it("adds an invited email", async () => {
    const store = memoryStore();
    await withInvite("owner@example.com", store, async (base) => {
      const res = await fetch(`${base}/invite`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "email=Friend%40Gmail.com",
      });
      expect(res.status).toBe(200);
      expect(store.added).toEqual(["friend@gmail.com"]);
      expect(store.entries()[0]?.addedBy).toBe("owner@example.com");
    });
  });

  // The one that matters most.
  it("refuses a member who is on the allowlist but is not an owner", async () => {
    const store = memoryStore();
    await withInvite("guest@example.com", store, async (base) => {
      const res = await fetch(`${base}/invite`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "email=stranger%40example.com",
      });
      expect(res.status).toBe(403);
      expect(store.added).toEqual([]);
    });
  });

  it("refuses an anonymous request", async () => {
    const store = memoryStore();
    await withInvite(undefined, store, async (base) => {
      expect((await fetch(base)).status).toBe(403);
      expect(store.added).toEqual([]);
    });
  });

  it("tells a non-owner nothing about whether the page exists for anyone else", async () => {
    const store = memoryStore();
    const bodies: string[] = [];
    await withInvite(undefined, store, async (base) => {
      bodies.push(await (await fetch(base)).text());
    });
    await withInvite("guest@example.com", store, async (base) => {
      bodies.push(await (await fetch(base)).text());
    });
    expect(bodies[0]).toBe(bodies[1]);
  });

  it("rejects a malformed address without writing anything", async () => {
    const store = memoryStore();
    await withInvite("owner@example.com", store, async (base) => {
      const res = await fetch(`${base}/invite`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "email=not-an-email",
      });
      expect(res.status).toBe(400);
      expect(store.added).toEqual([]);
    });
  });

  it("reports plainly when the store cannot be written", async () => {
    const store = { ...memoryStore(), canStoreSecurely: () => false };
    await withInvite("owner@example.com", store, async (base) => {
      const body = await (await fetch(base)).text();
      expect(body).toContain("SKYNET_STORE_SECRET");
    });
  });
});
