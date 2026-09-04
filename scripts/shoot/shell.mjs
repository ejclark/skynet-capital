// The app-shell screenshot harness (#1327) — one browser, one static server, stubbed APIs, for any
// `/app/*` surface.
//
// WHY THIS SHAPE (the call sheet on #1327, candidate A):
//  - **The static server is the PRODUCTION handler.** `serveAppShell` is what actually serves `/app`
//    in the deployed app; the three scripts that hand-rolled a 20-line copy of it had already
//    drifted (their content-type tables were each missing `.jpg`/`.ico`/`.map`). Importing the real
//    one means a shoot can never disagree with production about what the shell is. The cost is that
//    this module imports a `.ts` file, so its callers run under `tsx` — two scripts already did.
//  - **Stubs live in the BROWSER, not the server** (`page.route`). Fixtures then read as data a
//    script hands in, not as a request handler it has to write. Every fetch the shell makes today is
//    `/api/*`, so this covers all of them. The limit is real and worth knowing: anything that isn't
//    a request the page itself makes — a server redirect, a `Set-Cookie` gate, SSE event frames —
//    cannot be faked this way, and a surface needing one would have to serve it for real.
//  - **`/events` is held open, never answered.** The shell opens an `EventSource` on boot; the
//    hand-rolled servers returned without responding, so the header renders its "connecting…" state.
//    Answering it would change every existing frame, so the behaviour is preserved exactly.

import { existsSync } from "node:fs";
import { createServer } from "node:http";
import { join, resolve } from "node:path";
import { chromium } from "playwright-core";
import { isAppShellPath, serveAppShell } from "../../src/server/app-shell-routes.ts";
import { outputDir, resolveChromium, shooter, stubBody } from "./lib.mjs";

/**
 * Open the real built shell over stub APIs and hand back a page ready to photograph.
 *
 * @param {object} opts
 * @param {string} opts.name    the surface, used in the dist-missing message and the output dir
 * @param {Record<string, unknown | ((path: string) => unknown)>} [opts.stubs]  pathname → JSON body
 * @returns {Promise<{page: import("playwright-core").Page, origin: string, out: string,
 *                    shoot: (tag: string) => Promise<string>, close: () => Promise<void>}>}
 */
export async function openShell({
  name,
  stubs = {},
  viewport = { width: 1280, height: 900 },
  colorScheme = "dark",
  quality = 62,
  out = outputDir(name),
}) {
  const dist = resolve("app/dist");
  if (!existsSync(join(dist, "index.html"))) {
    console.error(`shoot/${name}: app/dist missing — run \`npm run build --prefix app\` first`);
    process.exit(1);
  }

  const server = createServer((req, res) => {
    const path = new URL(req.url ?? "/", "http://127.0.0.1").pathname;
    if (isAppShellPath(path)) return serveAppShell(res, path, { distDir: dist });
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("not the shell");
  });
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  const origin = `http://127.0.0.1:${server.address().port}`;

  const exe = resolveChromium();
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage({ viewport, colorScheme });
  await page.route("**/events*", () => {
    // Deliberately empty: never answered, never aborted. The shell's EventSource stays pending and
    // the header renders "connecting…", exactly as the hand-rolled servers left it.
  });
  await page.route("**/api/**", (route) =>
    route.fulfill({ json: stubBody(stubs, new URL(route.request().url()).pathname) }),
  );

  return {
    page,
    origin,
    out,
    shoot: shooter(page, out, { quality }),
    close: async () => {
      await browser.close();
      server.close();
    },
  };
}
