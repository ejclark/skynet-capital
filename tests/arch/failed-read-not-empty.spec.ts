import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Failed-read gate (#8320) — a read that FAILED must never render as a read that came back EMPTY.
//
// The class: code takes the empty or undefined result of a read that did not succeed and shows it
// as "nothing there". The hub degrades a failed or timed-out broker read to a row carrying
// `positions: []` plus `error` (src/observatory/participant-snapshot.ts), and a TanStack query that
// failed has `data === undefined`. Read either without asking "did it fail?" and a member is told
// they hold nothing, have no accounts, or that nothing needs them, when the truth is "we could not
// look". Four hits on one class before this gate: #6029, #6273, #8264 (held news said "you hold
// nothing" on a failed positions read) and #8267 (home said "Nothing needs you right now." on a
// failed read). The adversarial review lens names it ("Unreadable source counted as a reading"),
// but a lens is prose; this is the mechanical half.
//
// What it checks is deliberately coarse: a file that reads the hub's positions must mention the
// row's `.error`, and a route that calls useQuery/useQueries must mention `isError`, `.error` or
// `isLoadError`. A mention is not a correct handling. The gate only forces the author to decide
// the failed-read case; the reviewer lens still judges the wording. Model: volume-persistence.spec.ts.
//
// Tested in BOTH directions: each scan must FIND the files known to handle the case (a gate that
// passes because it discovered nothing is the failure mode banked before), and it must fail on
// the pre-fix text of #8264 and #8267, excerpted below as fixtures, never on the live files.

const SERVER = "src/server";
const ROUTES = "app/src/routes";

/** Reads a hub participant row's positions: `….getState().participants` plus a `.positions`. */
const READS_HUB_POSITIONS = (text: string): boolean =>
  /getState\(\)\s*\.participants\b/.test(text) && /\.positions\b/.test(text);
/** Mentions the row's error tag (`desk.error`, `p?.error`, `!p.error`), not a `{ error: … }` key. */
const MENTIONS_ROW_ERROR = (text: string): boolean => /[\w)\]?]\.error\b/.test(text);

/** Calls TanStack Query's useQuery or useQueries. */
const CALLS_QUERY = (text: string): boolean => /\buseQuer(?:y|ies)\s*[(<]/.test(text);
/** Mentions a failed query: `isError`, `.error`, or the app's `isLoadError`. */
const MENTIONS_QUERY_ERROR = (text: string): boolean =>
  /\bisError\b|\.error\b|\bisLoadError\b/.test(text);

/**
 * Known offenders on main when the gate landed (2026-11-24). SHRINK-ONLY: fix a file, delete its
 * line; never add one. Each entry names its tracking issue, or why the empty read claims nothing.
 */
const SERVER_OFFENDERS: Readonly<Record<string, string>> = {
  "src/server/desk-alerts-route.ts":
    "bug #8334: a failed read drops held-name window alerts, so the list reads as all clear",
  "src/server/draft-order-route.ts":
    "bug #8335: a failed read prices a draft against $0 cash and no positions",
  "src/server/fast-track-route.ts":
    "ranking key only: a failed read loses the held-first ordering and states nothing as fact",
  "src/server/option-positions-route.ts":
    "bug #8334: a failed read answers ok with no rows, read as 'no options held'",
  "src/server/quests-route.ts":
    "bug #8334: a failed read builds quests from no positions, read as nothing to do",
  "src/server/trade-api-routes.ts":
    "bug #8335: a failed read reviews an order against $0 cash and no positions",
};

const ROUTE_OFFENDERS: Readonly<Record<string, string>> = {
  "app/src/routes/trade.tsx":
    "bug #8337: a failed settings read shows 'No accounts are linked to your session yet'",
};

/** Files known to handle the case today; the scan must find them or it has gone blind. */
const SERVER_ANCHORS = ["src/server/coverage-route.ts", "src/server/held-news-route.ts"] as const;
const ROUTE_ANCHORS = ["app/src/routes/accounts.tsx", "app/src/routes/index.tsx"] as const;

// Pre-fix text, verbatim excerpts. Held news before #8324 (94b66c96^:src/server/held-news-route.ts):
const PRE_FIX_HELD_NEWS = `
  const desk = deps.hub.getState().participants.find((p) => p.id === accountId);
  const ranked = rankedHeldNames(desk?.positions ?? []);
  if (ranked.length === 0) return Promise.resolve(nothingToRead(asOf, HELD_NEWS_NOTES.empty));
`;
// The home's "Needs you" before #8325 (2364e910^:app/src/routes/index.tsx):
const PRE_FIX_HOME = `
import { useQuery } from "@tanstack/react-query";
function NeedsYou(): ReactElement {
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const accounts = settings.data?.accounts ?? [];
  const quests = useQuery({
    queryKey: ["quests"],
    queryFn: fetchQuests,
    enabled: accounts.length > 0,
  });
  const rows = needsRows({
    hasAccount: settings.data ? accounts.length > 0 : undefined,
    bestQuest: quests.data?.available ? quests.data.quests[0]?.move.label : undefined,
  });
  return <p className="home-needs-none">{loading ? "Checking what needs you…" : "Nothing needs you right now."}</p>;
}
`;

function files(dir: string, ext: RegExp): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return files(path, ext);
    return e.isFile() && ext.test(path) && !/\.(spec|test)\.tsx?$/.test(path) ? [path] : [];
  });
}

