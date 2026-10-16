import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import type { UserMessage } from "../../scripts/study/actor-sealed.mjs";
import {
  actorMessage,
  easeMessage,
  stepsLine,
  turnLine,
} from "../../scripts/study/actor-sealed.mjs";
import type { Turn } from "../../scripts/study/actor-turn.mjs";
import {
  easeProblems,
  parseScript,
  toAction,
  turnProblems,
} from "../../scripts/study/actor-turn.mjs";
import { parseResult, readSchema, sealedArgs, signedIn } from "../../scripts/study/sealed.mjs";
import { actionCap, deviceLine, parseTask, taskProblems } from "../../scripts/study/task-file.mjs";

// The member-session driver's pure halves (scripts/study/drive.mjs runs them): the task file and
// its action cap, the turn shape both actors produce, and the sealed actor's message and result
// parser. The sealed call itself is never made here — fixtures stand in for its stdout.

const TURN: Turn = {
  as_member: "As Pat, I am looking for my losses",
  noticed: "A list of three positions, one red",
  candidates: [{ target: "the red row", confidence: 70 }],
  expect: "the row opens",
  last_expectation: { verdict: "match", note: "first turn" },
  confusion: 0,
  action: { type: "tap", x: 10, y: 20 },
};

const TASK = {
  id: "t1",
  scenario: "Find the loss.",
  start: "/app/area",
  answer: { kind: "number", value: 412, abs: 1 },
  answerRegion: ["$412"],
};

describe("actionCap — min(2.5 × optimal, 15)", () => {
  it("defaults the optimal path to 6, which hits the ceiling", () => {
    expect(actionCap()).toBe(15);
  });
  it("scales a short task down", () => {
    expect(actionCap(4)).toBe(10);
    expect(actionCap(3)).toBe(7);
  });
  it("never exceeds 15 and never drops below 1", () => {
    expect(actionCap(20)).toBe(15);
    expect(actionCap(0)).toBe(1);
  });
});

describe("parseTask — a task's shape", () => {
  it("accepts a complete task and fills the default optimal path", () => {
    expect(parseTask(JSON.stringify(TASK)).optimal).toBe(6);
  });
  it("names every problem at once", () => {
    const problems = taskProblems({
      ...TASK,
      start: "app",
      answerRegion: [],
      answer: { kind: "x" },
    });
    expect(problems).toEqual([
      "start must be a path",
      "answer.kind must be number or text",
      "answerRegion must list at least one text snippet",
    ]);
  });
  it("refuses a text answer with an empty value", () => {
    expect(taskProblems({ ...TASK, answer: { kind: "text", value: "" } })).toHaveLength(1);
  });
  it("the committed proof task parses", () => {
    const text = readFileSync("scripts/study/tasks/proof/task.json", "utf8");
    expect(parseTask(text).optimal).toBe(4);
  });
});

describe("deviceLine — what the member holds", () => {
  it("says phone and touch for a touch frame, computer and mouse otherwise", () => {
    expect(deviceLine({ viewport: { width: 390, height: 844 }, hasTouch: true })).toMatch(
      /phone .*390×844.*finger/,
    );
    expect(deviceLine({ viewport: { width: 1280, height: 900 }, hasTouch: false })).toMatch(
      /computer .*1280×900.*mouse/,
    );
  });
});

describe("turnProblems / toAction — one turn, either actor", () => {
  it("accepts a well-formed turn", () => {
    expect(turnProblems(TURN)).toEqual([]);
  });
  it("flags noticed text past 60 words, a bad verdict and confusion out of range", () => {
    const long = Array.from({ length: 61 }, () => "word").join(" ");
    const bad = {
      ...TURN,
      noticed: long,
      last_expectation: { verdict: "maybe", note: "" },
      confusion: 4,
    };
    expect(turnProblems(bad)).toEqual([
      "noticed runs past 60 words",
      "last_expectation.verdict must be match, partial or surprise",
      "confusion must be 0–3",
    ]);
  });
  it("maps the member's action type onto the recorder's action kind", () => {
    expect(toAction({ type: "tap", x: 1, y: 2 })).toEqual({ kind: "tap", x: 1, y: 2 });
    expect(toAction({ type: "scroll", dir: "down", screens: 0.5 })).toEqual({
      kind: "scroll",
      dir: "down",
      screens: 0.5,
    });
    expect(toAction({ type: "done", answer: " $412 " })).toEqual({ kind: "done", answer: "$412" });
    expect(toAction({ type: "give_up", why: "lost" })).toEqual({ kind: "give_up", why: "lost" });
  });
  it("refuses a done with no answer and an unknown type", () => {
    expect(toAction({ type: "done" })).toEqual({ refused: "done needs an answer" });
    expect(toAction({ type: "fly" })).toEqual({ refused: "unknown action fly" });
  });
});

