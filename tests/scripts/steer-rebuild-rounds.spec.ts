import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, describe, expect, it } from "@rstest/core";
import { type OpenRound, openRounds } from "../../scripts/steer/open-rounds.mjs";
import { rebuildRounds, reportText } from "../../scripts/steer/rebuild-rounds.mjs";
import { INPUT_FILE } from "../../scripts/steer/round-input.mjs";
import { fixture } from "./steer-fixture";

// #6607: one command rebuilds every open round page from main, names any page it cannot rebuild and
// keeps going, and lists what changed. Fixtures only: nothing here publishes or reads a real page.

const dir = mkdtempSync(join(tmpdir(), "steer-rebuild-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const PAGE = (id: string) => `https://claude.ai/artifact/${id}`;
const state = (issue: number, round: number, url = PAGE(`page${issue}`)) =>
  `**State** — round ${round} · round page: ${url} (store id \`design-${issue}-r${round}\`) · picks: none yet`;

/** One round's input as gather leaves it: a design-only tp.json naming pictures on disk. */
function roundTp(issue: number, round: number, pictures: string[]) {
  const [today = "", ...rest] = pictures;
  return {
    version: 1,
    designOnly: true,
    id: `design-${issue}-r${round}`,
    title: `Round ${round} of #${issue}`,
    round,
    issues: [issue],
    generatedAt: "2026-10-18T07:00:00Z",
    repo: "ejclark/skynet-capital",
    budget: { minutes: 5, used: 5, shown: 1, deferred: 0 },
    decisions: [
      {
        key: `${issue}-q1`,
        kind: "design",
        issue,
        title: "What leads the form?",
        ask: "This round varies only the order.",
        minutes: 5,
        link: `https://github.com/ejclark/skynet-capital/issues/${issue}`,
        skip: "It waits.",
        today: {
          real: true,
          caption: "Today.",
          pictures: [{ src: today, alt: "Today", size: "phone" }],
        },
        options: rest.map((src, i) => ({
          key: String.fromCharCode(65 + i),
          name: `Shape ${i}`,
          delta: "One change.",
          pictures: [{ src, alt: `Shape ${i}`, size: "phone" }],
        })),
      },
    ],
    deferred: [],
    needsPictures: [],
    unstated: { count: 0, numbers: [] },
  };
}

/** A round folder under `root`: its pictures (when `drawn`) and its tp.json. */
function roundFolder(root: string, issue: number, round: number, drawn = true) {
  const folder = join(root, `redesign/s${issue}/r${round}`);
  const pics = ["today.jpg", "a.jpg"].map((f) => join(folder, f));
  mkdirSync(folder, { recursive: true });
  if (drawn) for (const p of pics) writeFileSync(p, "jpg");
  const tp = join(folder, "tp.json");
  writeFileSync(tp, JSON.stringify(roundTp(issue, round, pics)));
  return tp;
}

const cli = (args: string[]) =>
  execFileSync("node", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

describe("which rounds are open, read from the screens' issues", () => {
  const open = (body: string, more: string[] = []) =>
    openRounds([
      { number: 5174, title: "redesign x", comments: [...more, body].map((b) => ({ body: b })) },
    ])[0] as OpenRound;

  it("takes the page and the round from the state comment", () => {
    expect(open(state(5174, 4))).toMatchObject({
      issue: 5174,
      url: PAGE("page5174"),
      id: "design-5174-r4",
      settled: false,
    });
  });

  it("reads a linked page and takes the highest round named, not the first", () => {
    const body =
      "**State** — round 3 · round page: [Activity · round 3](https://claude.ai/artifact/abc) · " +
      "`design-5174-r2` then `design-5174-r10` · earlier page: https://claude.ai/artifact/old";
    expect(open(body)).toMatchObject({ url: PAGE("abc"), id: "design-5174-r10" });
  });

  it("reads the state-block shape, whose page sits in a link on the round", () => {
    const body =
      "## State block — read this first\n\n**Awaiting Eric:** taps on [round 3](https://claude.ai/artifact/abc). " +
      "Whoever picks this up reads `design-5174-r3` back.";
    expect(open(body)).toMatchObject({ url: PAGE("abc"), id: "design-5174-r3", settled: false });
  });

  it("leaves an open round open when its state line records an earlier build", () => {
    const body =
      "**State** — round 5 up, awaiting taps · r4 build filed as #6082 · round page: https://claude.ai/artifact/abc";
    expect(open(body).settled).toBe(false);
  });

  it("takes a link only when it names a numbered round: the board's could say redesign", () => {
    const body = "On the [redesign board](https://claude.ai/artifact/board).";
    expect(open(body).url).toBeNull();
    expect(open("[Pulse redesign · round 2](https://claude.ai/artifact/abc)").url).toBe(
      PAGE("abc"),
    );
  });

  it("never takes a page the state comment does not call a round page", () => {
    const body = "**State** — round 3 · steering page: https://claude.ai/artifact/steering";
    expect(open(body).url).toBeNull();
  });

  it("uses the newest state comment, so an edited history cannot revive an old page", () => {
    const round = open(state(5174, 4, PAGE("new")), [state(5174, 1, PAGE("old"))]);
    expect(round).toMatchObject({ url: PAGE("new"), id: "design-5174-r4" });
  });

  it.each([
    "**State**: design rounds done (r0–r3) · round page: https://claude.ai/artifact/abc",
    "**State** — build filed: #5253 · round page: [x](https://claude.ai/artifact/abc)",
    "**State** — round 4 Build filed as #6082 · page: https://claude.ai/artifact/abc",
    "**State** — this sitting is done: B settled · round page: https://claude.ai/artifact/abc",
    "**State** — section 1 done: what the bot believes · round page: https://claude.ai/artifact/abc",
  ])("calls a finished screen settled: %s", (body) => {
    expect(open(body).settled).toBe(true);
  });

  it("names an issue whose comments could not be read, and keeps its place", () => {
    const [round] = openRounds([
      { number: 7, title: "redesign x", comments: null, error: "HTTP 502" },
    ]);
    expect(round).toMatchObject({ issue: 7, url: null, problem: "HTTP 502" });
  });
});

describe("the rebuild names what it can't do and keeps going (#6607)", () => {
  const root = join(dir, "machine");
  const fromTp = roundFolder(root, 5001, 2);
  roundFolder(root, 5002, 2); // this machine stops at r2; the page shows r3
  roundFolder(root, 5004, 1, false); // its pictures are gone from disk
  const broken = roundTp(5005, 1, []);
  broken.decisions = null as never;
  mkdirSync(join(root, "broken"), { recursive: true });
  writeFileSync(join(root, "broken/tp.json"), JSON.stringify(broken));
  mkdirSync(join(root, "unreadable"), { recursive: true });
  writeFileSync(join(root, "unreadable/tp.json"), "{ not json");
  // A copy of a checkout holds specs and fixtures, never a round: it is not walked.
  roundFolder(join(root, "checkout"), 5099, 1);
  writeFileSync(join(root, "checkout/package.json"), "{}");

  const census = [5001, 5002, 5003, 5004, 5005].map((n) => ({
    number: n,
    title: `redesign s${n}`,
    comments: [{ body: state(n, n === 5002 ? 3 : n === 5001 ? 2 : 1) }],
  }));
  census.push(
    {
      number: 5006,
      title: "redesign settled",
      comments: [
        { body: "**State**: design rounds done · round page: https://claude.ai/artifact/s" },
      ],
    },
    { number: 5099, title: "redesign elsewhere", comments: [{ body: state(5099, 1) }] },
  );
  const out = join(dir, "out");
  const result = rebuildRounds(openRounds(census), {
    roots: [root],
    out,
    tooling: "abc1234",
    commits: () => ["abc1234 fix(steer): the bar reads at 390"],
  });
  const byIssue = <T extends { issue: number }>(list: T[], n: number) =>
    list.find((x) => x.issue === n) as T;

  it("rebuilds the page whose inputs are here, into its own folder, and never over the round's", () => {
    const page = byIssue(result.publish, 5001);
    expect(page).toMatchObject({ id: "design-5001-r2", url: PAGE("page5001"), source: fromTp });
    expect(page.file_path).toBe(join(out, "design-5001-r2", "steer.html"));
    expect(readFileSync(page.file_path, "utf8")).toContain("What leads the form?");
    expect(existsSync(join(dirname(fromTp), "steer.html"))).toBe(false);
  });

  it("asks a publish for all three capabilities, and for the input the next rebuild will read", () => {
    const page = byIssue(result.publish, 5001);
    expect(page.capabilities).toEqual({ db: {}, user: {}, comments: {} });
    expect(Object.keys(page.files)).toContain(INPUT_FILE);
    const input = JSON.parse(readFileSync(page.files[INPUT_FILE] as string, "utf8"));
    expect(input.built).toMatchObject({ sha: "abc1234" });
    expect(input.built.pageSha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("lists what changed in the tooling for each page it rebuilt", () => {
    expect(byIssue(result.publish, 5001)).toMatchObject({
      changed: ["abc1234 fix(steer): the bar reads at 390"],
    });
    expect(reportText(result)).toContain("abc1234 fix(steer): the bar reads at 390");
  });

  it("never publishes older inputs over a newer page", () => {
    expect(byIssue(result.publish, 5002)).toBeUndefined();
    expect(byIssue(result.failed, 5002).why).toContain("design-5002-r2");
    expect(byIssue(result.failed, 5002).why).toContain("design-5002-r3");
  });

  it("names a page whose inputs are nowhere here, and says how a session could still reach it", () => {
    expect(byIssue(result.failed, 5003).why).toContain("no inputs on this machine");
    expect(result.fetch).toContainEqual({
      id: "design-5003-r1",
      url: PAGE("page5003"),
      path: INPUT_FILE,
    });
  });

  it("rebuilds with the pictures gone: a publish keeps the files it leaves out", () => {
    const page = byIssue(result.publish, 5004);
    expect(page.keptOnPage).toBe(2);
    expect(Object.keys(page.files)).toEqual([INPUT_FILE]);
    expect(readFileSync(page.file_path, "utf8")).toContain("img/5004-q1/0-today.jpg");
  });

  it("names a page the tooling cannot render and still reaches the rest", () => {
    expect(byIssue(result.failed, 5005).why).toContain("cannot render");
    expect(byIssue(result.publish, 5004)).toBeDefined();
  });

  it("names a file it could not read, leaves a settled screen alone, skips a checkout copy", () => {
    expect(result.unreadable).toEqual([join(root, "unreadable/tp.json")]);
    expect(result.settled.map((r) => r.issue)).toEqual([5006]);
    expect(byIssue(result.failed, 5099).why).toContain("no inputs");
  });

  it("writes the plan and says plainly it published nothing", () => {
    const plan = JSON.parse(readFileSync(join(out, "publish.json"), "utf8"));
    expect(plan.publish.map((p: { issue: number }) => p.issue)).toEqual([5001, 5004]);
    expect(reportText(result)).toContain("nothing is published yet");
  });

  it("reads a rebuilt page's own input back as current, so a second run publishes nothing", () => {
    const again = rebuildRounds(openRounds(census.slice(0, 1)), {
      roots: copyInput(),
      out: join(dir, "out2"),
      tooling: "abc1234",
      commits: () => [],
    });
    expect(again.publish).toEqual([]);
    expect(again.current.map((r) => r.id)).toEqual(["design-5001-r2"]);
  });

  /** The input a publish carried, fetched back into a folder a session would read. */
  function copyInput() {
    const fetched = join(dir, "fetched");
    mkdirSync(fetched, { recursive: true });
    const page = byIssue(result.publish, 5001);
    writeFileSync(join(fetched, INPUT_FILE), readFileSync(page.files[INPUT_FILE] as string));
    return [fetched];
  }

  it("does not read its own unpublished output back as what the page shows", () => {
    const second = rebuildRounds(openRounds(census.slice(0, 1)), {
      roots: [out, root],
      out,
      tooling: "abc1234",
      commits: () => [],
    });
    expect(second.current).toEqual([]);
    expect(second.publish.map((p) => p.id)).toEqual(["design-5001-r2"]);
  });
});

describe("a state comment behind its page never gets an older round planned over it (#6731)", () => {
  // The page's own copy says r4; the scratchpad still holds r3, and the comment resolves to r3.
  const root = join(dir, "lagging");
  roundFolder(root, 5174, 3);
  const fetched = join(root, "fetched");
  mkdirSync(fetched, { recursive: true });
  writeFileSync(join(fetched, INPUT_FILE), JSON.stringify(roundTp(5174, 4, [])));

  const rebuildFrom = (comments: string[], out: string) =>
    rebuildRounds(
      openRounds([
        { number: 5174, title: "redesign x", comments: comments.map((body) => ({ body })) },
      ]),
      { roots: [root], out: join(dir, out), tooling: "abc1234", commits: () => [] },
    );

  it.each([
    ["a stale store id on the state line", [state(5174, 3)]],
    [
      "a state line with no store id, after an older comment naming r3",
      [
        "Round 3 is up: `design-5174-r3`.",
        `**State** — round 4 up · round page: ${PAGE("page5174")}`,
      ],
    ],
  ])("plans nothing over the page and names both rounds: %s", (_shape, comments) => {
    const result = rebuildFrom(comments, `lagging-out-${comments.length}`);
    expect(result.publish).toEqual([]);
    expect(result.current).toEqual([]);
    const [failed] = result.failed;
    expect(failed).toMatchObject({ issue: 5174, id: "design-5174-r3" });
    expect(failed?.why).toContain("page's own copy says it shows design-5174-r4");
    expect(reportText(result)).toContain("state comment resolves to design-5174-r3");
    const plan = JSON.parse(
      readFileSync(join(dir, `lagging-out-${comments.length}`, "publish.json"), "utf8"),
    );
    expect(plan.publish).toEqual([]);
  });

  it("still rebuilds when the comment agrees with the page's copy", () => {
    const agrees = join(dir, "agrees");
    roundFolder(agrees, 5175, 2);
    mkdirSync(join(agrees, "fetched"), { recursive: true });
    writeFileSync(
      join(agrees, "fetched", INPUT_FILE),
      JSON.stringify(roundTp(5175, 1, [])), // an older read-back of the same page: r2 is newer
    );
    mkdirSync(join(agrees, "fetched2"), { recursive: true });
    writeFileSync(join(agrees, "fetched2", INPUT_FILE), JSON.stringify(roundTp(5175, 2, [])));
    const result = rebuildRounds(
      openRounds([{ number: 5175, title: "redesign y", comments: [{ body: state(5175, 2) }] }]),
      { roots: [agrees], out: join(dir, "agrees-out"), tooling: "abc1234", commits: () => [] },
    );
    expect(result.failed).toEqual([]);
    expect(result.publish.map((p) => p.id)).toEqual(["design-5175-r2"]);
  });
});

describe("the build leaves a page able to be rebuilt by any session", () => {
  const root = join(dir, "built");
  const tp = roundFolder(root, 5150, 1);
  cli(["scripts/steer/build.mjs", tp]);
  const folder = dirname(tp);
  const files = JSON.parse(readFileSync(join(folder, "files.json"), "utf8"));
  const input = JSON.parse(readFileSync(join(folder, INPUT_FILE), "utf8"));

  it("publishes the round's input beside its page, with no path from the machine that drew it", () => {
    expect(files[INPUT_FILE]).toBe(join(folder, INPUT_FILE));
    expect(JSON.stringify(input)).not.toContain(folder);
    expect(input.decisions[0].today.pictures[0].local).toBe("img/5150-q1/0-today.jpg");
  });

  it("gives a steering page none: it is rebuilt at every touch point", () => {
    const page = join(dir, "steering");
    mkdirSync(page, { recursive: true });
    writeFileSync(join(page, "tp.json"), JSON.stringify(fixture({ decisions: [] })));
    cli(["scripts/steer/build.mjs", join(page, "tp.json")]);
    expect(existsSync(join(page, INPUT_FILE))).toBe(false);
  });

  it("never calls a page current from a build that may not have been published", () => {
    const census = openRounds([
      { number: 5150, title: "redesign x", comments: [{ body: state(5150, 1) }] },
    ]);
    const local = rebuildRounds(census, {
      roots: [root],
      out: join(dir, "local-out"),
      tooling: "abc1234",
      commits: () => [],
    });
    expect(local.current).toEqual([]);
    expect(local.publish.map((p) => p.source)).toEqual([tp]);
  });

  it("takes the page's own copy over a scratchpad's, and always asks for it first", () => {
    const fetched = join(dir, "fetched-first");
    mkdirSync(fetched, { recursive: true });
    writeFileSync(join(fetched, INPUT_FILE), JSON.stringify(input));
    const census = openRounds([
      { number: 5150, title: "redesign x", comments: [{ body: state(5150, 1) }] },
    ]);
    const both = rebuildRounds(census, {
      roots: [root, fetched],
      out: join(dir, "both-out"),
      tooling: "abc1234",
      commits: () => [],
    });
    expect(both.current.map((r) => r.id)).toEqual(["design-5150-r1"]);
    expect(both.fetch.map((f) => f.id)).toEqual(["design-5150-r1"]);
    expect(reportText(both)).toContain("Before publishing, Artifact read");
  });

  it("a rebuild of an unchanged page says so, whichever session asks", () => {
    const fetched = join(dir, "fetched-5150");
    mkdirSync(fetched, { recursive: true });
    writeFileSync(join(fetched, INPUT_FILE), JSON.stringify(input));
    const census = join(dir, "census.json");
    writeFileSync(
      census,
      JSON.stringify([{ number: 5150, title: "redesign x", comments: [{ body: state(5150, 1) }] }]),
    );
    const report = cli([
      "scripts/steer/rebuild-rounds.mjs",
      "--census",
      census,
      "--roots",
      fetched,
      "--out",
      join(dir, "cli-out"),
      "--any-tooling",
    ]);
    expect(report).toContain("Already current (1)");
    expect(report).toContain("design-5150-r1");
  });
});
