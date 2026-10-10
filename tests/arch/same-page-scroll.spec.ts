import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A SAME-PAGE REFINEMENT KEEPS YOUR PLACE (#4944; the retro line is in docs/LESSONS.md).
 *
 * TanStack Router scrolls to the top on every navigation unless the call says
 * `resetScroll: false`, a search-param refinement of the page you are on included. A filter chip
 * tapped halfway down the Profile page jumped it to the top ~300ms later. Trade was fixed for the
 * same thing on 2026-09-22, call site by call site, and the next page to grow a filter shipped
 * without it. So this is the gate: every navigation that targets the CURRENT route either keeps
 * the scroll (`useRefineSearch()` in app/src/live/refine-search.ts, or `resetScroll: false`
 * written out) or is listed in RESETS below with why the jump to the top is the right move.
 *
 * "Targets the current route" is read from the source, not run: a `navigate({...})` or a
 * `<Link search=…>` with no `to`, `to: "."`, a `to` equal to the file's own route path, or a
 * search that spreads `...prev` (carrying the page's own params over only makes sense on the
 * page that has them).
 */
const RESETS: Record<string, ReadonlyArray<readonly [snippet: string, why: string]>> = {
  // Whole-view switches: a section or an account is a different view, so it opens at its top.
  // Whether some of them should keep the scroll is a design call held by #4943, not #4944.
  "app/src/routes/accounts.tsx": [
    ["account: id === fallbackId", "account switch (held by #4943)"],
    ["section: next === opening ? undefined : next", "section switch (held by #4943)"],
  ],
  "app/src/routes/activity.tsx": [['next === "feed"', "section switch (held by #4943)"]],
  "app/src/routes/research.tsx": [
    ["({ ...prev, account: id })", "Playbooks' subscribe-as account switch (held by #4943)"],
    ['next === "board"', "section switch (held by #4943)"],
  ],
  "app/src/routes/settings.tsx": [['next === "preferences"', "section switch (held by #4943)"]],
  "app/src/routes/trade.tsx": [
    ['next === "ticket"', "section switch (held by #4943)"],
    ["guidanceSearch(prev, row)", "guidance 'Use this' lands on a preset ticket, a new view"],
    ["manageSearch(prev, call)", "'Manage' lands on the position's ticket, a new view"],
  ],
  "app/src/shell/bench-doors.tsx": [
    ['"guidance" as const', "Trade section door (held by #4943)"],
    ['"chain" as const', "Trade section door (held by #4943)"],
    ['"outlook" as const', "Trade section door (held by #4943)"],
    ['"watchlist" as const', "Trade section door (held by #4943)"],
  ],
  "app/src/shell/events-agenda.tsx": [
    ["section: undefined, events: undefined", "leaves Events for the row's #pos- anchor"],
  ],
  "app/src/shell/level-up-ceremony.tsx": [
    ['chapter: "trading" as const', "the ceremony's door into Milestones, a section switch"],
  ],
  "app/src/shell/milestone-strip.tsx": [
    ["play: play.code", "a rung is a ticket action: it lands on the ticket section"],
  ],
  "app/src/shell/money-strip.tsx": [
    ['chapter: "playbooks" as const', "Overview's door into Milestones, a section switch"],
  ],
  // No Leaderboard entries: its compare toggles keep the scroll and move the view to the result
  // themselves, never to the top (#5057, Eric's pick on #5037 question 8). "The view follows the
  // result" — docs/PATTERNS.md.
};

const APP_SRC = join("app", "src");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((path) => /\.tsx?$/.test(path) && !path.endsWith("routeTree.gen.ts"))
    .map((path) => join(dir, path));
}

/** Comments out, so a doc comment quoting `navigate({` is never read as a call. */
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:\\"'])\/\/.*$/gm, "$1");

/** The text from `open` to its matching close, skipping over string and template literals. */
function balanced(source: string, start: number, open: string, close: string): string {
  let depth = 0;
  let quote = "";
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") quote = ch;
    else if (ch === open) depth++;
    else if (ch === close && --depth === 0) return source.slice(start, i + 1);
  }
  return source.slice(start);
}

/** A JSX opening tag from `<Link` to its own `>`, braces (and the `=>` inside them) skipped. */
function openingTag(source: string, start: number): string {
  let depth = 0;
  let quote = "";
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") quote = ch;
    else if (ch === "{") depth++;
    else if (ch === "}") depth--;
    else if (ch === ">" && depth === 0) return source.slice(start, i + 1);
  }
  return source.slice(start);
}

interface SamePageNav {
  readonly text: string;
  readonly keepsScroll: boolean;
}

