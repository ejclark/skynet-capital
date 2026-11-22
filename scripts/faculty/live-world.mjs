// A LIVE study world (#change-scenarios) — the recorder (scripts/study/session.mjs) opened on a
// REAL running server instead of a composed one, so a simulated member's writes land.
//
// WHY A THIRD WORLD KIND: a composed world (world-route.mjs) answers every `/api` read from frozen
// payloads and records writes "never sent and never applied" — right for a study of reading, and
// blind by construction to the one question a change study asks: did the order the member meant
// to place land, at the side, size and price they meant? The faculty world
// (scripts/faculty/world.mjs) is a whole offline server whose paper account applies writes, so a
// live world is just a browser signed in to it: same instrumentation, same off-origin guard, same
// frames, and every write passes THROUGH (still listed in the world log, so a run names each one).
//
// The handle has the shape `openComposed` returns (session-world.mjs), so the recorder, the census
// and the actor loop take it unchanged:  { page, origin, close, log, signIn }.

import { chromium } from "playwright-core";
import { resolveChromium } from "../shoot/lib.mjs";

/**
 * @param {{ origin: string, cookie: string, clock?: {timeZone: string, locale: string} }} world
 * @param {{ viewport: {width: number, height: number}, hasTouch: boolean }} vp
 */
export async function openLive(world, vp) {
  const exe = resolveChromium();
  const browser = await chromium.launch({
    ...(exe ? { executablePath: exe } : {}),
    args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const context = await browser.newContext({
    viewport: vp.viewport,
    hasTouch: vp.hasTouch,
    isMobile: vp.hasTouch,
    colorScheme: "dark",
    timezoneId: world.clock?.timeZone ?? "America/Chicago",
    locale: world.clock?.locale ?? "en-US",
  });
  const cookie = {
    name: "skynet_session",
    value: world.cookie,
    url: world.origin,
    httpOnly: true,
    sameSite: "Lax",
  };
  await context.addCookies([cookie]);
  const log = { writes: [], unstubbed: [], offsite: [] };
  // Observe, never answer: each write is listed and continues to the real server.
  await context.route("**/*", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (
      url.origin === world.origin &&
      url.pathname.startsWith("/api/") &&
      request.method() !== "GET"
    ) {
      log.writes.push({
        method: request.method(),
        url: url.pathname + url.search,
        body: request.postData() ?? null,
      });
    }
    return route.fallback();
  });
  const page = await context.newPage();
  return {
    page,
    origin: world.origin,
    log,
    signIn: () => context.addCookies([cookie]),
    close: () => browser.close(),
  };
}
