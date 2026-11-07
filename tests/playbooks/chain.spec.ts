import {
  AI_DIP_CHAIN,
  chainStart,
  HANDOFF_EVENTS,
  MAX_LINKS,
  nextOwner,
  PASSES,
  type PlaybookChain,
  parseChain,
} from "../../src/playbooks/chain.js";
import { CRWV_LONG_CALL, CRWV_WHEEL } from "../../src/playbooks/registry.js";

/**
 * PLAYBOOK CHAINS (#6959 slice 1) — a chain is a form: a playbook, an event from a closed menu, the
 * next playbook. It carries no condition, no loop, and never two owners for one event.
 */

const KNOWN = new Set(["A", "B", "C", "D"]);
const link = (from: string, kind: string, to: string) => ({ from, on: { kind }, to });
const record = (links: unknown[], extra: Record<string, unknown> = {}) => ({
  id: "T",
  title: "a test chain",
  source: "spec",
  links,
  ...extra,
});
const problemsOf = (raw: unknown, known: ReadonlySet<string> = KNOWN): readonly string[] => {
  const parsed = parseChain(raw, known);
  return parsed.ok ? [] : parsed.problems;
};

describe("Given a chain record (criterion 1)", () => {
  it("then a playbook, an event from the menu and the next playbook is a chain", () => {
    const parsed = parseChain(
      record([link("A", "expired", "B"), link("A", "assigned", "C")]),
      KNOWN,
    );
    expect(parsed.ok).toBe(true);
  });

  it("then the menu is the six events the code already observes, and nothing else", () => {
    expect([...HANDOFF_EVENTS]).toEqual([
      "filled",
      "take-profit",
      "stopped",
      "assigned",
      "expired",
      "on-date",
    ]);
  });

  it("then an event off the menu is refused", () => {
    expect(problemsOf(record([link("A", "price-still-low", "B")])).join()).toMatch(
      /not on the menu/,
    );
  });

  it("then a free-form condition on a link, an event or the chain is refused", () => {
    expect(
      problemsOf(record([{ ...link("A", "expired", "B"), when: "close < 60" }])).join(),
    ).toMatch(/carries no condition \(when\)/);
    expect(
      problemsOf(record([{ from: "A", on: { kind: "expired", if: "iv > 90" }, to: "B" }])).join(),
    ).toMatch(/event carries no condition \(if\)/);
    expect(problemsOf(record([link("A", "expired", "B")], { rule: "x" })).join()).toMatch(
      /chain carries no condition \(rule\)/,
    );
  });

  it("then on-date carries a YYYY-MM-DD date and nothing else", () => {
    const dated = { from: "A", on: { kind: "on-date", date: "2027-01-29" }, to: "B" };
    expect(parseChain(record([dated]), KNOWN).ok).toBe(true);
    expect(problemsOf(record([{ ...dated, on: { kind: "on-date" } }])).join()).toMatch(
      /YYYY-MM-DD/,
    );
  });

  it(`then a chain has at most ${MAX_LINKS} links`, () => {
    const four = [
      link("A", "expired", "B"),
      link("A", "assigned", "C"),
      link("B", "take-profit", "D"),
      link("C", "stopped", "D"),
    ];
    expect(problemsOf(record(four)).join()).toMatch(/at most 3 links/);
  });

  it("then a loop back to an earlier link, or a playbook handing off to itself, is refused", () => {
    expect(
      problemsOf(record([link("A", "expired", "B"), link("B", "expired", "A")])).join(),
    ).toMatch(/no loops/);
    expect(problemsOf(record([link("A", "expired", "A")])).join()).toMatch(/to itself/);
  });

  it("then two events from one playbook may hand off to the same next one", () => {
    const both = record([link("A", "expired", "B"), link("A", "take-profit", "B")]);
    expect(parseChain(both, KNOWN).ok).toBe(true);
  });

  it("then a link must start from a playbook an earlier link handed something to", () => {
    expect(
      problemsOf(record([link("A", "expired", "B"), link("C", "expired", "D")])).join(),
    ).toMatch(/C owns nothing yet/);
  });

  it("then one playbook and event names one next owner, never two", () => {
    expect(
      problemsOf(record([link("A", "expired", "B"), link("A", "expired", "C")])).join(),
    ).toMatch(/one next owner each/);
  });

  it("then a playbook the registry does not carry is refused when the ids are given", () => {
    expect(problemsOf(record([link("A", "expired", "Z")])).join()).toMatch(/no playbook Z/);
  });
});

describe("Given a position reaching an event (criteria 2 and 6)", () => {
  const chain: PlaybookChain = {
    id: "T",
    title: "t",
    source: "spec",
    links: [
      { from: "A", on: { kind: "expired" }, to: "B" },
      { from: "A", on: { kind: "assigned" }, to: "C" },
    ],
  };

  it("then a linked event hands it to the next playbook, saying what passes", () => {
    expect(nextOwner(chain, "A", { kind: "expired" })).toEqual({
      owner: "B",
      handedOff: true,
      passes: "cash",
    });
    expect(nextOwner(chain, "A", { kind: "assigned" })).toEqual({
      owner: "C",
      handedOff: true,
      passes: "position",
    });
  });

  it("then an event with no link keeps the current owner and its own exit plan", () => {
    expect(nextOwner(chain, "A", { kind: "take-profit" })).toEqual({
      owner: "A",
      handedOff: false,
    });
    expect(nextOwner(chain, "B", { kind: "expired" })).toEqual({ owner: "B", handedOff: false });
  });

  it("then a closed position passes its freed cash and a living one passes itself", () => {
    expect(PASSES.expired).toBe("cash");
    expect(PASSES.stopped).toBe("cash");
    expect(PASSES["take-profit"]).toBe("cash");
    expect(PASSES.assigned).toBe("position");
    expect(PASSES.filled).toBe("position");
  });
});

describe("Given Eric's AI-dip view as a chain", () => {
  it("then it is a valid record on the registry's own playbooks", () => {
    const known = new Set([CRWV_WHEEL.id, CRWV_LONG_CALL.id]);
    expect(parseChain(AI_DIP_CHAIN, known).ok).toBe(true);
    expect(chainStart(AI_DIP_CHAIN)).toBe(CRWV_WHEEL.id);
  });

  it("then an expired put hands the freed cash to the long call", () => {
    expect(nextOwner(AI_DIP_CHAIN, CRWV_WHEEL.id, { kind: "expired" })).toEqual({
      owner: CRWV_LONG_CALL.id,
      handedOff: true,
      passes: "cash",
    });
  });

  it("then assigned shares stay with the wheel, whose own exit is the covered call", () => {
    expect(nextOwner(AI_DIP_CHAIN, CRWV_WHEEL.id, { kind: "assigned" })).toEqual({
      owner: CRWV_WHEEL.id,
      handedOff: false,
    });
  });
});
