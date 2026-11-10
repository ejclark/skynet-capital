import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "@rstest/core";
import {
  classify,
  flowOf,
  HAND_READ,
  readFlow,
  typedBy,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/agent-meter/flow.mjs";
// @ts-expect-error plain .mjs script, no declarations
import { flowSection, renderFlow } from "../../scripts/agent-meter/render.mjs";

// THE FLOW METER (#6470). Eric, 2026-11-01: "enable me to retain a flow state". A hand read found 141
// of his 184 typed messages were him managing a session rather than asking for work. Nothing could
// repeat that read, so a fall could not be seen. These rules are the repeatable half: narrower than a
// person, pinned here, and printed beside the hand read so nobody mistakes one for the other.

describe("what kind of message it is", () => {
  const rows: [string, string[]][] = [
    [
      "status",
      [
        "how's the deploy going?",
        "progress update?",
        "25 minutes - what are you waiting on?",
        "any updates?",
        "update?",
        "what's next?",
        "what remains?",
        "status?",
        "still working?",
        "any remaining tasks?",
        "is there anything left?",
        "how’s it going", // a phone's curly apostrophe
      ],
    ],
    ["try-again", ["Try again", "try again please", "retry"]],
    [
      "spotted-fault",
      [
        "5079 fails CI",
        "6020 fails lint",
        "deployment failed: https://github.com/o/r/actions/runs/1",
        "https://example.test/a doesn't load",
        "the page is broken again",
        "the readout isn't accessible",
      ],
    ],
    [
      "quote-back",
      [
        "> a rule of ours quoted back. seems arbitrary",
        "  > this one\nfeels backwards",
        "<!-- reply 1 -->\n> a line from the page. not what I meant",
      ],
    ],
    [
      "done-report",
      [
        "done",
        "Done.",
        "marked done in web",
        "Merged it",
        "merged",
        "last round of the page done.",
        "i said done on the form",
        "i've filled out the web version",
      ],
    ],
    [
      "word-confusion",
      [
        "no idea what you're talking about",
        "What is a held PR?",
        "the action is unclear",
        "what is there to approve?",
        "what does that mean?",
      ],
    ],
    [
      "other",
      [
        "A2",
        "yes",
        "do it",
        "keep pulling threads",
        "I would like to consolidate the sections onto one page and keep every part of it reachable.",
        // A failure word inside a long message is usually the subject of real work, not a spotted fault.
        "the tests that fail on the review step should read the same rules the server reads, because a member sees the same plan in both places",
        // A status word in an instruction asks for work.
        "update the docs for this",
        "waiting on the PR is fine",
        // Long, so it is thinking out loud about status rather than asking for one.
        "I wonder whether the status of all the plans on the board could be drawn as a single picture for the phone?",
      ],
    ],
  ];
  for (const [kind, messages] of rows) {
    for (const text of messages) {
      it(`reads ${JSON.stringify(text.slice(0, 40))} as ${kind}`, () => {
        expect(classify(text)).toBe(kind);
      });
    }
  }
});

describe("which messages are his", () => {
  const user = (content: unknown, extra = {}) =>
    JSON.stringify({
      type: "user",
      timestamp: "2026-10-20T12:00:00Z",
      message: { content },
      ...extra,
    });
  const texts = (lines: string[]) => typedBy(lines).map((m: { text: string }) => m.text);

  it("keeps what he typed and drops what the harness added, through dream-digest's own filter", () => {
    expect(
      texts([
        user("what's next?"),
        user("<task-notification>x</task-notification>"),
        user("a sub-agent prompt", { isSidechain: true }),
        user("the text of a skill", { isMeta: true }),
      ]),
    ).toEqual(["what's next?"]);
  });

  it("drops a round page's Done press and an artifact comment's wrapper", () => {
    expect(
      texts([
        user("Done with steering round design-1-r0: 1 of 1 answered. Read it back."),
        user("[Artifact comment sent to Claude] looks fine"),
        user("yes"),
      ]),
    ).toEqual(["yes"]);
  });

  it("drops a brief another session wrote: a long opening message, or a stage's own prompt", () => {
    const brief = `Build this. ${"x ".repeat(800)}`;
    expect(texts([user(brief), user("yes")])).toEqual(["yes"]);
    expect(texts([user("Run exactly: node scripts/x.mjs")])).toEqual([]);
    expect(texts([user("[Workflow harness — computed task] do it")])).toEqual([]);
    expect(texts([user("You are a reviewer. Read this.")])).toEqual([]);
  });

  it("keeps a long message later in a session, which he did type", () => {
    const long = `Here is the whole idea. ${"y ".repeat(800)}`;
    expect(texts([user("start"), user(long)])).toHaveLength(2);
  });

  it("drops a slash command, with or without arguments: he typed a tool's name, not work", () => {
    for (const command of [
      "/ship",
      "/ship --hold",
      "/code-review high",
      "/loop 5m /foo",
      "/superpowers:brainstorming a new page",
      "  /ship --hold",
    ]) {
      expect(texts([user(command), user("yes")]), command).toEqual(["yes"]);
    }
  });

  it("keeps a message that only opens on a path, or that names a command later on", () => {
    for (const text of [
      "/app/today doesn't load",
      "/Users is the wrong folder",
      "run /ship --hold on this one",
      "/",
    ]) {
      expect(texts([user(text)]), text).toEqual([text]);
    }
  });

  // What these two rules cannot tell apart. Both are written down in flow.mjs, and pinned so that
  // closing either one has to say so here.
  it("stays open: a long first message of his own reads as a brief, and is dropped", () => {
    const hisOwn = `Here is what I want from today, in my own words. ${"z ".repeat(800)}`;
    expect(texts([user(hisOwn), user("yes")])).toEqual(["yes"]);
  });

  it("stays open: a route he opens a message on reads as a slash command, and is dropped", () => {
    expect(texts([user("/login doesn't load"), user("yes")])).toEqual(["yes"]);
  });
});

describe("the reading", () => {
  const WINDOW = {
    sinceMs: Date.parse("2026-10-01T00:00:00Z"),
    untilMs: Date.parse("2026-11-01T00:00:00Z"),
  };
  const at = (day: number) => `2026-10-${String(day).padStart(2, "0")}T12:00:00Z`;
  const msg = (text: string, day = 5) => ({ at: at(day), text });
  const session = (...typed: { at: string; text: string }[]) => ({ path: "a.jsonl", typed });

  it("counts each kind and the share that manage the session", () => {
    const reading = flowOf(
      [
        session(
          msg("any updates?"),
          msg("5079 fails CI"),
          msg("Try again"),
          msg("I would like a new page"),
        ),
      ],
      WINDOW,
    );
    expect(reading.typed).toBe(4);
    expect(reading.managing).toBe(3);
    expect(reading.share).toBe(75);
    expect(reading.byKind).toEqual({
      status: 1,
      "try-again": 1,
      "spotted-fault": 1,
      "quote-back": 0,
      "done-report": 0,
      "word-confusion": 0,
      other: 1,
    });
  });

  it("reads only messages inside the window, whenever their session began", () => {
    const reading = flowOf(
      [session({ at: "2026-09-20T00:00:00Z", text: "any updates?" }, msg("yes"))],
      WINDOW,
    );
    expect(reading.typed).toBe(1);
  });

  it("leaves a message after the window's end to the next reading", () => {
    const after = { at: "2026-11-01T00:00:01Z", text: "any updates?" };
    const reading = flowOf(
      [
        session(msg("yes"), after),
        { path: "later.jsonl", typed: [{ at: "2026-11-02T00:00:00Z", text: "5079 fails CI" }] },
      ],
      WINDOW,
    );
    expect(reading).toMatchObject({ typed: 1, managing: 0, sessions: 1, repeatedStatus: 0 });
    expect(reading.byKind.status).toBe(0);
    expect(reading.byKind["spotted-fault"]).toBe(0);
  });

  it("does not count this window's question as repeated by one asked in the next", () => {
    const later = { at: "2026-11-03T00:00:00Z", text: "update?" };
    const reading = flowOf([session(msg("any updates?", 30), later)], WINDOW);
    expect(reading).toMatchObject({ typed: 1, repeatedStatus: 0 });
  });

  it("counts one message once when a resumed session copied it into a second file", () => {
    const reading = flowOf(
      [
        { path: "a.jsonl", typed: [msg("any updates?")] },
        { path: "b.jsonl", typed: [msg("any updates?"), msg("yes", 6)] },
      ],
      WINDOW,
    );
    expect(reading.typed).toBe(2);
  });

  it("counts the same status question repeated in a session, however it is worded", () => {
    const reading = flowOf(
      [session(msg("any updates?", 5), msg("update?", 6), msg("Update.", 7), msg("yes", 8))],
      WINDOW,
    );
    expect(reading.repeatedStatus).toBe(2);
  });

  it("does not call one question in each of two sessions a repeat", () => {
    const reading = flowOf(
      [
        { path: "a.jsonl", typed: [msg("any updates?", 5)] },
        { path: "b.jsonl", typed: [msg("any updates?", 6)] },
      ],
      WINDOW,
    );
    expect(reading.repeatedStatus).toBe(0);
  });

  it("reads a short question he asks again as status, even in words no rule names", () => {
    const reading = flowOf([session(msg("well?", 5), msg("well?", 6))], WINDOW);
    expect(reading.byKind.status).toBe(1);
    expect(reading.byKind.other).toBe(1);
    expect(reading.repeatedStatus).toBe(1);
  });

  it("leaves a kind a rule named alone when it is asked twice", () => {
    const reading = flowOf(
      [session(msg("What is a held PR?", 5), msg("What is a held PR?", 6))],
      WINDOW,
    );
    expect(reading.byKind["word-confusion"]).toBe(2);
    expect(reading.byKind.status).toBe(0);
    expect(reading.repeatedStatus).toBe(0);
  });

  it("counts a session only when he typed in it during the window", () => {
    const reading = flowOf(
      [
        { path: "a.jsonl", typed: [msg("yes")] },
        { path: "quiet.jsonl", typed: [] },
        { path: "old.jsonl", typed: [{ at: "2026-09-01T00:00:00Z", text: "yes" }] },
      ],
      WINDOW,
    );
    expect(reading.sessions).toBe(1);
  });

  const undated = (text: string) => ({ at: undefined as unknown as string, text });

  it("keeps a message with no readable time out of every window, and reads unknown", () => {
    const reading = flowOf([session(undated("yes"), undated("any updates?"))], WINDOW);
    expect(reading).toMatchObject({ verdict: "unknown", typed: 0, share: null, undated: 2 });
    expect(reading.line).toContain("2 typed messages");
    expect(reading.line).toMatch(/no readable time/);
  });

  it("states no share for a window with no typed message, and calls the reading unknown", () => {
    for (const sessions of [
      [],
      [session()],
      [session({ at: "2026-09-20T00:00:00Z", text: "any updates?" })],
    ]) {
      const reading = flowOf(sessions, WINDOW);
      expect(reading.typed).toBe(0);
      expect(reading.share).toBeNull();
      expect(reading.verdict).toBe("unknown");
      expect(reading.line).toMatch(/no typed message/);
    }
  });

  it("says how many it left out when some messages have a time and some do not", () => {
    const reading = flowOf([session(msg("any updates?"), undated("yes"))], WINDOW);
    expect(reading).toMatchObject({ verdict: "read", typed: 1, share: 100, undated: 1 });
  });

  it("states a true 0% once he typed something and none of it manages a session", () => {
    const reading = flowOf([session(msg("I would like a new page"))], WINDOW);
    expect(reading).toMatchObject({ verdict: "read", typed: 1, managing: 0, share: 0, undated: 0 });
  });
});

describe("how it prints", () => {
  const reading = {
    window: { hours: 24, since: "s", until: "u" },
    verdict: "read",
    sessions: 2,
    typed: 40,
    managing: 10,
    share: 25,
    repeatedStatus: 3,
    byKind: {
      status: 4,
      "try-again": 1,
      "spotted-fault": 2,
      "quote-back": 1,
      "done-report": 1,
      "word-confusion": 1,
      other: 30,
    },
    handRead: HAND_READ,
  };

  it("says out loud that the rules undercount, and prints the hand read beside them", () => {
    const text = renderFlow(reading);
    expect(text).toContain("10 of 40");
    expect(text).toContain("25%");
    expect(text).toContain("141 of 184");
    expect(text).toMatch(/undercount/);
    expect(text).toContain(`${HAND_READ.rulesCaught} of 184`);
    expect(text).toContain("repeated in a session: 3");
    expect(text).toContain("status ×4");
  });

  it("reads a machine with no transcripts as unknown, never as zero", () => {
    const text = flowSection({ verdict: "unknown", line: "no transcripts on this machine" });
    expect(text.join("\n")).toContain("unknown");
    expect(text.join("\n")).not.toMatch(/\b0 of\b|0%/);
  });

  it("says when the window held no typed message, and prints no share", () => {
    const nothing = flowOf([], { sinceMs: 0, untilMs: 1 });
    for (const section of [
      flowSection(nothing),
      // Whatever it is handed: a reading called read with nothing in it still has no share to print.
      flowSection({ ...reading, typed: 0, managing: 0, share: null }),
    ]) {
      const text = section.join("\n");
      expect(text).toContain("unknown");
      expect(text).toMatch(/no typed message/);
      expect(text).not.toMatch(/\b0 of\b|\b0%/);
    }
  });

  it("says how many messages it could not place in time", () => {
    expect(flowSection({ ...reading, undated: 3 }).join("\n")).toMatch(
      /3 more had no readable time/,
    );
    expect(flowSection({ ...reading, undated: 0 }).join("\n")).not.toMatch(/no readable time/);
  });
});

describe("reading the transcripts", () => {
  const dir = mkdtempSync(join(tmpdir(), "flow-"));
  const line = (text: string, day = "2026-10-20") =>
    JSON.stringify({ type: "user", timestamp: `${day}T12:00:00Z`, message: { content: text } });
  writeFileSync(join(dir, "a.jsonl"), `${[line("any updates?"), line("do it")].join("\n")}\n`);
  writeFileSync(join(dir, "old.jsonl"), `${line("5079 fails CI", "2026-08-01")}\n`);
  const empty = mkdtempSync(join(tmpdir(), "flow-empty-"));
  const WINDOW = {
    sinceMs: Date.parse("2026-10-01T00:00:00Z"),
    untilMs: Date.parse("2026-11-01T00:00:00Z"),
    hours: 744,
    since: "2026-10-01T00:00:00.000Z",
    until: "2026-11-01T00:00:00.000Z",
  };
  const meter = (env: Record<string, string>, ...args: string[]) =>
    spawnSync("node", ["scripts/agent-meter.mjs", "--flow", ...args], {
      encoding: "utf8",
      env: { ...process.env, ...env },
    });
  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
    rmSync(empty, { recursive: true, force: true });
  });

  const readFrom = async (folder: string) => {
    process.env.AGENT_TRANSCRIPTS_DIR = folder;
    try {
      return await readFlow(WINDOW);
    } finally {
      delete process.env.AGENT_TRANSCRIPTS_DIR;
    }
  };

  it("reads a folder of sessions", async () => {
    const reading = await readFrom(dir);
    expect(reading).toMatchObject({ verdict: "read", typed: 2, managing: 1, share: 50 });
  });

  it("reads unknown when the folder is missing or holds no session", async () => {
    expect((await readFrom(join(dir, "absent"))).verdict).toBe("unknown");
    expect((await readFrom(empty)).verdict).toBe("unknown");
  });

  const folderOf = (name: string, rows: string[]) => {
    const folder = join(dir, name);
    mkdirSync(folder);
    writeFileSync(join(folder, "a.jsonl"), `${rows.join("\n")}\n`);
    return folder;
  };
  const spaced = (row: string) => row.replace(/":/g, '": ');
  const window = ["--since", WINDOW.since, "--until", WINDOW.until];

  // Each of these states has transcripts in it and nothing to count, so each is one that could print a 0.
  const NOTHING_TO_COUNT: [string, string[]][] = [
    ["every row from before the window", [line("any updates?", "2026-08-01")]],
    ["every row from after the window", [line("any updates?", "2026-12-01")]],
    [
      "rows with no timestamp",
      [JSON.stringify({ type: "user", message: { content: "any updates?" } })],
    ],
    ["rows of no kind it knows", [line("any updates?").replace('"user"', '"human"')]],
    ["only what the harness wrote", [line("<task-notification>x</task-notification>")]],
  ];
  NOTHING_TO_COUNT.forEach(([state, rows], i) => {
    it(`reads unknown, with no share, on ${state}`, async () => {
      const folder = folderOf(`nothing-${i}`, rows);
      const reading = await readFrom(folder);
      expect(reading.verdict).toBe("unknown");
      expect(reading.share).toBeNull();
      expect(reading.line).toBeTruthy();
      const text = meter({ AGENT_TRANSCRIPTS_DIR: folder }, ...window);
      expect(text.status).toBe(0);
      expect(text.stdout).toContain("unknown");
      expect(text.stdout).not.toMatch(/\b0 of\b|\b0%/);
      const json = JSON.parse(meter({ AGENT_TRANSCRIPTS_DIR: folder }, ...window, "--json").stdout);
      expect(json).toMatchObject({ verdict: "unknown", share: null });
    });
  });

  it("reads a writer whose JSON has a space after each colon, rather than finding nothing", async () => {
    const folder = folderOf("spaced", [line("any updates?"), line("do it")].map(spaced));
    expect(await readFrom(folder)).toMatchObject({
      verdict: "read",
      typed: 2,
      managing: 1,
      share: 50,
    });
  });

  it("states a machine with no transcripts with no share either", async () => {
    expect(await readFrom(empty)).toMatchObject({ verdict: "unknown", share: null });
  });

  it("reads unknown rather than throwing when a transcript cannot be read", async () => {
    const broken = mkdtempSync(join(tmpdir(), "flow-broken-"));
    mkdirSync(join(broken, "a-folder.jsonl"));
    try {
      expect((await readFrom(broken)).verdict).toBe("unknown");
    } finally {
      rmSync(broken, { recursive: true, force: true });
    }
  });

  it("answers on the command line: the section alone, as text or JSON", () => {
    const window = ["--since", WINDOW.since, "--until", WINDOW.until];
    const text = meter({ AGENT_TRANSCRIPTS_DIR: dir }, ...window);
    expect(text.status).toBe(0);
    expect(text.stdout).toContain("1 of 2");
    expect(text.stdout).toContain("141 of 184");
    const json = meter({ AGENT_TRANSCRIPTS_DIR: dir }, ...window, "--json");
    expect(JSON.parse(json.stdout)).toMatchObject({ typed: 2, handRead: { managing: 141 } });
  });

  it("prints unknown and exits 0 on a machine with no transcripts, as a runner's check reads it", () => {
    const home = join(empty, "home");
    mkdirSync(home);
    const run = meter({ AGENT_TRANSCRIPTS_DIR: "", HOME: home });
    expect(run.status).toBe(0);
    expect(run.stdout).toContain("unknown");
  });
});
