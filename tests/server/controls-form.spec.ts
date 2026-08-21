import { mkdtemp, rm } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BotControlsStore } from "../../src/server/bot-controls-store.js";
import { type ControlsDeps, handleControls } from "../../src/server/controls-form.js";

/**
 * `/controls` — Mission Control. Exercised over a real socket like the other route specs. The
 * properties under test are the walls: owners only (identical 403 for members and the signed-out),
 * cross-site POSTs refused, unknown bots/actions refused — and the switchboard actually flipping
 * the store underneath.
 */
const OWNERS = new Set(["owner@example.com"]);
const BOTS = [
  { id: "sauron", displayName: "Sauron" },
  { id: "banker", displayName: "The Banker" },
];

async function withControls(
  viewer: string | undefined,
  store: BotControlsStore,
  run: (base: string) => Promise<void>,
): Promise<void> {
  const deps: ControlsDeps = {
    store,
    isOwner: (email) => OWNERS.has(email),
    bots: () => BOTS,
    now: () => new Date("2026-08-21T12:00:00.000Z"),
  };
  const server: Server = createServer((req, res) => {
    void handleControls(req, res, req.method ?? "GET", viewer, deps);
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

const post = (base: string, form: Record<string, string>, headers: Record<string, string> = {}) =>
  fetch(`${base}/controls`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", ...headers },
    body: new URLSearchParams(form).toString(),
  });

describe("Mission Control (/controls)", () => {
  let dir: string;
  let store: BotControlsStore;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-controls-form-"));
    store = new BotControlsStore(join(dir, "bot-controls.json"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("answers members and the signed-out with the same 403", async () => {
    for (const viewer of [undefined, "member@example.com"]) {
      await withControls(viewer, store, async (base) => {
        const res = await fetch(`${base}/controls`);
        expect(res.status).toBe(403);
        expect(await res.text()).toContain("isn't available on your account");
      });
    }
  });

  it("renders the switchboard for an owner, honest about latency", async () => {
    await withControls("owner@example.com", store, async (base) => {
      const html = await (await fetch(`${base}/controls`)).text();
      expect(html).toContain("Mission Control");
      expect(html).toContain("Sauron");
      expect(html).toContain("within ~30 seconds");
      // V1 is suspend-only (Eric, 2026-08-21): no restart-gated knobs on the page at all.
      expect(html).not.toContain("bots restart");
      expect(html).not.toContain("hardcore");
      expect(html).not.toContain("observe");
    });
  });

  it("suspend flips the store and reports the honest latency", async () => {
    await withControls("owner@example.com", store, async (base) => {
      const res = await post(base, { action: "suspend", bot: "sauron" });
      expect(res.status).toBe(200);
      expect(await res.text()).toContain("within ~30 s");
      expect(store.load().bots.sauron?.suspended).toBe(true);

      await post(base, { action: "resume", bot: "sauron" });
      expect(store.load().bots.sauron?.suspended).toBe(false);
    });
  });

  it("the global switch stands the whole fleet down and lifts again", async () => {
    await withControls("owner@example.com", store, async (base) => {
      await post(base, { action: "suspend-all" });
      expect(store.load().allSuspended).toBe(true);
      await post(base, { action: "resume-all" });
      expect(store.load().allSuspended).toBe(false);
    });
  });

  it("stamps who changed what", async () => {
    await withControls("owner@example.com", store, async (base) => {
      await post(base, { action: "suspend", bot: "sauron" });
      expect(store.load().updatedBy).toBe("owner@example.com");
      expect(store.load().updatedAt).toBe("2026-08-21T12:00:00.000Z");
    });
  });

  it("refuses unknown bots and any action the page does not render", async () => {
    await withControls("owner@example.com", store, async (base) => {
      expect((await post(base, { action: "suspend", bot: "nobody" })).status).toBe(400);
      expect((await post(base, { action: "explode", bot: "sauron" })).status).toBe(400);
      // The retired knobs are not merely hidden — the control plane refuses them outright.
      expect((await post(base, { action: "set-mode", bot: "sauron", mode: "live" })).status).toBe(
        400,
      );
      expect(
        (await post(base, { action: "set-hardcore", bot: "sauron", hardcore: "on" })).status,
      ).toBe(400);
      expect(store.load()).toEqual({ bots: {} });
    });
  });

  it("refuses a cross-site POST even from an owner's cookie", async () => {
    await withControls("owner@example.com", store, async (base) => {
      const res = await post(base, { action: "suspend-all" }, { "sec-fetch-site": "cross-site" });
      expect(res.status).toBe(403);
      expect(store.load().allSuspended).toBeUndefined();
    });
  });
});
