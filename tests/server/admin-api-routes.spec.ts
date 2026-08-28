import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { serveAdminApi } from "../../src/server/admin-api-routes.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";

/**
 * The owner pages' JSON twins: every non-owner learns exactly `{owner:false}` and nothing else,
 * each surface re-checks its OWN owner dep, and the claim rules port whole — an address that
 * can't sign in is refused, and linking stamps the acting owner.
 */

function fakeRes() {
  const out: { status?: number; body?: string } = {};
  const res = {
    writeHead: (status: number) => {
      out.status = status;
      return res;
    },
    end: (body?: string) => {
      out.body = body;
    },
  } as unknown as ServerResponse;
  return { res, out };
}

function post(body: unknown): IncomingMessage {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": "application/json" };
  return req;
}

function get(): IncomingMessage {
  return { method: "GET", headers: {} } as unknown as IncomingMessage;
}

const owner = { email: "Eric@example.com" } as never; // mixed case on purpose — normalized
const member = { email: "member@example.com" } as never;
const isOwner = (email: string) => email === "eric@example.com";

describe("serveAdminApi invite", () => {
  const config = (added: unknown[]) =>
    ({
      hub: { getState: () => ({ participants: [] }) },
      invite: {
        isOwner,
        store: {
          canStoreSecurely: () => true,
          entries: () => [
            {
              value: "friend@x.com",
              kind: "email",
              addedAt: "2026-08-20T10:00:00Z",
              addedBy: "eric@example.com",
              joinedAt: "2026-08-21T09:00:00Z",
            },
          ],
          add: (e: unknown) => {
            added.push(e);
            return true;
          },
        },
      },
    }) as unknown as DashboardServerConfig;

  it("answers a member {owner:false} and nothing else", async () => {
    const { res, out } = fakeRes();
    await serveAdminApi(get(), res, "/api/admin/invite", config([]), member);
    expect(JSON.parse(out.body ?? "{}")).toEqual({ owner: false });
  });

  it("lists the guest column for an owner and adds with the OWNER stamped", async () => {
    const added: { value?: string; addedBy?: string }[] = [];
    const cfg = config(added);
    const { res, out } = fakeRes();
    await serveAdminApi(get(), res, "/api/admin/invite", cfg, owner);
    const body = JSON.parse(out.body ?? "{}");
    expect(body.entries[0].joinedAt).toBe("2026-08-21T09:00:00Z");

    const p = fakeRes();
    await serveAdminApi(post({ email: "New@Friend.com" }), p.res, "/api/admin/invite", cfg, owner);
    expect(added[0]?.value).toBe("new@friend.com"); // lowercased, like the HTML form
    expect(added[0]?.addedBy).toBe("eric@example.com");
    expect(JSON.parse(p.out.body ?? "{}").ok).toBe(true);
  });

  it("refuses a member's POST flat", async () => {
    const added: unknown[] = [];
    const { res, out } = fakeRes();
    await serveAdminApi(
      post({ email: "x@y.com" }),
      res,
      "/api/admin/invite",
      config(added),
      member,
    );
    expect(out.status).toBe(403);
    expect(added).toEqual([]);
  });
});

describe("serveAdminApi claim", () => {
  const linked: { id?: string; email?: string; by?: string }[] = [];
  const config = () =>
    ({
      hub: { getState: () => ({ participants: [] }) },
      claim: {
        isOwner,
        accounts: () => [
          { id: "human-ann", displayName: "Ann", kind: "human" },
          { id: "bot-sauron", displayName: "Sauron", kind: "bot", ownerEmail: "eric@example.com" },
        ],
        canSignIn: (email: string) => email === "ann@x.com",
        store: {
          load: () => ({ links: [] }),
          link: (id: string, email: string, by: string) => linked.push({ id, email, by }),
          unlink: () => false,
        },
      },
    }) as unknown as DashboardServerConfig;

  it("refuses linking an address that can't sign in — the guest list comes first", async () => {
    const { res, out } = fakeRes();
    await serveAdminApi(
      post({ id: "human-ann", email: "stranger@x.com" }),
      res,
      "/api/admin/claim",
      config(),
      owner,
    );
    expect(JSON.parse(out.body ?? "{}").error).toContain("can't sign in yet");
    expect(linked).toEqual([]);
  });

  it("links with the acting owner stamped, and says what changed", async () => {
    const { res, out } = fakeRes();
    await serveAdminApi(
      post({ id: "human-ann", email: "Ann@x.com" }),
      res,
      "/api/admin/claim",
      config(),
      owner,
    );
    expect(linked).toEqual([{ id: "human-ann", email: "ann@x.com", by: "eric@example.com" }]);
    const body = JSON.parse(out.body ?? "{}");
    expect(body.ok).toBe(true);
    expect(body.message).toContain("No keys changed");
  });

  it("shows a member {owner:false} — the roster leaks nothing", async () => {
    const { res, out } = fakeRes();
    await serveAdminApi(get(), res, "/api/admin/claim", config(), member);
    expect(JSON.parse(out.body ?? "{}")).toEqual({ owner: false });
  });
});

describe("serveAdminApi ops-status", () => {
  it("serves the panel to owners only", async () => {
    const config = {
      hub: { getState: () => ({ participants: [] }) },
      opsStatus: {
        isOwner,
        status: () =>
          Promise.resolve({
            generatedAt: "2026-08-28T23:00:00Z",
            degraded: false,
            signals: [{ id: "bots", label: "Bots", verdict: "ok", detail: "5 trading" }],
          }),
      },
    } as unknown as DashboardServerConfig;
    const m = fakeRes();
    await serveAdminApi(get(), m.res, "/api/admin/ops-status", config, member);
    expect(JSON.parse(m.out.body ?? "{}")).toEqual({ owner: false });

    const o = fakeRes();
    await serveAdminApi(get(), o.res, "/api/admin/ops-status", config, owner);
    expect(JSON.parse(o.out.body ?? "{}").status.signals[0].verdict).toBe("ok");
  });
});
