import {
  CARD_SHOWN,
  type ChatConvictionDraft,
  type CompanionConvictions,
} from "../../src/companion/companion-convictions.js";
import { runCompanionTool } from "../../src/companion/companion-tools.js";

/**
 * #5482 criterion 9 — Moneypenny drafts a member's view and the rail shows its card. The tools only
 * read: a clean draft goes to the hand-off hook and the model is told nothing is saved; a draft the
 * rules refuse comes back as the rules, in words; without a linked desk or a bound port she says so.
 */

const INPUT = {
  title: "CRWV floor",
  checkOn: "2027-02-26",
  claims: [
    {
      tag: "underrated",
      statement: "CRWV's backlog outlasts the selloff.",
      bucket: "forward",
      evidence: "What the member said.",
      falsifier: "CRWV closes under $45 on or before 2026-12-18.",
      scoreBy: "2026-12-18",
    },
  ],
  steers: ["CRWV-WHEEL"],
};

const drafted = {
  draft: INPUT,
  conviction: { id: "crwv-floor-2026-10" },
  card: { label: "SIM", pairs: [], check: "Checked 2027-02-26", timing: "The playbook" },
  takesOver: [],
} as unknown as ChatConvictionDraft;

function port(over: Partial<CompanionConvictions> = {}): CompanionConvictions {
  return {
    mine: () => ({ label: "SIM", steerable: [], views: [] }),
    draft: () => ({ ok: true, drafted }),
    ...over,
  };
}

describe("the chat's conviction tools", () => {
  it("hands a clean draft to the rail and tells the model nothing is saved", async () => {
    const shown: ChatConvictionDraft[] = [];
    const answer = await runCompanionTool(
      "draft_conviction",
      {
        snapshotFor: () => undefined,
        convictions: port(),
        onConvictionDraft: (d) => shown.push(d),
      },
      "acct-1",
      INPUT,
    );
    expect(shown).toEqual([drafted]);
    expect(answer).toEqual({
      ok: true,
      result: { shown: true, status: CARD_SHOWN, card: drafted.card },
    });
  });

  it("returns the rules a draft breaks, and shows no card", async () => {
    const shown: ChatConvictionDraft[] = [];
    const answer = await runCompanionTool(
      "draft_conviction",
      {
        snapshotFor: () => undefined,
        convictions: port({ draft: () => ({ ok: false, problems: ["a", "b"] }) }),
        onConvictionDraft: (d) => shown.push(d),
      },
      "acct-1",
      INPUT,
    );
    expect(answer).toEqual({ ok: false, error: "the view breaks these rules: a; b" });
    expect(shown).toEqual([]);
  });

  it("refuses an unreadable draft before the port ever judges it", async () => {
    let judged = false;
    const answer = await runCompanionTool(
      "draft_conviction",
      {
        snapshotFor: () => undefined,
        convictions: port({
          draft: () => {
            judged = true;
            return { ok: true, drafted };
          },
        }),
      },
      "acct-1",
      { title: "no claims" },
    );
    expect(answer.ok).toBe(false);
    expect(judged).toBe(false);
  });

  it("reads the member's steerable pairs and views", async () => {
    const answer = await runCompanionTool(
      "get_my_convictions",
      { snapshotFor: () => undefined, convictions: port() },
      "acct-1",
    );
    expect(answer).toEqual({ ok: true, result: { label: "SIM", steerable: [], views: [] } });
  });

  it("says so without a linked desk, or without the session's reads bound", async () => {
    const deps = { snapshotFor: () => undefined, convictions: port() };
    expect(await runCompanionTool("get_my_convictions", deps, undefined)).toEqual({
      ok: false,
      error: "no linked desk",
    });
    const unbound = await runCompanionTool(
      "draft_conviction",
      { snapshotFor: () => undefined },
      "acct-1",
      INPUT,
    );
    expect(unbound.ok).toBe(false);
  });
});
