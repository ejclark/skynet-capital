// Holds a shoot still, so a pixel diff measures the css and not when the screenshot landed in a fade.
//
// WHY. Two runs of one clean build of `shoot:playbook-store` differed in 51 of 64 frames, some in over
// 80% of their pixels (#6546), so "the swap changed no pixels" could never pass, and any screenshot
// baseline is noisier than it looks. Reduced motion, finished animations, a hidden caret and lossless
// PNGs took that to 5 of 64. This wraps Playwright rather than editing each shoot script, because
// every script already runs through `chromium.launch` and a picture for a PR still wants the JPEG.
// Measured with this preload on one clean build (2026-11-01): `trade` moves 5 of 83 frames between two
// passes, `accounts` 7 to 9 of 34, `desk` 4 of 6, nearly all by under 350 pixels. So it narrows the
// noise and does not end it, which is why `shoot:diff` takes baselines.
//
// TWO THINGS A PLAIN SHOOT GETS WRONG FOR A DIFF. Scripts send some shots straight into docs/shots/, so
// a run rewrites committed pictures and scatters a pass across folders: `into` sends every shot to one
// folder, by basename. And fixtures hold real dates with the page on the real clock, so a shoot can
// stop working when the calendar passes them (`shoot:trade` from 2026-10-30): `clock` pins the page's
// date to the one the fixtures were written for.
//
// A script's own `shot <path>` line still prints where it asked for the file, not the out folder.
// Not reached: a locator's own `.screenshot()`, which `accounts`, `heartbeat-roll-call` and
// `mermaid-pairs` use. Lives apart from the preload so a spec can drive it with a fake browser. A
// file keeps its `.jpg` name and holds a PNG, since the name is what lines two passes up.

import { basename, join } from "node:path";

/** The selectors an optional coverage list names that match something on this page. A rule with no
 *  match in any frame is not covered by a clean diff, so a swap's reader needs the count. */
function matchingSelectors(selectors) {
  const hit = (selector) => {
    try {
      // A pseudo-class like :hover or a pseudo-element can't match at rest: test the base.
      const base = selector.replace(/::?[a-z-]+(\([^)]*\))?/g, "") || "*";
      return document.querySelector(base) !== null;
    } catch {
      return false;
    }
  };
  return selectors.filter(hit);
}

/** Lets the page finish before the shot. Most of what moved between clean passes was a desktop frame
 *  taken right after a resize or a fetch, not a fade. A page with a live stream never goes idle, so
 *  that wait is bounded and a timeout is not a failure. */
async function settle(page) {
  const givenUp = () => null;
  await page.waitForLoadState("networkidle", { timeout: 2000 }).catch(givenUp);
  // Raced, and a throw is no failure: a page navigating right now loses this context, and a shoot that
  // works plain must not crash under the preload. A paused page clock would stall the frames for good.
  const frames = page.evaluate(() =>
    document.fonts.ready.then(
      () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
    ),
  );
  await Promise.race([frames, new Promise((done) => setTimeout(done, 2000))]).catch(givenUp);
}

/**
 * Wraps `chromium.launch` so every page it opens is still.
 *
 * @param chromium Playwright's chromium, changed in place: the scripts hold this same object.
 * @param {{ into?: string, clock?: string, selectors?: string[], onSeen?: (matched: string[], frame?: string) => void }} [options]
 *   `into` the one folder for this pass's shots, `clock` the time the page reads, `selectors` and
 *   `onSeen` a coverage list asked at each shot.
 */
export function steady(chromium, { into, clock, selectors = [], onSeen } = {}) {
  const taken = new Map();
  /** One folder, and the same name on every pass: a basename used twice gets `-2`, in shot order. */
  const destination = (path) => {
    if (!(into && path)) return path;
    const name = basename(path);
    const count = (taken.get(name) ?? 0) + 1;
    taken.set(name, count);
    return join(into, count === 1 ? name : name.replace(/(\.\w+)$/, `-${count}$1`));
  };
  // Playwright's browser.newPage opens its page through browser.newContext, so one page comes through
  // here twice, and a second wrap would count its shot twice.
  const held = new WeakSet();
  const stillPage = async (page) => {
    if (held.has(page)) return page;
    held.add(page);
    if (clock) await page.clock.setFixedTime(new Date(clock));
    const screenshot = page.screenshot.bind(page);
    page.screenshot = async ({ quality: _lossy, path, ...shot } = {}) => {
      await settle(page);
      const target = path && destination(path);
      if (onSeen)
        onSeen(await page.evaluate(matchingSelectors, selectors), target && basename(target));
      const still = { ...shot, type: "png", animations: "disabled", caret: "hide" };
      return screenshot(target ? { ...still, path: target } : still);
    };
    return page;
  };
  const launch = chromium.launch.bind(chromium);
  chromium.launch = async (options) => {
    const browser = await launch(options);
    const newPage = browser.newPage.bind(browser);
    browser.newPage = async (pageOptions = {}) =>
      stillPage(await newPage({ ...pageOptions, reducedMotion: "reduce" }));
    const newContext = browser.newContext.bind(browser);
    browser.newContext = async (contextOptions = {}) => {
      const context = await newContext({ ...contextOptions, reducedMotion: "reduce" });
      const contextPage = context.newPage.bind(context);
      context.newPage = async () => stillPage(await contextPage());
      return context;
    };
    return browser;
  };
  return chromium;
}