/** Every file the scan applies to, and the ones among them that never mention the failure. */
function scan(
  dir: string,
  ext: RegExp,
  applies: (t: string) => boolean,
  handles: (t: string) => boolean,
): { found: string[]; silent: string[] } {
  const found: string[] = [];
  const silent: string[] = [];
  for (const file of files(dir, ext)) {
    const text = readFileSync(file, "utf8");
    if (!applies(text)) continue;
    found.push(file);
    if (!handles(text)) silent.push(file);
  }
  return { found, silent };
}

describe.each([
  {
    name: "server: a hub positions read must decide the row's error",
    dir: SERVER,
    ext: /\.ts$/,
    applies: READS_HUB_POSITIONS,
    handles: MENTIONS_ROW_ERROR,
    offenders: SERVER_OFFENDERS,
    anchors: SERVER_ANCHORS,
    preFix: PRE_FIX_HELD_NEWS,
    fixed: `${PRE_FIX_HELD_NEWS}\n  if (desk?.error) return failed(asOf);`,
    fix: "check the row's `.error` (a failed read carries positions: []) and say the read failed",
  },
  {
    name: "app: a route's query must decide its failure",
    dir: ROUTES,
    ext: /\.tsx?$/,
    applies: CALLS_QUERY,
    handles: MENTIONS_QUERY_ERROR,
    offenders: ROUTE_OFFENDERS,
    anchors: ROUTE_ANCHORS,
    preFix: PRE_FIX_HOME,
    fixed: `${PRE_FIX_HOME}\n  if (settings.isError) return <LoadFailed />;`,
    fix: "branch on `isError` before reading empty data as 'nothing there'",
  },
])("failed read is not an empty one — $name", (c) => {
  const { found, silent } = scan(c.dir, c.ext, c.applies, c.handles);

  it("finds the files known to handle it — the scan itself must not go blind", () => {
    for (const anchor of c.anchors)
      expect(found, `${anchor} not found by the scan`).toContain(anchor);
    expect(silent).not.toEqual(expect.arrayContaining([...c.anchors]));
  });

  it("fails on the pre-fix text of the finding that motivated it, and passes once it is fixed", () => {
    expect(c.applies(c.preFix)).toBe(true);
    expect(c.handles(c.preFix), "the pre-fix excerpt must read as silent").toBe(false);
    expect(c.handles(c.fixed)).toBe(true);
  });

  it("is not satisfied by an error KEY in a response body", () => {
    expect(c.handles(`${c.preFix}\n  sendJson(res, 404, { error: "no such account" });`)).toBe(
      c === undefined,
    );
  });

  it("names no new silent file — decide the failed read, or it shows as an empty one", () => {
    const fresh = silent.filter((f) => !(f in c.offenders));
    expect(fresh, `these never mention a failed read: ${c.fix}`).toEqual([]);
  });

  it("keeps the allowlist shrink-only — a fixed or removed file leaves it", () => {
    const stale = Object.keys(c.offenders).filter((f) => !silent.includes(f));
    expect(stale, "no longer silent (or gone): delete the line from the allowlist").toEqual([]);
  });
});
