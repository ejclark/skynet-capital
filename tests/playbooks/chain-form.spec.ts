import { AI_DIP_CHAIN, PASSES } from "../../src/playbooks/chain.js";
import {
  CHAINABLE,
  CHAINABLE_IDS,
  type ChainForm,
  type ChainLinkForm,
  chainFromForm,
  chainHoldsProblems,
  emptyChainForm,
  eventsFor,
  formFromChain,
  handoffProblem,
  nextPlaybookMenu,
} from "../../src/playbooks/chain-form.js";
import { findPlaybook, registeredPlaybooks } from "../../src/playbooks/registry.js";

/**
 * THE CHAIN FORM (#6959 slice 3a) — the menus a member picks from, every refusal at once under the
 * link it belongs to, and the rule `chain.ts` cannot know: the next playbook must be able to hold
 * what it is handed.
 */

const link = (from: string, on: ChainLinkForm["on"], to: string, date = ""): ChainLinkForm => ({
  from,
  on,
  date,
  to,
});
const form = (links: ChainLinkForm[], title = "A test chain"): ChainForm => ({ title, links });
const refusalsOf = (f: ChainForm) => {
  const result = chainFromForm(f, "spec");
  return result.ok ? [] : result.refusals;
};

describe("Given the playbooks on the chain menu", () => {
  it("then each is a registered playbook on one symbol", () => {
    for (const id of CHAINABLE_IDS) {
      expect(findPlaybook(id)?.symbols).toHaveLength(1);
    }
  });

  it("then what each event leaves agrees with what chain.ts says it passes", () => {
    for (const [id, row] of Object.entries(CHAINABLE)) {
      for (const [kind, left] of Object.entries(row.hands)) {
        const passes = PASSES[kind as keyof typeof PASSES];
        expect({ id, kind, cash: left === "cash" }).toEqual({ id, kind, cash: passes === "cash" });
      }
    }
  });

  it("then what a playbook hands on a position event is something it holds", () => {
    for (const row of Object.values(CHAINABLE)) {
      for (const left of Object.values(row.hands)) {
        if (left !== "cash") expect(row.holds).toContain(left);
      }
    }
  });

  it("then baskets, observe-only plays and a play with no feed are left off", () => {
    const off = registeredPlaybooks()
      .map((p) => p.id)
      .filter((id) => !CHAINABLE_IDS.includes(id));
    expect(off.sort()).toEqual(
      ["BETA-SCOUT", "COND-SCOUT", "MU-DIP-BOUNCE", "NBIS-DIP-BOUNCE", "SAURON", "TACO-DJT"].sort(),
    );
  });

  it("then every position reaches a date, and only the events its own rules take", () => {
    expect(eventsFor("CRWV-WHEEL")).toEqual(["filled", "assigned", "expired", "on-date"]);
    expect(eventsFor("CRWV-LONG-CALL")).toEqual(["filled", "take-profit", "stopped", "on-date"]);
    expect(eventsFor("S1-NVDA")).toEqual(["filled", "on-date"]);
    expect(eventsFor("NOT-A-PLAYBOOK")).toEqual([]);
  });
});

describe("Given a link whose next playbook would be handed something", () => {
  it("then the AI-dip chain passes: the wheel's freed cash goes to the long call", () => {
    expect(chainHoldsProblems(AI_DIP_CHAIN)).toEqual([undefined]);
  });

  it("then #6994's case is refused: assigned shares handed to the long call, which reads calls only", () => {
    expect(handoffProblem("CRWV-WHEEL", "assigned", "CRWV-LONG-CALL")).toMatch(
      /can't manage shares, which is what CRWV-WHEEL hands on when its sold contract is assigned/,
    );
  });

  it("then a position never passes to a playbook on another symbol", () => {
    expect(handoffProblem("CRWV-LONG-CALL", "on-date", "NVDA-LONG-LEAP")).toMatch(
      /NVDA-LONG-LEAP trades NVDA, so it can't take over CRWV-LONG-CALL's CRWV position/,
    );
  });

  it("then freed cash may fund a playbook on any symbol", () => {
    expect(handoffProblem("CRWV-LONG-CALL", "take-profit", "S1-NVDA")).toBeUndefined();
    expect(handoffProblem("NVDA-LONG-LEAP", "stopped", "CRWV-WHEEL")).toBeUndefined();
  });

  it("then an event the giver's position never reaches is refused, naming the ones it does", () => {
    expect(handoffProblem("S1-NVDA", "assigned", "CRWV-WHEEL")).toBe(
      `S1-NVDA's position never reaches "its sold contract is assigned" — pick one it does: its order fills; a date you pick arrives.`,
    );
  });

  it("then a giver an earlier link handed a position may hand on anything it can hold", () => {
    // Handed shares, the wheel sells a covered call, and that sale fills too.
    expect(handoffProblem("CRWV-WHEEL", "filled", "CRWV-LONG-CALL", true)).toMatch(
      /can't manage a sold put or shares or shares with a call sold on them/,
    );
    expect(handoffProblem("CRWV-WHEEL", "filled", "CRWV-LONG-CALL")).toMatch(
      /can't manage a sold put,/,
    );
  });

  it("then a playbook off the menu is refused by name", () => {
    expect(handoffProblem("SAURON", "filled", "CRWV-WHEEL")).toMatch(
      /can't be part of a chain yet/,
    );
  });

  it("then the next-playbook menu says, before the pick, who can take the handoff", () => {
    const afterExpiry = nextPlaybookMenu("CRWV-WHEEL", "expired");
    expect(afterExpiry.map((o) => o.id)).not.toContain("CRWV-WHEEL");
    expect(afterExpiry.every((o) => o.refused === undefined)).toBe(true);
    // No second CRWV playbook manages shares, so today nobody can take assigned CRWV shares — the
    // wheel keeps them and sells its own covered call (criterion 6).
    const afterAssignment = nextPlaybookMenu("CRWV-WHEEL", "assigned");
    expect(afterAssignment.every((o) => o.refused !== undefined)).toBe(true);
  });
});

