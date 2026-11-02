import { readdirSync } from "node:fs";
import { describe, expect, it } from "@rstest/core";
import { type Reply, runWorkflow } from "../support/run-workflow";

// Every scripted workflow asks the work-mode dial before it dispatches, grind.js first among them
// (#3960). Each one runs here under stubbed hooks against a dial fixture, so this pins the refusal, not
// the mention of it. Which fan-outs a real `halt` stops is what the dial's label on #4153 decides; the
// stub only stands in for reading it. A typed run has to get through, because a gate that only throws
// would refuse Eric's own command, so the override is pinned here too, with its price.
const CONDUCTORS: Record<
  string,
  { args: Record<string, unknown>; width: number; firstWork: RegExp }
> = {
  // The original gate, and the one that writes: a run's width is its item count (#6470).
  grind: {
    args: {
      items: ["a.ts", "b.ts", "c.ts"],
      itemSource: "three hand-picked paths for this spec",
      skipEnvelopeCheck: "the gate is under test here, not the envelope",
      promptTemplate: "fix {item}",
    },
    width: 3,
    firstWork: /^a\.ts/,
  },
  "post-merge-audit": { args: { prs: [1, 2, 3] }, width: 3, firstWork: /^triage/ },
  "clear-path-flip": { args: { issues: [1, 2, 3] }, width: 3, firstWork: /^judge/ },
  dream: {
    // Eight digests make two batches of seven at most, and a batch is what fans out.
    args: { digests: ["1", "2", "3", "4", "5", "6", "7", "8"], memoryDir: "m" },
    width: 2,
    firstWork: /^analyze/,
  },
  // Two passes per arm plus the judge: its width is known from n alone, before any lookup.
  "intent-replay": { args: { n: 2 }, width: 5, firstWork: /^cases/ },
  // Named ids, because a whole lens's width is only known after its `cases` lookup.
  "review-replay": {
    args: { lens: "performance", ids: ["P01", "P02", "P03"] },
    width: 3,
    firstWork: /^cases/,
  },
  "symbol-sweep": {
    args: {
      today: "2026-11-01",
      tickers: [
        { sym: "AAA", peers: "X" },
        { sym: "BBB", peers: "Y" },
        { sym: "CCC", peers: "Z" },
      ],
    },
    width: 3,
    firstWork: /^research/,
  },
};

const NORMAL = {
  found: true,
  dispatch: true,
  position: "normal",
  grindWidth: 200,
  reason: "cleared: work-mode is normal",
};
const HALT = {
  found: true,
  dispatch: false,
  position: "halt",
  grindWidth: 0,
  reason: "refused: work-mode is halt",
};

/** The dial answers; every agent doing work returns nothing, which each script already survives. */
const withDial =
  (dial: unknown): Reply =>
  (_prompt, { label }) => {
    if (label === "work-mode") return dial;
    if (label === "dead agents") return { left: [] };
    return null;
  };

const worked = (calls: { opts: { label?: string } }[]) =>
  calls.filter((c) => c.opts.label !== "work-mode");

