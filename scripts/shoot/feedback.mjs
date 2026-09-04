// Visual harness for /app/feedback — a member's own filings ledger, from the REAL built shell over
// a stub API. Two frames, because the surface's whole behaviour is the difference between them:
//   · active — the default view, shipped filings hidden (#1308)
//   · all    — the toggle flipped, shipped filings revealed with 🚀 and the version stamp (#1312)
//
// This is the harness's first use (#1327): #1308 and #1312 both waived their fridge picture with
// "no authed /feedback shoot script exists for this repo", which is the cost the consolidation was
// filed to remove. The script is fixtures and frames; everything else is scripts/shoot/shell.mjs.
// JPEG ≤100KB (docs/PICTURES.md).
// Usage: npm run build --prefix app && npm run shoot:feedback [outdir]
import { openShell } from "./shell.mjs";

const filing = (issueNumber, title, kind, filedAt, status) => ({
  issueNumber,
  title,
  kind,
  filedAt,
  url: `https://github.com/ejclark/skynet-capital/issues/${issueNumber}`,
  status,
});

// A ledger with one filing in each state the badge row can show — the mix is the point: two still
// moving, one waiting on the member, one with Eric, and two already shipped (hidden by default).
const feedback = {
  enabled: true,
  coachEnabled: true,
  followupEnabled: true,
  appVersion: "1.129.0",
  feedbackCount: 6,
  celebrating: [],
  recent: [
    filing(
      1204,
      "The desk's day P/L should say whether it's realized",
      "idea",
      "2026-09-03",
      "open",
    ),
    filing(
      1188,
      "Standings sorts by equity — I want return",
      "feature",
      "2026-09-02",
      "next-slice",
    ),
    filing(1171, "Milestone card cut off on my phone", "bug", "2026-09-01", "needs-info"),
    filing(1150, "Let me name my own bot personas", "feature", "2026-08-31", "needs-eric"),
    filing(1122, "Hide filings I've already seen ship", "idea", "2026-08-29", "shipped"),
    filing(1098, "Show which release my fix went out in", "idea", "2026-08-28", "shipped"),
  ],
};

const { page, origin, shoot, close } = await openShell({
  name: "feedback",
  // 1000px tall so the "all" frame fits BOTH shipped rows with their version stamps — at the
  // harness default of 900 the second one is clipped, which is the half of the story #1312 built.
  viewport: { width: 1280, height: 1000 },
  stubs: { "/api/feedback": feedback, "/api/settings": {}, "/api/learn": {} },
});

await page.goto(`${origin}/app/feedback`);
await page.getByText("Your recent feedback").waitFor();
await shoot("feedback-active");

await page.getByRole("button", { name: "All" }).click();
await page.getByText("confirmed live in v1.129.0").first().waitFor();
await shoot("feedback-all");

await close();