describe("Given a member filling in the chain form", () => {
  it("then the AI-dip chain round-trips through the form unchanged", () => {
    const result = chainFromForm(formFromChain(AI_DIP_CHAIN), AI_DIP_CHAIN.source);
    expect(result.ok && result.chain.links).toEqual(AI_DIP_CHAIN.links);
  });

  it("then a fresh form opens on one blank link and is refused for every blank at once", () => {
    expect(refusalsOf({ ...emptyChainForm(), title: "" })).toEqual([
      { field: "title", reason: "Say in a line what the chain does." },
      {
        field: "link.0",
        reason:
          "Pick the playbook that hands off, what happens to its position, the playbook that takes over.",
      },
    ]);
  });

  it("then a date link needs its date, and a date off the calendar shape is refused under it", () => {
    // A date hands the position itself on, and nobody can take it on these picks yet — so the
    // holding refusal rides beside the date one.
    expect(refusalsOf(form([link("CRWV-WHEEL", "on-date", "CRWV-LONG-CALL")]))).toContainEqual({
      field: "link.0",
      reason: "Pick the date.",
    });
    expect(
      refusalsOf(form([link("CRWV-LONG-CALL", "on-date", "S1-NVDA", "11/08/2026")])),
    ).toContainEqual({
      field: "link.0",
      reason: "Write the date as year-month-day, like 2027-01-15.",
    });
  });

  it("then a blank title with whole links is said once, under the title", () => {
    expect(refusalsOf(form([link("CRWV-WHEEL", "expired", "CRWV-LONG-CALL")], " "))).toEqual([
      { field: "title", reason: "Say in a line what the chain does." },
    ]);
  });

  it("then a holding refusal comes back beside a loop and a blank, not a round-trip later", () => {
    const refusals = refusalsOf(
      form([
        link("CRWV-WHEEL", "assigned", "CRWV-LONG-CALL"),
        link("CRWV-LONG-CALL", "stopped", "CRWV-WHEEL"),
      ]),
    );
    expect(refusals.map((r) => r.field)).toEqual(["link.0", "link.1"]);
    expect(refusals[0]?.reason).toMatch(/can't manage shares/);
    expect(refusals[1]?.reason).toMatch(/no loops/);
    const withBlank = refusalsOf(
      form([link("CRWV-WHEEL", "assigned", "CRWV-LONG-CALL"), link("", "", "")]),
    );
    expect(withBlank.map((r) => r.field)).toEqual(["link.1", "link.0"]);
  });

  it("then a registered playbook off the menu is named as one, never as missing", () => {
    expect(refusalsOf(form([link("SAURON", "filled", "CRWV-WHEEL")]))).toEqual([
      // SAURON's display name: a member reads the play's name, not its id.
      { field: "link.0", reason: "Buy the rumor, sell the news can't be part of a chain yet." },
    ]);
  });

  it("then chain.ts's own rules land under the link they name", () => {
    const loop = refusalsOf(
      form([
        link("CRWV-WHEEL", "expired", "CRWV-LONG-CALL"),
        link("CRWV-LONG-CALL", "stopped", "CRWV-WHEEL"),
      ]),
    );
    expect(loop).toEqual([
      { field: "link.1", reason: "CRWV-WHEEL hands back to CRWV-LONG-CALL; a chain has no loops." },
    ]);
    const offMenu = refusalsOf(
      form([link("CRWV-WHEEL", "price-still-low" as ChainLinkForm["on"], "CRWV-LONG-CALL")]),
    );
    expect(offMenu[0]?.field).toBe("link.0");
    expect(offMenu[0]?.reason).toMatch(/is not on the menu/);
  });

  it("then a fourth link is refused under the list, not under a link", () => {
    const four = form([
      link("CRWV-WHEEL", "expired", "CRWV-LONG-CALL"),
      link("CRWV-LONG-CALL", "take-profit", "S1-NVDA"),
      link("S1-NVDA", "on-date", "G1-GOOG", "2027-01-15"),
      link("CRWV-LONG-CALL", "stopped", "NVDA-CALL-SPREAD"),
    ]);
    expect(refusalsOf(four)).toContainEqual({
      field: "links",
      reason: "A chain has at most 3 links.",
    });
  });

  it("then a sound record whose handoff cannot be held is still refused, under its link", () => {
    expect(refusalsOf(form([link("CRWV-WHEEL", "assigned", "CRWV-LONG-CALL")]))).toEqual([
      {
        field: "link.0",
        reason:
          "CRWV-LONG-CALL can't manage shares, which is what CRWV-WHEEL hands on when its sold contract is assigned.",
      },
    ]);
  });

  it("then a long or two-line title is refused, and the chain's id comes from the title", () => {
    const long = refusalsOf(form([link("CRWV-WHEEL", "expired", "S1-NVDA")], "x".repeat(81)));
    expect(long[0]?.field).toBe("title");
    const ok = chainFromForm(
      form([link("CRWV-WHEEL", "expired", "S1-NVDA")], "Puts, then NVDA"),
      "spec",
    );
    expect(ok.ok && ok.chain.id).toBe("puts-then-nvda");
  });
});
