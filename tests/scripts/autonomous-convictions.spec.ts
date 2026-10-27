import { buildConvictionsWire } from "../../src/autonomous/convictions-wire.js";
import { AI_DIP_2026_10 } from "../../src/playbooks/conviction-seeds.js";
import { convictionsHolder } from "../../src/scripts/autonomous-convictions.js";
import { aMemberConviction } from "../support/member-conviction.js";

/**
 * #5482 slice 6c — the bots' copy of the members' handed-over views. A pointer resolves to a
 * seeded record on any bot, and to a member's record only on the accounts it names; every record is
 * judged by the seeded store's own rules, and a seeded id can never be taken.
 */

const ADA = aMemberConviction();
const wire = (records: Parameters<typeof buildConvictionsWire>[0], at = 10) =>
  buildConvictionsWire(records, at);

function holder() {
  const lines: string[] = [];
  const h = convictionsHolder((line) => lines.push(line));
  let changes = 0;
  h.onChange(() => changes++);
  return { h, lines, changes: () => changes };
}

describe("convictionsHolder", () => {
  it("resolves the seeded records on every bot before any poll", () => {
    const { h } = holder();
    expect(h.lookupFor("dragon")(AI_DIP_2026_10.id)).toBe(AI_DIP_2026_10);
    expect(h.lookupFor("dragon")(ADA.id)).toBeUndefined();
  });

  it("resolves a member's record only on the accounts it may steer", () => {
    const { h, changes } = holder();
    h.accept(wire([{ conviction: ADA, accounts: ["futurist"] }]));
    expect(h.lookupFor("futurist")(ADA.id)).toEqual(ADA);
    expect(h.lookupFor("dragon")(ADA.id)).toBeUndefined();
    expect(changes()).toBe(1);
  });

  it("is quiet when a poll carries the same set, and ignores one stamped older", () => {
    const { h, changes } = holder();
    h.accept(wire([{ conviction: ADA, accounts: ["futurist"] }], 10));
    h.accept(wire([{ conviction: ADA, accounts: ["futurist"] }], 11));
    expect(changes()).toBe(1);
    h.accept(wire([], 9));
    expect(h.lookupFor("futurist")(ADA.id)).toEqual(ADA);
    expect(changes()).toBe(1);
  });

  it("drops a view taken back: the set is whole every time", () => {
    const { h, changes } = holder();
    h.accept(wire([{ conviction: ADA, accounts: ["futurist"] }], 10));
    h.accept(wire([], 12));
    expect(h.lookupFor("futurist")(ADA.id)).toBeUndefined();
    expect(changes()).toBe(2);
  });

  it("refuses a record that breaks a store rule, says why once, and holds it for no bot", () => {
    const { h, lines } = holder();
    const widens = aMemberConviction({
      narrowings: [{ pair: "CRWV-WHEEL", fromClaims: [], narrow: [{ kind: "dte", min: 3 }] }],
    });
    const verified = aMemberConviction({ id: "nvda-run-up", steers: ["S1-NVDA"], narrowings: [] });
    h.accept(
      wire([
        { conviction: widens, accounts: ["futurist"] },
        { conviction: verified, accounts: ["futurist"] },
      ]),
    );
    h.accept(
      wire(
        [
          { conviction: widens, accounts: ["futurist"] },
          { conviction: verified, accounts: ["futurist"] },
        ],
        11,
      ),
    );
    expect(h.lookupFor("futurist")(widens.id)).toBeUndefined();
    expect(h.lookupFor("futurist")(verified.id)).toBeUndefined();
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(
      /conviction "crwv-floor-2026-10" from the dashboard REFUSED — .*wider/,
    );
    expect(lines[1]).toMatch(/conviction "nvda-run-up" from the dashboard REFUSED — .*not a ◆/);
  });

  it("holds a view stated on its one pair even when that pair is not ◆ (contract piece 3)", () => {
    const { h, lines } = holder();
    const onPair = aMemberConviction({
      id: "s1-nvda-sauron",
      scope: "pair",
      steers: ["S1-NVDA"],
      narrowings: [],
    });
    const wider = aMemberConviction({ id: "s1-nvda-two", scope: "pair", steers: ["S1-NVDA"] });
    h.accept(
      wire([
        { conviction: onPair, accounts: ["sauron"] },
        { conviction: wider, accounts: ["sauron"] },
      ]),
    );
    expect(h.lookupFor("sauron")(onPair.id)).toEqual(onPair);
    expect(h.lookupFor("dragon")(onPair.id)).toBeUndefined();
    expect(h.lookupFor("sauron")(wider.id)).toBeUndefined();
    expect(lines.join("\n")).toMatch(/"s1-nvda-two" .* REFUSED — .*narrows nothing/);
  });

  it("never lets a member's record take a seeded id, nor a second record take a member's", () => {
    const { h, lines } = holder();
    const impostor = aMemberConviction({ id: AI_DIP_2026_10.id });
    const second = aMemberConviction({ owner: "Grace" });
    h.accept(
      wire([
        { conviction: impostor, accounts: ["futurist"] },
        { conviction: ADA, accounts: ["futurist"] },
        { conviction: second, accounts: ["dragon"] },
      ]),
    );
    expect(h.lookupFor("futurist")(AI_DIP_2026_10.id)).toBe(AI_DIP_2026_10);
    expect(h.lookupFor("futurist")(ADA.id)).toEqual(ADA);
    expect(h.lookupFor("dragon")(ADA.id)).toBeUndefined();
    expect(lines.join("\n")).toMatch(/already stored/);
  });
});
