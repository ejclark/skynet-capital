// Visual harness for the any-account page (`/app/u/:id`, #3807 slice 2d) — its own head, the
// character card, and the ownership gate, photographed as ANOTHER member would see them.
//
// The openShell pattern (scripts/shoot/shell.mjs): the REAL built shell served by the production
// handler, stubs in the browser. The one difference: the page's reads (the account, its activity,
// its heartbeat, the league) come from the real offline dashboard over the committed fixtures —
// frozen, the crawl's own boot (scripts/crawl/server.mjs) — instead of a hand-written copy, so the
// frame shows what the offline app shows. Only `/api/settings` is stubbed: a signed-in member who
// owns one human account of their own, never `sauron` or `human-eric`, so both pages render
// their "not yours" state — no Close, no New trade, one plain line beside the blotter.
//
// Phone first (390, docs/PICTURES.md), then desktop (1280). JPEG under the ~100KB commit ceiling.
// Usage: npm run build --prefix app && npx tsx scripts/shoot/desk.mjs [outdir]
import { bootServer } from "../crawl/server.mjs";
import { openShell } from "./shell.mjs";

const viewer = {
  authConfigured: true,
  adminWired: false,
  fleetSuspended: false,
  timezones: [],
  accounts: [
    { id: "human-guest", name: "guest", kind: "human", hostConfigured: false, profile: null },
  ],
};

const api = await bootServer({ mode: "open", port: 8797, bridgePort: 8798 });
const pages = [
  ["sauron", "/app/u/sauron"],
  ["human-eric", "/app/u/human-eric"],
];

try {
  for (const [tag, viewport, quality] of [
    ["phone", { width: 390, height: 1500 }, 60],
    ["desktop", { width: 1280, height: 1100 }, 56],
  ]) {
    const shell = await openShell({ name: "any-account-page", viewport, quality });
    const { page, origin, shoot } = shell;
    // Registered after openShell's stub route, so it wins: settings is the stub, every other read
    // is the offline dashboard's own answer.
    await page.route("**/api/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === "/api/settings") return route.fulfill({ json: viewer });
      const res = await route.fetch({ url: `${api.origin}${url.pathname}${url.search}` });
      return route.fulfill({ response: res });
    });
    for (const [name, path] of pages) {
      await page.goto(`${origin}${path}`);
      await page.locator(".acct-head h1").waitFor();
      await page.getByText("You can trade only your own accounts").waitFor();
      await page.waitForTimeout(600);
      console.log(await shoot(`${name}-${tag}`));
    }
    await shell.close();
  }
} finally {
  await api.close();
}
