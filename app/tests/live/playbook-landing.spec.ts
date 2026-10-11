import type { PlaybookCard } from "../../src/live/bot-playbooks";
import {
  landingCard,
  landingFor,
  landingFromSearch,
  landingOf,
} from "../../src/live/playbook-landing";

/** #5073 slice 4a (#5037 round 2, R2-act): an order's playbook link names the card, the mode it
 *  ran in, the check that placed it and the order — and `/accounts` reads the same four back. */

const at = "2026-10-05T15:20:00.000Z";

describe("landingFor — what an order's playbook link writes", () => {
  it("names the playbook, its mode, the check that placed the order, and the order", () => {
    expect(
      landingFor({ playbookId: "SAURON", playbookMode: "aggressive", cycleAt: at }, "ord-1"),
    ).toEqual({ card: "SAURON", mode: "aggressive", fill: Date.parse(at), from: "ord-1" });
  });

  it("leaves the check out when the decision recorded none, or one that will not parse", () => {
    expect(landingFor({ playbookId: "SAURON" }, "ord-1")).toEqual({
      card: "SAURON",
      from: "ord-1",
    });
    expect(landingFor({ playbookId: "SAURON", cycleAt: "soon" }, "ord-1").fill).toBeUndefined();
  });
});

describe("landingFromSearch — the same link, read back on /accounts", () => {
  it("round-trips what the link wrote", () => {
    const written = landingFor(
      { playbookId: "CRWV-WHEEL", playbookMode: "aggressive", cycleAt: at },
      "put-1",
    );
    // A URL hands every value back as it was serialized: the fill arrives as a number or a string.
    expect(landingFromSearch({ ...written })).toEqual(written);
    expect(landingFromSearch({ ...written, fill: String(written.fill) })).toEqual(written);
  });

  it("is nothing without a card, and drops a malformed part rather than the landing", () => {
    expect(landingFromSearch({ mode: "aggressive", fill: 1 })).toEqual({});
    expect(landingFromSearch({ card: "" })).toEqual({});
    expect(landingFromSearch({ card: "X".repeat(81) })).toEqual({});
    expect(landingFromSearch({ card: "SAURON", fill: "-3", mode: 4, from: "" })).toEqual({
      card: "SAURON",
    });
    expect(landingFromSearch({ card: "SAURON", fill: 1.5 })).toEqual({ card: "SAURON" });
  });

  it("hands the page only the four landing params", () => {
    expect(landingOf({ card: "SAURON", fill: 9 })).toEqual({ card: "SAURON", fill: 9 });
    expect(landingOf({})).toBeUndefined();
  });
});

describe("landingCard — which card the link names", () => {
  const card = (over: Partial<PlaybookCard>): PlaybookCard => ({
    key: over.playbookId ?? "slot-0",
    state: "tactical",
    ...over,
  });
  const cards = [
    card({ playbookId: "SAURON", mode: "standard", key: "a" }),
    card({ playbookId: "SAURON", mode: "aggressive", key: "b" }),
    card({ playbookId: "S1-NVDA", mode: "standard" }),
  ];

  it("takes the playbook in the mode it ran in", () => {
    expect(landingCard(cards, { card: "SAURON", mode: "aggressive" })?.key).toBe("b");
  });

  it("falls back to the playbook in any mode when that mode has no card now", () => {
    expect(landingCard(cards, { card: "SAURON", mode: "cautious" })?.key).toBe("a");
    expect(landingCard(cards, { card: "S1-NVDA" })?.playbookId).toBe("S1-NVDA");
  });

  it("never lands on a card whose name is withheld, or one that is not there", () => {
    expect(landingCard([card({ mode: "aggressive" })], { card: "SAURON" })).toBeUndefined();
    expect(landingCard(cards, { card: "TACO-DJT" })).toBeUndefined();
  });
});
