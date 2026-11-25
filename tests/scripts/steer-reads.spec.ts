import { describe, expect, it } from "@rstest/core";
import { runCli } from "../../scripts/moneypenny/admission.mjs";
import { admissionReads, blockingLists } from "../../scripts/steer/reads.mjs";

// #8289 slice 2: the steering page's per-issue GitHub reads, each made only where it can change the
// page. Every read is injected and counted: no `gh`, no network.

const issue = (number: number, labels: string[] = [], extra: Record<string, unknown> = {}) => ({
  number,
  state: "open",
  body: "",
  labels: labels.map((name) => ({ name })),
  ...extra,
});
const summary = (blocking: number) => ({ issue_dependencies_summary: { blocking } });

describe("blockingLists — a Needs-you issue's blocking list, read only where it has one", () => {
  const counting = (answers: Record<number, { number: number; state: string }[]>) => {
    const paths: string[] = [];
    const read = (path: string) => {
      paths.push(path);
      return answers[Number(/issues\/(\d+)\//.exec(path)?.[1])] ?? [];
    };
    return { paths, read };
  };

  it("reads only the issue whose list row counts a blocker, and keeps its open ones", () => {
    const { paths, read } = counting({
      2: [
        { number: 9, state: "open" },
        { number: 8, state: "closed" },
      ],
    });
    const issues = [issue(1, [], summary(0)), issue(2, [], summary(1)), issue(3, [], summary(0))];
    const blocks = blockingLists([{ number: 1 }, { number: 2 }, { number: 3 }], { issues }, read);
    expect(blocks).toEqual({ 1: [], 2: [9], 3: [] });
    expect(paths).toEqual(["issues/2/dependencies/blocking"]);
  });

  it("reads when the summary is missing or the issue has no list row, so nothing hides a blocker", () => {
    const { paths, read } = counting({
      4: [{ number: 7, state: "open" }],
      5: [{ number: 6, state: "open" }],
    });
    const blocks = blockingLists([{ number: 4 }, { number: 5 }], { issues: [issue(4)] }, read);
    expect(blocks).toEqual({ 4: [7], 5: [6] });
    expect(paths).toHaveLength(2);
  });

  it("skips a held PR, as the page always did", () => {
    const { paths, read } = counting({});
    expect(blockingLists([{ number: 12 }], { issues: [], prs: [{ number: 12 }] }, read)).toEqual(
      {},
    );
    expect(paths).toEqual([]);
  });
});

describe("admissionReads — --queue and --next in one process, their shared reads made once", () => {
  const setup = (ready: ReturnType<typeof issue>[]) => {
    let readyReads = 0;
    const holdReads: number[] = [];
    const ask = admissionReads({
      run: (argv, io) =>
        runCli(argv, {
          readMode: () => ({
            position: "normal",
            caps: { inFlightCap: 3 },
            until: null,
            reason: "x",
          }),
          readInFlight: () => [],
          readPlans: () => [],
          readRetry: () => null,
          ...io,
        }),
      readReady: () => {
        readyReads++;
        return ready;
      },
      readHold: (i) => {
        holdReads.push(i.number ?? 0);
        return i.number === 10 ? "its state block names no next pickup" : null;
      },
    });
    return { ask, counts: () => ({ readyReads, holdReads }) };
  };

  it("answers as the CLI does, with the ready list read once and each plan's hold once", () => {
    const s = setup([
      issue(10, ["ready", "plan"]),
      issue(11, ["ready", "plan"]),
      issue(4, ["ready", "feedback"]),
    ]);
    const queue = s.ask("--queue") as { number: number }[];
    const next = s.ask("--next") as { number: number; admit: boolean };
    expect(queue.map((r) => r.number).sort()).toEqual([11, 4].sort());
    expect(next).toMatchObject({ admit: true });
    const { readyReads, holdReads } = s.counts();
    expect(readyReads).toBe(1);
    expect(new Set(holdReads).size).toBe(holdReads.length);
  });

  it("returns --next's refusal (exit 3 with an answer) instead of throwing", () => {
    const s = setup([issue(6, ["plan"])]);
    expect(s.ask("--next")).toMatchObject({ admit: false });
  });

  it("throws when --queue cannot read the ready list, as the child process's failure did", () => {
    const ask = admissionReads({
      run: runCli,
      readReady: () => {
        throw new Error("HTTP 502");
      },
    });
    expect(() => ask("--queue")).toThrow(/--queue exited 3 with no answer/);
  });
});