/** Every navigation in `source` that lands on the page it's called from. */
function samePageNavigations(source: string, routePath?: string): SamePageNav[] {
  const code = stripComments(source);
  const ownPath = routePath?.replace(/(.)\/$/, "$1");
  const isOwn = (to: string | undefined) =>
    to === undefined || to === "." || (ownPath !== undefined && to === ownPath);
  const out: SamePageNav[] = [];

  for (const m of code.matchAll(/\bnavigate\(\s*\{/g)) {
    const text = balanced(code, code.indexOf("{", m.index), "{", "}");
    const to = /\bto:\s*"([^"]*)"/.exec(text)?.[1] ?? (/\bto:/.test(text) ? "<expr>" : undefined);
    if (isOwn(to) || /\.\.\.prev\b/.test(text))
      out.push({ text, keepsScroll: /\bresetScroll:\s*false\b/.test(text) });
  }
  for (const m of code.matchAll(/<Link\b/g)) {
    const text = openingTag(code, m.index);
    if (!/\ssearch=/.test(text)) continue;
    const to = /\sto="([^"]*)"/.exec(text)?.[1] ?? (/\sto=\{/.test(text) ? "<expr>" : undefined);
    if (isOwn(to) || /\.\.\.prev\b/.test(text))
      out.push({ text, keepsScroll: /\bresetScroll=\{false\}/.test(text) });
  }
  return out;
}

const scanned = sourceFiles(APP_SRC).map((file) => {
  const source = readFileSync(file, "utf8");
  const route = /createFileRoute\("([^"]+)"\)/.exec(source)?.[1];
  return { file, navs: samePageNavigations(source, route) };
});

const resets = scanned.flatMap(({ file, navs }) =>
  navs.filter((n) => !n.keepsScroll).map((n) => ({ file, text: n.text })),
);

describe("same-page refinements keep the scroll position (#4944)", () => {
  it("flags a same-route navigate or Link that resets the scroll, and passes one that doesn't", () => {
    // The gate's own fixture: the shape #4944 shipped with, then its fix.
    const before = `
      const navigate = Route.useNavigate();
      urlTimer.current = setTimeout(() => {
        void navigate({ search: (prev) => ({ ...prev, q: next }), replace: true });
      }, 300);
      const el = <Link to="/accounts" search={(prev) => ({ ...prev, chapter })} replace>x</Link>;
      const away = <Link to="/trade" search={{ play: "101" }}>y</Link>;
      // a comment naming navigate({ search }) is not a call
    `;
    const found = samePageNavigations(before, "/accounts");
    expect(found.map((n) => n.keepsScroll)).toEqual([false, false]);

    const after = before
      .replace("replace: true }", "replace: true, resetScroll: false }")
      .replace("replace>", "replace resetScroll={false}>");
    expect(samePageNavigations(after, "/accounts").map((n) => n.keepsScroll)).toEqual([true, true]);
  });

  it("sees the refinement helper itself — the scan must not go blind", () => {
    const helper = scanned.find((s) => s.file.endsWith(join("live", "refine-search.ts")));
    expect(helper?.navs.map((n) => n.keepsScroll)).toEqual([true]);
  });

  it("lists every same-route navigation that jumps to the top, with why", () => {
    // Failing here? A navigation on the page it's called from scrolls the page to the top. If it
    // refines the page (a filter, a chip, a lens, a range), route it through useRefineSearch() or
    // write `resetScroll: false`. If the jump is the point (a new view), add it to RESETS with a
    // snippet of the call and the reason.
    const unlisted = resets
      .filter(({ file, text }) => !(RESETS[file] ?? []).some(([snippet]) => text.includes(snippet)))
      .map(({ file, text }) => `${file}: ${text.replace(/\s+/g, " ").slice(0, 120)}`);
    expect(unlisted).toEqual([]);
  });

  it("keeps the ledger honest: every entry names exactly one navigation that resets the scroll", () => {
    // Exactly one, not "at least one": a snippet is a substring match, so a later reset in the
    // same file whose text happens to contain an entry's snippet would otherwise ride that entry
    // through the gate without a line (and a reason) of its own.
    const off = Object.entries(RESETS).flatMap(([file, entries]) =>
      entries
        .map(([snippet]) => ({
          snippet,
          hits: resets.filter((r) => r.file === file && r.text.includes(snippet)).length,
        }))
        .filter(({ hits }) => hits !== 1)
        .map(({ snippet, hits }) => `${file}: ${snippet} (${hits} matches)`),
    );
    expect(off).toEqual([]);
  });
});
