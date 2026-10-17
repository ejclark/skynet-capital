import { authoredPlayId, authoredRoster } from "../../src/playbooks/authored-play.js";
import {
  type AuthoredPlayRecord,
  parseAuthoredPlaysState,
  runnableSpecs,
  shadowOrders,
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
 * (#5457 slice 3) ONLY a promoted play passes `runnableSpecs`: the one trading status.
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
  it("one status may trade, and only that one: promoted", () => {
    expect(TRADING_STATUSES).toEqual(["promoted"]);
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

describe("a play in its shadow test never trades either (#5457 slice 2)", () => {
  const shadowed = (over: Partial<AuthoredPlayRecord> = {}) =>
    record({ status: "shadow", shadowSince: "2026-10-17T12:00:00.000Z", ...over });

  it("shadow is not a trading status: promotion (slice 3) added the first, and it is another", () => {
    expect(TRADING_STATUSES).not.toContain("shadow");
    expect(TRADING_STATUSES).not.toContain("draft");
  });

  it("a play in its test compiles to nothing on any roster, whatever its author", () => {
    expect(runnableSpecs([shadowed()])).toEqual([]);
    expect(authoredRoster(runnableSpecs([shadowed()]), "futurist").plays).toEqual([]);
  });

  it("a subscription to it resolves to nothing, even on its author's own account", () => {
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
      authoredRoster(runnableSpecs([shadowed()]), "futurist"),
    );
    expect(roster.enabled).toEqual([]);
  });

  it("the other door hands the spec to the shadow runner, and only for a play in its test", () => {
    const state = {
      "member-a": [shadowed(), record({ id: "U-futurist-two", name: "Two" })],
      "member-b": [shadowed({ id: "U-other-three", name: "Three" })],
    };
    expect(shadowOrders(state)).toEqual([
      { id: "U-futurist-earnings-runup", since: "2026-10-17T12:00:00.000Z", spec: record().spec },
      { id: "U-other-three", since: "2026-10-17T12:00:00.000Z", spec: record().spec },
    ]);
    expect(shadowOrders({ "member-a": [record()] })).toEqual([]);
  });

  it("a test saved without its start falls back to the last change, never to nothing", () => {
    const { shadowSince: _gone, ...bare } = shadowed();
    expect(shadowOrders({ m: [bare as AuthoredPlayRecord] })[0]?.since).toBe(bare.updatedAt);
  });

  it("round-trips a play in its test, with its start", () => {
    const state = { "member-a": [shadowed()] };
    expect(parseAuthoredPlaysState(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });

  it("a stray start on a draft is dropped: a draft is not in a test", () => {
    const parsed = parseAuthoredPlaysState({
      "member-a": [{ ...record(), shadowSince: "2026-10-17T12:00:00.000Z" }],
    });
    expect(parsed?.["member-a"]?.[0]).not.toHaveProperty("shadowSince");
  });
});

describe("a promoted play is the one that trades (#5457 slice 3)", () => {
  const promoted = (over: Partial<AuthoredPlayRecord> = {}) =>
    record({ status: "promoted", ...over });

  it("passes runnableSpecs, which a draft and a shadow test do not", () => {
    const all = [
      record(),
      record({ status: "shadow", shadowSince: "2026-10-17T12:00:00.000Z", id: "U-futurist-b" }),
      promoted({ id: "U-futurist-c" }),
    ];
    expect(runnableSpecs(all)).toEqual([record().spec]);
  });

  it("on its author's account it compiles; on any other account it does not", () => {
    const specs = runnableSpecs([promoted()]);
    expect(authoredRoster(specs, "futurist").plays.map((p) => p.id)).toEqual([
      "U-futurist-earnings-runup",
    ]);
    expect(authoredRoster(specs, "dragon").plays).toEqual([]);
  });

  it("it still needs a subscription: with none, it resolves to nothing to run", () => {
    const roster = subscriptionRoster([], authoredRoster(runnableSpecs([promoted()]), "futurist"));
    expect(roster.enabled).toEqual([]);
  });

  it("is not in the shadow runner's door, and round-trips without a test start", () => {
    expect(shadowOrders({ m: [promoted()] })).toEqual([]);
    const state = { "member-a": [promoted()] };
    expect(parseAuthoredPlaysState(JSON.parse(JSON.stringify(state)))).toEqual(state);
    const stray = parseAuthoredPlaysState({
      "member-a": [{ ...promoted(), shadowSince: "2026-10-17T12:00:00.000Z" }],
    });
    expect(stray?.["member-a"]?.[0]).not.toHaveProperty("shadowSince");
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
    const newer = { ...record(), status: "published" };
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
