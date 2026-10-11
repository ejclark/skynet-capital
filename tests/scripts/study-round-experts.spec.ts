import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "@rstest/core";
import { runRound } from "../../scripts/study/round.mjs";
import { FILES, SESSIONS } from "../../scripts/study/round-contract.mjs";
import { findSessions } from "../../scripts/study/round-files.mjs";
import { makeCaller, readSchema, resultUsage, userMessage } from "../../scripts/study/sealed.mjs";
import { readRequests, sumUsage } from "../../scripts/study/usage.mjs";
import { fakePin, SEAMS, STUB } from "../support/study-round-fakes.js";

// #5099, "revise the method first": the experts run at once instead of one after another (they
// were ~4½ of the first round's ~7¾ hours), and every sealed call keeps what it cost, so the next
// round's price is read back rather than estimated.

const RESULT = {
  type: "result",
  subtype: "success",
  is_error: false,
  duration_ms: 41_200,
  duration_api_ms: 39_800,
  total_cost_usd: 0.1834,
  usage: {
    input_tokens: 12,
    output_tokens: 2_310,
    cache_creation_input_tokens: 18_400,
    cache_read_input_tokens: 4_100,
  },
  modelUsage: { "claude-opus-5-5": { inputTokens: 12, outputTokens: 2_310 } },
  structured_output: { ok: true },
};
const stream = (...events: unknown[]) => events.map((e) => JSON.stringify(e)).join("\n");

describe("resultUsage — what a sealed call cost, from its result event", () => {
  it("reads tokens by kind, the CLI's dollar figure, time and the models that answered", () => {
    const out = stream({ type: "system", subtype: "init" }, RESULT);
    expect(resultUsage(out)).toEqual({
      input_tokens: 12,
      output_tokens: 2_310,
      cache_creation_input_tokens: 18_400,
      cache_read_input_tokens: 4_100,
      cost_usd: 0.1834,
      duration_ms: 41_200,
      duration_api_ms: 39_800,
      models: ["claude-opus-5-5"],
    });
  });

  it("is null with no result event, and zero where the CLI left a figure out", () => {
    expect(resultUsage(stream({ type: "system" }))).toBeNull();
    const bare = resultUsage(stream({ type: "result", subtype: "success" }));
    expect(bare).toMatchObject({ input_tokens: 0, cost_usd: 0, models: [] });
  });
});

describe("sumUsage — a step's cost from its recorded calls", () => {
  const usage = resultUsage(stream(RESULT));
  it("adds what was paid for, counts replays at the price first paid, and never guesses", () => {
    const total = sumUsage([
      { usage },
      { usage, replayed: true },
      { stub: "/stub/expert/1.json", usage: null },
      { error: "sealed call: timed out" },
      { answer: {} },
    ]);
    expect(total).toMatchObject({
      calls: 5,
      priced: 2,
      replayed: 1,
      stubbed: 1,
      failed: 1,
      unpriced: 1,
      output_tokens: 4_620,
      cost_usd: 0.3668,
      models: { "claude-opus-5-5": 2 },
    });
  });

  it("finds a session's own requests folder, however deep", () => {
    const dir = mkdtempSync(join(tmpdir(), "study-usage-"));
    const deep = join(dir, "eric/w/phone/t1/run-1/requests");
    mkdirSync(deep, { recursive: true });
    mkdirSync(join(dir, "requests"));
    writeFileSync(join(deep, "actor-001.json"), JSON.stringify({ usage }));
    writeFileSync(join(dir, "requests", "analyst-001.json"), JSON.stringify({ usage }));
    writeFileSync(join(dir, "plan.json"), "[]");
    expect(readRequests(dir)).toHaveLength(2);
  });
});

describe("makeCaller — a call numbered by its step", () => {
  it("answers and records under the number given, and leaves the role's count alone", async () => {
    const dir = mkdtempSync(join(tmpdir(), "study-numbered-"));
    mkdirSync(join(dir, "canary"));
    writeFileSync(join(dir, "canary", "1.json"), JSON.stringify({ knowledge: "", context: [] }));
    writeFileSync(join(dir, "canary", "3.json"), JSON.stringify({ knowledge: "3", context: [] }));
    const call = makeCaller({ stub: dir, record: join(dir, "rec") });
    const ask = (n?: number) =>
      call({
        role: "canary",
        rolePath: "/r",
        schema: readSchema("canary"),
        message: userMessage("q"),
        n,
      });
    // Finished out of order, as parallel calls do: each still lands on its own number.
    expect(await ask(3)).toEqual({ knowledge: "3", context: [] });
    expect(await ask()).toEqual({ knowledge: "", context: [] });
    expect(readdirSync(join(dir, "rec")).sort()).toEqual(["canary-001.json", "canary-003.json"]);
  });
});

