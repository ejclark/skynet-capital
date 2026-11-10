import { CAMPAIGNS } from "../../src/domain/campaigns.js";
import {
  askId,
  cleanQuestion,
  type DiscoveryQueue,
  LANE_READS_QUEUE,
  MAX_ASKERS,
  MAX_PER_MEMBER,
  MAX_QUEUED,
  passesUntil,
  QUESTION_MAX,
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
    expect(tellMember(first, 6, true)).toMatch(/^Queued\. It is next/);
    expect(tellMember(first, 6, true)).toMatch(/Nothing is bought or sold/);
    const deep = queueAsk(queued(["A1", "B1", "C1"]), ask("D1"), CAMPAIGNS, none, AT);
    expect(tellMember(deep, 1, true)).toMatch(/3 ahead of it, so about 4 research passes/);
  });

  it("a lane reads the queue, so the wait is said in days (#7034 slice 3b)", () => {
    expect(LANE_READS_QUEUE).toBe(true);
    const first = queueAsk([], ask("PLTR"), CAMPAIGNS, none, AT);
    expect(tellMember(first, 6)).toMatch(/runs once a day/);
  });

  it("promises no wait if the lane is ever switched off", () => {
    const deep = queueAsk(queued(["A1", "B1", "C1"]), ask("D1"), CAMPAIGNS, none, AT);
    const text = tellMember(deep, 1, false);
    expect(text).toMatch(/doesn't read this list yet, so there is no wait to promise/);
    expect(text).not.toMatch(/passes|next in line|ahead|Queued/i);
    const joined = tellMember({ status: "joined", queue: deep.queue, ahead: 3 }, 1, false);
    expect(joined).toMatch(/^Someone already asked this/);
    expect(joined).not.toMatch(/passes|ahead/i);
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

describe("a question asked inside a campaign (#6952 slice 2c, criterion 9)", () => {
  const inCampaign = (
    subject: string,
    campaign: string,
    by = "m1",
    question?: string,
    kind: "name" | "sector" | "market" = "name",
  ) => ({ kind, subject, by, campaign, ...(question ? { question } : {}) });

  it("scopes the ask to its campaign and keeps the member's words", () => {
    const out = queueAsk(
      [],
      inCampaign("PLTR", "ai-buildout", "m1", "Who buys its data?"),
      CAMPAIGNS,
      none,
      AT,
    );
    expect(out.status).toBe("queued");
    expect(out.queue[0]).toMatchObject({
      id: "ai-buildout/name:PLTR",
      campaign: "ai-buildout",
      question: "Who buys its data?",
    });
    expect(askId("name", "PLTR")).toBe("name:PLTR");
  });

  it("queues a subject the campaign already covers, instead of answering covered", () => {
    // NVDA is in ai-buildout's cast: a bare ask is covered, an ask inside it is a deeper question.
    expect(queueAsk([], ask("NVDA"), CAMPAIGNS, none).status).toBe("covered");
    const inside = queueAsk([], inCampaign("NVDA", "ai-buildout"), CAMPAIGNS, none);
    expect(inside.status).toBe("queued");
    expect(inside.queue[0]?.id).toBe("ai-buildout/name:NVDA");
  });

  it("still answers covered when a different house campaign holds the subject", () => {
    const out = queueAsk([], inCampaign("NVDA", "energy-for-ai"), CAMPAIGNS, none);
    expect(out).toMatchObject({ status: "covered", campaign: "ai-buildout" });
  });

  it("does not turn a researched name away inside a campaign, but still does for a bare ask", () => {
    const researched = (s: string): boolean => s === "PLTR";
    expect(queueAsk([], ask("PLTR"), CAMPAIGNS, researched).status).toBe("covered");
    expect(queueAsk([], inCampaign("PLTR", "ai-buildout"), CAMPAIGNS, researched).status).toBe(
      "queued",
    );
  });

  it("makes the same subject in two campaigns two asks, and a bare ask a third", () => {
    let q: DiscoveryQueue = [];
    for (const campaign of ["ai-buildout", "energy-for-ai"])
      q = queueAsk(q, inCampaign("PLTR", campaign), CAMPAIGNS, none).queue;
    q = queueAsk(q, ask("PLTR"), CAMPAIGNS, none).queue;
    expect(q.map((a) => a.id)).toEqual([
      "ai-buildout/name:PLTR",
      "energy-for-ai/name:PLTR",
      "name:PLTR",
    ]);
  });

  it("lets a second member asking the same thing in the same campaign join the first", () => {
    const first = queueAsk(
      [],
      inCampaign("PLTR", "ai-buildout", "m1", "First words"),
      CAMPAIGNS,
      none,
    );
    const out = queueAsk(
      first.queue,
      inCampaign("PLTR", "ai-buildout", "m2", "Other words"),
      CAMPAIGNS,
      none,
    );
    expect(out).toMatchObject({ status: "joined", ahead: 0 });
    expect(out.queue).toHaveLength(1);
    expect(out.queue[0]?.askers).toEqual(["m1", "m2"]);
    // The first asker's words stay: one ask never carries two.
    expect(out.queue[0]?.question).toBe("First words");
  });

  it("lets a joiner's words fill a gap when the first asker gave none", () => {
    const first = queueAsk([], inCampaign("PLTR", "ai-buildout"), CAMPAIGNS, none);
    const out = queueAsk(
      first.queue,
      inCampaign("PLTR", "ai-buildout", "m2", "Why now?"),
      CAMPAIGNS,
      none,
    );
    expect(out.queue[0]?.question).toBe("Why now?");
  });

  it("holds the same per-member and whole-queue bounds as any ask", () => {
    let q: DiscoveryQueue = [];
    for (let i = 0; i < MAX_PER_MEMBER; i++)
      q = queueAsk(q, inCampaign(`ZZ${i}`, "ai-buildout", "hog"), CAMPAIGNS, none).queue;
    expect(queueAsk(q, inCampaign("EXTRA", "ai-buildout", "hog"), CAMPAIGNS, none).status).toBe(
      "limit",
    );
    const full = Array.from({ length: MAX_QUEUED }, (_, i) => `ZZ${i}`).reduce<DiscoveryQueue>(
      (acc, s, i) => queueAsk(acc, inCampaign(s, "ai-buildout", `m${i}`), CAMPAIGNS, none).queue,
      [],
    );
    expect(queueAsk(full, inCampaign("NEWCO", "ai-buildout"), CAMPAIGNS, none).status).toBe("full");
  });
});

describe("cleanQuestion", () => {
  it("makes one tidy line and caps it at QUESTION_MAX characters", () => {
    expect(cleanQuestion("  Who \n\t keeps the   windfall?  ")).toBe("Who keeps the windfall?");
    expect(cleanQuestion("x".repeat(QUESTION_MAX + 50))).toHaveLength(QUESTION_MAX);
  });

  it("is undefined for nothing, whitespace, control characters or a non-string", () => {
    for (const bad of [undefined, "", "   ", "\u0000\u0007", 42, {}])
      expect(cleanQuestion(bad)).toBeUndefined();
  });
});
