// Visual harness for Standings — the merged Board + Leaderboard + Bots vs Humans page — rendered
// from a realistic mixed fixture and screenshot with Chromium, so the surface can be judged by eye
// (CLAUDE.md: every choice becomes something Eric can see) without standing up a server.
// Usage: npm run shoot:standings [outdir]
import { sampleDashboardData } from "../../src/observatory/sample-dashboard-data.ts";
import { renderStandingsBody } from "../../src/observatory/standings-view.ts";
import { shellDocument } from "../../src/server/page-shell.ts";
import { shootHtml } from "./lib.mjs";

const nav = { active: "board", canAdd: true, authed: true };
const data = sampleDashboardData();

const frame = (tag, options) => ({
  tag,
  html: shellDocument(`${tag} — shoot`, renderStandingsBody(data, { nav, ...options })),
});

await shootHtml({
  name: "standings",
  viewport: { width: 1360, height: 1400 },
  pages: [
    frame("standings-equity", {}),
    frame("standings-return", { metric: "return" }),
    frame("standings-cmp-armed", { aId: "eric" }),
    frame("standings-cmp-pair", { aId: "eric", bId: "news-fader" }),
  ],
});
