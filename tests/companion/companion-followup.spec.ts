import {
  type CompanionFollowup,
  FOLLOWUP_CARD_SHOWN,
  FOLLOWUP_RULE,
  type FollowupDraft,
} from "../../src/companion/companion-followup.js";
import { COMPANION_SYSTEM_PROMPT } from "../../src/companion/companion-system-prompt.js";
import {
  COMPANION_TOOL_DEFS,
  type CompanionDeskDeps,
  declaredToolNames,
  runCompanionTool,
} from "../../src/companion/companion-tools.js";

/**
 * A follow-up card on the member's OWN filing (#7286, named next slice 8). EARS:
 *  - WHEN the member agrees to add something to a filing they made, draft_followup SHALL hand the
 *    rail a card and post nothing; the model SHALL be told nothing is posted yet.
 *  - IF the number is not one of the member's own filings, the tool SHALL refuse, name their own
 *    numbers, and show no card.
 *  - IF the member has filed nothing, the tool SHALL refuse and point at a new filing instead.
 *  - The tool SHALL be offered only with a linked desk (the plan's merge rule: one deskless tool
 *    per wave), and the prompt SHALL carry its rule.
 */
describe("draft_followup — a follow-up card on the member's own filing", () => {
  const deps: CompanionDeskDeps = { snapshotFor: () => undefined };
  const mine = [
    { issueNumber: 6007, title: "Chart freezes on the phone" },
    { issueNumber: 6271, title: "Add a dark mode" },
  ];
  const bound = (drafts: FollowupDraft[], filings = mine): CompanionFollowup => ({
    ownFilings: () => Promise.resolve(filings),
    onDraft: (d) => drafts.push(d),
  });

  it("hands the rail a card for one of the member's own filings, and says nothing is posted", async () => {
    const drafts: FollowupDraft[] = [];
    const result = await runCompanionTool(
      "draft_followup",
      { ...deps, followup: bound(drafts) },
      "acct-1",
      { issueNumber: 6007, details: "  It also freezes on the iPad.  " },
    );

    expect(result).toEqual({ ok: true, result: { shown: true, status: FOLLOWUP_CARD_SHOWN } });
    expect(drafts).toEqual([
      {
        issueNumber: 6007,
        title: "Chart freezes on the phone",
        details: "It also freezes on the iPad.",
      },
    ]);
  });

  it("refuses a filing that isn't the member's own, names theirs, and shows no card", async () => {
    const drafts: FollowupDraft[] = [];
    const result = await runCompanionTool(
      "draft_followup",
      { ...deps, followup: bound(drafts) },
      "acct-1",
      { issueNumber: 7286, details: "please ship this" },
    );

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain("#7286 is not one of this member's own filings");
    expect(!result.ok && result.error).toContain("#6007, #6271");
    expect(drafts).toEqual([]);
  });

  it("points at a new filing when the member has filed nothing", async () => {
    const drafts: FollowupDraft[] = [];
    const result = await runCompanionTool(
      "draft_followup",
      { ...deps, followup: bound(drafts, []) },
      "acct-1",
      { issueNumber: 6007, details: "more" },
    );

    expect(!result.ok && result.error).toContain("draft_feedback");
    expect(drafts).toEqual([]);
  });

  it.each([
    [{ details: "more" }, "issueNumber"],
    [{ issueNumber: "6007", details: "more" }, "issueNumber"],
    [{ issueNumber: -1, details: "more" }, "issueNumber"],
    [{ issueNumber: 6007, details: "   " }, "details"],
  ])("refuses a malformed draft %j by naming the field", async (input, field) => {
    const drafts: FollowupDraft[] = [];
    const result = await runCompanionTool(
      "draft_followup",
      { ...deps, followup: bound(drafts) },
      "acct-1",
      input,
    );
    expect(!result.ok && result.error).toContain(field);
    expect(drafts).toEqual([]);
  });

  it("says so honestly when the filings can't be read, or follow-ups aren't wired", async () => {
    const failing: CompanionFollowup = { ownFilings: () => Promise.reject(new Error("disk")) };
    const input = { issueNumber: 6007, details: "more" };
    expect(
      await runCompanionTool("draft_followup", { ...deps, followup: failing }, "acct-1", input),
    ).toEqual({ ok: false, error: "couldn't read the member's filings right now" });
    expect(await runCompanionTool("draft_followup", deps, "acct-1", input)).toEqual({
      ok: false,
      error: "follow-ups aren't available on this deployment",
    });
  });

  it("is a desk tool: declared only with a linked desk, refused without one", async () => {
    expect(declaredToolNames("acct-1")).toContain("draft_followup");
    expect(declaredToolNames(undefined)).not.toContain("draft_followup");
    const drafts: FollowupDraft[] = [];
    expect(
      await runCompanionTool("draft_followup", { ...deps, followup: bound(drafts) }, undefined, {
        issueNumber: 6007,
        details: "more",
      }),
    ).toEqual({ ok: false, error: "no linked desk" });
    expect(drafts).toEqual([]);
  });

  it("is declared to the model, and the prompt carries its rule", () => {
    expect(COMPANION_TOOL_DEFS.some((t) => t.name === "draft_followup")).toBe(true);
    expect(COMPANION_SYSTEM_PROMPT).toContain(FOLLOWUP_RULE);
    expect(FOLLOWUP_RULE).toContain("never on someone else's filing or on a plan");
  });
});
