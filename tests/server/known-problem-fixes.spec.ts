/**
 * "Try it" (#8005 slice 7): a member's filing matched to a known problem reads as fixed once that
 * problem's plan closes as built, on the Feedback section and in Moneypenny's member context.
 *
 * EARS lines this spec pins:
 *   - WHEN a matched filing's plan was built, the Feedback index SHALL mark that filing fixed,
 *     with the screen to try it on.
 *   - WHILE no filing carries a match, nothing extra SHALL be read.
 *   - WHEN a matched filing's fix has shipped, the member context SHALL tell Moneypenny, with the
 *     screen, and SHALL quote the member's own title.
 *   - WHEN that screen is offered, its path SHALL be one her link grammar links (`placeHref`):
 *     app-relative, never the ledger's `/app/…` form (#8079); a screen off the allow-list SHALL be
 *     named without a path, so no raw path reaches her reply as text.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { memberContext } from "../../src/companion/companion-context.js";
import { placeHref } from "../../src/companion/places.js";
import { KNOWN_PROBLEMS } from "../../src/domain/known-problems.js";
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

/** A fake `FetchBuiltPlans`: the plans in `built` were built (plan-fix-built.spec.ts covers what
 *  "built" reads from GitHub, #8077). */
const builtPlans =
  (built: readonly number[], asked: number[][] = []) =>
  (plans: readonly number[]) => {
    asked.push([...plans]);
    return Promise.resolve(new Set(plans.filter((n) => built.includes(n))));
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
  it("marks a matched filing fixed when its row's plan was built, and leaves the rest", async () => {
    const asked: number[][] = [];
    const fixes = await knownProblemFixes(
      [entry(1, { match: { row: "U3" } }), entry(2, { match: { row: "U6" } }), entry(3)],
      builtPlans([5206], asked),
    );
    expect(asked).toEqual([[5206, 5207]]); // only the plans the matched filings point at
    expect(fixes.get(1)?.tryAt?.id).toBe("trade-ticket");
    expect(fixes.has(2)).toBe(false);
    expect(fixes.has(3)).toBe(false);
  });

  it("reads nothing when no filing carries a match", async () => {
    const asked: number[][] = [];
    expect((await knownProblemFixes([entry(3)], builtPlans([], asked))).size).toBe(0);
    expect(asked).toEqual([]);
  });

  it("reads nothing as fixed when the plan read fails", async () => {
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
      fetchFeedbackStatus: () => Promise.resolve(new Map([[9001, "open" as const]])),
      fetchBuiltPlans: builtPlans([5206]),
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
      'Fixed since they asked: #9001 "Put \\"every\\" order in one list" counted toward a known problem ("One history, three homes"), and its fix has shipped: they can try it on Profile: Activity (/accounts?section=ledger).',
    );
    expect(text).toContain("If you have not said so in this conversation");
  });

  /** The path the context line offers for the screen, or undefined when it names the screen bare. */
  const offered = (route: string): string | undefined => {
    const text = memberContext({
      onboarding,
      filings: [],
      marketOpen: false,
      fixed: [{ issueNumber: 1, title: "t", problem: "p", tryAt: { name: "A screen", route } }],
    });
    return /they can try it on A screen \(([^)\s]+)\)/.exec(text)?.[1];
  };

  it("offers the screen by a path her links accept, never the ledger's /app form (#8079)", () => {
    expect(offered("/app/accounts?section=ledger")).toBe("/accounts?section=ledger");
    expect(placeHref(offered("/app/accounts?section=ledger") ?? "")).toBe(
      "/accounts?section=ledger",
    );
  });

  it("names a screen off her allow-list without a path, so no raw path shows as text", () => {
    const text = memberContext({
      onboarding,
      filings: [],
      marketOpen: false,
      fixed: [
        {
          issueNumber: 1,
          title: "t",
          problem: "p",
          tryAt: { name: "Pulse", route: "/app/u/sauron/pulse" },
        },
      ],
    });
    expect(text).toContain("they can try it on Pulse.");
    expect(text).not.toContain("/u/sauron/pulse");
  });

  it("every ledger row's try-it screen is offered linkable or not offered as a path at all", () => {
    const unlinkable = KNOWN_PROBLEMS.flatMap((row) => {
      const tryAt = row.screens[0];
      if (!tryAt) return [];
      const path = offered(tryAt.route);
      return path === undefined || placeHref(path) === path ? [] : [`${row.id} ${path}`];
    });
    expect(unlinkable).toEqual([]);
  });

  it("says nothing about fixes when none shipped", () => {
    expect(memberContext({ onboarding, filings: [], marketOpen: false })).not.toContain(
      "Fixed since they asked",
    );
  });
});
