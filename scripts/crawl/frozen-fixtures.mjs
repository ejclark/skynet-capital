// A FROZEN copy of the offline fixtures for the journeys — the roster as committed, and no
// `events.jsonl`, so nothing replays. `SKYNET_DATA_SOURCE=offline` normally replays the recorded
// fill script one tick a second from boot (src/adapters/replay-event-stream.ts), which is right
// for a demo and wrong for an acceptance test: run 0 watched Eric's one EEM position get closed
// by the replay between two steps of the same journey, so "the member holds EEM" was true or
// false depending on the second the step ran. A test that flips with the clock is not a test.
//
// The copy is made in a temp dir at boot (`SKYNET_OFFLINE_FIXTURES` points the server at it —
// src/runtime/data-source.ts:185), so `fixtures/offline/participants.json` is read, never
// touched, and no second copy of the roster lives in the tree to drift.
//
// **Plus one invited friend, in the copy only.** The committed roster has one human (Eric, the
// fund owner) and every signed-in journey used to sign in AS him, so no test had ever seen what
// someone else sees (Eric, 2026-09-26: "Other people that log in should have the perspective of
// their accounts/data, not mine."). The copy appends a second human with a position of their own,
// and writes the guest list the way production keeps it — a store file beside the roster
// (`SKYNET_ALLOWLIST_STORE`, src/server/auth/allowlist-store.ts), NOT the owner tier
// (`SKYNET_ALLOWED_EMAILS`, src/server/auth/resolve-auth.ts). `scripts/crawl/fixtures/owner-links.json`
// links the friend's email to that human and to the Day Trader bot; `docs/members/invited-friend.md`
// is the member, and its journeys are the boundary check.

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** The invited friend's sign-in — a member (guest list), never an owner (env allowlist). */
const FRIEND_EMAIL = "friend@example.test";

/** The owner who "invited" the friend — the guest list's audit column; same as server.mjs's CRAWL_EMAIL. */
const INVITED_BY = "crawl@example.test";

/** The friend's own human account: one XLE position nobody else on the roster holds, so a page
 *  that names it is showing the friend's book and a page that names EEM is showing Eric's. */
const FRIEND_PARTICIPANT = {
  id: "human-friend",
  displayName: "Friend",
  kind: "human",
  timezone: "America/New_York",
  account: {
    id: "sim-friend",
    account_number: "SIM-HUMAN-FRIEND",
    cash: "18400.00",
    portfolio_value: "30100.00",
    status: "ACTIVE",
  },
  positions: [{ symbol: "XLE", qty: "130", avg_entry_price: "86.40", market_value: "11700.00" }],
  orders: [
    {
      id: "f1",
      symbol: "XLE",
      qty: "130",
      side: "buy",
      status: "filled",
      filled_qty: "130",
      filled_avg_price: "86.40",
      submitted_at: "2026-08-04T14:12:00Z",
      filled_at: "2026-08-04T14:12:01Z",
    },
  ],
};

/** @returns {string} a directory holding `participants.json` (+ the friend) and `allowlist.json`. */
export function frozenFixturesDir(source = join("fixtures", "offline")) {
  const dir = mkdtempSync(join(tmpdir(), "skynet-journeys-fixtures-"));
  const roster = JSON.parse(readFileSync(join(source, "participants.json"), "utf8"));
  writeFileSync(join(dir, "participants.json"), JSON.stringify([...roster, FRIEND_PARTICIPANT]));
  writeFileSync(allowlistPath(dir), JSON.stringify(guestList()));
  return dir;
}

/** Where the frozen dir keeps its guest list — `envFor` points `SKYNET_ALLOWLIST_STORE` here. */
export function allowlistPath(dir) {
  return join(dir, "allowlist.json");
}

/** The guest list as `FileAllowlistStore` reads it: `seal()`'s unkeyed envelope (`enc: false`,
 *  src/storage/secure-envelope.ts) around the entries — the one shape a store with no
 *  `SKYNET_STORE_SECRET` opens. Written literally so the playwright config needs no TS import. */
function guestList() {
  const entries = [
    { value: FRIEND_EMAIL, kind: "email", addedAt: "2026-09-26T00:00:00Z", addedBy: INVITED_BY },
  ];
  return { v: 1, enc: false, data: JSON.stringify(entries) };
}