describe("easeProblems / parseScript — the scripted actor's file", () => {
  it("needs a reason at 5 or lower, none above", () => {
    expect(easeProblems({ score: 5, reason: "" })).toEqual([
      "a score of 5 or lower needs a reason",
    ]);
    expect(easeProblems({ score: 6, reason: "" })).toEqual([]);
    expect(easeProblems({ score: 8, reason: "x" })).toEqual(["ease score must be 1–7"]);
  });
  it("fills the talk a script does not carry, so its turns fit the turn shape", () => {
    const { turns, ease } = parseScript(
      JSON.stringify({ turns: [{ action: { type: "back" } }], ease: { score: 7 } }),
    );
    expect(turns[0]).toMatchObject({ as_member: "(scripted)", confusion: 0, scripted: 0 });
    expect(turnProblems(turns[0])).toEqual([]);
    expect(ease).toEqual({ score: 7, reason: "" });
  });
  it("refuses a script with no turns or a bad ease answer", () => {
    expect(() => parseScript(JSON.stringify({ turns: [] }))).toThrow(/at least one turn/);
    expect(() =>
      parseScript(JSON.stringify({ turns: [{ action: { type: "back" } }], ease: { score: 3 } })),
    ).toThrow(/needs a reason/);
  });
  it("the committed proof script parses", () => {
    const text = readFileSync("scripts/study/tasks/proof/actions.json", "utf8");
    expect(parseScript(text).turns).toHaveLength(4);
  });
});

describe("sealedArgs — the blind call's exact flags", () => {
  it("is print mode, safe, restricted, tool-less, MCP-less, stream-json both ways, unpersisted", () => {
    const args = sealedArgs({ rolePath: "/r.md", schema: "{}" });
    expect(args.slice(0, 5)).toEqual(["-p", "--safe-mode", "--restricted", "--tools", ""]);
    for (const flag of ["--strict-mcp-config", "--verbose", "--no-session-persistence"])
      expect(args).toContain(flag);
    expect(args[args.indexOf("--system-prompt-file") + 1]).toBe("/r.md");
    expect(args[args.indexOf("--json-schema") + 1]).toBe("{}");
    expect(args[args.indexOf("--input-format") + 1]).toBe("stream-json");
    expect(args[args.indexOf("--output-format") + 1]).toBe("stream-json");
  });
});

/** The text a message carries, and its images' data, in order. */
const textOf = (m: UserMessage) =>
  m.message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n");
const imagesOf = (m: UserMessage) =>
  m.message.content.flatMap((b) => (b.type === "image" ? [b.source.data] : []));

