// A study world's browser floor (#4943 slice 2) — the real built shell, every `/api` answer a
// function of the FULL request, and nothing able to leave the machine: every request off the
// local origin (a tapped external link, a popup, a font CDN) is aborted and listed (`offsite`). Area-agnostic: a world
// (scripts/study/worlds/*) hands in its answers; this file never names a surface.
//
// WHY NOT `scripts/shoot/shell.mjs` AS IT STANDS (it is the model, and its static half is reused
// verbatim in spirit — the PRODUCTION `serveAppShell`, never a hand-rolled copy):
//  - Its stubs see the pathname only (`stubBody`), so `?playbook=` or `?symbol=` cannot pick a
//    different answer. A study member filters, so the world must answer the filter.
//  - It never answers `/events`; the header then says "connecting…" forever, which a simulated
//    member would honestly report as a broken app. Here the local server answers `/events` with
//    the server's REAL board stream (`streamBoardPatches`) over a channel that never publishes —
//    its `hello` says the head is 0, the composed board's own `seq` — and every other event-stream
//    request (a desk's order lifecycle, a quote feed) with an empty stream it holds OPEN. The shell
//    sees a live, quiet feed.
//  - Writes are recorded, never sent and never applied: a study must not mutate its own world
//    mid-task (the next frame would no longer be the composed world), and nothing may reach a
//    broker. Each one is answered with a benign stub so the page's own success path runs.
//  - An `/api` call no answer covers is FLAGGED per session ('unstubbed') and answered 404, never
//    a silent `{}`: a stub artifact must surface as a world defect, not as a member's finding.
//
// The clock is pinned in the page too (`page.clock.setFixedTime`, as scripts/crawl/phone-one.mjs
// does), and the page's zone and language are the member's (`clock`, ./clock.mjs — default the
// owner's), so the browser's "now" reads the same instant on any machine and every time the page
// formats itself reads as it would on that member's own screen (#5009). The 3D landmark renders
// when its bundle is built (`npm run build:scene`), as in shell.mjs.

import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { join, resolve } from "node:path";
import { chromium } from "playwright-core";
import { parseLeaderMetric } from "../../src/observatory/standings-metric.ts";
import { isAppShellPath, serveAppShell } from "../../src/server/app-shell-routes.ts";
import { clearSessionCookie, sessionTokenFromCookies } from "../../src/server/auth/session.ts";
import { createBoardChannel, streamBoardPatches } from "../../src/server/board-patch-routes.ts";
import { gateRequest } from "../../src/server/dashboard-auth-gate.ts";
import { resolveChromium, shooter } from "../shoot/lib.mjs";
import { DEFAULT_CLOCK } from "./clock.mjs";
import { routeRequest, wantsEventStream } from "./routing.mjs";
import { SIGNED_OUT_PAGE } from "./signed-out.mjs";

const SCENE = { "/tower": "src/three/scene.html", "/three/scene.js": "public/three/scene.js" };

/** The session cookie every world context starts with: the member is signed in. Its value is
 *  never verified — the world answers `/api` per viewer itself — only its presence is the gate. */
const SESSION_COOKIE = {
  name: "skynet_session",
  value: "study-world",
  httpOnly: true,
  sameSite: "Lax",
};

/** True while the request still carries the world's session cookie (not cleared by Sign out). */
const signedIn = (cookieHeader) => Boolean(sessionTokenFromCookies(cookieHeader));

/**
 * The server's REAL auth gate (`gateRequest`) in front of every page and stream, as production's
 * `dashboard-server.ts` puts it: `/logout` is its 302 to `/login` with the real cleared cookie,
 * and once the cookie is gone every gated path answers 302 `/login` (a stream 401) — so Back or
 * any `/app` link after Sign out lands where production's does. `/login` is the one declared
 * page (signed-out.mjs, shell-artifacts.mjs).
 */
const WORLD_AUTH = {
  loginPage: () => SIGNED_OUT_PAGE,
  clearCookie: clearSessionCookie,
  handleAuthRoute: async () => false,
  sessionFrom: (req) =>
    signedIn(req.headers.cookie) ? { email: "", provider: "google" } : undefined,
};

/** The static half: the production shell handler, plus held-open empty event streams. A path
 *  neither serves is flagged in `session.unstubbed` (`PAGE <path>`) like an uncomposed read. */
