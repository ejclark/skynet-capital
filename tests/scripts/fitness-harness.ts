import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// The stub-binary harness for fitness.spec.ts's wiring tests: the real entrypoint run against stub
// fly and gh that record their arguments. Grading the spec with scripts/fitness-audit.mjs needs this
// file staged beside it (--with tests/scripts/fitness-harness.ts).

export const SCRIPT = resolve("scripts/fitness.mjs");
export const MIN = 60_000;
export const iso = (ms: number) => new Date(ms).toISOString();

// ---- wiring: the real entrypoint against stub fly and gh ------------------------------------------

// Each reply is tied to the app it belongs to, so a probe asking the wrong app reads nothing.
export const STUB_FLY = `#!/usr/bin/env bash
S="$STUB"; echo "$*" >> "$S/fly-calls"
[[ -f "$S/fly-dead" ]] && { echo "Error: token expired" >&2; exit 1; }
app() { [[ "$*" == *"-a $1"* ]] || { echo "Error: app not found" >&2; exit 1; }; }
case "$1 $2" in
  "machine list") app "skynet-capital-bots --json" "$@"
    if [[ -f "$S/machines-first" ]]; then cat "$S/machines-first"; rm "$S/machines-first"; else cat "$S/machines"; fi ;;
  "machine exec") app "skynet-capital-bots --timeout" "$@"; [[ -f "$S/exec-hang" ]] && sleep 5
    case "$4" in
      "ls -t /data/audit") echo sauron.jsonl ;;
      "tail -n 2 "*) cat "$S/journal" ;;
      "node /app/scripts/journal-tally.mjs /data/audit") if [[ -f "$S/tally" ]]; then cat "$S/tally"; else echo '{"tally":1,"bots":[]}'; fi ;;
      *) cat "$S/stamp" ;;
    esac ;;
  "machine start") cp "$S/machines-up" "$S/machines" ;;
  "secrets list") app "skynet-capital --json" "$@"; cat "$S/secrets" ;;
esac
`;

// deploy-lag's gh api calls land here too, so the main-deploys contract is driven end to end.
export const STUB_GH = `#!/usr/bin/env bash
S="$STUB"; echo "$*" >> "$S/gh-calls"
case "$1 $2" in
  "issue list")
    if [[ "$*" == *--search* ]]; then
      [[ -f "$S/closed-dead" ]] && { echo "HTTP 502" >&2; exit 1; }
      cat "$S/closed"
    else cat "$S/issues"; fi ;;
  "issue create") [[ -f "$S/gh-refuse" ]] && { echo "HTTP 502" >&2; exit 1; }; echo "https://github.com/x/y/issues/99" ;;
  "api --method") [[ -f "$S/edit-refuse" ]] && { echo "HTTP 403" >&2; exit 1; } ;;
  "issue comment"|"issue close"|"issue reopen") ;;
  api*)
    case "$2" in
      *assignees/*)
        [[ -f "$S/not-assignable" ]] && { echo "gh: Not Found (HTTP 404)" >&2; exit 1; }
        [[ -f "$S/assign-dead" ]] && { echo "gh: HTTP 502" >&2; exit 1; } ;;
      graphql) [[ -f "$S/graphql-dead" ]] && { echo "gh: HTTP 502" >&2; exit 1; }; cat "$S/graphql" ;;
      *issues/*/comments*)
        [[ -f "$S/comments-dead" ]] && { echo "gh: HTTP 502" >&2; exit 1; }
        [[ "$2" =~ issues/([0-9]+)/comments ]]; f="$S/comments-\${BASH_REMATCH[1]}"
        if [[ -f "$f" ]]; then jq -c "$5" "$f"; fi ;;
      *commits/main) cat "$S/api-head" ;;
      *pipeline.yml/runs*)
        if [[ "$2" == *event=push* && -f "$S/api-runs-push" ]]; then cat "$S/api-runs-push"; else cat "$S/api-runs"; fi ;;
      *compare/*) cat "$S/api-compare" ;;
      *) [[ "$2" =~ runs/([0-9]+)/jobs ]] && cat "$S/api-jobs-\${BASH_REMATCH[1]}" ;;
    esac ;;
esac
exit 0
`;

