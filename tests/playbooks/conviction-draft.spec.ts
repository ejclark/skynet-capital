import { convictionSlug, draftConviction } from "../../src/playbooks/conviction-draft.js";
import {
  type ConvictionDraftInput,
  parseConvictionDraft,
  parseStoredConviction,
} from "../../src/playbooks/conviction-parse.js";
import { playbookBounds } from "../../src/playbooks/conviction-store.js";

/**
 * #5482 slice 6a — a member's view drafted into a record and shown back as the settings it would
 * change. Criteria 1 (claims tagged, evidenced, falsifiable on a day), 3 (narrow only, a widening
 * refused), 9 (a before → after per setting, nothing subscribed) and 8 (SIM).
 */

const CLAIM = {
  tag: "underrated",
  statement: "CRWV's backlog outlasts the selloff.",
  bucket: "forward",
  evidence: "The 2026-10-16 premium-fit re-run: implied vol at the 63rd percentile.",
  falsifier: "CRWV closes under $45 on or before 2026-12-18.",
  scoreBy: "2026-12-18",
};

const DRAFT: ConvictionDraftInput = {
  title: "Ada's CRWV floor",
  checkOn: "2027-02-26",
  claims: [CLAIM as ConvictionDraftInput["claims"][number]],
  steers: ["CRWV-WHEEL"],
  narrowings: [
    {
      pair: "CRWV-WHEEL",
      fromClaims: ["1"],
      narrow: [
        { kind: "strike-ceiling", ceiling: 50 },
        { kind: "contracts", max: 1 },
      ],
    },
  ],
};

const ctx = (over: Record<string, unknown> = {}) => ({
  owner: "Ada Lovelace",
  statedOn: "2026-10-19",
  takenIds: new Set(["ai-dip-2026-10"]),
  subscribed: new Set(["CRWV-WHEEL", "CRWV-LONG-CALL"]),
  ...over,
});

describe("parseConvictionDraft", () => {
  it("reads a member's view, and never a study, check or score they typed", () => {
    const parsed = parseConvictionDraft({
      ...DRAFT,
      claims: [{ ...CLAIM, study: { disposition: "studied" }, score: { outcome: "pass" } }],
    });
    expect(parsed?.claims[0]).toEqual(CLAIM);
  });

  it("is unreadable, not truncated, past a bound or with a bad field", () => {
    expect(parseConvictionDraft({ ...DRAFT, claims: Array(13).fill(CLAIM) })).toBeUndefined();
    expect(
      parseConvictionDraft({ ...DRAFT, claims: [{ ...CLAIM, tag: "bullish" }] }),
    ).toBeUndefined();
    expect(
      parseConvictionDraft({
        ...DRAFT,
        narrowings: [{ pair: "CRWV-WHEEL", narrow: [{ kind: "x" }] }],
      }),
    ).toBeUndefined();
    expect(parseConvictionDraft({ ...DRAFT, title: "" })).toBeUndefined();
    expect(parseConvictionDraft("not a draft")).toBeUndefined();
  });

  it("reads a stored record back whole", () => {
    const outcome = draftConviction(DRAFT, ctx());
    if (!outcome.ok) throw new Error(outcome.problems.join("; "));
    expect(parseStoredConviction(JSON.parse(JSON.stringify(outcome.conviction)))).toEqual(
      outcome.conviction,
    );
  });
});

