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
});
