import { CAMPAIGNS } from "../../src/domain/campaigns.js";
import {
  type DiscoveryQueue,
  MAX_ASKERS,
  MAX_PER_MEMBER,
  MAX_QUEUED,
  passesUntil,
  queueAsk,
  takeForPass,
  tellMember,
} from "../../src/domain/discovery-queue.js";

/**
 * A question starts discovery (#6952 slice 2b, criterion 7): WHEN a member asks about a sector,
 * market or name no campaign covers, it joins a bounded queue, the lane takes from it inside the
 * pass's ceiling and never above it, and the member is told it is queued and roughly when.
 */

const none = (): boolean => false;
const AT = new Date("2026-11-08T12:00:00Z");
const ask = (subject: string, by = "m1", kind: "name" | "sector" | "market" = "name") => ({
  kind,
  subject,
  by,
});
const queued = (subjects: string[]): DiscoveryQueue =>
  subjects.reduce<DiscoveryQueue>((q, s) => queueAsk(q, ask(s), CAMPAIGNS, none, AT).queue, []);

describe("queueAsk", () => {
  it("queues a name no campaign covers, first in first out", () => {
    const out = queueAsk([], ask("PLTR"), CAMPAIGNS, none, AT);
    expect(out).toMatchObject({ status: "queued", ahead: 0 });
    expect(out.queue).toEqual([
      {
        id: "name:PLTR",
        kind: "name",
        subject: "PLTR",
        askedAt: AT.toISOString(),
        askers: ["m1"],
      },
    ]);
    expect(queueAsk(out.queue, ask("RIVN"), CAMPAIGNS, none, AT)).toMatchObject({
      status: "queued",
      ahead: 1,
    });
  });

  it("answers covered, and queues nothing, for a name or sector a house campaign holds", () => {
    expect(queueAsk([], ask("NVDA"), CAMPAIGNS, none)).toMatchObject({
      status: "covered",
      campaign: "ai-buildout",
      queue: [],
    });
    expect(queueAsk([], ask("Utilities", "m1", "sector"), CAMPAIGNS, none)).toMatchObject({
      status: "covered",
      campaign: "energy-for-ai",
    });
  });

  it("answers covered for a name the research shelf already has a ledger on", () => {
    const out = queueAsk([], ask("PLTR"), CAMPAIGNS, (s) => s === "PLTR");
    expect(out.status).toBe("covered");
    expect(out.queue).toEqual([]);
  });

  it("queues a sector or market no campaign covers", () => {
    expect(queueAsk([], ask("Healthcare", "m1", "sector"), CAMPAIGNS, none).status).toBe("queued");
    expect(queueAsk([], ask("gold", "m1", "market"), CAMPAIGNS, none).status).toBe("queued");
  });

  it("treats a second member's identical question as one ask they join", () => {
    const first = queued(["PLTR", "RIVN"]);
    const out = queueAsk(first, ask("RIVN", "m2"), CAMPAIGNS, none);
    expect(out).toMatchObject({ status: "joined", ahead: 1 });
    expect(out.queue).toHaveLength(2);
    expect(out.queue[1]?.askers).toEqual(["m1", "m2"]);
    // The same member asking again adds nobody.
    const again = queueAsk(out.queue, ask("RIVN", "m2"), CAMPAIGNS, none);
    expect(again.queue[1]?.askers).toEqual(["m1", "m2"]);
  });

  it("remembers at most MAX_ASKERS members per ask", () => {
    let q = queued(["PLTR"]);
    for (let i = 0; i < MAX_ASKERS + 5; i++)
      q = queueAsk(q, ask("PLTR", `x${i}`), CAMPAIGNS, none).queue;
    expect(q[0]?.askers).toHaveLength(MAX_ASKERS);
  });

  it("is bounded: a full queue refuses a new ask unchanged, but a joined ask still joins", () => {
    const full = Array.from({ length: MAX_QUEUED }, (_, i) => `ZZ${i}`).reduce<DiscoveryQueue>(
      (q, s, i) => queueAsk(q, ask(s, `m${i}`), CAMPAIGNS, none, AT).queue,
      [],
    );
    expect(full).toHaveLength(MAX_QUEUED);
    const out = queueAsk(full, ask("NEWCO"), CAMPAIGNS, none);
    expect(out.status).toBe("full");
    expect(out.queue).toBe(full);
    expect(queueAsk(full, ask("ZZ3", "m9"), CAMPAIGNS, none).status).toBe("joined");
  });
});

