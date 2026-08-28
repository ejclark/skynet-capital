import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { NavContext } from "../../src/observatory/dashboard-shell.js";
import { handleOpsStatus, type OpsStatusDeps } from "../../src/server/ops-status-routes.js";
import type { OpsStatus } from "../../src/server/ops-status-service.js";

const nav: NavContext = { active: "add", canAdd: true, authed: true };

const OWNERS = new Set(["owner@example.com"]);

const STATUS: OpsStatus = {
  generatedAt: "2026-08-28T12:00:00.000Z",
  degraded: false,
  signals: [
    { id: "bridge", label: "Controls bridge", verdict: "ok", detail: "polled 5s ago" },
    {
      id: "deploy-app",
      label: "App deploy",
      verdict: "attention",
      detail: "3 commits behind",
      link: { href: "https://github.com/x/y/actions", label: "Open Actions" },
    },
  ],
};

/**
 * `/ops-status` (#666 slice 1) — read-only, owner-gated. The property worth pinning is the SAME
 * privilege split `/invite`/`/claim` already enforce: a non-owner (or an unauthenticated request)
 * sees the identical refusal an owner-only page that didn't exist would produce.
 */
async function withOpsStatus(
  viewer: string | undefined,
  deps: OpsStatusDeps,
  run: (base: string) => Promise<void>,
): Promise<void> {
  const server: Server = createServer((_req, res) => {
    void handleOpsStatus(res, viewer, deps, nav);
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe("handleOpsStatus", () => {
  const deps: OpsStatusDeps = {
    isOwner: (email) => OWNERS.has(email),
    status: () => Promise.resolve(STATUS),
  };

  it("refuses a signed-out visitor exactly like any other owner page", async () => {
    await withOpsStatus(undefined, deps, async (base) => {
      const res = await fetch(`${base}/ops-status`);
      expect(res.status).toBe(403);
      expect(await res.text()).toContain("isn't available on your account");
    });
  });

  it("refuses a signed-in member who isn't an owner", async () => {
    await withOpsStatus("member@example.com", deps, async (base) => {
      const res = await fetch(`${base}/ops-status`);
      expect(res.status).toBe(403);
    });
  });

  it("renders every signal's label, verdict, and deep link for the owner", async () => {
    await withOpsStatus("owner@example.com", deps, async (base) => {
      const res = await fetch(`${base}/ops-status`);
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("Controls bridge");
      expect(html).toContain("App deploy");
      expect(html).toContain("ATTENTION");
      expect(html).toContain("https://github.com/x/y/actions");
    });
  });
});