function startServer(dist, streams, session) {
  const channel = createBoardChannel();
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const path = url.pathname;
    // The landmark portrait embeds the real `/tower` scene, served as shell.mjs serves it — when
    // its bundle is built (`npm run build:scene`); unbuilt, `/three/scene.js` is flagged below.
    // Public, as production's `servePublicRoute` serves it ahead of the gate.
    const scene = SCENE[path];
    if (scene && existsSync(scene)) {
      const type = path.endsWith(".js") ? "application/javascript" : "text/html; charset=utf-8";
      res.writeHead(200, { "content-type": type });
      return res.end(readFileSync(scene));
    }
    const gate = await gateRequest(req, res, path, req.url ?? path, { auth: WORLD_AUTH });
    if (gate.handled) return;
    if (path === "/events") {
      streams.add(res);
      req.on("close", () => streams.delete(res));
      return streamBoardPatches(
        req,
        res,
        channel,
        parseLeaderMetric(url.searchParams.get("by")),
        {},
      );
    }
    if (wantsEventStream(path, req.headers.accept)) {
      res.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-store",
        connection: "keep-alive",
      });
      // One comment frame so the browser's EventSource fires `open`; then nothing, ever.
      res.write(": world stream open\n\n");
      streams.add(res);
      req.on("close", () => streams.delete(res));
      return;
    }
    if (isAppShellPath(path)) return serveAppShell(res, path, { distDir: dist });
    // The front door (`dashboard-server.ts` serveHomePage): a bare visit lands in the shell.
    if (path === "/" || path === "/index.html") {
      res.writeHead(302, { location: `/app/${url.search}` });
      res.end();
      return;
    }
    // Production's own 404 (`dashboard-server.ts` serveAuthorizedRoute), flagged as a world hole.
    session.unstubbed.push(`PAGE ${path}`);
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok(server)));
}

/**
 * Open the built shell inside one world.
 *
 * @param {object} opts
 * @param {Parameters<typeof routeRequest>[1]} opts.answer  see `routeRequest` (routing.mjs)
 * @param {string} opts.at              the world's pinned instant (ISO), also the page's clock
 * @param {{viewport: {width: number, height: number}, hasTouch: boolean}} opts.frame  a VIEWPORTS entry
 * @param {string} [opts.out]           where `shoot(tag)` writes frames
 * @param {{timeZone: string, locale: string}} [opts.clock]  the member's clock (./clock.mjs)
 * @returns {Promise<{page, origin, shoot,
 *                    session: {unstubbed: string[], writes: object[], offsite: string[]},
 *                    reframe: (frame) => Promise<void>, signIn: () => Promise<void>,
 *                    close: () => Promise<void>}>}
 */
export async function openWorld({
  answer,
  at,
  frame,
  out = ".",
  colorScheme = "dark",
  clock = DEFAULT_CLOCK,
}) {
  const dist = resolve("app/dist");
  if (!existsSync(join(dist, "index.html"))) {
    throw new Error("study world: app/dist missing — run `npm run build --prefix app` first");
  }
  const streams = new Set();
  const session = { unstubbed: [], writes: [], offsite: [] };
  const server = await startServer(dist, streams, session);
  const origin = `http://127.0.0.1:${server.address().port}`;
  const exe = resolveChromium();
  const browser = await chromium.launch({
    ...(exe ? { executablePath: exe } : {}),
    args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
  });
  let context;
  let page;

  async function reframe(next) {
    if (context) await context.close();
    context = await browser.newContext({
      ...next,
      colorScheme,
      timezoneId: clock.timeZone,
      locale: clock.locale,
    });
    await context.addCookies([{ ...SESSION_COOKIE, url: origin }]);
    page = await context.newPage();
    await page.clock.setFixedTime(new Date(at));
    // Every request of every page in the context — popups included — passes here: anything off
    // the local origin is aborted and recorded, `/api` is answered by the world, the rest is the
    // local shell server.
    await context.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin !== origin) {
        session.offsite.push(`${request.method()} ${url.origin}${url.pathname}`);
        return route.abort("blockedbyclient");
      }
      if (!url.pathname.startsWith("/api/")) return route.continue();
      // The gate stands in front of `/api` too: signed out, every read and write is its 302.
      if (!signedIn(await request.headerValue("cookie"))) {
        return route.fulfill({ status: 302, headers: { location: "/login" } });
      }
      const decided = routeRequest(
        { method: request.method(), url, accept: request.headers().accept },
        answer,
      );
      if (decided.kind === "stream") return route.continue();
      if (decided.kind === "write") {
        session.writes.push({
          method: request.method(),
          url: url.pathname + url.search,
          body: request.postData() ?? null,
        });
        return route.fulfill({ status: decided.status, json: decided.body });
      }
      if (decided.kind === "unstubbed") {
        session.unstubbed.push(`${request.method()} ${url.pathname}${url.search}`);
        return route.fulfill({ status: 404, json: { error: "unstubbed in this study world" } });
      }
      return route.fulfill({ status: decided.status, json: decided.body });
    });
    handle.page = page;
    handle.shoot = shooter(page, out);
  }

  const handle = {
    page: undefined,
    origin,
    session,
    shoot: undefined,
    reframe,
    // The member is signed in again after a harness-made fresh start (session-fresh.mjs clears
    // cookies with the rest of the origin's state). Without it every census load after the first
    // was signed out, and the first full round operated 0 of 856 controls (2026-10-09).
    signIn: () => context.addCookies([{ ...SESSION_COOKIE, url: origin }]),
    close: async () => {
      for (const res of streams) res.end();
      await browser.close();
      server.close();
    },
  };
  await reframe(frame);
  return handle;
}
