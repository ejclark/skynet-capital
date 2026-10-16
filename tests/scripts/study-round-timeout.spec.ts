import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import { runRound, type SealedRequest } from "../../scripts/study/round.mjs";
import { askBatch, expertCoverage } from "../../scripts/study/round-review.mjs";
import { fakePin, SEAMS, STUB } from "../support/study-round-fakes.js";

// #5155: in #5099's control re-run an expert batch hit the 600s limit twice and stopped the whole
// round, though the identical call answered in ~168s when asked again. A batch that times out is
// now asked once more; a second timeout records it as missing, counted against coverage, and the
// round goes on.

const timeout = () =>
  Object.assign(new Error("sealed call: timed out after 600000ms"), { timedOut: true });

describe("askBatch — one expert batch's call, asked once more on a timeout", () => {
  it("answers on the second ask when the first timed out, with the identical request", async () => {
    const seen: unknown[] = [];
    let retries = 0;
    const call = (req: { n: number }) => {
      seen.push(req);
      return seen.length === 1 ? Promise.reject(timeout()) : Promise.resolve({ ok: req.n });
    };
    const asked = await askBatch(call, { n: 7 }, () => retries++);
    expect(asked).toEqual({ answer: { ok: 7 } });
    expect(retries).toBe(1);
    expect(seen).toEqual([{ n: 7 }, { n: 7 }]);
  });

  it("comes back missing, never thrown, when the second ask times out too", async () => {
    let asks = 0;
    const asked = await askBatch(() => {
      asks++;
      return Promise.reject(timeout());
    }, {});
    expect(asked).toEqual({ missing: "sealed call: timed out after 600000ms" });
    expect(asks).toBe(2);
  });

  it("throws any other failure at once — asking again would not change it", async () => {
    let asks = 0;
    const broken = askBatch(() => {
      asks++;
      return Promise.reject(new Error("sealed call: the CLI stopped reading its message"));
    }, {});
    await expect(broken).rejects.toThrow("stopped reading");
    expect(asks).toBe(1);
  });
});

describe("expertCoverage — batches answered of batches asked", () => {
  it("names every missing batch with its expert and counts it against coverage", () => {
    const gone = {
      batch: 2,
      source: "census",
      route: "/trade",
      viewport: "phone",
      controls: 20,
      reason: "sealed call: timed out after 600000ms",
    };
    const coverage = expertCoverage([
      { k: 1, summary: { batches: 3, missing: [gone] } },
      { k: 2, summary: { batches: 2, missing: [] } },
    ]);
    expect(coverage).toEqual({ answered: 4, of: 5, missing: [{ expert: 1, ...gone }] });
  });
});

describe("a stub round whose expert batches time out", () => {
  const argv = (pin: string, round: string, experts: number) => [
    "--pin",
    pin,
    "--out",
    round,
    "--sealed",
    join(STUB, "sealed"),
    "--stub",
    STUB,
    "--thin",
    "--experts",
    String(experts),
  ];
  const log = (round: string) =>
    readFileSync(join(round, "log.jsonl"), "utf8")
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l));
  /** Times out the expert batch calls numbered in `slow`, the first `times` asks of each. */
  const slowBatches = (slow: number[], times: number) => {
    const left = new Map(slow.map((n) => [n, times]));
    return (step: string, call: (req: SealedRequest) => Promise<unknown>) =>
      (req: SealedRequest) => {
        const n = req.n ?? 0;
        if (step === "7-experts" && req.role === "expert" && (left.get(n) ?? 0) > 0) {
          left.set(n, (left.get(n) ?? 0) - 1);
          return Promise.reject(timeout());
        }
        return call(req);
      };
  };

  it("finishes when a slow batch answers on its retry, and logs the retry", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "study-round-retry-"));
    const [pin, round] = [join(tmp, "pin"), join(tmp, "round")];
    fakePin(pin, "stub");
    const status = await runRound(argv(pin, round, 1), {
      ...SEAMS,
      wrapCall: slowBatches([1], 1),
    });
    expect(status === 0 ? "" : JSON.stringify(log(round).slice(-3))).toBe("");
    const events = log(round).filter((e) => e.step === "7-experts");
    expect(events.filter((e) => e.event === "retry")).toHaveLength(1);
    expect(events.some((e) => e.event === "missing")).toBe(false);
    const done = JSON.parse(readFileSync(join(round, "7-experts", "done.json"), "utf8"));
    expect(done.coverage.missing).toEqual([]);
    expect(done.coverage.answered).toBe(done.coverage.of);
  }, 120_000);

  it("goes on past a batch that times out twice, and its report names the batch missing", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "study-round-missing-"));
    const [pin, round] = [join(tmp, "pin"), join(tmp, "round")];
    fakePin(pin, "stub");
    // Three experts over the same batches: expert 1's first batch (call 1) is the slow one.
    const status = await runRound(argv(pin, round, 3), {
      ...SEAMS,
      wrapCall: slowBatches([1], 2),
    });
    expect(status === 0 ? "" : JSON.stringify(log(round).slice(-3))).toBe("");
    const done = JSON.parse(readFileSync(join(round, "7-experts", "done.json"), "utf8"));
    expect(done.coverage.missing).toEqual([
      expect.objectContaining({ expert: 1, batch: 1, reason: expect.stringContaining("timed") }),
    ]);
    expect(done.coverage.answered).toBe(done.coverage.of - 1);
    // The thin cut gives each expert one batch: expert 1 stands with nothing to merge, no findings.
    const expert1 = JSON.parse(readFileSync(join(round, "7-experts", "expert-1.json"), "utf8"));
    expect(expert1.missing).toHaveLength(1);
    expect(expert1.answer).toEqual({ findings: [] });
    const missing = log(round).filter((e) => e.step === "7-experts" && e.event === "missing");
    expect(missing).toEqual([expect.objectContaining({ expert: 1, batch: 1 })]);
    // The round ran on through collection.
    expect(log(round).some((e) => e.step === "round" && e.event === "complete")).toBe(true);
  }, 120_000);

  it("stops when no expert batch answered at all — no review is not a thin one", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "study-round-none-"));
    const [pin, round] = [join(tmp, "pin"), join(tmp, "round")];
    fakePin(pin, "stub");
    const status = await runRound(argv(pin, round, 1), {
      ...SEAMS,
      wrapCall: slowBatches([1], 2),
    });
    expect(status).toBe(1);
    const stopped = log(round).find((e) => e.event === "stopped");
    expect(stopped?.note).toContain("every one of the 1 expert batches timed out twice");
  }, 120_000);
});