describe("draftConviction", () => {
  it("sets the id, owner and day itself, and numbers each claim so a narrowing can cite it", () => {
    const outcome = draftConviction(DRAFT, ctx());
    if (!outcome.ok) throw new Error(outcome.problems.join("; "));
    expect(outcome.conviction).toMatchObject({
      id: "ada-s-crwv-floor-2026-10",
      owner: "Ada Lovelace",
      statedOn: "2026-10-19",
      title: "Ada's CRWV floor",
    });
    expect(outcome.conviction.claims[0]?.statement).toBe("1. CRWV's backlog outlasts the selloff.");
  });

  it("numbers claims by their place, so two can never share a number, and a full-length one reads back", () => {
    const long = "x".repeat(600);
    const outcome = draftConviction(
      {
        ...DRAFT,
        claims: [
          { ...CLAIM, statement: "2. First." },
          { ...CLAIM, statement: "Second." },
          { ...CLAIM, statement: long },
        ] as never,
      },
      ctx(),
    );
    if (!outcome.ok) throw new Error(outcome.problems.join("; "));
    expect(outcome.conviction.claims.map((c) => c.statement.slice(0, 9))).toEqual([
      "1. First.",
      "2. Second",
      "3. xxxxxx",
    ]);
    expect(parseStoredConviction(JSON.parse(JSON.stringify(outcome.conviction)))).toEqual(
      outcome.conviction,
    );
  });

  it("refuses a claim that is only a number", () => {
    expect(
      draftConviction({ ...DRAFT, claims: [{ ...CLAIM, statement: "3. " }] as never }, ctx()),
    ).toEqual({ ok: false, problems: ["claim 1: statement is empty"] });
  });

  it("shows each steered pair's before → after, only for what it changes, labelled SIM", () => {
    const outcome = draftConviction(DRAFT, ctx());
    if (!outcome.ok) throw new Error(outcome.problems.join("; "));
    const bounds = playbookBounds("CRWV-WHEEL");
    if (!bounds) throw new Error("the wheel is steerable");
    expect(outcome.card.label).toBe("SIM");
    expect(outcome.card.pairs).toEqual([
      {
        pair: "CRWV-WHEEL",
        name: "the wheel on CRWV",
        changes: [
          { setting: "Strike", before: "the playbook's own pick", after: "at or under $50.00" },
          {
            setting: "Contracts",
            before: `up to ${Math.max(...Object.values(bounds.contracts))}`,
            after: "at most 1",
          },
        ],
      },
    ]);
    expect(outcome.card.timing).toMatch(/never places an order/);
    expect(outcome.card.check).toMatch(/^Checked 2027-02-26, .* Exits keep running\.$/);
  });

  it("steers a pair for its check date alone when it narrows nothing there", () => {
    const outcome = draftConviction({ ...DRAFT, narrowings: undefined }, ctx());
    if (!outcome.ok) throw new Error(outcome.problems.join("; "));
    expect(outcome.card.pairs[0]?.changes).toEqual([]);
  });

  it("refuses a widening whole, in the store's own words (criterion 3)", () => {
    const bounds = playbookBounds("CRWV-WHEEL");
    if (!bounds) throw new Error("the wheel is steerable");
    const outcome = draftConviction(
      {
        ...DRAFT,
        narrowings: [
          {
            pair: "CRWV-WHEEL",
            fromClaims: ["1"],
            narrow: [{ kind: "dte", min: bounds.dte.min - 1 }],
          },
        ],
      },
      ctx(),
    );
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.problems.join(" ")).toMatch(/wider than this playbook's/);
  });

  it("never steers a pair none of the member's bots subscribes to", () => {
    const outcome = draftConviction(DRAFT, ctx({ subscribed: new Set() }));
    expect(outcome).toEqual({
      ok: false,
      problems: [
        "none of your bots subscribes to CRWV-WHEEL; a conviction steers pairs you already run and never subscribes one",
      ],
    });
  });

  it("keeps a seeded record's rules: a claim per view, ◆ pairs only, a dated falsifier", () => {
    const outcome = draftConviction(
      {
        ...DRAFT,
        claims: [
          { ...CLAIM, bucket: "tested", scoreBy: undefined, falsifier: "It falls." },
        ] as never,
        steers: ["S1-NVDA"],
        narrowings: undefined,
      },
      ctx({ subscribed: new Set(["S1-NVDA"]) }),
    );
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.problems).toEqual(
      expect.arrayContaining([
        "claim 1: the falsifier is not dated (name a day, or set scoreBy)",
        "steers S1-NVDA, which is not a ◆ conviction pair (cite its study instead)",
      ]),
    );
  });

  it("asks for a price, not a claim's floor band, and a name not already taken", () => {
    const outcome = draftConviction(
      {
        ...DRAFT,
        narrowings: [
          {
            pair: "CRWV-WHEEL",
            fromClaims: ["1"],
            narrow: [{ kind: "strike-ceiling", ceiling: { floorOfClaim: "1" } }],
          },
        ],
      },
      ctx({ takenIds: new Set(["ada-s-crwv-floor-2026-10"]) }),
    );
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.problems).toEqual([
      `a view named "Ada's CRWV floor" was already stated this month; give this one another name`,
      "the strike ceiling on CRWV-WHEEL must be a price: a claim's floor band needs its study, which members' claims do not get yet",
    ]);
  });

  it("needs a title with a letter or a digit to make an id from", () => {
    expect(convictionSlug("  !!  ")).toBe("");
    expect(draftConviction({ ...DRAFT, title: "!!" }, ctx())).toEqual({
      ok: false,
      problems: ["the title needs a letter or a digit"],
    });
  });
});
