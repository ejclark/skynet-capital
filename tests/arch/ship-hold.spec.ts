import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

/**
 * A HOLD THAT HOLDS (2026-09-25, #3735). pipeline.yml's arm job reads the labels in the triggering
 * event's payload. `ship open --hold` used to open the PR ready and label it a moment later, so the
 * `opened` event carried no `hold-merge` and the job armed it anyway — a held PR merged on green,
 * before its correctness review landed. The fix is an ORDER inside cmd_open: open as a draft (the
 * arm job skips drafts), label, then promote (the `ready_for_review` event carries the label). A
 * network-free check of that order, read straight from the script so it cannot drift.
 */
describe("ship open --hold — the label is on before the PR is ever ready", () => {
  const script = readFileSync("scripts/ship.sh", "utf8");
  const start = script.indexOf("cmd_open()");
  const next = script.indexOf("\ncmd_", start + 1);
  const open = script.slice(start, next === -1 ? undefined : next);

  it("opens a held PR as a draft, and only a held one", () => {
    expect(open).toContain("'draft':sys.argv[5]=='1'");
    expect(open).toMatch(/"\$title" "\$branch" "\$base" "\$body" "\$hold"/);
  });

  it("labels hold-merge before it promotes the draft to ready", () => {
    const label = open.indexOf('{"labels":["hold-merge"]}');
    const promote = open.indexOf("promote_ready");
    expect(label).toBeGreaterThan(-1);
    expect(promote).toBeGreaterThan(label);
  });

  it("never promotes when the label failed — an unlabelled ready PR merges on green", () => {
    const failed = open.indexOf("could NOT label");
    const promote = open.indexOf("promote_ready");
    expect(open.slice(failed, promote)).toContain("return");
  });

  // The first live --hold (#3738) labelled its PR and stranded it as a draft: a Claude Code cloud
  // session's proxy refuses GraphQL, and GraphQL was the only promote path tried.
  const fn = script.slice(
    script.indexOf("promote_ready() {"),
    script.indexOf("\n}\n", script.indexOf("promote_ready() {")),
  );

  it("falls back to the session's REST route when GraphQL does not confirm the promote", () => {
    const gql = fn.indexOf("markPullRequestReadyForReview");
    const rest = fn.indexOf("/ccr/ready_for_review");
    expect(gql).toBeGreaterThan(-1);
    expect(rest).toBeGreaterThan(gql);
    expect(fn).toContain(`grep -q '"draft":false'`);
  });

  it("never reports a stranded draft as ready", () => {
    const failure = open.slice(open.indexOf("could NOT promote"));
    expect(failure.slice(0, 300)).toContain("still a DRAFT");
  });
});

/**
 * A HELD PR'S VERIFY IS A REAL RUN (2026-09-30, #4168). `open --hold` fires `opened` (draft) and
 * `ready_for_review` a second apart in one cancel-in-progress group; on #4166 the draft run landed
 * second, cancelled the real verify, and left a skipped verify as the latest word — which branch
 * protection reads as a PASS (the #322 hole). After promoting, ship.sh reads the head's verify
 * once and fires an `edited` event when it is stale. The verdict is pure, so it is pinned here.
 */
