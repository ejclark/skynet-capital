import {
  admitBuild,
  gateAdmission,
  isDuplicateQueueNote,
  nextAdmissible,
  QUEUE_MARKER,
  queueNote,
  readInFlight,
  surfaceOf,
} from "../../../scripts/moneypenny/admission.mjs";
import { type ClaimCtx, claimNext, peekNext } from "../../../scripts/moneypenny/index.mjs";

// THE ADMISSION GATE (#3960 criteria 1, 2, 7). Between "ready" and "a build session starts":
// halt refuses everything, conserve refuses all but fast-track, the in-flight cap refuses all but
// fast-track, and the same-surface fence refuses everything — fast-track included. Pure specs,
// then the impure `gateAdmission` with every read injected (no `gh`, no network).

const capsule = (surface: string) =>
  `**Do the thing.**\n\n| | |\n|---|---|\n| **Status** | ready |\n| **Surface** | ${surface} |\n| **Size** | ~1 PR |\n`;

const issue = (number: number, surface: string | null, labels: string[] = []) => ({
  number,
  body: surface === null ? "no capsule here" : capsule(surface),
  labels: labels.map((name) => ({ name })),
});

const mode = (position: "halt" | "conserve" | "normal" | "surge", inFlightCap = 3) => ({
  position,
  caps: { inFlightCap },
});

describe("surfaceOf — the capsule's Surface cell", () => {
  it("reads and normalises the cell (lowercase, trimmed, markdown stripped)", () => {
    expect(surfaceOf(capsule("  The `/app/accounts` **Rail**  "))).toBe("the /app/accounts rail");
  });

  it("reduces a markdown link to its text", () => {
    expect(surfaceOf(capsule("[Research lens](https://x.test/y)"))).toBe("research lens");
  });

  it.each([
    ["no spaces", "|**Surface**|Trade form|", "trade form"],
    ["wide spaces", "|   **Surface**   |   Trade   form   |", "trade form"],
    ["no bold", "| Surface | Trade form |", "trade form"],
    ["no closing pipe", "| **Surface** | Trade form", "trade form"],
  ])("tolerates odd spacing — %s", (_, row, want) => {
    expect(surfaceOf(`| | |\n|---|---|\n${row}\n`)).toBe(want);
  });

  it("is null with no table, no Surface row, or an empty/placeholder cell", () => {
    expect(surfaceOf("just prose")).toBeNull();
    expect(surfaceOf(undefined)).toBeNull();
    expect(surfaceOf("| **Status** | ready |\n| **Size** | ~1 PR |")).toBeNull();
    expect(surfaceOf(capsule(""))).toBeNull();
    expect(surfaceOf(capsule("—"))).toBeNull();
    expect(surfaceOf(capsule("n/a"))).toBeNull();
  });

  it("does not mistake prose mentioning 'surface' for the row", () => {
    expect(surfaceOf("The surface | is shiny")).toBeNull();
  });
});