// One GitHub that remembers, for the replay: both scripts read and write the same thread. Anything
// else (deploy-lag's reads, the assignment path) falls through to the plain stub above.
export const STATEFUL_GH = `#!/usr/bin/env node
const fs = require("node:fs");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");
const S = process.env.STUB;
const file = join(S, "threads.json");
const argv = process.argv.slice(2);
const db = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { issues: [] };
const save = () => fs.writeFileSync(file, JSON.stringify(db));
const flag = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
const stamp = () => new Date().toISOString().replace(/\\.\\d{3}Z$/, "Z");
const find = () => db.issues.find((i) => i.number === Number(argv[2]));
const say = (issue, body) => issue.comments.push({ body, created_at: stamp() });
const shape = (i) => ({
  number: i.number,
  title: i.title,
  body: i.body,
  state: i.state,
  closedAt: i.closedAt,
  createdAt: i.createdAt,
  assignees: i.assignees.map((login) => ({ login })),
  comments: i.comments.map((c) => ({ body: c.body })),
});
const op = argv[0] + " " + argv[1];
if (op === "issue list") {
  const rows = flag("--search") ? db.issues : db.issues.filter((i) => i.state === "OPEN");
  console.log(JSON.stringify(rows.map(shape)));
} else if (op === "issue create") {
  const number = db.issues.length + 1;
  const assignee = flag("--assignee");
  db.issues.push({
    number,
    title: flag("--title"),
    body: flag("--body"),
    state: "OPEN",
    createdAt: stamp(),
    assignees: assignee ? [assignee] : [],
    assigned: assignee ? 1 : 0,
    comments: [],
  });
  save();
  console.log("https://github.com/o/r/issues/" + number);
} else if (op === "issue comment") {
  say(find(), flag("--body"));
  save();
} else if (op === "issue close" || op === "issue reopen") {
  const issue = find();
  issue.state = op === "issue close" ? "CLOSED" : "OPEN";
  issue.closedAt = op === "issue close" ? stamp() : undefined;
  say(issue, flag("--comment"));
  save();
} else if (op === "api --method") {
  const number = Number(argv[3].match(/issues\\/(\\d+)\\/assignees/)[1]);
  const issue = db.issues.find((i) => i.number === number);
  const login = argv[5].replace("assignees[]=", "");
  if (argv[2] === "DELETE") issue.assignees = issue.assignees.filter((a) => a !== login);
  else if (!issue.assignees.includes(login)) {
    issue.assignees.push(login);
    issue.assigned++;
  }
  save();
} else if (argv[0] === "api" && /issues\\/\\d+\\/comments/.test(argv[1])) {
  const number = Number(argv[1].match(/issues\\/(\\d+)\\/comments/)[1]);
  const issue = db.issues.find((i) => i.number === number);
  const rows = (issue ? issue.comments : []).map((c) => ({ ...c, user: { type: "Bot" } }));
  const res = spawnSync("jq", ["-c", flag("--jq")], { input: JSON.stringify(rows), encoding: "utf8" });
  process.stdout.write(res.stdout);
} else {
  const res = spawnSync(join(S, "gh-plain"), argv, { encoding: "utf8", env: process.env });
  process.stdout.write(res.stdout ?? "");
  process.stderr.write(res.stderr ?? "");
  process.exit(res.status ?? 1);
}
`;

export const HEAD = "aaaaaaa0000000000000000000000000000000aa";
export const NEXT = "bbbbbbb0000000000000000000000000000000bb";
export const landed = `{"jobs":[{"name":"release · deploy","conclusion":"success"},{"name":"release · deploy bots","steps":[{"name":"Deploy bots","conclusion":"success"},{"name":"Smoke test the bots release","conclusion":"success"}]}]}`;
export const skipped = `{"jobs":[{"name":"release · deploy","conclusion":"failure"},{"name":"release · deploy bots","steps":[{"name":"Deploy bots","conclusion":"skipped"}]}]}`;
/** The dashboard deployed; the bots step did what it says, with its smoke not reached. */
export const botsStep = (conclusion: string) =>
  `{"jobs":[{"name":"release · deploy","conclusion":"success"},{"name":"release · deploy bots","conclusion":"${conclusion}","steps":[{"name":"Deploy bots","conclusion":"${conclusion}"}]}]}`;
/** A dispatched landing: the dashboard's job is skipped on a dispatch, the bots deploy and smoke pass. */
export const dispatchLanded = `{"jobs":[{"name":"release · deploy","conclusion":"skipped"},{"name":"release · deploy bots","steps":[{"name":"Deploy bots","conclusion":"success"},{"name":"Smoke test the bots release","conclusion":"success"}]}]}`;

