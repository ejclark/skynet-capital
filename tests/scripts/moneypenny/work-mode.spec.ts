import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  ACTOR_RULES,
  loadWorkModeConfig,
  mayActorSet,
  noticeLine,
  readWorkMode,
  resolveWorkMode,
  type WorkModeConfig,
} from "../../../scripts/moneypenny/work-mode.mjs";

// THE WORK SPIGOT'S READER (#3960 slice 1). One `work-mode:<position>` label on #4153 sets how fast
// every autonomous lane pulls work. These specs pin the reading rules the lanes will rely on in
// slices 2–3, with `gh` faked throughout — nothing here touches the network:
//   - exactly one label is a position; zero, two, or an unknown one fail closed to conserve + warn;
//   - a non-normal position expires at the end of its `until <date>` day (UTC) and reads normal;
//   - halt with no expiry stays halted (a brake never silently releases), while a conserve or
//     surge with no expiry reads normal + warn (a forgotten throttle must not starve the repo);
//   - an unreadable issue is conserve + warn, never a throw; a broken config file always throws;
//   - who may turn the dial is Eric's 2026-09-30 table ("option C, tightened").

const CONFIG: WorkModeConfig = {
  trackingIssue: 4153,
  labelPrefix: "work-mode:",
  positions: {
    halt: {
      inFlightCap: 0,
      researchPerTick: 0,
      governorDispatches: 0,
      grindWidth: 0,
      continuationsPerDay: 0,
      startedPlanCap: 0,
    },
    conserve: {
      inFlightCap: 1,
      researchPerTick: 2,
      governorDispatches: 1,
      grindWidth: 5,
      continuationsPerDay: 1,
      startedPlanCap: 2,
    },
    normal: {
      inFlightCap: 3,
      researchPerTick: 6,
      governorDispatches: 4,
      grindWidth: 200,
      continuationsPerDay: 3,
      startedPlanCap: 4,
    },
    surge: {
      inFlightCap: 6,
      researchPerTick: 12,
      governorDispatches: 8,
      grindWidth: 200,
      continuationsPerDay: 6,
      startedPlanCap: 8,
    },
  },
};

const at = (iso: string) => Date.parse(iso);
const NOW = at("2026-09-30T12:00:00Z");
const label = (position: string) => ({ name: `work-mode:${position}` });
const until = (date: string, createdAt = "2026-09-29T00:00:00Z") => ({
  body: `Setting the spigot. until ${date}`,
  createdAt,
});
const resolve = (labels: Array<{ name: string }>, comments: Array<{ body: string }> = []) =>
  resolveWorkMode({ labels, comments, now: NOW, config: CONFIG });

describe("reading the dial — one label is one position", () => {
  it("never marks a dial it actually read as unreadable, however it warns", () => {
    expect(resolve([label("normal")]).unreadable).toBeUndefined();
    expect(resolve([label("conserve")]).unreadable).toBeUndefined();
    expect(resolve([]).unreadable).toBeUndefined();
    expect(resolve([label("turbo")]).unreadable).toBeUndefined();
  });

  it("reads normal with today's caps and ignores any comments", () => {
    const mode = resolve([label("normal")], [until("2026-09-01")]);
    expect(mode).toEqual({
      position: "normal",
      until: null,
      caps: {
        inFlightCap: 3,
        researchPerTick: 6,
        governorDispatches: 4,
        grindWidth: 200,
        continuationsPerDay: 3,
        startedPlanCap: 4,
      },
      reason: "set to normal",
    });
  });

  it.each([
    [
      "halt",
      {
        inFlightCap: 0,
        researchPerTick: 0,
        governorDispatches: 0,
        grindWidth: 0,
        continuationsPerDay: 0,
        startedPlanCap: 0,
      },
    ],
    [
      "conserve",
      {
        inFlightCap: 1,
        researchPerTick: 2,
        governorDispatches: 1,
        grindWidth: 5,
        continuationsPerDay: 1,
        startedPlanCap: 2,
      },
    ],
    [
      "surge",
      {
        inFlightCap: 6,
        researchPerTick: 12,
        governorDispatches: 8,
        grindWidth: 200,
        continuationsPerDay: 6,
        startedPlanCap: 8,
      },
    ],
  ])("reads %s with its caps while its expiry is ahead", (position, caps) => {
    const mode = resolve([label(position)], [until("2026-10-06")]);
    expect(mode.position).toBe(position);
    expect(mode.until).toBe("2026-10-06");
    expect(mode.caps).toEqual(caps);
    expect(mode.warning).toBeUndefined();
  });

  it("ignores labels outside the dial's prefix", () => {
    const mode = resolve(
      [{ name: "plan" }, label("surge"), { name: "ready" }],
      [until("2026-10-01")],
    );
    expect(mode.position).toBe("surge");
  });

  it("accepts plain-string labels as well as { name } objects", () => {
    const mode = resolveWorkMode({ labels: ["work-mode:normal"], now: NOW, config: CONFIG });
    expect(mode.position).toBe("normal");
  });
});

