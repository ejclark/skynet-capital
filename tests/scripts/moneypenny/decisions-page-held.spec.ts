import { describe, expect, it } from "@rstest/core";
import type { HeldFacts } from "../../../scripts/held-pr.mjs";
import { plan } from "../../../scripts/moneypenny/assignments.mjs";
import type { DecisionsIntent, PageIssue } from "../../../scripts/moneypenny/decisions-page.mjs";
import { PAGE_MARKER, planDecisions } from "../../../scripts/moneypenny/decisions-page.mjs";

// #8212, found by the post-merge audit of #8073: held PRs feed the decisions page from
// `plan().needsYou`, which listed a held PR he had already answered by unassigning himself
// (criterion 3), so the page re-assigned him and re-pinged him about it every 24h. These drive the
// whole path — plan() → planDecisions → the ping — the way the push sweep runs it.
const NOW = Date.parse("2026-11-22T15:00:00Z"); // after the 14:00Z batch start
const H = 36e5;
const BOT = { type: "Bot", login: "skynet-envoy[bot]" };
const page = (over: Partial<PageIssue> = {}): PageIssue => ({
  number: 900,
  title: "Decisions for Eric",
  body: `${PAGE_MARKER}\nold`,
  state: "open",
  created_at: "2026-11-22T00:00:00Z",
  labels: [{ name: "decisions-page" }],
  assignees: [{ login: "ejclark" }],
  user: BOT,
  ...over,
});
const heldPr = (over: Record<string, unknown> = {}) => ({
  number: 7030,
  title: "feat: held for a taste fork",
  state: "open",
  labels: [{ name: "hold-merge" }],
  created_at: new Date(NOW - 30 * H).toISOString(),
  head: { ref: "feat/x" },
  assignees: [] as { login: string }[],
  ...over,
});
const facts = (greenAt: HeldFacts["greenAt"]) =>
  new Map<number, HeldFacts>([[7030, { greenAt, blocks: [] }]]);
const greenFor = (hours: number) => facts(NOW - hours * H);
type Sync = Extract<DecisionsIntent, { kind: "decisions-sync" }>;
const sync = (intents: DecisionsIntent[]) =>
  intents.find((i): i is Sync => i.kind === "decisions-sync");

/** One sweep tick: plan the assignments, then the page from what plan() says he holds. */
function tick({
  prs,
  markers = new Set<number>(),
  held = greenFor(26),
  onPage = page(),
  now = NOW,
}: {
  prs: ReturnType<typeof heldPr>[];
  markers?: Set<number>;
  held?: Map<number, HeldFacts>;
  onPage?: PageIssue | null;
  now?: number;
}) {
  const planned = plan({ prs, markers, held, now });
  return { planned, ...planDecisions({ needsYou: planned.needsYou, page: onPage, now }) };
}

describe("a held PR he answered by unassigning stays answered (#8212)", () => {
  it("is not on Needs-you, so the page lists nothing and asks nothing", () => {
    const { planned, body, intents } = tick({ prs: [heldPr()], markers: new Set([7030]) });
    expect(planned.needsYou).toEqual([]);
    expect(planned.actions).toEqual([]);
    expect(body).not.toContain("#7030");
    expect(body).toContain("Nothing waits on you");
    // He is on the page only because of it: nothing else holds him there, so he comes off.
    expect(sync(intents)?.unassign).toBe(true);
  });

  it("does not re-assign him to the page after he takes himself off it", () => {
    const { intents } = tick({
      prs: [heldPr()],
      markers: new Set([7030]),
      onPage: page({ assignees: [] }),
    });
    for (const i of intents) expect((i as { assign?: boolean }).assign ?? false).toBe(false);
  });

  it("does not ping him about it again a day later", () => {
    const first = tick({ prs: [heldPr()], markers: new Set([7030]) });
    expect(sync(first.intents)?.ping ?? null).toBeNull();
    const later = tick({
      prs: [heldPr()],
      markers: new Set([7030]),
      held: greenFor(51),
      onPage: page({ body: first.body, assignees: [] }),
      now: NOW + 25 * H,
    });
    for (const i of later.intents) expect((i as { ping?: string | null }).ping ?? null).toBeNull();
  });

  it("still lists a marked held PR he kept, and an unmarked one he was never asked about", () => {
    const kept = tick({
      prs: [heldPr({ assignees: [{ login: "ejclark" }] })],
      markers: new Set([7030]),
    });
    expect(kept.planned.needsYou.map((r) => r.number)).toEqual([7030]);
    expect(kept.body).toContain("- #7030 feat: held for a taste fork — green 26h");
    const fresh = tick({ prs: [heldPr()] });
    expect(fresh.planned.needsYou.map((r) => r.number)).toEqual([7030]);
    expect(sync(fresh.intents)?.ping).toContain(
      "1 held PR ready for your merge: #7030 (green 26h)",
    );
  });
});

describe("a held PR whose check runs could not be read says unknown (#8212)", () => {
  // No facts read: `readHeldFacts` leaves greenAt undefined when the check-runs read fails.
  const unread = facts(undefined);

  it("the page says 'checks unknown', never 'checks not green'", () => {
    const { planned, body } = tick({ prs: [heldPr()], held: unread });
    expect(planned.needsYou[0]).toMatchObject({ number: 7030, green: false, unknown: true });
    expect(body).toContain("- #7030 feat: held for a taste fork — open 30h, checks unknown");
    expect(body).not.toContain("checks not green");
  });

  it("the ping says unknown, never 'ready for your merge'", () => {
    const ping = sync(tick({ prs: [heldPr()], held: unread }).intents)?.ping ?? "";
    expect(ping).toContain("1 held PR waiting on your merge: #7030 (open 30h, checks unknown)");
    expect(ping).not.toContain("ready for your merge");
    expect(ping).not.toContain("checks not green");
  });

  it("a PR whose checks were read and are not green still says so", () => {
    const red = facts(null);
    const { body, intents } = tick({ prs: [heldPr()], held: red });
    expect(body).toContain("open 30h, checks not green");
    expect(sync(intents)?.ping).toContain(
      "waiting on your merge: #7030 (open 30h, checks not green)",
    );
  });
});
