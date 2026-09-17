import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Pagination-consumer gate — the mechanical answer to "does anything downstream of this cursor
// actually walk it?" (banked in docs/LESSONS.md, retro on #3187).
//
// PR #2329 unified four disagreeing hardcoded feed caps into one `per_page`/`before`/`nextCursor`
// contract (`src/server/pagination.ts`), explicit in its own body that "no frontend load more UI
// [was] wired in this PR" and that a consumer would follow later. It never did: #2355 (the very
// next PR against the same plan issue) built a different feature instead, the plan issue never
// grew an EARS criterion for "a member can see a trade older than page one," and the deferral —
// only ever prose in a merged PR body — had nowhere to stay checked, so it quietly vanished. A
// member hit the result eight days later: the Activity feed showed only whatever fit on the first
// page, with older trades sitting in the store, unreachable.
//
// This gate cannot know whether EVERY paginated route has ITS OWN UI consumer (that's a design
// question, not a mechanical one) — but it CAN catch the exact failure mode that just happened:
// the server growing a pagination contract while the client-side surface reads none of it at all.
// Tested in both directions, same as `volume-persistence.spec.ts`: the scan must find the
// contract's own usage (a refactor that renames it should break this loudly, not go silently
// blind), and the client must reference at least one of its cursor-carrying shapes.

const SRC = "src";
const APP_SRC = join("app", "src");

function tsFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return tsFiles(path);
    return e.isFile() && /\.(ts|tsx)$/.test(path) ? [path] : [];
  });
}

function grep(dir: string, pattern: RegExp): string[] {
  return tsFiles(dir).filter((file) => pattern.test(readFileSync(file, "utf8")));
}

describe("pagination consumer", () => {
  it("finds the server-side pagination contract in use — the scan itself must not go blind", () => {
    const serverUsers = grep(SRC, /nextLinkHeader|paginateDesc/);
    expect(
      serverUsers.length,
      "no src/ file references nextLinkHeader/paginateDesc — either the pagination contract " +
        "(src/server/pagination.ts) was removed, or this scan's pattern no longer matches it. " +
        "Update the pattern rather than deleting this gate.",
    ).toBeGreaterThan(0);
  });

  it("has at least one client-side reader of the pagination cursor", () => {
    // Any of these means SOME screen walks back past page one: a raw `nextCursor` field read off
    // a fetch response, or a hand-parsed `Link: rel="next"` header (this app's own convention,
    // see `app/src/live/wire.ts`'s `parseNextCursor`).
    const consumers = grep(APP_SRC, /nextCursor|rel="next"/);
    expect(
      consumers,
      "src/server/pagination.ts's per_page/cursor contract has zero client-side consumers in " +
        "app/src — every paginated feed's rows past the first page are unreachable from the UI. " +
        "Wire up a 'load more' (or equivalent) that reads the response's nextCursor/Link, the way " +
        "app/src/live/wire.ts + app/src/routes/activity.tsx do for the Activity feed.",
    ).not.toHaveLength(0);
  });
});