describe("reading the dial — anything but exactly one known label fails closed to conserve", () => {
  it.each([
    ["no label", []],
    ["two labels", [label("normal"), label("surge")]],
    ["an unknown position", [label("turbo")]],
  ])("%s → conserve with a warning", (_what, labels) => {
    const mode = resolve(labels, [until("2026-10-06")]);
    expect(mode.position).toBe("conserve");
    expect(mode.caps).toEqual({
      inFlightCap: 1,
      researchPerTick: 2,
      governorDispatches: 1,
      grindWidth: 5,
      continuationsPerDay: 1,
      startedPlanCap: 2,
    });
    expect(mode.until).toBeNull();
    expect(mode.warning).toMatch(/conserve/);
  });
});

describe("expiry — non-normal positions end on their until date", () => {
  it("reads normal once the date has passed", () => {
    const mode = resolve([label("conserve")], [until("2026-09-29")]);
    expect(mode.position).toBe("normal");
    expect(mode.reason).toMatch(/expired at the end of 2026-09-29/);
    expect(mode.caps).toEqual({
      inFlightCap: 3,
      researchPerTick: 6,
      governorDispatches: 4,
      grindWidth: 200,
      continuationsPerDay: 3,
      startedPlanCap: 4,
    });
  });

  it("holds through the whole of the until day, in UTC", () => {
    const comments = [until("2026-09-30")];
    const late = resolveWorkMode({
      labels: [label("surge")],
      comments,
      now: at("2026-09-30T23:59:59Z"),
      config: CONFIG,
    });
    expect(late.position).toBe("surge");
    const next = resolveWorkMode({
      labels: [label("surge")],
      comments,
      now: at("2026-10-01T00:00:00Z"),
      config: CONFIG,
    });
    expect(next.position).toBe("normal");
  });

  it("an expired halt releases too — an explicit expiry is honored", () => {
    expect(resolve([label("halt")], [until("2026-09-01")]).position).toBe("normal");
  });

  it("uses the NEWEST until comment, by createdAt, not by array order", () => {
    const comments = [
      until("2026-10-06", "2026-09-29T10:00:00Z"),
      until("2026-09-20", "2026-09-15T10:00:00Z"),
    ];
    expect(resolve([label("conserve")], comments).until).toBe("2026-10-06");
  });

  it("matches case-insensitively and inside backticks, skipping comments with no date", () => {
    const comments = [
      { body: "UNTIL `2026-10-02` — the Tuesday reset", createdAt: "2026-09-28T00:00:00Z" },
      { body: "looks good to me", createdAt: "2026-09-29T00:00:00Z" },
    ];
    expect(resolve([label("conserve")], comments).until).toBe("2026-10-02");
  });

  it("does not accept an impossible date as an expiry", () => {
    const mode = resolve([label("surge")], [until("2026-02-31")]);
    expect(mode.position).toBe("normal");
    expect(mode.warning).toMatch(/no "until/);
  });
});

describe("no expiry at all — the brake holds, the throttle and the surge do not", () => {
  it("halt with no until comment stays halted", () => {
    const mode = resolve([label("halt")], [{ body: "stop everything" }]);
    expect(mode.position).toBe("halt");
    expect(mode.until).toBeNull();
    expect(mode.caps).toEqual({
      inFlightCap: 0,
      researchPerTick: 0,
      governorDispatches: 0,
      grindWidth: 0,
      continuationsPerDay: 0,
      startedPlanCap: 0,
    });
    expect(mode.warning).toBeUndefined();
  });

  it.each(["conserve", "surge"])("%s with no until comment reads normal with a warning", (p) => {
    const mode = resolve([label(p)]);
    expect(mode.position).toBe("normal");
    expect(mode.warning).toMatch(new RegExp(`${p} has no "until`));
  });
});

/** A fake `exec` that returns canned output or throws, recording the args it saw. */
function fakeExec(result: string | Error) {
  const calls: string[][] = [];
  const exec = (_cmd: string, args: readonly string[]) => {
    calls.push([...args]);
    if (result instanceof Error) throw result;
    return result;
  };
  return { exec, calls };
}

describe("readWorkMode — one gh call, never a throw on a bad read", () => {
  it("reads the tracking issue's labels and comments in one call", () => {
    const { exec, calls } = fakeExec(
      JSON.stringify({ labels: [label("conserve")], comments: [until("2026-10-06")] }),
    );
    const mode = readWorkMode(exec, CONFIG, NOW);
    expect(calls).toEqual([["issue", "view", "4153", "--json", "labels,comments"]]);
    expect(mode.position).toBe("conserve");
    expect(mode.until).toBe("2026-10-06");
  });

  it.each([
    ["gh fails", new Error("HTTP 502")],
    ["gh returns junk", "<html>not json</html>"],
    ["gh returns null", "null"],
  ])("%s → conserve with a warning", (_what, result) => {
    const { exec } = fakeExec(result);
    const mode = readWorkMode(exec, CONFIG, NOW);
    expect(mode.position).toBe("conserve");
    // The one state where the position is a fallback, not a reading — marked explicitly so the
    // title sync can tell it from the warnings `resolveWorkMode` raises on a dial it read fine.
    expect(mode.unreadable).toBe(true);
    expect(mode.caps).toEqual({
      inFlightCap: 1,
      researchPerTick: 2,
      governorDispatches: 1,
      grindWidth: 5,
      continuationsPerDay: 1,
      startedPlanCap: 2,
    });
    expect(mode.warning).toMatch(/could not read issue #4153/);
  });
});

describe("work-mode config — fail closed", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "work-mode-"));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));
  const write = (cfg: unknown) => {
    const file = join(dir, "work-mode.json");
    writeFileSync(file, typeof cfg === "string" ? cfg : JSON.stringify(cfg));
    return file;
  };
  const withPos = (pos: string, caps: unknown) => ({
    ...CONFIG,
    positions: { ...CONFIG.positions, [pos]: caps },
  });

  it("refuses when the file is missing", () => {
    expect(() => loadWorkModeConfig(join(dir, "nope.json"))).toThrow(/config missing/);
  });

  it.each([
    ["invalid JSON", "{ nope"],
    ["no trackingIssue", { ...CONFIG, trackingIssue: undefined }],
    ["a zero trackingIssue", { ...CONFIG, trackingIssue: 0 }],
    ["an empty labelPrefix", { ...CONFIG, labelPrefix: "" }],
    ["no positions", { ...CONFIG, positions: undefined }],
    ["a missing position", { ...CONFIG, positions: { ...CONFIG.positions, surge: undefined } }],
    [
      "a negative cap",
      withPos("conserve", {
        inFlightCap: -1,
        researchPerTick: 2,
        governorDispatches: 1,
        grindWidth: 5,
      }),
    ],
    [
      "a fractional cap",
      withPos("normal", {
        inFlightCap: 2.5,
        researchPerTick: 6,
        governorDispatches: 4,
        grindWidth: 200,
      }),
    ],
    [
      "a halt that dispatches",
      withPos("halt", { inFlightCap: 0, researchPerTick: 1, governorDispatches: 0, grindWidth: 0 }),
    ],
    [
      "a conserve looser than normal",
      withPos("conserve", {
        inFlightCap: 4,
        researchPerTick: 2,
        governorDispatches: 1,
        grindWidth: 5,
      }),
    ],
    [
      "a surge tighter than normal",
      withPos("surge", {
        inFlightCap: 6,
        researchPerTick: 5,
        governorDispatches: 8,
        grindWidth: 200,
      }),
    ],
    // A lane whose key is absent from a position would otherwise read `undefined` and dispatch on
    // `?? 0`-style defaults scattered across callers. Every position carries every lane's number.
    [
      "a position missing a lane's cap",
      withPos("conserve", { inFlightCap: 1, researchPerTick: 2 }),
    ],
    [
      "a governor allowance looser under conserve than normal",
      withPos("conserve", {
        inFlightCap: 1,
        researchPerTick: 2,
        governorDispatches: 9,
        grindWidth: 5,
      }),
    ],
  ])("refuses %s", (_what, cfg) => {
    expect(() => loadWorkModeConfig(write(cfg))).toThrow(/Refusing to run/);
  });

  it("loads a valid file", () => {
    expect(loadWorkModeConfig(write({ $why: "x", ...CONFIG }))).toEqual(CONFIG);
  });
});

