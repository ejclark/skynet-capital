/**
 * `get_what_members_ask` on the companion side (#7286, named next slice 4): the tool is declared,
 * dispatched, kept to a linked desk for now, and the prompt tells her how to cite it. The counting
 * itself is pinned in `tests/server/what-members-ask.spec.ts`.
 *
 * EARS lines this spec pins:
 *   - WHEN a member with a linked desk asks, the dispatcher SHALL answer with the counts for the
 *     window the model asked for.
 *   - WHILE a session has no linked desk, the tool SHALL NOT be declared, and a call SHALL be
 *     refused (offering it deskless is a later slice; one slice owns that list per wave).
 *   - The tool's schema SHALL carry no field that could hold order details.
 *   - The prompt SHALL tell her to cite counts with their window, never who asked or their words,
 *     and never to read a count as a vote or a promise.
 */
import { COMPANION_SYSTEM_PROMPT } from "../../src/companion/companion-system-prompt.js";
import {
  COMPANION_TOOL_DEFS,
  type CompanionDeskDeps,
  declaredToolNames,
  runCompanionTool,
} from "../../src/companion/companion-tools.js";
import { type AskWindow, whatMembersAsk } from "../../src/server/what-members-ask.js";

const NOW = new Date("2026-11-10T04:30:00.000Z");

function deps(overrides: Partial<CompanionDeskDeps> = {}): CompanionDeskDeps {
  return { snapshotFor: () => undefined, ...overrides };
}

const reader = (seen: AskWindow[]) => (days: AskWindow) => {
  seen.push(days);
  return Promise.resolve(counts(days));
};

const counts = (days: AskWindow) =>
  whatMembersAsk({
    days,
    now: NOW,
    queue: [
      {
        id: "sector:Energy",
        kind: "sector",
        subject: "Energy",
        askedAt: "2026-11-08T00:00:00.000Z",
        askers: ["key-a", "key-b"],
      },
    ],
    questions: [],
    filings: [],
  });

describe("get_what_members_ask — what the league asked for, counts only", () => {
  it("is declared with a linked desk and not without one", () => {
    expect(declaredToolNames("acct-1")).toContain("get_what_members_ask");
    expect(declaredToolNames(undefined)).not.toContain("get_what_members_ask");
  });

  it("answers with the counts for the window the model asked for", async () => {
    const seen: AskWindow[] = [];
    const out = await runCompanionTool(
      "get_what_members_ask",
      deps({ readWhatMembersAsk: reader(seen) }),
      "acct-1",
      { days: 7 },
    );
    expect(seen).toEqual([7]);
    expect(out).toMatchObject({
      ok: true,
      result: {
        days: 7,
        researchList: {
          available: true,
          bySubject: [{ kind: "sector", subject: "Energy", questions: 1, askedBy: 2 }],
        },
      },
    });
  });

  it("refuses without a linked desk, before any read", async () => {
    const seen: AskWindow[] = [];
    const out = await runCompanionTool(
      "get_what_members_ask",
      deps({ readWhatMembersAsk: reader(seen) }),
      undefined,
      {},
    );
    expect(out).toEqual({ ok: false, error: "no linked desk" });
    expect(seen).toEqual([]);
  });

  it("says not available when the deployment has no reader", async () => {
    expect(await runCompanionTool("get_what_members_ask", deps(), "acct-1", {})).toEqual({
      ok: false,
      error: "what members are asking for isn't available on this deployment",
    });
  });

  it("takes only a fixed window — no field that could carry order details", () => {
    const def = COMPANION_TOOL_DEFS.find((t) => t.name === "get_what_members_ask");
    expect(def).toBeDefined();
    expect(Object.keys(def?.input_schema.properties ?? {})).toEqual(["days"]);
    expect(def?.description).toMatch(/counts only/i);
  });

  it("tells her to cite counts with their window, never who asked, and never as a vote", () => {
    expect(COMPANION_SYSTEM_PROMPT).toContain("get_what_members_ask");
    expect(COMPANION_SYSTEM_PROMPT).toMatch(/never who asked/i);
    expect(COMPANION_SYSTEM_PROMPT).toMatch(/never a vote/i);
    expect(COMPANION_SYSTEM_PROMPT).toMatch(/not available.*not that nobody asked/i);
  });
});
