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
  // A link with an `href` and no `name` means "some visible link goes there" — a hand-off whose
  // wording is the fix's to choose (#8005 slice 3). By role alone, `.first()` would be whichever
  // link comes first on the page, and only ITS href would be checked.
  if (e.role === "link" && e.href && e.name === undefined) {
    return root.locator(`a[href^=${JSON.stringify(e.href)}]:visible`);
  }
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

/** How long one action, or one `after` entry, may wait. Longer than an `expect`'s 4s: what an act
 *  starts (Moneypenny typing her answer, a route the click opens) is still arriving. */
export const ACT_TIMEOUT_MS = 8000;

/**
 * A step's `act` as a list. One action (the original shape, `{click}`) or several in order, so a
 * step can hold a hand-off a single click cannot: type to Moneypenny, wait for her line, follow
 * the link she gives (#8005 slice 3). Each step is still its own fresh page, so a conversation that
 * spans turns lives inside ONE step's actions, never across steps.
 */
export function actionsOf(act) {
  if (act === undefined) return [];
  return Array.isArray(act) ? act : [act];
}

/** One line a human reads in a failure: which action, aimed at what. */
export function describeAction(a) {
  if (a.click) return `click ${describeExpect(a.click)}`;
  if (a.fill) return `fill ${describeExpect(a.fill)} with "${a.value}"`;
  if (a.press) return `press ${a.key} in ${describeExpect(a.press)}`;
  if (a.await) return `await ${describeExpect(a.await)}`;
  return `unknown action ${JSON.stringify(a)}`;
}

/**
 * Perform a step's `act`, AFTER its expects. Four actions, each aimed with the expect grammar:
 * `{click}` · `{fill, value}` · `{press, key}` · `{await}` (wait until an expect entry holds — her
 * reply, a link, a heading — so the next action never races what the last one started). Throws on
 * the first action that cannot run, naming it; the spec fails the step, the crawl logs it.
 */
export async function performAct(page, act) {
  for (const a of actionsOf(act)) {
    try {
      await performOne(page, a);
    } catch (err) {
      throw new Error(`${describeAction(a)} — ${err instanceof Error ? err.message : err}`);
    }
  }
}

async function performOne(page, a) {
  const timeout = ACT_TIMEOUT_MS;
  if (a.click) {
    await locatorFor(page, a.click).first().click({ timeout });
    await page.waitForLoadState("domcontentloaded");
  } else if (a.fill) {
    await locatorFor(page, a.fill)
      .first()
      .fill(a.value ?? "", { timeout });
  } else if (a.press) {
    await locatorFor(page, a.press).first().press(a.key, { timeout });
  } else if (a.await) {
    const held = await expectHolds(page, a.await, timeout);
    if (!held.ok) throw new Error(held.detail);
  } else {
    throw new Error("not one of click · fill · press · await");
  }
}

/** A step's `after` entries — expects checked after its act, so a hand-off is judged where it
 *  LANDS (the URL that kept its keys, the line she answered with), not only by the link before.
 *  Named `after`, not `then`: an object with a `then` key reads as a promise (biome's
 *  noThenProperty), and these steps are plain objects passed through async code. */
export async function afterMisses(page, step) {
  const misses = [];
  for (const e of step.after ?? []) {
    const r = await expectHolds(page, e, ACT_TIMEOUT_MS);
    if (!r.ok) misses.push(`after ${r.detail}`);
  }
  return misses;
}

/** Enough to render a route; a page holding an SSE open never idles, so idle is best-effort.
 *  Shared by `phone-one.mjs` and the study's parity check (`scripts/study/parity.mjs`). */
export async function settle(page) {
  await page.waitForLoadState("load");
  await page.waitForLoadState("networkidle", { timeout: 1500 }).catch(() => {
    /* a held-open stream — the short wait below is the fallback */
  });
  await page.waitForTimeout(300);
}

/** The cookie the session fixtures sign in with — the crawl mints it, the spec adds it. */
export function sessionCookie(token, baseURL) {
  const { hostname } = new URL(baseURL);
  return { name: "skynet_session", value: token, domain: hostname, path: "/" };
}
