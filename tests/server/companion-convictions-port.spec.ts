import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { companionConvictionsFor } from "../../src/server/companion-convictions-port.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { opaqueMemberId } from "../../src/server/feedback-issue.js";
import { MemberConvictionStore } from "../../src/server/member-conviction-store.js";
import { SubscriptionStore } from "../../src/server/subscription-store.js";

/**
 * #5482 criterion 9 — Moneypenny's conviction reads, bound to one session: she sees the pairs the
 * member's own bots run and their own views, drafts through the form's judgement, and writes
 * nothing. Saving and handing over stay with the member's tap on the routes.
 */

const ada = { email: "ada@example.com", name: "Ada Lovelace" } as never;
const NOW = new Date("2026-10-19T15:00:00Z");

const DRAFT = {
  title: "CRWV floor",
  checkOn: "2027-02-26",
  claims: [
    {
      tag: "underrated" as const,
      statement: "CRWV's backlog outlasts the selloff.",
      bucket: "forward" as const,
      evidence: "The 2026-10-16 premium-fit re-run.",
      falsifier: "CRWV closes under $45 on or before 2026-12-18.",
      scoreBy: "2026-12-18",
    },
  ],
  steers: ["CRWV-WHEEL"],
  narrowings: [{ pair: "CRWV-WHEEL", fromClaims: [], narrow: [{ kind: "contracts", max: 1 }] }],
} as const;

describe("companionConvictionsFor", () => {
  let dir: string;
  let store: MemberConvictionStore;
  let subs: SubscriptionStore;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-chat-convictions-"));
    store = new MemberConvictionStore(join(dir, "member-convictions.json"));
    subs = new SubscriptionStore(join(dir, "subscriptions.json"), undefined, () =>
      store.pointers(),
    );
    subs.subscribe("sauron", { playbookId: "CRWV-WHEEL", mode: "standard", enabled: true }, NOW);
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const config = (): DashboardServerConfig =>
    ({
      auth: { providerIds: ["google"] },
      resolveOwnerIds: (email: string) => (email === "ada@example.com" ? ["sauron"] : []),
      subscriptions: subs,
      memberConvictions: store,
      now: () => NOW,
    }) as unknown as DashboardServerConfig;

  it("offers reads only: no save, no hand-over, no subscribe", () => {
    expect(Object.keys(companionConvictionsFor(config(), ada)).sort()).toEqual(["draft", "mine"]);
  });

  it("lists the pairs the member's own bots run, with their room, and the views they hold", () => {
    const port = companionConvictionsFor(config(), ada);
    expect(port.mine()).toMatchObject({ label: "SIM", views: [] });
    expect(port.mine().steerable.map((p) => p.pair)).toEqual(["CRWV-WHEEL"]);
    expect(port.mine().steerable[0]?.bounds.dte.max).toBeGreaterThan(0);

    const drafted = port.draft(DRAFT);
    if (!drafted.ok) throw new Error(drafted.problems.join("; "));
    store.save(opaqueMemberId("ada@example.com"), drafted.drafted.conviction, NOW);
    expect(port.mine().views).toEqual([
      {
        id: "crwv-floor-2026-10",
        title: "CRWV floor",
        status: "draft",
        steers: ["CRWV-WHEEL"],
        checkOn: "2027-02-26",
      },
    ]);
  });

  it("drafts through the form's judgement — owner from the session — and keeps nothing", () => {
    const drafted = companionConvictionsFor(config(), ada).draft(DRAFT);
    expect(drafted.ok).toBe(true);
    if (!drafted.ok) return;
    expect(drafted.drafted.draft).toEqual(DRAFT);
    expect(drafted.drafted.conviction).toMatchObject({
      id: "crwv-floor-2026-10",
      owner: "Ada Lovelace",
      statedOn: "2026-10-19",
    });
    expect(drafted.drafted.card.pairs[0]?.changes.map((c) => c.setting)).toEqual(["Contracts"]);
    expect(drafted.drafted.takesOver).toEqual([]);
    expect(store.list(opaqueMemberId("ada@example.com"))).toEqual([]);
  });

  it("refuses a pair none of the member's bots runs, in the form's words", () => {
    const drafted = companionConvictionsFor(config(), ada).draft({
      ...DRAFT,
      steers: ["CRWV-LONG-CALL"],
      narrowings: [],
    });
    expect(drafted.ok).toBe(false);
    if (drafted.ok) return;
    expect(drafted.problems.join(" ")).toContain("never subscribes one");
  });
});