describe("a stub round with three experts at once", () => {
  const tmp = mkdtempSync(join(tmpdir(), "study-round-experts-"));
  const pin = join(tmp, "pin");
  const round = join(tmp, "round");
  let status = -1;
  let overlap = 0;

  beforeAll(async () => {
    fakePin(pin, "stub");
    let inFlight = 0;
    // A frame takes a moment to scale; experts running at once overlap here, one at a time never.
    const half = async (path: string) => {
      inFlight++;
      overlap = Math.max(overlap, inFlight);
      await new Promise((r) => setTimeout(r, 15));
      inFlight--;
      return SEAMS.half(path);
    };
    status = await runRound(
      [
        "--pin",
        pin,
        "--out",
        round,
        "--sealed",
        join(STUB, "sealed"),
        "--stub",
        STUB,
        "--thin",
      ].concat(["--experts", "3", "--concurrency", "3"]),
      { ...SEAMS, half },
    );
  }, 120_000);

  const log = () =>
    readFileSync(join(round, "log.jsonl"), "utf8")
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l));

  it("finishes, and the experts' frames were scaled while another expert's were", () => {
    expect(status === 0 ? "" : JSON.stringify(log().slice(-3))).toBe("");
    expect(overlap).toBeGreaterThan(1);
  });

  it("numbers every call as the experts would have one after another", () => {
    const batches = log()
      .filter((e) => e.step === "7-experts" && e.event === "batch")
      .map((e) => ({ k: e.expert, b: e.batch }));
    const [one = 0, two = 0, three = 0] = [1, 2, 3].map(
      (k) => batches.filter((x) => x.k === k).length,
    );
    const files = readdirSync(join(round, "7-experts", "requests")).sort();
    const total = one + two + three;
    expect(files.filter((f) => f.startsWith("expert-0"))).toHaveLength(total);
    expect(files.filter((f) => f.startsWith("expert-consolidation-"))).toEqual([
      "expert-consolidation-001.json",
      "expert-consolidation-002.json",
      "expert-consolidation-003.json",
    ]);
    // Expert 2's first batch is call one + 1: it follows every one of expert 1's.
    const second = JSON.parse(
      readFileSync(
        join(round, "7-experts", "requests", `expert-${String(one + 1).padStart(3, "0")}.json`),
        "utf8",
      ),
    );
    expect(JSON.stringify(second.message)).toContain(`Batch 1 of ${two}`);
    for (const k of [1, 2, 3])
      expect(existsSync(join(round, "7-experts", `expert-${k}.json`))).toBe(true);
  });

  it("states each step's cost in its done.json, and the round's in usage.json", () => {
    const done = JSON.parse(readFileSync(join(round, "7-experts", "done.json"), "utf8"));
    expect(done.usage).toMatchObject({ stubbed: done.usage.calls, cost_usd: 0 });
    const usage = JSON.parse(readFileSync(join(round, FILES.usage), "utf8"));
    expect(usage.steps["7-experts"]).toEqual(done.usage);
    expect(usage.total.calls).toBeGreaterThan(done.usage.calls);
    expect(usage.total.stubbed).toBe(usage.total.calls);
  });
});

describe("a round that stops still says what it spent", () => {
  const argv = (pin: string, round: string) => [
    "--pin",
    pin,
    "--out",
    round,
    "--sealed",
    join(STUB, "sealed"),
    "--stub",
    STUB,
    "--thin",
  ];

  it("stops with status 1, not a crash, when the browser will not launch — usage.json written", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "study-round-nolaunch-"));
    const pin = join(tmp, "pin");
    const round = join(tmp, "round");
    fakePin(pin, "stub");
    // The real frame scaler, pointed at a program that is no browser: its launch fails.
    const { half: _real, ...seams } = SEAMS;
    const was = process.env.PW_CHROME;
    process.env.PW_CHROME = "/usr/bin/false";
    try {
      expect(await runRound(argv(pin, round), seams)).toBe(1);
    } finally {
      if (was === undefined) delete process.env.PW_CHROME;
      else process.env.PW_CHROME = was;
    }
    expect(existsSync(join(round, FILES.usage))).toBe(true);
  }, 120_000);

  it("keeps a session's first attempt priced when the session is driven again", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "study-round-redrive-"));
    const pin = join(tmp, "pin");
    const round = join(tmp, "round");
    fakePin(pin, "stub");
    const usage = resultUsage(stream(RESULT));
    // First attempt: the member's session pays for one call, then dies, and the round stops.
    const dies = {
      ...SEAMS,
      toolAsync: (script: string, args: string[], logFile: string) => {
        if (script !== "drive.mjs") return SEAMS.toolAsync(script, args, logFile);
        const out = args[args.indexOf("--out") + 1] ?? "";
        mkdirSync(join(out, "requests"), { recursive: true });
        writeFileSync(join(out, "requests", "actor-001.json"), JSON.stringify({ usage }));
        return Promise.resolve(1);
      },
    };
    expect(await runRound(argv(pin, round), dies)).toBe(1);
    // Resumed: the session is driven again from an empty folder, and the round finishes.
    expect(await runRound(argv(pin, round), SEAMS)).toBe(0);
    const done = JSON.parse(readFileSync(join(round, SESSIONS, "done.json"), "utf8"));
    expect(done.usage).toMatchObject({ priced: 1, cost_usd: 0.1834 });
    const total = JSON.parse(readFileSync(join(round, FILES.usage), "utf8"));
    expect(total.steps[SESSIONS]).toEqual(done.usage);
    // The kept calls sit apart from the sessions every reader walks.
    expect(findSessions(round).some((s) => s.rel.includes("superseded"))).toBe(false);
  }, 120_000);
});