describe("admitBuild — the pure gate", () => {
  const me = issue(10, "trade form");
  const urgent = issue(10, "trade form", ["fast-track"]);

  it("admits under normal with room and no shared surface", () => {
    expect(
      admitBuild({ issue: me, inFlight: [issue(1, "research lens")], mode: mode("normal") }),
    ).toEqual({ admit: true, reason: "admitted" });
  });

  it("halt refuses — even fast-track", () => {
    expect(admitBuild({ issue: me, inFlight: [], mode: mode("halt", 0) })).toEqual({
      admit: false,
      reason: "work-mode is halt",
    });
    expect(admitBuild({ issue: urgent, inFlight: [], mode: mode("halt", 0) }).admit).toBe(false);
  });

  it("conserve refuses without fast-track, admits with it", () => {
    expect(admitBuild({ issue: me, inFlight: [], mode: mode("conserve", 1) })).toEqual({
      admit: false,
      reason: "queued: conserve mode",
    });
    expect(admitBuild({ issue: urgent, inFlight: [], mode: mode("conserve", 1) })).toEqual({
      admit: true,
      reason: "admitted (fast-track, conserve)",
    });
  });

  it("refuses at the in-flight cap, naming the count", () => {
    const busy = [issue(1, "a"), issue(2, "b"), issue(3, "c")];
    expect(admitBuild({ issue: me, inFlight: busy, mode: mode("normal") })).toEqual({
      admit: false,
      reason: "queued: 3 of 3 in flight",
    });
  });

  it("does not count the issue itself as in flight", () => {
    const busy = [issue(1, "a"), issue(2, "b"), issue(10, "trade form")];
    expect(admitBuild({ issue: me, inFlight: busy, mode: mode("normal") }).admit).toBe(true);
  });

  it("fast-track skips the cap", () => {
    const busy = [issue(1, "a"), issue(2, "b"), issue(3, "c")];
    expect(admitBuild({ issue: urgent, inFlight: busy, mode: mode("normal") }).admit).toBe(true);
  });

  it("surge's bigger cap lets a fourth build through", () => {
    const busy = [issue(1, "a"), issue(2, "b"), issue(3, "c")];
    expect(admitBuild({ issue: me, inFlight: busy, mode: mode("surge", 6) }).admit).toBe(true);
  });

  it("the surface fence refuses a second build on the same surface, naming the blocker", () => {
    expect(
      admitBuild({ issue: me, inFlight: [issue(7, "  Trade Form ")], mode: mode("normal") }),
    ).toEqual({
      admit: false,
      reason: "queued behind #7 (same surface: trade form)",
      queuedBehind: 7,
    });
  });

  it("fast-track does NOT bypass the surface fence", () => {
    const verdict = admitBuild({
      issue: urgent,
      inFlight: [issue(7, "trade form")],
      mode: mode("normal"),
    });
    expect(verdict.admit).toBe(false);
    expect(verdict.queuedBehind).toBe(7);
  });

  it("no Surface on either side never fences", () => {
    expect(
      admitBuild({ issue: issue(10, null), inFlight: [issue(7, null)], mode: mode("normal") })
        .admit,
    ).toBe(true);
  });
});

describe("nextAdmissible — the retry sweep's pick", () => {
  const dated = (n: number, createdAt: string, labels: string[] = [], surface = `s${n}`) => ({
    ...issue(n, surface, ["ready", ...labels]),
    createdAt,
  });

  it("picks the oldest admissible ready issue within one rank class", () => {
    const ready = [dated(5, "2026-09-29T00:00:00Z"), dated(4, "2026-09-28T00:00:00Z")];
    expect(nextAdmissible(ready, [], mode("normal"))?.number).toBe(4);
  });

  it("skips one fenced by an in-flight surface and takes the next", () => {
    const ready = [
      dated(4, "2026-09-28T00:00:00Z", [], "trade form"),
      dated(5, "2026-09-29T00:00:00Z"),
    ];
    expect(nextAdmissible(ready, [issue(1, "trade form")], mode("normal"))?.number).toBe(5);
  });

  it("skips parked and already-in-progress issues", () => {
    const ready = [
      dated(3, "2026-09-27T00:00:00Z", ["needs-eric"]),
      dated(4, "2026-09-28T00:00:00Z", ["in-progress"]),
      dated(5, "2026-09-29T00:00:00Z"),
    ];
    expect(nextAdmissible(ready, [], mode("normal"))?.number).toBe(5);
  });

  it("puts fast-track first, and under conserve only fast-track is admissible", () => {
    const ready = [
      dated(4, "2026-09-28T00:00:00Z"),
      dated(9, "2026-09-30T00:00:00Z", ["fast-track"]),
    ];
    expect(nextAdmissible(ready, [], mode("normal"))?.number).toBe(9);
    expect(nextAdmissible(ready.slice(0, 1), [], mode("conserve", 1))).toBeNull();
  });

  // The sweep's first live tick (2026-09-30) took #784, a P3 idea, because it was the oldest.
  it("follows npm run rank: a bug before older P2 work, a P3 idea last, a hand P-label wins", () => {
    const ready = [
      dated(784, "2026-08-20T00:00:00Z", ["idea"]),
      dated(900, "2026-09-01T00:00:00Z"),
      dated(950, "2026-09-29T00:00:00Z", ["bug"]),
    ];
    expect(nextAdmissible(ready, [], mode("normal"))?.number).toBe(950);
    expect(nextAdmissible(ready.slice(0, 2), [], mode("normal"))?.number).toBe(900);
    // Eric's P1 on the idea lifts it over the derived P2 — his label always wins.
    const hand = [
      dated(784, "2026-08-20T00:00:00Z", ["idea", "P1"]),
      dated(900, "2026-08-01T00:00:00Z"),
    ];
    expect(nextAdmissible(hand, [], mode("normal"))?.number).toBe(784);
  });

  it("is null at the cap, under halt, or with nothing ready", () => {
    const busy = [issue(1, "a"), issue(2, "b"), issue(3, "c")];
    expect(nextAdmissible([dated(4, "2026-09-28T00:00:00Z")], busy, mode("normal"))).toBeNull();
    expect(nextAdmissible([dated(4, "2026-09-28T00:00:00Z")], [], mode("halt", 0))).toBeNull();
    expect(nextAdmissible([], [], mode("normal"))).toBeNull();
  });
});

