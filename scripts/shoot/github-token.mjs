// Visual harness for Settings → GitHub access, the owner's form for renewing the token Moneypenny
// files issues with — from the REAL built shell (app/dist) over a stub API. Phone first: the
// expired state at 390 (what Eric meets the day filing breaks), then the same at desktop width.
// Usage: npm run build --prefix app && npx tsx scripts/shoot/github-token.mjs [outdir]
import { openShell } from "./shell.mjs";

const settings = {
  authConfigured: true,
  adminWired: true,
  fleetSuspended: false,
  timezones: [],
  accounts: [
    { id: "human-eric", name: "eric", kind: "human", hostConfigured: true, profile: null },
  ],
};

const expired = {
  owner: true,
  secure: true,
  repo: "ejclark/skynet-capital",
  source: "host",
  expiresAt: "2026-10-22T15:00:00.000Z",
  working: false,
  problem: "GitHub doesn't accept that token — it's expired, revoked, or not copied whole.",
};

const { page, origin, shoot, close } = await openShell({
  name: "github-token",
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  stubs: {
    "/api/settings": settings,
    "/api/admin/invite": { owner: true, secure: true, entries: [] },
    "/api/admin/github-token": expired,
  },
});

await page.goto(`${origin}/app/settings?section=github`);
await page.getByRole("heading", { name: "🔑 GitHub access" }).waitFor();
await page.getByRole("heading", { name: "🔑 GitHub access" }).scrollIntoViewIfNeeded();
await shoot("github-token-expired-390");

await page.setViewportSize({ width: 1280, height: 900 });
await shoot("github-token-expired-desktop");

await close();