/** The assignment-path reply: one piece of work a bot assigned him at `at`. */
export function graphqlReply(at: number, extra: unknown[] = []) {
  const nodes = [
    {
      number: 4612,
      title: "some work",
      state: "OPEN",
      timelineItems: {
        nodes: [
          {
            createdAt: iso(at),
            actor: { __typename: "Bot", login: "skynet-envoy" },
            assignee: { login: "ejclark" },
          },
        ],
      },
    },
    ...extra,
  ];
  return { data: { repository: { issues: { nodes } } } };
}

export type World = {
  machine?: string;
  machines?: string;
  stampAgeMs?: number;
  secrets?: string[];
  deploy?: "current" | "young" | "late" | "future" | "ahead" | "unreadable";
  issues?: unknown[];
  memoryHistory?: boolean | "none";
  closed?: unknown[];
  comments?: Record<number, unknown[]>;
  assignedAgoMs?: number;
};

/** A stub world. Healthy by default: machine started, fresh stamp, secrets set, deploys current. */
export function fixture(world: World = {}) {
  const stub = mkdtempSync(join(tmpdir(), "fitness-"));
  const now = Date.now();
  writeFileSync(
    join(stub, "machines"),
    world.machines ??
      `[{"id":"standby1","state":"stopped","config":{"standbys":["m1"]}},{"id":"m1","state":"${world.machine ?? "started"}","config":{"env":{"GIT_SHA":"${HEAD}"}}}]`,
  );
  writeFileSync(
    join(stub, "stamp"),
    JSON.stringify({ lastControlsPollAt: iso(now - (world.stampAgeMs ?? MIN)), bridge: "armed" }),
  );
  // These specs run at any hour, so decision-cycle must read healthy whenever the market is open.
  // Its own seeds, with the clock pinned, are in fitness-decision-cycle.spec.ts.
  writeFileSync(join(stub, "journal"), JSON.stringify({ at: now - 15_000 }));
  const secrets = world.secrets ?? ["SKYNET_ALERT_EMAIL_API_KEY", "SKYNET_ALERT_EMAIL_FROM"];
  writeFileSync(join(stub, "secrets"), JSON.stringify(secrets.map((name) => ({ Name: name }))));
  writeFileSync(join(stub, "issues"), JSON.stringify(world.issues ?? []));
  writeFileSync(join(stub, "closed"), JSON.stringify(world.closed ?? []));
  for (const [n, rows] of Object.entries(world.comments ?? {})) {
    writeFileSync(join(stub, `comments-${n}`), JSON.stringify(rows));
  }
  writeFileSync(
    join(stub, "graphql"),
    JSON.stringify(graphqlReply(now - (world.assignedAgoMs ?? 24 * 60 * MIN))),
  );
  const deploy = world.deploy ?? "current";
  if (deploy !== "unreadable") {
    const head = deploy === "current" ? HEAD : NEXT;
    writeFileSync(join(stub, "api-head"), JSON.stringify({ sha: head }));
    const runs =
      deploy === "current"
        ? [{ id: 1, head_sha: HEAD }]
        : [
            { id: 2, head_sha: NEXT },
            { id: 1, head_sha: HEAD },
          ];
    writeFileSync(join(stub, "api-runs"), JSON.stringify({ workflow_runs: runs }));
    writeFileSync(join(stub, "api-jobs-1"), landed);
    writeFileSync(join(stub, "api-jobs-2"), skipped);
    const ages = { current: 5, young: 5, late: 45, future: -60, ahead: -0.5 };
    const since = iso(now - ages[deploy] * MIN);
    writeFileSync(
      join(stub, "api-compare"),
      JSON.stringify({
        commits: [
          {
            sha: NEXT,
            commit: { message: "docs: x", committer: { date: since } },
            author: { login: "ejclark" },
          },
        ],
        files: [{ filename: "docs/IDEAS.md" }],
      }),
    );
  }
  // A home with one memory folder, versioned or bare, for the session contract.
  const memory = join(stub, "home", ".claude", "projects", "p", "memory");
  if (world.memoryHistory !== "none") {
    mkdirSync(memory, { recursive: true });
    writeFileSync(join(memory, "MEMORY.md"), "# memory\n");
    if (world.memoryHistory !== false) mkdirSync(join(memory, ".git"));
  } else mkdirSync(join(stub, "home"), { recursive: true });
  for (const [name, body] of [
    ["fly", STUB_FLY],
    ["gh", STUB_GH],
  ] as const) {
    writeFileSync(join(stub, name), body);
    chmodSync(join(stub, name), 0o755);
  }
  return stub;
}