describe("the queue note and its dedupe", () => {
  it("carries the marker, the reason, and the lane footer", () => {
    const body = queueNote("queued: 3 of 3 in flight");
    expect(body).toContain(QUEUE_MARKER);
    expect(body).toContain("queued: 3 of 3 in flight");
    expect(body).toContain("Generated by [Claude Code]");
  });

  it("is a duplicate only when this lane's NEWEST note says the same thing", () => {
    const a = { body: queueNote("queued: conserve mode") };
    const b = { body: queueNote("queued: 3 of 3 in flight") };
    const human = { body: "any news?" };
    expect(isDuplicateQueueNote([a, human], "queued: conserve mode")).toBe(true);
    expect(isDuplicateQueueNote([a, b], "queued: conserve mode")).toBe(false);
    expect(isDuplicateQueueNote([human], "queued: conserve mode")).toBe(false);
    expect(isDuplicateQueueNote([], "queued: conserve mode")).toBe(false);
  });
});

describe("readInFlight — the REST read", () => {
  it("asks for open in-progress issues and drops pull requests", () => {
    const seen: string[][] = [];
    const rows = readInFlight((_cmd, args) => {
      seen.push(args);
      return JSON.stringify([
        { number: 1, body: capsule("a"), labels: [{ name: "in-progress" }] },
        { number: 2, body: "", labels: [], pull_request: {} },
      ]);
    });
    expect(seen[0]?.join(" ")).toContain("issues?state=open&labels=in-progress");
    expect(rows.map((r) => r.number)).toEqual([1]);
  });

  it("throws on a non-list answer rather than reading it as 'nothing in flight'", () => {
    expect(() => readInFlight(() => '{"message":"Bad credentials"}')).toThrow();
  });
});

describe("gateAdmission — the impure call, reads injected", () => {
  const me = issue(10, "trade form");
  const setup = (over: Record<string, unknown> = {}) => {
    const posted: [number, string][] = [];
    const lines: string[] = [];
    const deps = {
      readMode: () => ({ ...mode("normal"), until: null, reason: "set to normal" }),
      readInFlight: () => [] as ReturnType<typeof issue>[],
      comments: () => [] as Array<{ body?: string }>,
      comment: (n: number, body: string) => posted.push([n, body]),
      log: (l: string) => lines.push(l),
      ...over,
    };
    return { deps, posted, lines };
  };

  it("admits and posts nothing when there is room", () => {
    const { deps, posted, lines } = setup();
    expect(gateAdmission(me, deps).admit).toBe(true);
    expect(posted).toEqual([]);
    expect(lines).toContain("::notice::work-mode=normal");
  });

  it("refuses at the cap and posts ONE queue note", () => {
    const { deps, posted } = setup({
      readInFlight: () => [issue(1, "a"), issue(2, "b"), issue(3, "c")],
    });
    expect(gateAdmission(me, deps)).toEqual({ admit: false, reason: "queued: 3 of 3 in flight" });
    expect(posted).toHaveLength(1);
    expect(posted[0]?.[0]).toBe(10);
    expect(posted[0]?.[1]).toContain("queued: 3 of 3 in flight");
  });

  it("does not repeat a note the newest lane comment already carries", () => {
    const { deps, posted, lines } = setup({
      readMode: () => ({ ...mode("conserve", 1), until: "2026-10-02", reason: "x" }),
      comments: () => [{ body: queueNote("queued: conserve mode") }],
    });
    expect(gateAdmission(me, deps).admit).toBe(false);
    expect(posted).toEqual([]);
    expect(lines.some((l) => l.includes("not repeating"))).toBe(true);
  });

  it("fails closed, with no note, when the in-flight list cannot be read", () => {
    const { deps, posted } = setup({
      readInFlight: () => {
        throw new Error("HTTP 502");
      },
    });
    expect(gateAdmission(me, deps)).toEqual({
      admit: false,
      reason: "queued: the in-flight list could not be read",
    });
    expect(posted).toEqual([]);
  });

  it("prints the dial's warning when it read one", () => {
    const { deps, lines } = setup({
      readMode: () => ({ ...mode("conserve", 1), until: null, reason: "x", warning: "no dial" }),
    });
    gateAdmission(me, deps);
    expect(lines).toContain("::warning::no dial");
  });

  it("still returns the refusal when posting the note fails", () => {
    const { deps, lines } = setup({
      readMode: () => ({ ...mode("halt", 0), until: null, reason: "x" }),
      comment: () => {
        throw new Error("403");
      },
    });
    expect(gateAdmission(me, deps)).toEqual({ admit: false, reason: "work-mode is halt" });
    expect(lines.some((l) => l.startsWith("::warning::could not post"))).toBe(true);
  });
});

