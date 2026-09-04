import type { IncomingMessage, ServerResponse } from "node:http";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { opaqueMemberId } from "../../src/server/feedback-issue.js";
import { serveOnboardingApi } from "../../src/server/onboarding-api-routes.js";

/**
 * M·01 as data: every done-state is the server's reading of a ledger — the board for "connected",
 * the progression view for "first feedback" and "first trade" — and the money block is the
 * viewer's OWN human account only.
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

const get = () => ({ method: "GET", headers: {} }) as unknown as IncomingMessage;
const session = { email: "joe@example.com" } as never;

const participants = [
  { id: "human-joe", displayName: "Uncle Joe", kind: "human", equity: 1_000_000, cash: 992_296 },
  { id: "sauron", displayName: "Sauron", kind: "bot", equity: 998_942, cash: 500_000 },
];

function configWith(over: Record<string, unknown> = {}): DashboardServerConfig {
  return {
    hub: { getState: () => ({ participants }) },
    auth: { providerIds: ["google"] },
    ...over,
  } as unknown as DashboardServerConfig;
}

const progressionWith = (over: Record<string, unknown> = {}) => ({
  view: () =>
    Promise.resolve({
      wheels: true,
      earned: [],
      engagementEarned: [],
      nextUp: "101",
      ...over,
    }),
});

async function body(config: DashboardServerConfig, sess: unknown = session) {
  const { res, out } = fakeRes();
  const answered = await serveOnboardingApi(get(), res, "/api/onboarding", config, sess as never);
  return { answered, ...JSON.parse(out.body ?? "{}") };
}

describe("serveOnboardingApi", () => {
  it("ignores other paths", async () => {
    const { res } = fakeRes();
    expect(await serveOnboardingApi(get(), res, "/api/learn", configWith(), session)).toBe(false);
  });

  it("refuses anything but GET", async () => {
    const { res, out } = fakeRes();
    const post = { method: "POST", headers: {} } as unknown as IncomingMessage;
    expect(await serveOnboardingApi(post, res, "/api/onboarding", configWith(), session)).toBe(
      true,
    );
    expect(out.status).toBe(405);
  });

  it("starts from nothing done for a member with no account, no filing, no fill", async () => {
    const view = await body(
      configWith({ resolveOwnerIds: () => [], progression: progressionWith() }),
    );
    expect(view.linked).toBe(true);
    expect(view.milestone.code).toBe("M·01");
    expect(view.steps.map((s: { done: boolean }) => s.done)).toEqual([false, false, false]);
    expect(view.done).toBe(0);
    expect(view.account).toBeUndefined();
  });

  it("counts connect only for the member's OWN human account — an owned bot is not it", async () => {
    const view = await body(
      configWith({ resolveOwnerIds: () => ["sauron"], progression: progressionWith() }),
    );
    expect(view.steps[0].done).toBe(false);
    expect(view.account).toBeUndefined();
  });

  it("reads connect, first message and first trade from the ledgers, with the account block", async () => {
    const view = await body(
      configWith({
        resolveOwnerIds: () => ["sauron", "human-joe"],
        resolveOwnerId: () => "human-joe",
        progression: progressionWith({
          earned: [{ milestoneId: "first-buy", code: "101", orderId: "o1", at: "2026-09-01" }],
          engagementEarned: [{ milestoneId: "first-message", at: "2026-09-01" }],
          nextUp: "102",
        }),
      }),
    );
    expect(view.steps.map((s: { done: boolean }) => s.done)).toEqual([true, true, true]);
    expect(view.complete).toBe(true);
    expect(view.points).toBe(30);
    expect(view.account).toEqual({
      id: "human-joe",
      displayName: "Uncle Joe",
      equity: 1_000_000,
      cash: 992_296,
      stale: false,
      rungsEarned: 1,
      rungsTotal: 6,
      nextUp: { code: "102", title: "Sell stock" },
    });
  });

  it("names a fresh course graduation on the account block (#469 slice 4)", async () => {
    const view = await body(
      configWith({
        resolveOwnerIds: () => ["human-joe"],
        resolveOwnerId: () => "human-joe",
        progression: progressionWith({
          earned: [],
          engagementEarned: [],
          celebrating: [
            { milestoneId: "first-covered-call", code: "202", orderId: "o1", at: "2026-09-01" },
          ],
        }),
      }),
    );
    expect(view.account.freshGraduation).toEqual({
      level: 200,
      title: "The Wheel — get paid to own good stocks",
    });
  });

  it("names nothing when the fresh earn is real but doesn't graduate a course", async () => {
    const view = await body(
      configWith({
        resolveOwnerIds: () => ["human-joe"],
        resolveOwnerId: () => "human-joe",
        progression: progressionWith({
          earned: [],
          engagementEarned: [],
          celebrating: [{ milestoneId: "first-buy", code: "101", orderId: "o1", at: "2026-09-01" }],
        }),
      }),
    );
    expect(view.account.freshGraduation).toBeUndefined();
  });

  it("answers an unauthenticated deployment as not linked, nothing done", async () => {
    const view = await body(configWith({ auth: undefined }), undefined);
    expect(view.linked).toBe(false);
    expect(view.done).toBe(0);
  });

  it("reads progression with the member's OPAQUE id, not the account id (#1171)", async () => {
    // The feedback log is keyed by `opaqueMemberId(session.email)` — a different id space than
    // the account id `resolveOwnerId` returns. Passing the account id into that slot is exactly
    // how #1171 shipped: every filing looked unfiled forever.
    const calls: unknown[][] = [];
    await body(
      configWith({
        resolveOwnerIds: () => ["human-joe"],
        resolveOwnerId: () => "human-joe",
        progression: {
          view: (...args: unknown[]) => {
            calls.push(args);
            return Promise.resolve({ wheels: true, earned: [], engagementEarned: [] });
          },
        },
      }),
    );
    expect(calls).toEqual([["human-joe", opaqueMemberId("joe@example.com")]]);
  });
});
