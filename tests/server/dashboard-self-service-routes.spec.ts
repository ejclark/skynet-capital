import type { IncomingMessage, ServerResponse } from "node:http";
import type { NavContext } from "../../src/observatory/render-dashboard.js";
import type { Session } from "../../src/server/auth/session.js";
import { trySelfServiceRoute } from "../../src/server/dashboard-self-service-routes.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";

function fakeReq(method = "GET"): IncomingMessage {
  return { method } as unknown as IncomingMessage;
}

function fakeRes(): ServerResponse {
  return { writeHead: () => undefined, end: () => undefined } as unknown as ServerResponse;
}

const nav: NavContext = { active: "add", canAdd: true, authed: false };

describe("trySelfServiceRoute", () => {
  it("leaves an unrecognized path unhandled", async () => {
    const config = {} as unknown as DashboardServerConfig;
    const handled = await trySelfServiceRoute(
      fakeReq(),
      fakeRes(),
      "/nope",
      "/nope",
      config,
      undefined,
      nav,
    );
    expect(handled).toBe(false);
  });

  it("leaves /add unhandled when no addParticipant hook is wired", async () => {
    const config = {} as unknown as DashboardServerConfig;
    const handled = await trySelfServiceRoute(
      fakeReq(),
      fakeRes(),
      "/add",
      "/add",
      config,
      undefined,
      nav,
    );
    expect(handled).toBe(false);
  });

  it("dispatches a GET /add to the onboarding form when addParticipant is wired", async () => {
    const addParticipant = async () => ({ ok: true }) as never;
    const out: { status?: number; body?: string } = {};
    const res = {
      writeHead: (status: number) => {
        out.status = status;
      },
      end: (body?: string) => {
        out.body = body;
      },
    } as unknown as ServerResponse;
    const config = { addParticipant } as unknown as DashboardServerConfig;
    const session: Session = {
      email: "ann@example.com",
      provider: "google",
      exp: Date.now() + 1000,
    };

    const handled = await trySelfServiceRoute(
      fakeReq("GET"),
      res,
      "/add",
      "/add",
      config,
      session,
      nav,
    );

    expect(handled).toBe(true);
    expect(out.status).toBe(200);
  });

  it("redirects /controls to the viewer's own desk settings when controls is wired", async () => {
    const out: { status?: number; location?: string } = {};
    const res = {
      writeHead: (status: number, headers?: Record<string, string>) => {
        out.status = status;
        out.location = headers?.location;
      },
      end: () => undefined,
    } as unknown as ServerResponse;
    const config = {
      controls: { bots: () => [{ id: "bot-1" }] },
    } as unknown as DashboardServerConfig;

    const handled = await trySelfServiceRoute(
      fakeReq(),
      res,
      "/controls",
      "/controls",
      config,
      undefined,
      nav,
    );

    expect(handled).toBe(true);
    expect(out.status).toBe(302);
    expect(out.location).toContain("bot-1");
    expect(out.location).toContain("tab=settings");
  });

  it("leaves /invite and /claim unhandled when their deps aren't wired", async () => {
    const config = {} as unknown as DashboardServerConfig;
    expect(
      await trySelfServiceRoute(fakeReq(), fakeRes(), "/invite", "/invite", config, undefined, nav),
    ).toBe(false);
    expect(
      await trySelfServiceRoute(fakeReq(), fakeRes(), "/claim", "/claim", config, undefined, nav),
    ).toBe(false);
  });

  it("leaves /rotate unhandled when no rotateCredentials hook is wired", async () => {
    const config = {} as unknown as DashboardServerConfig;
    const handled = await trySelfServiceRoute(
      fakeReq(),
      fakeRes(),
      "/rotate",
      "/rotate",
      config,
      undefined,
      nav,
    );
    expect(handled).toBe(false);
  });

  // 2026-08-27, reported live: an owner's own roster account had no `ownerEmail` link, so the
  // page resolved to a DIFFERENT owned account (a bot) and locked the field on it — no way to
  // pick the account they actually needed. /rotate must offer every roster account for an owner.
  it("offers a picker with the owner's own roster account, not just the bot they own by email", async () => {
    const out: { body?: string } = {};
    const res = {
      writeHead: () => undefined,
      end: (body?: string) => {
        out.body = body;
      },
    } as unknown as ServerResponse;
    const board = [
      { id: "human-eric", displayName: "Eric", kind: "human" as const },
      { id: "sauron", displayName: "Sauron", kind: "bot" as const },
    ];
    const config = {
      auth: {},
      rotateCredentials: async () => ({ ok: true }) as never,
      hub: { getState: () => ({ participants: board }) },
      resolveOwnerId: () => "sauron",
      resolveOwnerIds: () => ["sauron"],
      isOwnerEmail: (email: string) => email === "eric@example.com",
      rosterIds: () => new Set(["human-eric", "sauron"]),
    } as unknown as DashboardServerConfig;
    const session: Session = {
      email: "eric@example.com",
      provider: "google",
      exp: Date.now() + 1000,
    };

    const handled = await trySelfServiceRoute(
      fakeReq(),
      res,
      "/rotate",
      "/rotate",
      config,
      session,
      nav,
    );

    expect(handled).toBe(true);
    expect(out.body).toContain("Eric");
    expect(out.body).toContain("Sauron");
    // A picker, not a locked single field — both names appear as <option>s in a <select>.
    expect(out.body).toContain("<select");
  });

  // Eric, 2026-08-27, live: every real entry point to /rotate carries an explicit ?id=, which
  // locks the field — the widened picker from the test above was never actually reachable.
  // /account's own switcher must carry the same widening now that rotate lives there too.
  it("widens /account's switcher to every roster account for an owner, same as /rotate", async () => {
    const out: { body?: string } = {};
    const res = {
      writeHead: () => undefined,
      end: (body?: string) => {
        out.body = body;
      },
    } as unknown as ServerResponse;
    const board = [
      { id: "human-eric", displayName: "Eric", kind: "human" as const },
      { id: "sauron", displayName: "Sauron", kind: "bot" as const },
    ];
    const config = {
      auth: {},
      accountAdmin: {
        updateProfile: async () => ({ ok: true, id: "human-eric", displayName: "Eric" }),
        removeAccount: async () => ({ ok: true, id: "human-eric", displayName: "Eric" }),
        profileFor: () => ({ displayName: "Eric" }),
      },
      rotateCredentials: async () => ({ ok: true, id: "human-eric", displayName: "Eric" }),
      hub: { getState: () => ({ participants: board }) },
      resolveOwnerId: () => "sauron",
      resolveOwnerIds: () => ["sauron"],
      isOwnerEmail: (email: string) => email === "eric@example.com",
      rosterIds: () => new Set(["human-eric", "sauron"]),
    } as unknown as DashboardServerConfig;
    const session: Session = {
      email: "eric@example.com",
      provider: "google",
      exp: Date.now() + 1000,
    };

    const handled = await trySelfServiceRoute(
      fakeReq(),
      res,
      "/account",
      "/account",
      config,
      session,
      nav,
    );

    expect(handled).toBe(true);
    // The account switcher (accountSwitcher in account-forms.ts) lists both, not just the one
    // account the session's email happens to own via a claim link.
    expect(out.body).toContain("Managing:");
    expect(out.body).toContain("Sauron");
    expect(out.body).toContain('href="/account?id=human-eric"');
    // And the rotate block is right there for the currently-selected account.
    expect(out.body).toContain('action="/account/rotate"');
  });
});