describe("claimNext — the retry sweep hands the pick to its own lane's claim", () => {
  const setup = (ready: ReturnType<typeof issue>[], inFlight: ReturnType<typeof issue>[] = []) => {
    const called: Array<{ lane: string; ctx: unknown }> = [];
    const fake = (lane: string) => (ctx: ClaimCtx) => {
      called.push({ lane, ctx });
      return { claimed: true, reason: "claimed", number: ctx.payload?.issue?.number };
    };
    const deps = {
      readMode: () => ({ ...mode("normal"), until: null, reason: "set to normal" }),
      readReady: () => ready,
      readInFlight: () => inFlight,
      claims: { plan: fake("plan"), feedback: fake("feedback") },
    };
    return { deps, called };
  };
  const at = (i: ReturnType<typeof issue>, createdAt: string) => ({ ...i, createdAt });

  it("claims the oldest admissible ready issue through its lane, as a labeled:ready event", () => {
    const { deps, called } = setup([
      at(issue(8, "a", ["ready", "feedback"]), "2026-09-29T00:00:00Z"),
      at(issue(6, "b", ["ready", "plan"]), "2026-09-28T00:00:00Z"),
    ]);
    const r = claimNext(0, "abc", deps);
    expect(r).toMatchObject({ claimed: true, lane: "plan", number: 6 });
    expect(called).toHaveLength(1);
    expect(called[0]?.ctx).toMatchObject({
      payload: { action: "labeled", label: { name: "ready" } },
    });
  });

  it("routes a feedback issue to the feedback lane", () => {
    const { deps, called } = setup([issue(8, "a", ["ready", "feedback"])]);
    expect(claimNext(0, "abc", deps).lane).toBe("feedback");
    expect(called[0]?.lane).toBe("feedback");
  });

  it("ignores ready issues that belong to neither lane", () => {
    const { deps, called } = setup([issue(8, "a", ["ready", "enhancement"])]);
    expect(claimNext(0, "abc", deps).claimed).toBe(false);
    expect(called).toEqual([]);
  });

  it("claims nothing when the cap is full", () => {
    const { deps, called } = setup(
      [issue(8, "z", ["ready", "plan"])],
      [issue(1, "a"), issue(2, "b"), issue(3, "c")],
    );
    const r = claimNext(0, "abc", deps);
    expect(r.claimed).toBe(false);
    expect(r.reason).toContain("1 ready, 3 in flight, work-mode=normal");
    expect(called).toEqual([]);
  });
});

describe("peekNext — the push pass asks, and claims nothing", () => {
  const deps = (ready: ReturnType<typeof issue>[]) => ({
    readMode: () => ({ ...mode("normal"), until: null, reason: "set to normal" }),
    readReady: () => ready,
    readInFlight: () => [],
  });

  it("returns the pick claimNext would take, without taking a lease", () => {
    const pick = peekNext(deps([issue(8, "a", ["ready", "plan"])]));
    expect(pick?.number).toBe(8);
  });

  it("returns null when nothing in either lane is admissible", () => {
    expect(peekNext(deps([issue(8, "a", ["ready", "enhancement"])]))).toBeNull();
    expect(peekNext(deps([]))).toBeNull();
  });
});