describe("one member can't take every slot", () => {
  it("refuses a member's ask past MAX_PER_MEMBER, but still lets them join others' and others ask", () => {
    let q: DiscoveryQueue = [];
    for (let i = 0; i < MAX_PER_MEMBER; i++)
      q = queueAsk(q, ask(`ZZ${i}`, "hog"), CAMPAIGNS, none).queue;
    const out = queueAsk(q, ask("EXTRA", "hog"), CAMPAIGNS, none);
    expect(out.status).toBe("limit");
    expect(out.queue).toBe(q);
    expect(queueAsk(q, ask("EXTRA", "other"), CAMPAIGNS, none).status).toBe("queued");
    expect(tellMember(out, 6)).toMatch(/already have 5 questions waiting/);
  });
});

describe("takeForPass — the queue never raises the ceiling", () => {
  const q = queued(["A1", "B1", "C1", "D1"]);
  const ids = (xs: DiscoveryQueue) => xs.map((a) => a.subject);

  it("takes the front of the queue, at most the pass's ceiling", () => {
    const { take, rest } = takeForPass(q, 2);
    expect(ids(take)).toEqual(["A1", "B1"]);
    expect(ids(rest)).toEqual(["C1", "D1"]);
  });

  it("leaves event research its slots: only the ceiling's remainder is available", () => {
    expect(ids(takeForPass(q, 6, 5).take)).toEqual(["A1"]);
    expect(takeForPass(q, 6, 6).take).toEqual([]);
    expect(takeForPass(q, 6, 9).take).toEqual([]);
  });

  it("takes nothing at halt (ceiling 0)", () => {
    expect(takeForPass(q, 0).take).toEqual([]);
  });

  it("reads a nonsense ceiling as zero, closed, never as no limit", () => {
    for (const bad of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])
      expect(takeForPass(q, bad).take).toEqual([]);
    expect(takeForPass(q, 3, -1).take).toEqual([]);
  });

  it("never takes more than the queue holds, and never more than the ceiling", () => {
    for (let ceiling = 0; ceiling <= 8; ceiling++) {
      const { take, rest } = takeForPass(q, ceiling);
      expect(take.length).toBeLessThanOrEqual(ceiling);
      expect(take.length + rest.length).toBe(q.length);
    }
  });
});

describe("passesUntil and tellMember — roughly when", () => {
  it("counts the pass an ask is taken on, at perPass asks a pass", () => {
    expect(passesUntil(0, 6)).toBe(1);
    expect(passesUntil(5, 6)).toBe(1);
    expect(passesUntil(6, 6)).toBe(2);
    expect(passesUntil(13, 6)).toBe(3);
  });

  it("reads a bad per-pass number as one a pass, the longer wait", () => {
    expect(passesUntil(3, 0)).toBe(4);
    expect(passesUntil(3, Number.NaN)).toBe(4);
  });

  it("tells a member the ask is queued, where in line, and that nothing is traded", () => {
    const first = queueAsk([], ask("PLTR"), CAMPAIGNS, none, AT);
    expect(tellMember(first, 6)).toMatch(/^Queued\. It is next/);
    expect(tellMember(first, 6)).toMatch(/Nothing is bought or sold/);
    const deep = queueAsk(queued(["A1", "B1", "C1"]), ask("D1"), CAMPAIGNS, none, AT);
    expect(tellMember(deep, 1)).toMatch(/3 ahead of it, so about 4 research passes/);
  });

  it("says plainly when it is covered or the list is full, promising nothing", () => {
    expect(tellMember({ status: "covered", queue: [], campaign: "oil-supply" }, 6)).toMatch(
      /already covers this in oil-supply/,
    );
    expect(tellMember({ status: "full", queue: [] }, 6)).toMatch(/full list/);
  });

  it("makes no promise the app can't keep: no article, no date", () => {
    const text = tellMember(queueAsk([], ask("PLTR"), CAMPAIGNS, none, AT), 6);
    expect(text).not.toMatch(/article|comes back|\d{4}-\d{2}-\d{2}/i);
  });
});
