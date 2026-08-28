import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { NavContext } from "../../src/observatory/dashboard-shell.js";
import { requireOwnerOnRailedPage } from "../../src/server/owner-gate.js";

const nav: NavContext = { active: "add", canAdd: true, authed: true };
const OWNERS = new Set(["owner@example.com"]);

/** The one shared idiom every owner-only page (`/invite`, `/claim`, `/ops-status`, Mission
 *  Control) reaches for: render the standard rail, refuse anyone who isn't an owner. */
async function withPage(
  viewer: string | undefined,
  run: (base: string) => Promise<void>,
): Promise<void> {
  const server: Server = createServer((_req, res) => {
    const owner = requireOwnerOnRailedPage(res, viewer, (email) => OWNERS.has(email), nav);
    if (!owner) return;
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end("owner page");
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe("requireOwnerOnRailedPage", () => {
  it("lets an owner through to the page body", async () => {
    await withPage("owner@example.com", async (base) => {
      const res = await fetch(base);
      expect(res.status).toBe(200);
      expect(await res.text()).toBe("owner page");
    });
  });

  it("refuses a non-owner with the standard railed refusal, never the page body", async () => {
    await withPage("member@example.com", async (base) => {
      const res = await fetch(base);
      expect(res.status).toBe(403);
      const html = await res.text();
      expect(html).toContain("isn't available on your account");
      expect(html).not.toContain("owner page");
    });
  });

  it("refuses a signed-out visitor identically — existence leaks nothing", async () => {
    await withPage(undefined, async (base) => {
      expect((await fetch(base)).status).toBe(403);
    });
  });
});
