import {
  branchFor,
  discoverySlug,
  planPass,
  shelfFileFor,
  toTaken,
  withoutAnswered,
} from "../../src/domain/discovery-pass.js";
import type { DiscoveryAsk } from "../../src/domain/discovery-queue.js";

const ask = (
  over: Partial<DiscoveryAsk> & Pick<DiscoveryAsk, "kind" | "subject">,
): DiscoveryAsk => ({
  id: `${over.campaign ? `${over.campaign}/` : ""}${over.kind}:${over.subject}`,
  askedAt: "2026-11-09T10:00:00.000Z",
  askers: ["abcdef0123"],
  ...over,
});

const queue = [
  ask({ kind: "name", subject: "PLTR", question: "is it a buy?" }),
  ask({ kind: "sector", subject: "Energy" }),
  ask({ kind: "name", subject: "CEG", campaign: "energy-for-ai" }),
  ask({ kind: "name", subject: "NVDA", campaign: "abc1234567~mine" }),
];
const nothingAnswered = (): boolean => false;

describe("planPass (#7034 slice 3b)", () => {
  it("takes the front of the queue, at most the ceiling", () => {
    const taken = planPass({
      queue,
      ceiling: 2,
      spentByEvents: 0,
      answered: nothingAnswered,
      openHeads: [],
    });
    expect(taken.map((t) => t.id)).toEqual(["name:PLTR", "sector:Energy"]);
  });

  it("leaves the slots event research used, and takes nothing at halt or when overspent", () => {
    const run = (ceiling: number, spentByEvents: number) =>
      planPass({ queue, ceiling, spentByEvents, answered: nothingAnswered, openHeads: [] });
    expect(run(3, 2).map((t) => t.id)).toEqual(["name:PLTR"]);
    expect(run(0, 0)).toEqual([]);
    expect(run(2, 5)).toEqual([]);
    expect(run(Number.NaN, 0)).toEqual([]);
  });

  it("skips an ask already answered on the shelf or already an open PR, and fills the room behind it", () => {
    const taken = planPass({
      queue,
      ceiling: 2,
      spentByEvents: 0,
      answered: (a) => a.subject === "PLTR",
      openHeads: [branchFor(queue[1] as DiscoveryAsk)],
    });
    expect(taken.map((t) => t.id)).toEqual(["energy-for-ai/name:CEG", "abc1234567~mine/name:NVDA"]);
  });

  it("hands a session the subject and never a member's words or keys", () => {
    const [first] = planPass({
      queue,
      ceiling: 1,
      spentByEvents: 0,
      answered: nothingAnswered,
      openHeads: [],
    });
    expect(Object.keys(first ?? {}).sort()).toEqual([
      "branch",
      "id",
      "kind",
      "shelfFile",
      "slug",
      "subject",
    ]);
    expect(JSON.stringify(first)).not.toMatch(/buy|abcdef0123/);
  });
});

describe("naming an ask's work", () => {
  it("names a bare ask by kind and subject, a house campaign's by its id", () => {
    expect(discoverySlug({ kind: "name", subject: "PLTR" })).toBe("name-pltr");
    expect(discoverySlug({ kind: "sector", subject: "Consumer Staples" })).toBe(
      "sector-consumer-staples",
    );
    expect(discoverySlug({ kind: "name", subject: "CEG", campaign: "energy-for-ai" })).toBe(
      "name-ceg-in-energy-for-ai",
    );
    expect(shelfFileFor({ kind: "name", subject: "PLTR" })).toBe(
      "docs/research/discovery/name-pltr.md",
    );
    expect(branchFor({ kind: "name", subject: "PLTR" })).toBe("discovery/name-pltr");
  });

  it("never puts a member's key in a public name", () => {
    const slug = discoverySlug({ kind: "name", subject: "NVDA", campaign: "abc1234567~mine" });
    expect(slug).toMatch(/^name-nvda-in-[0-9a-f]{8}$/);
    expect(slug).not.toMatch(/abc1234567|mine/);
    expect(toTaken(queue[3] as DiscoveryAsk).houseCampaign).toBeUndefined();
    expect(toTaken(queue[2] as DiscoveryAsk).houseCampaign).toBe("energy-for-ai");
  });
});

describe("withoutAnswered", () => {
  it("drops answered asks and returns the same queue when none are", () => {
    expect(withoutAnswered(queue, nothingAnswered)).toBe(queue);
    expect(withoutAnswered(queue, (a) => a.kind === "name").map((a) => a.id)).toEqual([
      "sector:Energy",
    ]);
  });
});
