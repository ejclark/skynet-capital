// A fresh start inside a live recorder session (#4943) — split from session.mjs so that file holds
// one session's life. The machine census (census.mjs) operates each control from a fresh load, and
// moves the page itself between screens; neither is a member's action, so neither may leak into the
// next `act`'s measurements.

import { marks } from "./measure.mjs";
import { settle } from "./session.mjs";

/**
 * A FRESH load of `path` on the session's page — the origin's storage and cookies cleared, the
 * page loaded and settled, the log re-marked — so the next `act` measures from a clean start, as a
 * new member would land. The machine census (census.mjs) operates each control this way.
 */
export async function reopen(session, path) {
  const { page } = session;
  await page.evaluate(clearStorage).catch(() => null);
  await page.context().clearCookies();
  const url = new URL(path, session.shell.origin);
  session.startPath = url.pathname;
  // The old document's requests die with it; one the browser never reported finished must not
  // hold the new load's settle open.
  session.inflight.clear();
  await page.goto(url.href, { waitUntil: "domcontentloaded" });
  session.settled = await settle(session);
  session.mark = await page.evaluate(marks);
  return session.settled;
}

/** In-page: forget whatever an earlier action persisted in this origin's storage. */
function clearStorage() {
  localStorage.clear();
  sessionStorage.clear();
}

/** Re-mark the gap-free log here: a harness move (not a member's) is not the next action's drift. */
export async function remark(session) {
  session.mark = await session.page.evaluate(marks);
}