describe("ship open --hold — a late draft run never leaves verify skipped", () => {
  const verdict = (runs: object[]) =>
    execFileSync("bash", ["scripts/ship.sh", "checkverify"], {
      input: JSON.stringify({ check_runs: runs }),
      env: { ...process.env, GH_TOKEN: "test-token-never-used" },
    })
      .toString()
      .trim();
  const real = { id: 1, name: "verify", status: "completed", conclusion: "cancelled" };
  const skipped = { id: 2, name: "verify", status: "completed", conclusion: "skipped" };

  it("calls the #4166 shape stale: cancelled real run, then a newer skipped one", () => {
    expect(verdict([real, skipped])).toBe("stale");
  });

  it("reads the LATEST verify by id, not the first listed", () => {
    const rerun = { id: 3, name: "verify", status: "completed", conclusion: "success" };
    expect(verdict([rerun, real, skipped])).toBe("real");
    expect(verdict([{ ...rerun, conclusion: "failure" }, skipped])).toBe("real");
  });

  it("leaves a queued or running verify alone", () => {
    expect(verdict([skipped, { id: 4, name: "verify", status: "in_progress" }])).toBe("pending");
  });

  it("ignores other checks, and says none when no verify exists yet", () => {
    expect(
      verdict([{ id: 9, name: "integration tests", status: "completed", conclusion: "skipped" }]),
    ).toBe("none");
  });

  const script = readFileSync("scripts/ship.sh", "utf8");
  const start = script.indexOf("cmd_open()");
  const open = script.slice(start, script.indexOf("\ncmd_", start + 1));
  const fn = script.slice(
    script.indexOf("reverify_held() {"),
    script.indexOf("\n}\n", script.indexOf("reverify_held() {")),
  );

  it("re-checks verify only after a confirmed promote", () => {
    const promoted = open.indexOf("promoted #$num to ready");
    const reverify = open.indexOf("reverify_held");
    expect(promoted).toBeGreaterThan(-1);
    expect(reverify).toBeGreaterThan(promoted);
    expect(reverify).toBeLessThan(open.indexOf("could NOT promote"));
  });

  it("re-triggers with a CHANGED body (an unchanged PATCH fires no edited event), and says so", () => {
    expect(fn).toContain('api PATCH "/pulls/$num"');
    expect(fn).toContain("<!-- ship: re-verify");
    expect(fn).toContain("fired an edited event");
  });

  it("reads once after a delay — never a polling loop", () => {
    expect(fn).not.toMatch(/\b(while|until)\b/);
  });
});

/**
 * `ship automerge` from a cloud session (2026-09-26): the session proxy refuses GraphQL and serves
 * auto-merge at a REST route, so arming from here could only fail. The fallback sits AFTER the
 * envelope check (a protected diff still never arms) and BEFORE the read-back that judges every arm.
 */
describe("ship automerge — the session's REST route when GraphQL is refused", () => {
  const script = readFileSync("scripts/ship.sh", "utf8");
  const start = script.indexOf("cmd_automerge()");
  const fn = script.slice(start, script.indexOf("\n}\n", start));

  it("tries the REST route only after the envelope check and the GraphQL attempt", () => {
    const checkarm = fn.indexOf("cmd_checkarm");
    const gql = fn.indexOf("enablePullRequestAutoMerge");
    const rest = fn.indexOf("/ccr/auto_merge");
    expect(checkarm).toBeGreaterThan(-1);
    expect(gql).toBeGreaterThan(checkarm);
    expect(rest).toBeGreaterThan(gql);
  });

  it("still reads the PR back before claiming it is armed", () => {
    expect(fn.indexOf('get("auto_merge")')).toBeGreaterThan(fn.indexOf("/ccr/auto_merge"));
  });
});

/**
 * EVERY REQUEST WITH A BODY DECLARES ITS TYPE (#3907). curl defaults a bare `-d` to
 * `application/x-www-form-urlencoded`. api.github.com tolerates that and parses the JSON anyway; a
 * Claude Code session's proxy does not, and answers 415 — so `ship open` could only fail from a
 * proxied session, which is where most of this lane's PRs are opened from. The header landed in
 * #3355 as a drive-by inside an unrelated PR, with no test: the invariant held by luck. This pins it
 * for `api()` specifically and for every other body-sending curl in the file, so a future edit that
 * drops it goes red here instead of 415-ing the next proxied ship.
 */
