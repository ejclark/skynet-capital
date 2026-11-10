import { describe, expect, it } from "@rstest/core";
// @ts-expect-error plain .mjs script, no declarations
import { casesFor, runOfSlot, scoreReplay } from "../../../scripts/intent-replay.mjs";
import { type Reply, runWorkflow } from "../../support/run-workflow";
import { IDS, kase, SET } from "./fixtures";

// The real script text under stubbed hooks. tests/scripts/workflow-gate.spec.ts pins its dial block
// with every other workflow; this pins what is its own: the two arms, the blinding and the return.
describe("intent-replay's workflow", () => {
  const GATE = { found: true, dispatch: true, position: "normal", grindWidth: 200 };
  // What the real `cases` command prints, so the lookup a spec hands over cannot drift from the script.
  const lookup = (n = 2) => ({ found: true, ...casesFor(SET, { n }) });
  const LOOKUP = lookup();
  const armOf = (label = "") => label.replace("answer ", "");
  // Each answerer's first move names its own run, under a token no prompt could carry by accident.
  const answers = (label?: string) => ({
    ran: true,
    answers: IDS.map((id) => ({
      id,
      route: "act-now",
      ask: "must-not-ask",
      firstMove: `token-${armOf(label).replace("without-", "a").replace("with-", "b")}`,
    })),
  });
  // What each stage returns, by its label; a spec overrides one stage to kill or change it.
  const reply =
    (over: Record<string, unknown> = {}): Reply =>
    (_prompt, { label = "" }) => {
      const table: Record<string, unknown> = {
        "work-mode": GATE,
        cases: LOOKUP,
        "blind judge": { ran: true, verdicts: [] },
        ...over,
      };
      return label in table ? table[label] : answers(label);
    };
  const run = (args: unknown, answer: Reply) => runWorkflow("intent-replay", args, answer);

  it("runs both arms on worker stages, each told to run the prompt the script prints", async () => {
    const { calls } = await run({}, reply());
    const answerers = calls.filter((c) => c.opts.label?.startsWith("answer "));
    expect(answerers.map((c) => c.opts.label)).toEqual([
      "answer without-1",
      "answer without-2",
      "answer with-1",
      "answer with-2",
    ]);
    for (const c of answerers) {
      expect(c.opts.agentType).toBe("worker");
      expect(c.prompt).toContain("node scripts/intent-replay.mjs prompt --arm ");
    }
    expect(answerers[0]?.prompt).toContain("--arm without --order forward");
    expect(answerers[3]?.prompt).toContain("--arm with --order forward");
    expect(calls.at(-1)?.opts).toMatchObject({ label: "blind judge", agentType: "worker" });
  });

  it("passes N through to the lookup, and refuses one it cannot mean before spending", async () => {
    const { calls } = await run({ n: 4 }, reply());
    expect(calls.find((c) => c.opts.label === "cases")?.prompt).toContain("--n 4");
    for (const n of [0, 1, 3, 5, 6, "2; rm -rf x", 1.5]) {
      const refused = await run({ n }, reply());
      expect(refused.error?.message, String(n)).toMatch(/args\.n/);
      expect(refused.calls).toEqual([]);
    }
  });

  it("takes exactly the N the script takes, so neither refuses what the other runs", async () => {
    for (const n of [0, 1, 2, 3, 4, 5, 6]) {
      const refusedByWorkflow = (await run({ n }, reply({ cases: lookup() }))).error !== null;
      let refusedByScript = false;
      try {
        casesFor(SET, { n });
      } catch {
        refusedByScript = true;
      }
      expect(refusedByWorkflow, String(n)).toBe(refusedByScript);
    }
  });

  it("carries what each case held through to its return, so a rewritten set is refused", async () => {
    const { calls, result } = await run({}, reply());
    expect(calls.find((c) => c.opts.label === "cases")?.prompt).toContain('"caseDigests"');
    expect(result?.caseDigests).toEqual(casesFor(SET).caseDigests);
    const rewritten = { ...SET, cases: [kase("C1", { said: "new words" }), ...SET.cases.slice(1)] };
    expect(() => scoreReplay(rewritten, result)).toThrow(/C1/);
  });

  it("stops when the lookup leaves out what each case held", async () => {
    const { ids, runs } = LOOKUP;
    const none = await run({}, reply({ cases: { found: true, ids, runs } }));
    expect(none.error?.message).toMatch(/could not list the cases/);
    const short = await run({}, reply({ cases: { found: true, ids, runs, caseDigests: ["x"] } }));
    expect(short.error?.message).toMatch(/could not list the cases/);
    expect(short.calls.filter((c) => c.opts.label?.startsWith("answer "))).toEqual([]);
  });

  it("shows the judge unlabelled answers, whose order turns with the case", async () => {
    const { calls } = await run({}, reply());
    const judge = calls.find((c) => c.opts.label === "blind judge");
    expect(judge?.prompt).not.toMatch(/without-\d|with-\d|"arm"|"run"|answer with/);
    const blinded = JSON.parse(String(judge?.prompt.split("<<<answers>>>")[1]));
    const seen = blinded.map((row: { answers: { firstMove: string }[] }) =>
      row.answers.map((a) => a.firstMove),
    );
    expect(seen[0]).toEqual(["token-a1", "token-a2", "token-b1", "token-b2"]);
    expect(seen[1]).toEqual(["token-a2", "token-b1", "token-b2", "token-a1"]);
    expect(seen[2]).toEqual(["token-b1", "token-b2", "token-a1", "token-a2"]);
  });

  it("round-trips: what the judge says of a slot lands on the run that wrote it", async () => {
    // A judge that passes only one run's words, without being told which run that is.
    const judge = (prompt: string) => {
      const blinded = JSON.parse(prompt.split("<<<answers>>>")[1] ?? "");
      return {
        ran: true,
        verdicts: blinded.flatMap((row: { id: string; answers: Record<string, string>[] }) =>
          row.answers.map((a) => ({
            id: row.id,
            slot: a.slot,
            pass: a.firstMove === "token-b1",
            why: "w",
          })),
        ),
      };
    };
    const { result } = await run({}, (prompt, opts) =>
      opts.label === "blind judge" ? judge(prompt) : reply()(prompt, opts),
    );
    const { byRun, arms } = scoreReplay(SET, result);
    expect(byRun["with-1"].judged).toBe(3);
    expect(byRun["with-2"].judged).toBe(0);
    expect(arms.without.judged).toBe(0);
  });

  describe("the blinding, pinned to the script's runOfSlot through the real workflow", () => {
    type Blinded = { id: string; answers: { slot: number; firstMove: string }[] }[];
    const blindedOf = (prompt: string): Blinded =>
      JSON.parse(prompt.split("<<<answers>>>")[1] ?? "");
    // Each answerer's words name its run and the case, so a mix-up of either shows. A backward run
    // hands its answers back in reverse, as a real one reads them.
    const wordsOf = (name: string, id: string) => `words-of-${name.replace("-", "")}-on-${id}`;
    const answerers = (n: number, passing: (name: string, id: string) => boolean): Reply => {
      const plan = lookup(n);
      return (prompt, { label = "" }) => {
        if (label === "work-mode") return GATE;
        if (label === "cases") return plan;
        if (label === "blind judge") {
          const writer = new Map<string, { name: string; id: string }>(
            plan.runs.flatMap((r: { name: string }) =>
              IDS.map((id) => [wordsOf(r.name, id), { name: r.name, id }]),
            ),
          );
          return {
            ran: true,
            verdicts: blindedOf(prompt).flatMap((row) =>
              row.answers.map((a) => {
                const from = writer.get(a.firstMove);
                return {
                  id: row.id,
                  slot: a.slot,
                  pass: from ? passing(from.name, from.id) : false,
                  why: "w",
                };
              }),
            ),
          };
        }
        const name = armOf(label);
        const run = plan.runs.find((r: { name: string }) => r.name === name);
        const ids = run?.order === "backward" ? [...IDS].reverse() : IDS;
        return {
          ran: true,
          answers: ids.map((id) => ({
            id,
            route: "act-now",
            ask: "must-not-ask",
            firstMove: wordsOf(name, id),
          })),
        };
      };
    };

    for (const n of [2, 4]) {
      it(`shows the judge each run's words in the slot runOfSlot says, at n=${n}`, async () => {
        const { calls } = await run(
          { n },
          answerers(n, () => true),
        );
        const judge = calls.find((c) => c.opts.label === "blind judge");
        const { runs } = lookup(n);
        const blinded = blindedOf(judge?.prompt ?? "");
        expect(blinded.map((row) => row.id)).toEqual(IDS);
        blinded.forEach((row, caseIndex) => {
          expect(row.answers.map((a) => a.slot)).toEqual(runs.map((_: unknown, i: number) => i));
          for (const { slot, firstMove } of row.answers) {
            const writer = runs[runOfSlot(caseIndex, slot, runs.length)];
            expect(firstMove, `${row.id} slot ${slot}`).toBe(wordsOf(writer.name, row.id));
          }
        });
      });

      it(`lands what the judge says of a slot on the run that wrote it, for every run, at n=${n}`, async () => {
        for (const { name, arm } of lookup(n).runs) {
          const { result } = await run(
            { n },
            answerers(n, (from) => from === name),
          );
          const { byRun, arms } = scoreReplay(SET, result);
          for (const other of lookup(n).runs) {
            const expected = other.name === name ? IDS.length : 0;
            expect(byRun[other.name].judged, `${name}: ${other.name}`).toBe(expected);
            expect(byRun[other.name].unjudged, `${name}: ${other.name}`).toBe(0);
          }
          expect(arms[arm].judged).toBe(IDS.length);
        }
      });

      it(`lands a verdict on the right case as well as the right run, at n=${n}`, async () => {
        const passing = (from: string, id: string) => from.startsWith("with-") && id === "C2";
        const { result } = await run({ n }, answerers(n, passing));
        const report = scoreReplay(SET, result);
        expect(report.differs).toEqual([{ id: "C2", without: 0, with: n }]);
        expect(report.arms.with.judged).toBe(n);
        expect(report.arms.without.judged).toBe(0);
      });
    }
  });

  it("returns an answerer that died or could not read its task as no answers", async () => {
    const dead = await run({}, reply({ "answer with-2": null }));
    const failed = await run(
      {},
      reply({ "answer with-2": { ran: false, answers: [{ id: "C1" }] } }),
    );
    for (const { result } of [dead, failed]) {
      const runs = (result?.runs ?? []) as unknown as { name: string; answers: unknown }[];
      expect(runs.find((r) => r.name === "with-2")?.answers).toBeNull();
      expect(scoreReplay(SET, result).verdict).toBe("unknown");
    }
  });

  it("returns a judge that died as no verdicts, which the score reads as unknown", async () => {
    const { result } = await run({}, reply({ "blind judge": null }));
    expect(result?.verdicts).toEqual([]);
    expect(scoreReplay(SET, result).verdict).toBe("unknown");
  });

  it("keeps the answers it paid for when the judge throws", async () => {
    const { result, error } = await run({}, (prompt, opts) => {
      if (opts.label === "blind judge") throw new Error("the judge could not start");
      return reply()(prompt, opts);
    });
    expect(error).toBeNull();
    expect(result?.verdicts).toEqual([]);
    expect(result?.runs).toHaveLength(4);
  });

  it("says nothing was run when the lookup dies, and stops when it reports a failure", async () => {
    const dead = await run({}, reply({ cases: null }));
    expect(dead.result).toMatchObject({ runs: [], notRun: expect.stringContaining("re-run") });
    const failed = await run({}, reply({ cases: { found: false, why: "a member's name" } }));
    expect(failed.error?.message).toContain("a member's name");
  });
});
