// One touch point built through the real model (decisionsFrom → fitBudget, designDecisions), so the
// steer specs exercise the same shaping gather.mjs does — only the GitHub reads are replaced.
import { designDecisions } from "../../scripts/steer/design.mjs";
import { decisionsFrom, fitBudget } from "../../scripts/steer/model.mjs";
import type { TouchPointData } from "../../scripts/steer/render.mjs";

export const ROUND = "2026-10-10-pm";
export const NOW = "2026-10-10T21:30:00Z";

const issue = (number: number, labels: string[], created = "2026-10-01T12:00:00Z") => ({
  number,
  title: `issue ${number}`,
  labels: labels.map((name) => ({ name })),
  created_at: created,
});

const DESIGN = designDecisions(
  [
    {
      q: 1,
      topic: "guidance",
      title: "Where does a position's guidance live?",
      ask: "Today the guidance sits apart from the positions.",
      rec: "A",
      conf: "medium",
      wrong: "Trade-tab opens still match row opens by 2026-11-15.",
      saw: ["8 member trips to Guidance, none found it."],
      today: {
        phone: "img/q1/today-phone.jpg",
        desk: "img/q1/today-desk.jpg",
        source: "frames/107.jpg",
        caption: "Rows carry no advice.",
      },
      options: [
        {
          key: "A",
          name: "Guidance opens under its row",
          phone: "img/q1/a.jpg",
          delta: "Advice opens under the row.",
        },
        {
          key: "B",
          name: "A sheet from the row",
          phone: "img/q1/b.jpg",
          delta: "A panel slides up.",
        },
        { key: "C", name: "A page per position", phone: "img/q1/c.jpg", delta: "Its own page." },
      ],
    },
    {
      q: 2,
      title: "Which columns show beside the tower?",
      options: [{ key: "A", name: "Ranked columns" }],
    },
  ],
  { issue: 5037, round: 2, at: (p) => `/fixture/${p}` },
);

export function fixture(over: Partial<TouchPointData> = {}): TouchPointData {
  const all = decisionsFrom({
    needsYou: [
      {
        number: 5037,
        title: "Pick the profile shapes",
        criterion: 1,
        why: "w",
        decision: "Pick round 2's shapes",
      },
      { number: 2224, title: "Member text", criterion: 1, why: "w", decision: "Pick shape 4 or 5" },
      {
        number: 4100,
        title: "Cheaper Council replies",
        criterion: 1,
        why: "w",
        decision: "Take replies on a Council line (default: replies on a Council line)",
      },
      {
        number: 4200,
        title: "Night chain plan",
        criterion: 1,
        why: "w",
        decision: "Ready this plan? (default: take slice 1 as written)",
      },
      {
        number: 4300,
        title: "chore(platter): protected paths",
        criterion: 4,
        why: "held PR unmerged 30h (≥12h)",
        decision: "Merge this held PR, or say what it's waiting on",
      },
    ],
    issues: [
      issue(5037, ["needs-eric", "enhancement"], "2026-10-09T12:00:00Z"),
      issue(2224, ["needs-eric"], "2026-09-09T12:00:00Z"),
      issue(4100, ["needs-eric", "feedback"]),
      issue(4200, ["needs-eric", "plan"]),
    ],
    prs: [{ ...issue(4300, ["hold-merge"]), head: { ref: "platter/2026-10-09" } }],
    design: { 5037: DESIGN },
    now: NOW,
  });
  const { shown, deferred, used, minutes } = fitBudget(all, 60);
  return {
    version: 1,
    id: ROUND,
    date: "2026-10-10",
    slot: "pm",
    next: { label: "8am", hours: 11 },
    budget: { minutes, used, shown: shown.length, deferred: deferred.length },
    decisions: shown,
    deferred,
    unstated: { count: 1, numbers: [4612] },
    reel: {
      since: "2026-10-10T13:00:00Z",
      merged: 3,
      research: 1,
      builds: 1,
      headlines: [
        {
          number: 5054,
          subject: "fix(profile): closed-trade squares get a 44px tap target (#5046)",
          shots: [
            {
              path: "docs/shots/pr-5054/strip.jpg",
              url: "https://raw.githubusercontent.com/x/y/abc/docs/shots/pr-5054/strip.jpg",
              local: "img/reel/pr-5054-strip.jpg",
            },
          ],
          because: "make the squares easier to hit",
        },
        {
          number: 5049,
          subject: "feat(profile): today on the phone card",
          shots: [],
          because: null,
        },
      ],
      more: { total: 0, byKind: {} },
    },
    queue: {
      position: "normal",
      halt: false,
      inFlightCap: 3,
      dialLink: "https://github.com/ejclark/skynet-capital/issues/4153",
      nextPick: { number: 4437, admit: true, reason: "admitted" },
      items: [
        {
          number: 4437,
          title: "Ship the thing",
          cls: "P2",
          why: "improves a surface or a process",
        },
        {
          number: 4241,
          title: "Put an ember on calendar days",
          cls: null,
          why: "ready; not in the rank",
        },
      ],
    },
    strip: {
      days: [{ date: "2026-10-10", day: 1, night: 2, late: 1 }],
      perDay: 3,
      perNight: 2,
      needsYou: 5,
      unstated: 1,
      medianWaitDays: null,
      pages: [],
    },
    ...over,
  };
}
