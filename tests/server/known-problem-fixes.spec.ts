/**
 * "Try it" (#8005 slice 7): a member's filing matched to a known problem reads as fixed once that
 * problem's plan closes as built, on the Feedback section and in Moneypenny's member context.
 *
 * EARS lines this spec pins:
 *   - WHEN a matched filing's plan reads shipped, the Feedback index SHALL mark that filing fixed,
 *     with the screen to try it on.
 *   - WHILE no filing carries a match, nothing extra SHALL be read.
 *   - WHEN a matched filing's fix has shipped, the member context SHALL tell Moneypenny, with the
 *     screen, and SHALL quote the member's own title.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { memberContext } from "../../src/companion/companion-context.js";
import type { FeedbackStatus } from "../../src/domain/feedback-status.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveFeedbackApi } from "../../src/server/feedback-api-routes.js";
import { opaqueMemberId } from "../../src/server/feedback-issue.js";
import type { FeedbackLogEntry } from "../../src/server/feedback-log.js";
import { knownProblemFixes } from "../../src/server/known-problem-fixes.js";
import type { OnboardingView } from "../../src/server/onboarding-api-routes.js";

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

const statuses =
  (known: Record<number, FeedbackStatus>, asked: number[][] = []) =>
  (numbers: readonly number[]) => {
    asked.push([...numbers]);
    return Promise.resolve(
      new Map(numbers.flatMap((n) => (known[n] ? [[n, known[n]] as const] : []))),
    );
  };

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

describe("knownProblemFixes", () => {
  it("marks a matched filing fixed when its row's plan shipped, and leaves the rest", async () => {
    const asked: number[][] = [];
    const fixes = await knownProblemFixes(
      [entry(1, { match: { row: "U3" } }), entry(2, { match: { row: "U6" } }), entry(3)],
      statuses({ 5206: "shipped", 5207: "building" }, asked),
    );
    expect(asked).toEqual([[5206, 5207]]); // only the plans the matched filings point at
    expect(fixes.get(1)?.tryAt?.id).toBe("trade-ticket");
    expect(fixes.has(2)).toBe(false);
    expect(fixes.has(3)).toBe(false);
  });

  it("reads nothing when no filing carries a match", async () => {
    const asked: number[][] = [];
    expect((await knownProblemFixes([entry(3)], statuses({}, asked))).size).toBe(0);
    expect(asked).toEqual([]);
  });

  it("reads nothing as fixed when the status read fails", async () => {
    const fixes = await knownProblemFixes([entry(1, { match: { row: "U3" } })], () =>
      Promise.reject(new Error("github down")),
    );
    expect(fixes.size).toBe(0);
  });
});

describe("the Feedback index", () => {
  it("carries the fix and the screen on the member's own matched filing", async () => {
    const config = {
      hub: { getState: () => ({ participants: [] }) },
      submitFeedback: () => undefined,
      readFeedback: () => Promise.resolve([entry(9001, { match: { row: "U3" } })]),
      fetchFeedbackStatus: statuses({ 9001: "open", 5206: "shipped" }),
    } as unknown as DashboardServerConfig;
    const { res, out } = fakeRes();
    const get = { method: "GET", headers: {} } as unknown as IncomingMessage;
    await serveFeedbackApi(get, res, "/api/feedback", config, session);
    const body = JSON.parse(out.body ?? "{}");
    expect(body.recent[0]).toMatchObject({
      issueNumber: 9001,
      status: "open",
      fixed: {
        problem: "A section switch that can't hold its sections at 390",
        tryAt: { id: "trade-ticket", route: "/app/trade?symbol=NVDA" },
      },
    });
  });
});

describe("Moneypenny's member context", () => {
  const onboarding = {
    viewerName: "A Member",
    done: 1,
    total: 3,
    steps: [],
  } as unknown as OnboardingView;

  it("tells her a fix shipped for what they asked, with the screen, once", () => {
    const text = memberContext({
      onboarding,
      filings: [],
      marketOpen: false,
      fixed: [
        {
          issueNumber: 9001,
          title: 'Put "every" order in one list',
          problem: "One history, three homes",
          tryAt: { name: "Profile: Activity", route: "/app/accounts?section=ledger" },
        },
      ],
    });
    expect(text).toContain(
      'Fixed since they asked: #9001 "Put \\"every\\" order in one list" counted toward a known problem ("One history, three homes"), and its fix has shipped: they can try it on Profile: Activity (/app/accounts?section=ledger).',
    );
    expect(text).toContain("If you have not said so in this conversation");
  });

  it("says nothing about fixes when none shipped", () => {
    expect(memberContext({ onboarding, filings: [], marketOpen: false })).not.toContain(
      "Fixed since they asked",
    );
  });
});
