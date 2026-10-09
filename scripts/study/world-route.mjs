// A study world's browser floor (#4943 slice 2) — the real built shell, every `/api` answer a
// function of the FULL request, and nothing able to leave the machine. Area-agnostic: a world
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
// does), and the timezone is New York's, so server-composed timestamps, the browser's "now" and
// every rendered time read the same instant on any machine. The 3D landmark renders when its
// bundle is built (`npm run build:scene`), as in shell.mjs.

import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { join, resolve } from "node:path";
import { chromium } from "playwright-core";
import { parseLeaderMetric } from "../../src/observatory/standings-metric.ts";
import { isAppShellPath, serveAppShell } from "../../src/server/app-shell-routes.ts";
import { createBoardChannel, streamBoardPatches } from "../../src/server/board-patch-routes.ts";
import { resolveChromium, shooter } from "../shoot/lib.mjs";
import { routeRequest, wantsEventStream } from "./routing.mjs";

const SCENE = { "/tower": "src/three/scene.html", "/three/scene.js": "public/three/scene.js" };

/** The static half: the production shell handler, plus held-open empty event streams. */
function startServer(dist, streams) {
  const channel = createBoardChannel();
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const path = url.pathname;
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
    // The landmark portrait embeds the real `/tower` scene, served as shell.mjs serves it — when
    // its bundle is built (`npm run build:scene`); otherwise the frame stays the night background.
    const scene = SCENE[path];
    if (scene && existsSync(scene)) {
      const type = path.endsWith(".js") ? "application/javascript" : "text/html; charset=utf-8";
      res.writeHead(200, { "content-type": type });
      return res.end(readFileSync(scene));
    }
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("not the shell");
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
 * @returns {Promise<{page, origin, shoot, session: {unstubbed: string[], writes: object[]},
 *                    reframe: (frame) => Promise<void>, close: () => Promise<void>}>}
 */
export async function openWorld({
  answer,
  at,
  frame,
  out = ".",
  colorScheme = "dark",
  timezoneId = "America/New_York",
}) {
  const dist = resolve("app/dist");
  if (!existsSync(join(dist, "index.html"))) {
    throw new Error("study world: app/dist missing — run `npm run build --prefix app` first");
  }
  const streams = new Set();
  const server = await startServer(dist, streams);
  const origin = `http://127.0.0.1:${server.address().port}`;
  const exe = resolveChromium();
  const browser = await chromium.launch({
    ...(exe ? { executablePath: exe } : {}),
    args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const session = { unstubbed: [], writes: [] };
  let context;
  let page;

  async function reframe(next) {
    if (context) await context.close();
    context = await browser.newContext({ ...next, colorScheme, timezoneId, locale: "en-US" });
    page = await context.newPage();
    await page.clock.setFixedTime(new Date(at));
    await page.route("**/api/**", (route) => {
      const request = route.request();
      const url = new URL(request.url());
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
    close: async () => {
      for (const res of streams) res.end();
      await browser.close();
      server.close();
    },
  };
  await reframe(frame);
  return handle;
}