describe("the committed work-mode.json", () => {
  const committed = loadWorkModeConfig(join(process.cwd(), "work-mode.json"));

  it("points at the tracking issue and the dial's prefix", () => {
    expect(committed.trackingIssue).toBe(4153);
    expect(committed.labelPrefix).toBe("work-mode:");
  });

  it("keeps normal at the board's In Progress limit of 3 (Eric, 2026-09-30)", () => {
    expect(committed.positions.normal.inFlightCap).toBe(3);
  });

  it("keeps normal's research cap equal to research-dispatch-budget.json, so normal changes nothing", () => {
    const budget = JSON.parse(readFileSync("research-dispatch-budget.json", "utf8"));
    expect(committed.positions.normal.researchPerTick).toBe(budget.maxPerTick);
  });

  // The two files bound the same number and the dial wins at every position but `normal`
  // (events.mjs → researchCapFor), so this pair is what keeps "normal changes nothing" true. The
  // spec above is the live gate; this one says what breaks if someone edits one file alone.
  // #3960 slice 4, the third pair of this shape: the dial's `normal` number must equal whatever the
  // consumer already did, or "normal changes nothing" stops being true. grind.js's MAX_ITEMS is its
  // own sanity ceiling, so a `normal` grindWidth below it would silently narrow every grind run.
  it("keeps normal's grind width equal to grind.js's MAX_ITEMS, so normal changes nothing", () => {
    const grind = readFileSync(".claude/workflows/grind.js", "utf8");
    const maxItems = Number(grind.match(/const MAX_ITEMS = (\d+)/)?.[1]);
    expect(maxItems).toBeGreaterThan(0);
    expect(committed.positions.normal.grindWidth).toBe(maxItems);
    expect(committed.positions.surge.grindWidth).toBe(maxItems);
  });

  // The slice's own falsifier (#3960): "a conserve window passes with a /grind run at full width →
  // the width cap sat in a doc no run actually reads". This is that falsifier as a gate — the cap
  // has to be read by the script, not just written down in docs/grind/README.md.
  it("is actually read by grind.js, not just documented", () => {
    const grind = readFileSync(".claude/workflows/grind.js", "utf8");
    expect(grind).toContain("scripts/moneypenny/work-gate.mjs");
    expect(grind).toContain("gate.grindWidth");
  });

  it("keeps normal's governor allowance equal to the governor roster's size, so normal changes nothing", () => {
    // Counted from the roster table rather than hardcoded, so adding a fifth athlete fails here
    // until the allowance follows it — the same shape as the research pair above.
    const skill = readFileSync(".claude/skills/governor/SKILL.md", "utf8");
    const athletes = skill.match(/^\s*\| `[a-z-]+` \| `scripts\/[^`]+` \| `[^`]+` \|/gm) ?? [];
    expect(athletes.length).toBeGreaterThan(0);
    expect(committed.positions.normal.governorDispatches).toBe(athletes.length);
  });
});