describe("ship — a curl that sends a body declares it as JSON", () => {
  const script = readFileSync("scripts/ship.sh", "utf8");

  // Continuations joined, so one logical curl invocation reads as one line whatever the wrapping.
  const curls = script.replace(/\\\n\s*/g, " ").match(/curl\b[^\n]*/g) ?? [];

  it("sets Content-Type on api()'s request in the same expansion as its body", () => {
    const start = script.indexOf("api() {");
    const fn = script.slice(start, script.indexOf("\n}\n", start));
    // One expansion, not two: a body with no header is not a state this can reach.
    expect(fn).toContain('${3:+-H "Content-Type: application/json" -d "$3"}');
  });

  it("finds no body-sending curl anywhere in the script without the header", () => {
    expect(curls.length).toBeGreaterThan(2); // api(), promote_ready, the automerge mutation
    const bare = curls.filter((c) => /-d ["']/.test(c) && !c.includes("Content-Type"));
    expect(bare).toEqual([]);
  });
});

/**
 * NEVER MERGE PAST INTEGRATION TESTS (2026-09-30, #4094). Native auto-merge waits only on REQUIRED
 * checks and only `verify` is required, so the skill's "arm the moment it opens" let #4151, #4155
 * and #4158 merge while `integration tests` was still running; two of those runs went red. The
 * pipeline's own arm job already waits for it — so `ship open` stops telling sessions to arm, runs
 * the Playwright suite locally first, and `ship automerge` (the fallback) holds the same line.
 */
describe("ship — integration tests gate every merge path", () => {
  const source = readFileSync("scripts/ship.sh", "utf8");
  const automerge = source.slice(source.indexOf("cmd_automerge()"));

  it("checks the integration tests run BEFORE the arm mutation, and refuses anything but pass/skip", () => {
    const gate = automerge.indexOf("check_name=integration%20tests");
    const mutation = automerge.indexOf("enablePullRequestAutoMerge");
    expect(gate).toBeGreaterThan(-1);
    expect(gate).toBeLessThan(mutation);
    expect(automerge).toMatch(/success\|skipped\) ;;/);
    expect(automerge).toMatch(/refusing to arm/);
  });

  it("runs the local integration suite on a non-docs diff before anything is pushed", () => {
    const open = source.slice(source.indexOf("cmd_open()"), source.indexOf("cmd_automerge()"));
    const e2e = open.indexOf("npm run test:e2e");
    expect(e2e).toBeGreaterThan(open.indexOf("npm run verify"));
    expect(e2e).toBeLessThan(open.indexOf('cmd_push "$branch"'));
    expect(open).toMatch(/LOCAL INTEGRATION TESTS FAILED — not pushing/);
  });

  it("no longer tells a session to arm by hand after opening", () => {
    expect(source).toMatch(/Do NOT arm auto-merge by hand/);
    expect(source).not.toMatch(/NEXT \(per \.claude\/skills\/ship\) — one enable_pr_auto_merge/);
  });
});

/**
 * THE WAY BACK FROM A RED FIRST RUN (2026-10-10). Baselines are Linux-only, so off Linux the local
 * e2e is skipped and a visual PR meets its new pictures first in CI — #5079 and #5080 both went
 * red that way, and #5079 was re-baselined by hand. Once the PR exists, ship names the one command
 * (scripts/rebaseline-from-ci.mjs) with that PR's number, for a diff that can move a screenshot.
 */
describe("ship — a visual PR is told the way back from a red first run", () => {
  const source = readFileSync("scripts/ship.sh", "utf8");
  const hint = source.slice(source.indexOf("visual_hint()"), source.indexOf("cmd_open()"));
  const open = source.slice(source.indexOf("cmd_open()"), source.indexOf("cmd_automerge()"));

  it("speaks only off Linux, and only for a diff under app/src or e2e", () => {
    expect(hint).toMatch(/uname -s\)" != "Linux" \] \|\| return 0/);
    expect(hint).toContain("grep -qE '^(app/src|e2e)/'");
  });

  it("names the re-baseline command with the PR's own number, after the PR is opened", () => {
    expect(hint).toContain("node scripts/rebaseline-from-ci.mjs $1");
    expect(hint).toMatch(/read each diff, then \\`--apply --commit\\`/);
    expect(open.indexOf('visual_hint "$num" "$base"')).toBeGreaterThan(
      open.indexOf("opened PR #$num"),
    );
  });
});