describe("the work-mode gate in the scripted workflows", () => {
  // A new script joins this table or fails here. grind.js was left out on the word that it had its
  // own specs, and none of them reached its refusal; it has run here since it took force (#6470).
  it("covers every scripted workflow", () => {
    const scripts = readdirSync(".claude/workflows")
      .filter((f) => f.endsWith(".js"))
      .map((f) => f.replace(/\.js$/, ""));
    expect(scripts.sort()).toEqual(Object.keys(CONDUCTORS).sort());
  });

  for (const [name, { args, width, firstWork }] of Object.entries(CONDUCTORS)) {
    describe(name, () => {
      it("reads the dial first, by running the gate's own command as a cheap worker", async () => {
        const { calls } = await runWorkflow(name, args, withDial(NORMAL));
        expect(calls[0]?.opts.label).toBe("work-mode");
        expect(calls[0]?.prompt).toContain("node scripts/moneypenny/work-gate.mjs");
        expect(calls[0]?.opts).toMatchObject({
          agentType: "worker",
          model: "sonnet",
          effort: "low",
        });
      });

      it("dispatches when the dial clears it", async () => {
        const { calls, error, logs } = await runWorkflow(name, args, withDial(NORMAL));
        expect(error).toBeNull();
        expect(calls[1]?.opts.label).toMatch(firstWork);
        expect(logs.join("\n")).toContain("work-mode=normal");
        expect(logs.join("\n")).not.toContain("Price");
      });

      it("refuses under halt and dispatches nothing", async () => {
        const { calls, error } = await runWorkflow(name, args, withDial(HALT));
        expect(error?.message).toContain("refused: work-mode is halt");
        expect(error?.message).toContain("force: true");
        expect(worked(calls)).toEqual([]);
      });

      it("refuses when the spend brake says no, in the gate's own words", async () => {
        const reason = "refused: the #2946 spend breaker is tripped — a human clears it";
        const { calls, error } = await runWorkflow(
          name,
          args,
          withDial({ ...NORMAL, dispatch: false, reason }),
        );
        expect(error?.message).toContain(reason);
        expect(worked(calls)).toEqual([]);
      });

      // A broken control never reads as a quiet go, in any of the ways the read can come back.
      for (const [how, dial] of [
        ["the read died", null],
        ["the command gave no verdict", { found: false }],
        ["the verdict has no width", { found: true, dispatch: true, position: "normal" }],
      ] as const) {
        it(`refuses when ${how}`, async () => {
          const { calls, error } = await runWorkflow(name, args, withDial(dial));
          expect(error?.message).toContain("work-gate.mjs");
          expect(worked(calls)).toEqual([]);
        });
      }

      it("refuses a run wider than the position allows, and names the number", async () => {
        const dial = { ...NORMAL, position: "conserve", grindWidth: width - 1 };
        const { calls, error } = await runWorkflow(name, args, withDial(dial));
        expect(error?.message).toContain(`${width}`);
        expect(error?.message).toContain(`${width - 1}`);
        expect(error?.message).toContain("conserve");
        expect(error?.message).toContain(`at most ${width - 1} `);
        expect(worked(calls)).toEqual([]);
      });

      it("takes a run exactly as wide as the position allows", async () => {
        const dial = { ...NORMAL, position: "conserve", grindWidth: width };
        const { error, calls } = await runWorkflow(name, args, withDial(dial));
        expect(error).toBeNull();
        expect(worked(calls).length).toBeGreaterThan(0);
      });

      it("lets a typed run through a halt, and prints what it overrode and its price", async () => {
        const { calls, error, logs } = await runWorkflow(
          name,
          { ...args, force: true },
          withDial(HALT),
        );
        expect(error).toBeNull();
        expect(worked(calls)[0]?.opts.label).toMatch(firstWork);
        const said = logs.join("\n");
        expect(said).toContain("refused: work-mode is halt");
        expect(said).toMatch(/Price: .*\d+ agents/);
      });

      it("lets a typed run through a dial it could not read, and says so", async () => {
        const { error, logs } = await runWorkflow(name, { ...args, force: true }, withDial(null));
        expect(error).toBeNull();
        expect(logs.join("\n")).toContain("work-gate.mjs");
        expect(logs.join("\n")).toContain("Price");
      });

      it("treats a dial read that throws as unread: refused, or forced past", async () => {
        const throwing: Reply = (prompt, opts) => {
          if (opts.label === "work-mode") throw new Error("the read could not start");
          return withDial(NORMAL)(prompt, opts);
        };
        const refused = await runWorkflow(name, args, throwing);
        expect(refused.error?.message).toContain("work-gate.mjs");
        expect(worked(refused.calls)).toEqual([]);
        const forced = await runWorkflow(name, { ...args, force: true }, throwing);
        expect(forced.error).toBeNull();
        expect(worked(forced.calls)[0]?.opts.label).toMatch(firstWork);
      });

      it("prints the price on a typed run the dial would have allowed", async () => {
        const { logs } = await runWorkflow(name, { ...args, force: true }, withDial(NORMAL));
        expect(logs.join("\n")).toContain("Price");
      });

      // Only the value true overrides: a caller's "false" or a stray 1 must not open the gate.
      for (const force of ["false", "true", 1]) {
        it(`does not treat force: ${JSON.stringify(force)} as the override`, async () => {
          const { error, calls } = await runWorkflow(name, { ...args, force }, withDial(HALT));
          expect(error?.message).toContain("refused");
          expect(worked(calls)).toEqual([]);
        });
      }
    });
  }
});

// What only grind adds. Its runs can write and push, so a forced one leaves the override in the ledger
// callers paste into the issue or PR, and its price counts the chain it will really run (#6470).
describe("grind's forced run", () => {
  const { args } = CONDUCTORS.grind;
  const ledgerOf = (result: unknown) => String((result as { ledger?: string } | null)?.ledger);

  it("writes the override into the ledger, with what it passed", async () => {
    const { result, error } = await runWorkflow("grind", { ...args, force: true }, withDial(HALT));
    expect(error).toBeNull();
    expect(ledgerOf(result)).toContain("_force: true, past this: refused: work-mode is halt_");
  });

  it("writes it even when the dial allowed the run", async () => {
    const { result } = await runWorkflow("grind", { ...args, force: true }, withDial(NORMAL));
    expect(ledgerOf(result)).toContain("_force: true, though the dial allowed it_");
  });

  it("leaves an unforced run's ledger as it was", async () => {
    const { result } = await runWorkflow("grind", args, withDial(NORMAL));
    expect(ledgerOf(result)).toContain("_Items from: three hand-picked paths for this spec_");
    expect(ledgerOf(result)).not.toContain("force: true");
  });

  it("prices every step of every item, one lookup per chore file, and the reader", async () => {
    // 2 items × (envelope + the chore twice + a check + branch verify) = 10, plus 1 lookup for the
    // one chore file the two chore steps share, plus 1 reader = 12.
    const chain = {
      items: ["a.ts", "b.ts"],
      itemSource: "two hand-picked paths for this spec",
      steps: [
        { kind: "instructions", path: "docs/grind/spec-only.instructions.md" },
        { kind: "instructions", path: "docs/grind/spec-only.instructions.md", label: "again" },
        { kind: "script", command: "true {item}" },
      ],
      verifyBranch: true,
      force: true,
    };
    const reply: Reply = (prompt, opts) =>
      opts.label?.startsWith("manifest:")
        ? { found: true, effort: "high", isolation: "none" }
        : withDial(NORMAL)(prompt, opts);
    const { logs } = await runWorkflow("grind", chain, reply);
    expect(logs.join("\n")).toContain(
      "Price: up to 12 agents: 2 items through 5 steps, 1 manifest lookup, and one reader",
    );
  });
});