describe("who may turn the dial (#3960, Eric 2026-09-30, option C tightened)", () => {
  it.each([
    // position, actor, afterEricPhrase, allowed
    ["halt", "some-session", false, true],
    ["normal", "some-session", false, true],
    ["fast-track", "some-session", false, true],
    ["conserve", "some-session", false, false],
    ["conserve", "some-session", true, true],
    ["conserve", "ejclark", false, true],
    ["surge", "some-session", true, false],
    ["surge", "ejclark", false, true],
    ["surge", "EJClark", false, true],
    ["turbo", "ejclark", true, false],
  ] as const)("%s by %s (after phrase: %s) → %s", (position, actor, afterEricPhrase, allowed) => {
    expect(mayActorSet(position, actor, { afterEricPhrase })).toBe(allowed);
  });

  it("covers every position plus fast-track, and nothing else", () => {
    expect(Object.keys(ACTOR_RULES).sort()).toEqual(
      ["conserve", "fast-track", "halt", "normal", "surge"].sort(),
    );
  });

  it("a missing actor may only pull the brake or return to normal", () => {
    expect(mayActorSet("halt", undefined)).toBe(true);
    expect(mayActorSet("surge", undefined)).toBe(false);
    expect(mayActorSet("conserve", null)).toBe(false);
  });
});

describe("the status line", () => {
  it("names the position and, when there is one, the expiry", () => {
    expect(noticeLine({ position: "conserve", until: "2026-10-06" })).toBe(
      "::notice::work-mode=conserve (until 2026-10-06)",
    );
    expect(noticeLine({ position: "normal", until: null })).toBe("::notice::work-mode=normal");
  });
});