export function run(stub: string, args: string[], env: Record<string, string> = {}) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      STUB: stub,
      FLY_BIN: join(stub, "fly"),
      GH_BIN: join(stub, "gh"),
      PATH: `${stub}:${process.env.PATH}`,
      HOME: join(stub, "home"),
      FITNESS_RETRY_MS: "0",
      FITNESS_SPAWN_MS: "10000",
      GITHUB_ACTIONS: "true",
      GITHUB_EVENT_NAME: "schedule",
      ...env,
    },
  });
}

export const calls = (stub: string, bin: string) =>
  existsSync(join(stub, `${bin}-calls`)) ? readFileSync(join(stub, `${bin}-calls`), "utf8") : "";
export const lines = (text: string, needle: string) =>
  text.split("\n").filter((l) => l.includes(needle)).length;
// The JSON sits between ::warning:: lines above it and report lines below it.
export type Result = { status: string; detail: string; home: string };
export const results = (res: ReturnType<typeof run>) => {
  const list = JSON.parse(
    res.stdout.slice(res.stdout.indexOf("\n[") + 1, res.stdout.lastIndexOf("\n]") + 2),
  ) as (Result & { id: string })[];
  return (id: string): Result => {
    const r = list.find((x) => x.id === id);
    if (!r) throw new Error(`no result for ${id}: ${res.stdout}${res.stderr}`);
    return r;
  };
};

/** Runs the scan reads, newest first, with one set of jobs each. Main sits on the newest run's sha. */
export function runsWindow(stub: string, jobs: string[]) {
  const now = Date.now();
  const runs = jobs.map((_, i) => ({
    id: i + 1,
    head_sha: `sha${i + 1}`,
    created_at: iso(now - (i + 1) * 3 * MIN),
  }));
  writeFileSync(join(stub, "api-head"), JSON.stringify({ sha: "sha1" }));
  writeFileSync(join(stub, "api-runs"), JSON.stringify({ workflow_runs: runs }));
  jobs.forEach((body, i) => {
    writeFileSync(join(stub, `api-jobs-${i + 1}`), body);
  });
}

/** The real 11-01 shape: a push skipped by the debounce, then catch-up's dispatch landed it. */
export function dispatchLandedWorld(stub: string) {
  const now = Date.now();
  writeFileSync(join(stub, "api-head"), JSON.stringify({ sha: NEXT }));
  const run = (id: number, sha: string, event: string, agoMin: number) => ({
    id,
    event,
    head_sha: sha,
    created_at: iso(now - agoMin * MIN),
  });
  const dispatched = run(3, NEXT, "workflow_dispatch", 125);
  const push = [run(2, NEXT, "push", 142), run(1, HEAD, "push", 155)];
  writeFileSync(join(stub, "api-runs"), JSON.stringify({ workflow_runs: [dispatched, ...push] }));
  writeFileSync(join(stub, "api-runs-push"), JSON.stringify({ workflow_runs: push }));
  writeFileSync(join(stub, "api-jobs-3"), dispatchLanded);
  writeFileSync(join(stub, "api-jobs-2"), botsStep("skipped"));
  writeFileSync(join(stub, "api-jobs-1"), landed);
  writeFileSync(
    join(stub, "api-compare"),
    JSON.stringify({
      commits: [
        {
          sha: NEXT,
          commit: { message: "fix: x", committer: { date: iso(now - 142 * MIN) } },
          author: { login: "ejclark" },
        },
      ],
      files: [{ filename: "scripts/fitness.mjs" }],
    }),
  );
}

export const deploysIssue = (body: string) => ({
  number: 7,
  title: "[fitness] main-deploys",
  body,
  comments: [],
  createdAt: iso(Date.now() - 30 * MIN),
  assignees: [],
});

// ---- shared by fitness.spec.ts and fitness-wiring.spec.ts -----------------------------------------

export const START = resolve("scripts/bots-start-stopped.sh");
