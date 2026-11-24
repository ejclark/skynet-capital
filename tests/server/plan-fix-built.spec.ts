/**
 * #8077: a plan that closed without its fix being built must not tell a member "Fixed — try it".
 *
 * EARS lines this spec pins:
 *   - WHEN a matched filing's plan closed as a duplicate (now, or in its timeline since the last
 *     reopen), the system SHALL NOT mark that filing fixed.
 *   - WHEN a matched filing's plan closed and the relay moved its remainder to a new issue, the
 *     system SHALL NOT mark that filing fixed.
 *   - WHEN a matched filing's plan closed `completed` with no remainder and a clean timeline, the
 *     system SHALL mark that filing fixed, on the Feedback index and in Moneypenny's context.
 *   - IF a plan's issue or timeline cannot be read, THEN the system SHALL NOT mark it fixed.
 *
 * The fixtures are the real shapes the post-merge audit of #8026 found: #3527 (closed duplicate),
 * #1211 (closed duplicate of #8008, then re-closed so its current reason reads completed), #4469
 * (closed completed, remainder relayed to #6045 and `next-slice` removed).
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { sourceCommentBody } from "../../scripts/moneypenny/relay.mjs";
import type { JsonResponse } from "../../src/http/fetch-json.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveFeedbackApi } from "../../src/server/feedback-api-routes.js";
import { opaqueMemberId } from "../../src/server/feedback-issue.js";
import type { FeedbackLogEntry } from "../../src/server/feedback-log.js";
import { knownProblemFixes } from "../../src/server/known-problem-fixes.js";
import {
  createBuiltPlanReader,
  RELAY_RECEIPT,
  resolveBuiltPlanReader,
} from "../../src/server/plan-fix-built.js";

const email = `spec-${Math.random().toString(36).slice(2)}@example.com`;
const session = { email, name: "A Member" } as never;

const entry = (issueNumber: number, over: Partial<FeedbackLogEntry> = {}): FeedbackLogEntry => ({
  uuid: `u${issueNumber}`,
  opaqueMemberId: opaqueMemberId(email),
  issueNumber,
  url: `https://github.com/x/y/issues/${issueNumber}`,
  kind: "idea",
  title: "Put every order in one list",
  filedAt: "2026-11-23T00:00:00Z",
  ...over,
});

interface Plan {
  readonly state: string;
  readonly state_reason?: string | null;
  readonly labels?: readonly string[];
  readonly timeline?: readonly Record<string, unknown>[];
}

const closed = (event: Record<string, unknown> = {}) => ({ event: "closed", ...event });
const relayReceipt = { event: "commented", body: `${RELAY_RECEIPT} — moved on` };

/** A fake GitHub: `issues/<n>` answers the issue, `issues/<n>/timeline` its events. */
function github(plans: Record<number, Plan>, asked: string[] = []) {
  return (_method: string, url: string): Promise<JsonResponse> => {
    const path = url.replace(/^https:\/\/api\.github\.com\/repos\/x\/y\//, "");
    asked.push(path);
    const timeline = /^issues\/(\d+)\/timeline\?per_page=100&page=(\d+)$/.exec(path);
    const issue = /^issues\/(\d+)$/.exec(path);
    const plan = plans[Number((timeline ?? issue)?.[1])];
    if (!plan) return Promise.resolve({ status: 404, body: null });
    if (timeline) {
      const page = Number(timeline[2]);
      const events = plan.timeline ?? [closed({ state_reason: "completed" })];
      return Promise.resolve({ status: 200, body: events.slice((page - 1) * 100, page * 100) });
    }
    return Promise.resolve({
      status: 200,
      body: {
        state: plan.state,
        state_reason: plan.state_reason ?? null,
        labels: (plan.labels ?? []).map((name) => ({ name })),
      },
    });
  };
}

const reader = (plans: Record<number, Plan>, asked?: string[]) =>
  createBuiltPlanReader({ token: "t", repo: "x/y" }, github(plans, asked));

describe("a matched filing reads fixed only when its plan was built (#8077)", () => {
  it("does not mark U1 and U2 fixed when #8008 closed as a duplicate", async () => {
    const fixes = await knownProblemFixes(
      [entry(9001, { match: { row: "U1" } }), entry(9002, { match: { row: "U2" } })],
      reader({ 8008: { state: "closed", state_reason: "duplicate" } }),
    );
    expect([...fixes.keys()]).toEqual([]);
  });

  it("does not mark a plan-only match fixed when the plan closed as a duplicate (#3527)", async () => {
    const fixes = await knownProblemFixes(
      [entry(9003, { match: { plan: 3527 } })],
      reader({ 3527: { state: "closed", state_reason: "duplicate" } }),
    );
    expect(fixes.has(9003)).toBe(false);
  });

  it("reads the timeline: closed as a duplicate, then re-closed as completed (#1211)", async () => {
    const fixes = await knownProblemFixes(
      [entry(9005, { match: { plan: 1211 } })],
      reader({
        1211: {
          state: "closed",
          state_reason: "completed",
          timeline: [closed({ state_reason: "duplicate" }), closed({ state_reason: null })],
        },
      }),
    );
    expect(fixes.has(9005)).toBe(false);
  });

  it("does not mark a filing fixed when its plan's remainder was relayed on (#4469)", async () => {
    const fixes = await knownProblemFixes(
      [entry(9004, { match: { plan: 4469 } })],
      reader({
        4469: {
          state: "closed",
          state_reason: "completed",
          labels: ["plan", "released"],
          timeline: [closed({ state_reason: "completed" }), relayReceipt],
        },
      }),
    );
    expect(fixes.has(9004)).toBe(false);
  });

  it("does not mark a filing fixed while its closed plan still carries a remainder label", async () => {
    const asked: string[] = [];
    const fixes = await knownProblemFixes(
      [entry(9006, { match: { plan: 77 } })],
      reader({ 77: { state: "closed", state_reason: "completed", labels: ["next-slice"] } }, asked),
    );
    expect(fixes.has(9006)).toBe(false);
    expect(asked).toEqual(["issues/77"]); // the cheap check settles it; no timeline read
  });

  it("marks a filing fixed when its plan closed completed with a clean timeline", async () => {
    const fixes = await knownProblemFixes(
      [entry(9007, { match: { row: "U3" } })],
      reader({ 5206: { state: "closed", state_reason: "completed" } }),
    );
    expect(fixes.get(9007)?.tryAt?.id).toBe("trade-ticket");
  });

  it("counts a plan reopened after a duplicate close and then built", async () => {
    const fixes = await knownProblemFixes(
      [entry(9008, { match: { plan: 88 } })],
      reader({
        88: {
          state: "closed",
          state_reason: "completed",
          timeline: [
            closed({ state_reason: "duplicate" }),
            relayReceipt,
            { event: "reopened" },
            closed({ state_reason: "completed" }),
          ],
        },
      }),
    );
    expect(fixes.has(9008)).toBe(true);
  });

  it("reads a timeline past its first page before calling a plan built", async () => {
    const quiet = Array.from({ length: 100 }, () => ({ event: "labeled" }));
    const fixes = await knownProblemFixes(
      [entry(9009, { match: { plan: 99 } })],
      reader({
        99: {
          state: "closed",
          state_reason: "completed",
          timeline: [...quiet, closed({ state_reason: "completed" }), relayReceipt],
        },
      }),
    );
    expect(fixes.has(9009)).toBe(false);
  });

  it("marks nothing fixed while a plan is still open, or cannot be read", async () => {
    const fixes = await knownProblemFixes(
      [entry(9010, { match: { plan: 10 } }), entry(9011, { match: { plan: 11 } })],
      reader({ 10: { state: "open" } }),
    );
    expect(fixes.size).toBe(0);
    const failing = createBuiltPlanReader({ token: "t", repo: "x/y" }, () =>
      Promise.reject(new Error("github down")),
    );
    expect((await failing([10])).size).toBe(0);
  });

  it("is dark without the feedback token", () => {
    expect(resolveBuiltPlanReader({})).toBeUndefined();
    expect(resolveBuiltPlanReader({ SKYNET_FEEDBACK_GITHUB_TOKEN: "x" })).toBeInstanceOf(Function);
  });

  it("recognizes the relay's own receipt, word for word", () => {
    expect(
      sourceCommentBody({ number: 4469, labels: [{ name: "next-slice" }] }).startsWith(
        RELAY_RECEIPT,
      ),
    ).toBe(true);
  });
});

describe("the Feedback index, end to end (#8077)", () => {
  function fakeRes() {
    const out: { body?: string } = {};
    const res = {
      writeHead: () => res,
      end: (body?: string) => {
        out.body = body;
      },
    } as unknown as ServerResponse;
    return { res, out };
  }

  it("shows no fix on a member's filing when #8008 closed as a duplicate", async () => {
    const config = {
      hub: { getState: () => ({ participants: [] }) },
      submitFeedback: () => undefined,
      readFeedback: () => Promise.resolve([entry(9001, { match: { row: "U1" } })]),
      fetchFeedbackStatus: () => Promise.resolve(new Map([[9001, "open" as const]])),
      fetchBuiltPlans: reader({ 8008: { state: "closed", state_reason: "duplicate" } }),
    } as unknown as DashboardServerConfig;
    const { res, out } = fakeRes();
    const get = { method: "GET", headers: {} } as unknown as IncomingMessage;
    await serveFeedbackApi(get, res, "/api/feedback", config, session);
    const row = JSON.parse(out.body ?? "{}").recent[0];
    expect(row).toMatchObject({ issueNumber: 9001, status: "open" });
    expect(row.fixed).toBeUndefined();
  });
});