describe("actorMessage — what the member is shown, and only that", () => {
  const base = {
    card: "# Pat\nChecks on a phone.",
    device: "You are on your phone.",
    scenario: "Find the loss.",
    size: { width: 390, height: 844 },
    remaining: 10,
  };
  it("first turn: one text block then the current frame, no earlier frame", () => {
    const m = actorMessage({ ...base, turns: [], prevFrame: null, frame: "NOW" });
    expect(m.type).toBe("user");
    expect(m.message.content.map((b) => b.type)).toEqual(["text", "image"]);
    const text = textOf(m);
    expect(text).toContain("# Pat");
    expect(text).toContain("Find the loss.");
    expect(text).toContain("this is your first turn");
    expect(text).toContain("390×844 pixels");
    expect(m.message.content.at(-1)).toEqual({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: "NOW" },
    });
  });
  it("later turns: its own prior turns, then the previous frame, then the current one", () => {
    const m = actorMessage({ ...base, turns: [TURN], prevFrame: "PREV", frame: "NOW" });
    expect(m.message.content.map((b) => b.type)).toEqual(["text", "image", "image"]);
    expect(textOf(m)).toContain("1. As Pat, I am looking for my losses");
    expect(imagesOf(m)).toEqual(["PREV", "NOW"]);
  });
  it("never carries a URL or a path, whatever the turns held", () => {
    const m = actorMessage({ ...base, turns: [TURN], prevFrame: null, frame: "NOW" });
    expect(JSON.stringify(m)).not.toMatch(/https?:|\/app\//);
  });
  it("says when most of the steps are spent", () => {
    expect(stepsLine(4)).toBe("You have 4 actions left.");
    expect(stepsLine(1)).toBe("You have 1 action left. You have used most of your steps.");
  });
  it("reads a refused turn back with why it could not be done", () => {
    expect(turnLine({ ...TURN, refused: "outside the frame" }, 0)).toMatch(
      /did: tap at \(10, 20\) — it could not be done: outside the frame$/,
    );
  });
  it("asks the ease question as text only", () => {
    const m = easeMessage({ ...base, turns: [TURN] });
    expect(m.message.content).toHaveLength(1);
    expect(textOf(m)).toMatch(/how easy or difficult was this task/);
  });
});

describe("parseResult — the final result event's structured output", () => {
  const stream = (...events: object[]) => events.map((e) => JSON.stringify(e)).join("\n");
  const init = { type: "system", subtype: "init", tools: ["StructuredOutput"] };
  it("returns the last result's structured_output", () => {
    const out = stream(
      init,
      { type: "assistant", message: { content: [] } },
      { type: "result", subtype: "success", is_error: false, structured_output: TURN },
    );
    expect(parseResult(out)).toEqual(TURN);
  });
  it("skips a garbled line rather than failing on it", () => {
    const out = `not json\n{broken\n${stream({ type: "result", subtype: "success", structured_output: { a: 1 } })}`;
    expect(parseResult(out)).toEqual({ a: 1 });
  });
  it("throws on an error result, a missing structured_output, and no result at all", () => {
    const error = stream({ type: "result", subtype: "error_during_execution", is_error: true });
    expect(() => parseResult(error)).toThrow(/error_during_execution/);
    const bare = stream({ type: "result", subtype: "success", result: "plain text" });
    expect(() => parseResult(bare)).toThrow(/no structured_output/);
    expect(() => parseResult(stream(init))).toThrow(/no result event/);
  });
  it("names the CLI's own reason when the call died before any result", () => {
    const stderr =
      'warming up\nError: --json-schema is not a valid JSON Schema: no schema with key or ref "x"\n';
    expect(() => parseResult("", stderr)).toThrow(
      /no result event in the output — Error: --json-schema is not a valid JSON Schema/,
    );
  });
});

describe("readSchema — what --json-schema is handed", () => {
  // The CLI's validator rejects a 2020-12 `$schema` URI and exits before answering (2026-10-09).
  it("never passes a draft declaration, for every role schema", () => {
    for (const name of readdirSync(join(import.meta.dirname, "../../scripts/study/schemas"))) {
      const schema = JSON.parse(readSchema(name.replace(/\.json$/, "")));
      expect(schema.$schema, name).toBeUndefined();
      expect(schema.type, name).toBe("object");
    }
  });
});

describe("signedIn — refuse before any call while the CLI is signed out", () => {
  const status = (stdout: string, error?: Error) => () => ({ stdout, error: error ?? null });
  it("is ok only when auth status says loggedIn", () => {
    expect(signedIn(status('{"loggedIn": true}')).ok).toBe(true);
    const out = signedIn(status('{"loggedIn": false, "authMethod": "none"}'));
    expect(out).toEqual({
      ok: false,
      why: "the standalone claude CLI is signed out — run `claude auth login`, then retry",
    });
  });
  it("is not ok when the CLI cannot run or prints garbage", () => {
    expect(signedIn(status("", new Error("ENOENT"))).why).toMatch(/not runnable/);
    expect(signedIn(status("Not logged in")).ok).toBe(false);
  });
});
