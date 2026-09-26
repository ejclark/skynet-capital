// The journey file's step semantics, in ONE place — `e2e/journeys.spec.ts` (the acceptance tests)
// and `scripts/crawl/run.mjs` (the baseline crawl) both walk the same `e2e/journeys/*.journey.json`
// files, so what an `expect` entry means must not be written twice. The schema is documented once,
// in docs/members/README.md; this module is its executable reading.
//
// Playwright-core only (no @playwright/test): the spec wraps these in real assertions, the crawl
// records the boolean and moves on — a crawl that stopped at the first failed expect would never
// reach the dead end two steps later.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** phone = 390×844 with touch (the mobile-first frame); desktop = 1280×900. */
export const VIEWPORTS = {
  phone: { viewport: { width: 390, height: 844 }, hasTouch: true },
  desktop: { viewport: { width: 1280, height: 900 }, hasTouch: false },
};

/** Every `*.journey.json` under `dir`, sorted by file name so runs are stable. */
export function loadJourneys(dir = "e2e/journeys") {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".journey.json"))
    .sort()
    .map((f) => ({ file: join(dir, f), ...JSON.parse(readFileSync(join(dir, f), "utf8")) }));
}

/** The viewports a journey runs at: its own list, else the member file's. */
export function viewportsFor(member, journey) {
  return journey.viewports ?? member.viewports ?? ["phone", "desktop"];
}

/** A step may pin itself to one viewport (`"only": "desktop"`) — the docked-vs-folded checks. */
export function stepRunsAt(step, viewport) {
  return step.only === undefined || step.only === viewport;
}

/** One line a human reads in a test title or a ledger cell. */
export function describeExpect(e) {
  if (e.url) return `url ${e.url}`;
  if (e.text) return `${e.absent ? "no " : ""}text "${e.text}"`;
  if (e.testid) return `${e.absent ? "no " : ""}testid ${e.testid}`;
  const scope = e.within ? ` within ${e.within}` : "";
  const href = e.href ? ` → ${e.href}` : "";
  return `${e.absent ? "no " : ""}${e.role} "${e.name ?? ""}"${scope}${href}`;
}

/** Build the Playwright locator an expect (or an act target) names. */
export function locatorFor(page, e) {
  const root = e.within ? page.locator(e.within) : page;
  if (e.text) return root.getByText(e.text, { exact: e.exact === true });
  if (e.testid) return root.getByTestId(e.testid);
  return root.getByRole(e.role, e.name === undefined ? {} : { name: e.name, exact: e.exact });
}

/** Does the page satisfy one expect entry? Never throws; the caller decides what a miss means. */
export async function expectHolds(page, e, timeout = 4000) {
  if (e.url) return urlHolds(page, e.url);
  const target = locatorFor(page, e).first();
  if (e.absent) {
    try {
      await target.waitFor({ state: "visible", timeout: Math.min(timeout, 1500) });
      return { ok: false, detail: `${describeExpect(e)} — present` };
    } catch {
      return { ok: true, detail: describeExpect(e) };
    }
  }
  try {
    await target.waitFor({ state: "visible", timeout });
  } catch {
    return { ok: false, detail: `${describeExpect(e)} — not found` };
  }
  if (e.href) {
    const href = (await target.getAttribute("href")) ?? "";
    if (!href.startsWith(e.href)) {
      return { ok: false, detail: `${describeExpect(e)} — href is ${href}` };
    }
  }
  return { ok: true, detail: describeExpect(e) };
}

/** `{url}` compares the path exactly and requires each named query param; the rest may vary. */
function urlHolds(page, wanted) {
  const want = new URL(wanted, "http://x");
  const have = new URL(page.url());
  const pathOk = have.pathname === want.pathname;
  const queryOk = [...want.searchParams].every(([k, v]) => have.searchParams.get(k) === v);
  return {
    ok: pathOk && queryOk,
    detail:
      pathOk && queryOk ? `url ${wanted}` : `url ${wanted} — at ${have.pathname}${have.search}`,
  };
}

/** Perform a step's `act` — today only `{click: <locator spec>}`; performed AFTER the expects. */
export async function performAct(page, act) {
  if (!act) return;
  if (act.click) {
    await locatorFor(page, act.click).first().click();
    await page.waitForLoadState("domcontentloaded");
  }
}

/** The cookie the session fixtures sign in with — the crawl mints it, the spec adds it. */
export function sessionCookie(token, baseURL) {
  const { hostname } = new URL(baseURL);
  return { name: "skynet_session", value: token, domain: hostname, path: "/" };
}
