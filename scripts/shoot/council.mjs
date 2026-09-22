// Visual harness for The Council section on /app/activity (issue #2224 shape 1) — from the REAL
// built shell (app/dist) over a stub API. One frame: the composer plus a few weekly theses.
// Usage: npm run build --prefix app && npm run shoot:council [outdir]
import { openShell } from "./shell.mjs";

const wire = {
  wire: {
    trades: [],
    pnl: [],
    feedbackEnabled: true,
    feedback: [],
  },
};

const council = {
  enabled: true,
  week: "2026-W37",
  entries: [
    {
      id: "a1b2c3d4e5",
      text: "NVDA runs into the print, because the options desk is skewed call-heavy.",
      at: "2026-09-09T10:00:00.000Z",
    },
    {
      id: "f6g7h8i9j0",
      text: "Staying flat on GOOG — the antitrust ruling risk isn't priced in yet.",
      at: "2026-09-09T09:00:00.000Z",
    },
  ],
  mine: {
    id: "a1b2c3d4e5",
    text: "NVDA runs into the print, because the options desk is skewed call-heavy.",
    at: "2026-09-09T10:00:00.000Z",
  },
};

const { page, origin, shoot, close } = await openShell({
  name: "council",
  viewport: { width: 1280, height: 800 },
  stubs: {
    "/api/wire": wire,
    "/api/council": council,
  },
});

await page.goto(`${origin}/app/activity?section=council`);
await page.getByRole("heading", { name: "The Council" }).waitFor();
await shoot("activity-council-section");

await close();
