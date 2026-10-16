import { authoredPlayId, authoredRoster } from "../../src/playbooks/authored-play.js";
import {
  type AuthoredPlayRecord,
  parseAuthoredPlaysState,
  runnableSpecs,
  TRADING_STATUSES,
} from "../../src/playbooks/authored-play-draft.js";
import { newSubscriptionRefusal } from "../../src/subscriptions/subscribe-eligibility.js";
import { subscriptionRoster } from "../../src/subscriptions/subscription-roster.js";

/**
 * A DRAFT NEVER TRADES (#5457 slice 1; Eric: an authored play runs only on its author's own account,
 * and no step before a shadow test exists may let it run).
 *
 * WHILE a saved play is a draft, the system SHALL NOT hand it to any bot's roster, SHALL NOT let it
 * be subscribed to, and SHALL read a status it doesn't know as unreadable rather than as a draft.
 */

const record = (over: Partial<AuthoredPlayRecord> = {}): AuthoredPlayRecord => ({
  id: "U-futurist-earnings-runup",
  name: "Earnings run-up",
  status: "draft",
  spec: {
    slug: "earnings-runup",
    authorAccountId: "futurist",
    authorDisplayName: "Ada",
    symbols: ["AMD"],
    thesis: "long the pre-print drift, out before the dead final week",
    trigger: { kind: "pre-print-window", enterDaysBefore: 20, exitDaysBefore: 6 },
    size: { conservative: 0.01, standard: 0.02, aggressive: 0.03 },
  },
  createdAt: "2026-10-16T12:00:00.000Z",
  updatedAt: "2026-10-16T12:00:00.000Z",
  ...over,
});

describe("a draft never trades", () => {
  it("no status may trade yet — the list is empty until a shadow test and a promotion exist", () => {
    expect(TRADING_STATUSES).toEqual([]);
  });

  it("a draft compiles to nothing: no spec reaches the roster, whatever its author", () => {
    const drafts = [record(), record({ id: "U-futurist-two", name: "Two" })];
    expect(runnableSpecs(drafts)).toEqual([]);
    expect(authoredRoster(runnableSpecs(drafts), "futurist").plays).toEqual([]);
  });

  it("the filter is what holds it: the same spec handed straight to the roster would compile", () => {
    const { spec } = record();
    expect(authoredRoster([spec], "futurist").plays.map((p) => p.id)).toEqual([
      authoredPlayId(spec),
    ]);
    expect(authoredRoster(runnableSpecs([record()]), "futurist").plays).toEqual([]);
  });

  it("a subscription to a draft's play resolves to nothing, even on its author's own account", () => {
    const roster = subscriptionRoster(
      [
        {
          accountId: "futurist",
          playbookId: "U-futurist-earnings-runup",
          mode: "standard",
          enabled: true,
          createdAt: "2026-10-16T12:00:00.000Z",
          updatedAt: "2026-10-16T12:00:00.000Z",
        },
      ],
      authoredRoster(runnableSpecs([record()]), "futurist"),
    );
    expect(roster.enabled).toEqual([]);
    expect(roster.rejected).toEqual(["U-futurist-earnings-runup"]);
  });

  it("the Store refuses to subscribe a draft: no playbook is called its id", () => {
    const refusal = newSubscriptionRefusal({
      playbookId: "U-futurist-earnings-runup",
      subscriptions: [],
      asOfIso: "2026-10-16T12:00:00.000Z",
    });
    expect(refusal).toBe("No playbook is called U-futurist-earnings-runup.");
  });
});

describe("reading a saved file", () => {
  it("round-trips a draft", () => {
    const state = { "member-a": [record()] };
    expect(parseAuthoredPlaysState(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });

  it("drops a record it cannot read and keeps the rest", () => {
    const state = parseAuthoredPlaysState({
      "member-a": [record(), { id: "x" }, record({ id: "U-futurist-two" })],
      "member-b": "not a list",
    });
    expect(state?.["member-a"]?.map((r) => r.id)).toEqual([
      "U-futurist-earnings-runup",
      "U-futurist-two",
    ]);
    expect(state).not.toHaveProperty("member-b");
  });

  it("a status this build doesn't know is unreadable — never downgraded to a draft", () => {
    const newer = { ...record(), status: "promoted" };
    expect(parseAuthoredPlaysState({ "member-a": [newer] })).toEqual({});
  });

  it("a spec with a basket, a stray trigger or a non-number is unreadable", () => {
    const base = record();
    const bad = [
      { ...base, spec: { ...base.spec, symbols: ["AMD", "NVDA"] } },
      { ...base, spec: { ...base.spec, trigger: { kind: "code", expr: "1" } } },
      { ...base, spec: { ...base.spec, size: { ...base.spec.size, standard: "2" } } },
    ];
    expect(parseAuthoredPlaysState({ "member-a": bad })).toEqual({});
  });

  it("a file that isn't an object is no state", () => {
    expect(parseAuthoredPlaysState([])).toBeUndefined();
    expect(parseAuthoredPlaysState(null)).toBeUndefined();
  });
});
