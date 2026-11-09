import { encounterSetLines } from "../../src/domain/campaign-encounter-lines.js";
import { encountersFor, pose, reveal } from "../../src/domain/campaign-encounters.js";
import type { Landscape, Scheduled } from "../../src/domain/campaign-landscape.js";
import { type LessonRecord, startDiscovery } from "../../src/domain/campaign-lessons.js";
import {
  type HandOff,
  handOff,
  type StrategyEncounter,
  type StrategyMember,
  strategyEncounters,
} from "../../src/domain/campaign-strategy.js";
import { leaveBuildStrategy } from "../../src/domain/campaign-strategy-leave.js";
import { type Campaign, campaignById } from "../../src/domain/campaigns.js";
import type { AuthoredPlayRecord } from "../../src/playbooks/authored-play-draft.js";
import { specFromForm } from "../../src/playbooks/authored-play-form.js";
import type { PlaybookChain } from "../../src/playbooks/chain.js";
import { draftConviction } from "../../src/playbooks/conviction-draft.js";
import type { ConvictionDraftInput } from "../../src/playbooks/conviction-parse.js";

/**
 * BUILD A STRATEGY (#6952 slice 4, criteria 5 and 6). The done line: build-a-strategy mode hands a
 * member's thesis to the conviction form, the authored-play form or the chain form, and a member
 * leaves it only with a view that carries falsifiers, a play in its shadow test, or a chain, never
 * a live order. One `describe` per rule.
 */

const TODAY = "2026-11-09";

const house = (id: string): Campaign => {
  const c = campaignById(id);
  if (!c) throw new Error(`the ${id} campaign is missing`);
  return c;
};

const AI = house("ai-buildout");
const ENERGY = house("energy-for-ai");

const landscape = (campaign: Campaign, scheduled: readonly Scheduled[] = []): Landscape => ({
  campaign: { id: campaign.id, title: campaign.title, storyline: campaign.storyline },
  anchor: "fixture",
  today: TODAY,
  moved: { sessions: 5, moves: [] },
  unread: [],
  scheduled,
  reported: [],
  tested: [],
});

const ENERGY_RECORD: LessonRecord = {
  campaign: ENERGY.id,
  lessons: [
    {
      id: "bwxt-killed",
      kind: "killed",
      idea: "BWXT's backlog converts.",
      symbols: ["BWXT"],
      on: "2026-11-07",
      recheckOn: "2027-02-22",
      source: "fixture.md",
    },
    {
      id: "cmi-watch",
      kind: "on-watch",
      idea: "CMI's power margins rose.",
      symbols: ["CMI"],
      on: "2026-11-07",
      recheckOn: "2027-02-05",
      falsifier: "CMI closes above $500.",
      source: "fixture.md",
    },
    {
      id: "spxc-old-watch",
      kind: "on-watch",
      idea: "SPXC's backlog grows.",
      symbols: ["SPXC"],
      on: "2026-08-12",
      recheckOn: "2027-02-23",
      source: "old-study.md",
    },
    {
      id: "xlu-watch",
      kind: "on-watch",
      idea: "Utilities as a group.",
      symbols: ["XLU"],
      on: "2026-11-07",
      recheckOn: "2027-02-05",
      source: "fixture.md",
    },
  ],
};

const AI_RECORD: LessonRecord = {
  campaign: AI.id,
  lessons: [
    {
      id: "crwv-watch",
      kind: "on-watch",
      idea: "CRWV's backlog outlasts the selloff.",
      symbols: ["CRWV"],
      on: "2026-11-01",
      recheckOn: "2026-12-18",
      falsifier: "CRWV closes under $45.",
      source: "docs/research/crwv.md",
    },
  ],
};

const RECORDS = { records: [ENERGY_RECORD, AI_RECORD] };

/** Ada runs one bot, subscribed to the CRWV wheel; she picked CRWV to enter and NVDA to watch. */
const ADA: StrategyMember = {
  picks: { CRWV: "enter", NVDA: "watch", AMD: "stand-aside", SMH: "watch" },
  subscribed: new Set(["CRWV-WHEEL"]),
  bots: ["acct-ada"],
};

const build = (
  campaign: Campaign,
  member?: StrategyMember,
  scheduled: readonly Scheduled[] = [],
): readonly StrategyEncounter[] =>
  strategyEncounters(campaign, {
    landscape: landscape(campaign, scheduled),
    brief: startDiscovery(campaign.id, TODAY, RECORDS),
    ...(member ? { member } : {}),
  });

const on = (es: readonly StrategyEncounter[], symbol: string): StrategyEncounter => {
  const e = es.find((x) => x.symbol === symbol);
  if (!e) throw new Error(`no build-strategy encounter for ${symbol}`);
  return e;
};

const door = (e: StrategyEncounter, id: string) => {
  const d = e.doors.find((x) => x.id === id);
  if (!d) throw new Error(`no ${id} door on ${e.id}`);
  return d;
};

describe("a mode is a set of encounters, never a screen (criterion 6)", () => {
  it("encountersFor posts build-strategy encounters in that mode, from the same inputs", () => {
    const set = encountersFor(AI, {
      landscape: landscape(AI),
      brief: startDiscovery(AI.id, TODAY, RECORDS),
      mode: "build-strategy",
      member: ADA,
    });
    expect(set.mode).toBe("build-strategy");
    expect(set.encounters.map((e) => (e.kind === "build-strategy" ? e.symbol : e.kind))).toEqual([
      "CRWV",
      "NVDA",
    ]);
  });

  it("builds on the member's watch and enter picks first, then names the house watches", () => {
    const es = build(AI, ADA);
    expect(es.map((e) => [e.symbol, e.from])).toEqual([
      ["CRWV", "your-pick"],
      ["NVDA", "your-pick"],
    ]);
    expect(build(AI).map((e) => [e.symbol, e.from])).toEqual([["CRWV", "house-watch"]]);
  });

  it("never builds on a stand-aside pick or a fund", () => {
    const symbols = build(AI, ADA).map((e) => e.symbol);
    expect(symbols).not.toContain("AMD");
    expect(symbols).not.toContain("SMH");
    expect(build(ENERGY).map((e) => e.symbol)).not.toContain("XLU");
  });

  it("builds on a house watch only while it is current: an old or killed one is not proposed", () => {
    expect(build(ENERGY).map((e) => e.symbol)).toEqual(["CMI"]);
  });

  it("a member may still build on a name the house stood aside on, and sees the house's word", () => {
    const e = on(build(ENERGY, { picks: { BWXT: "enter" }, bots: ["acct-ada"] }), "BWXT");
    expect(e.house.verdict).toBe("stand-aside");
    expect(e.choices.map((c) => c.id)).toContain("play");
  });

  it("offers only open doors as choices, always 'not yet' last, and says why every door is shut", () => {
    for (const e of [...build(AI, ADA), ...build(ENERGY)]) {
      const open = e.doors.filter((d) => d.open).map((d) => d.id);
      expect(e.choices.map((c) => c.id)).toEqual([...open, "not-yet"]);
      for (const d of e.doors) expect(d.why.length).toBeGreaterThan(20);
    }
  });

  it("hides nothing before the pick: posing returns the encounter whole, and a pick scores nothing", () => {
    const e = on(build(AI, ADA), "CRWV");
    expect(pose(e)).toEqual(e);
    expect(reveal(e, "play")).toEqual({ picked: "play", encounter: e });
  });

  it("the words list every door, open or shut, and the house's word", () => {
    const set = encountersFor(ENERGY, {
      landscape: landscape(ENERGY),
      brief: startDiscovery(ENERGY.id, TODAY, RECORDS),
      mode: "build-strategy",
    });
    const text = encounterSetLines(set).join("\n");
    expect(text).toContain("Build a strategy · energy-for-ai");
    expect(text).toContain(
      "Q. CMI, equipment makers: how will you put your view on it to the test?",
    );
    expect(text).toMatch(/State it as a view: claims with falsifiers \(shut\)/);
    expect(text).toMatch(/Chain playbooks that trade it \(shut\): No playbook on the chain menu/);
    expect(text).toContain("The house's word: Watch.");
  });
});

describe("a view opens only on a playbook the member's bot runs (criterion 5)", () => {
  it("opens on the CRWV wheel Ada subscribes to, and steers only that pair", () => {
    const e = on(build(AI, ADA), "CRWV");
    expect(door(e, "view").open).toBe(true);
    expect(e.seeds.view?.steers).toEqual(["CRWV-WHEEL"]);
  });

  it("is shut on a name a view-taking playbook trades but Ada's bot does not run, and names it", () => {
    const view = door(on(build(AI, ADA), "NVDA"), "view");
    expect(view.open).toBe(false);
    expect(view.why).toMatch(/subscribe a bot to .*NVDA/);
  });

  it("is shut on a name no view-taking playbook trades", () => {
    const view = door(on(build(ENERGY), "CMI"), "view");
    expect(view.open).toBe(false);
    expect(view.why).toContain("no playbook that takes a view trades CMI");
  });

  it("seeds the house's evidence and re-check day, and leaves the claim and falsifier to the member", () => {
    const seed = on(build(AI, ADA), "CRWV").seeds.view;
    expect(seed).toEqual({
      title: "CRWV view",
      steers: ["CRWV-WHEEL"],
      checkOn: "2026-12-18",
      evidence: "docs/research/crwv.md (2026-11-01): CRWV's backlog outlasts the selloff.",
    });
  });

  it("a member's claim on the seed goes through the conviction form's own rules and passes", () => {
    const hand = handOff(on(build(AI, ADA), "CRWV"), "view");
    if (hand.door !== "view") throw new Error("expected the view door");
    const draft: ConvictionDraftInput = {
      title: hand.seed.title,
      checkOn: hand.seed.checkOn ?? "",
      steers: hand.seed.steers,
      claims: [
        {
          tag: "underrated",
          statement: "CRWV's contracted backlog holds through the selloff.",
          bucket: "forward",
          evidence: hand.seed.evidence ?? "",
          falsifier: "CRWV closes under $45 on or before 2026-12-18.",
          scoreBy: "2026-12-18",
        },
      ],
    };
    const outcome = draftConviction(draft, {
      owner: "Ada Lovelace",
      statedOn: TODAY,
      takenIds: new Set(),
      subscribed: ADA.subscribed ?? new Set(),
    });
    expect(outcome.ok ? [] : outcome.problems).toEqual([]);
  });
});

describe("a play is a draft that shadow-tests first (criterion 5)", () => {
  it("is shut for a member with no bot of their own, and on a read with no member", () => {
    const play = door(on(build(ENERGY, { picks: { CMI: "watch" } }), "CMI"), "play");
    expect(play.open).toBe(false);
    expect(play.why).toContain("you have none yet");
    expect(door(on(build(ENERGY), "CMI"), "play").why).toContain("this read has no member");
  });

  it("seeds the authored-play form on the name and the member's bot, the thesis left blank", () => {
    const seed = on(build(AI, ADA), "NVDA").seeds.play;
    expect(seed).toMatchObject({
      symbol: "NVDA",
      runsOn: "acct-ada",
      thesis: "",
      name: "NVDA before its report",
    });
  });

  it("with the member's thesis, the seed passes the authored-play form's own rules", () => {
    const hand = handOff(on(build(AI, ADA), "NVDA"), "play");
    if (hand.door !== "play") throw new Error("expected the play door");
    const result = specFromForm({ ...hand.seed, thesis: "NVDA runs up into its print." }, "Ada");
    expect(result.ok).toBe(true);
  });

  it("says when its shadow test would act: before a confirmed report, quiet without one", () => {
    const report: Scheduled = {
      id: "nvda-earnings",
      title: "NVDA earnings",
      date: "2026-11-18",
      daysUntil: 9,
      kind: "earnings",
      impact: "critical",
      dateIs: "confirmed",
      source: "IR: NVIDIA",
      reasons: [{ via: "cast", symbol: "NVDA" }],
    };
    expect(door(on(build(AI, ADA, [report]), "NVDA"), "play").why).toContain(
      "ahead of the 2026-11-18 report",
    );
    const estimated = { ...report, dateIs: "estimated" as const };
    expect(door(on(build(AI, ADA, [estimated]), "NVDA"), "play").why).toContain(
      "stays quiet until one is",
    );
  });
});

describe("a chain opens only where the chain menu trades the name (criterion 5)", () => {
  it("opens on CRWV with the playbooks that can start it, and is shut on CMI", () => {
    const crwv = on(build(AI, ADA), "CRWV");
    expect(door(crwv, "chain").open).toBe(true);
    expect(crwv.seeds.chain).toEqual(["CRWV-WHEEL", "CRWV-LONG-CALL"]);
    expect(door(on(build(ENERGY), "CMI"), "chain").open).toBe(false);
  });
});

describe("a pick hands its form a seed, and only an offered door can be picked", () => {
  it("returns the picked door's seed, or nothing for 'not yet'", () => {
    const e = on(build(AI, ADA), "CRWV");
    const doors = (["view", "play", "chain", "not-yet"] as const).map((id) => handOff(e, id).door);
    expect(doors).toEqual(["view", "play", "chain", "not-yet"]);
  });

  it("refuses a shut door and anything that is not a choice", () => {
    const e = on(build(ENERGY), "CMI");
    expect(() => handOff(e, "view")).toThrow(/not a choice/);
    expect(() => handOff(e, "buy")).toThrow(/not a choice/);
    expect(handOff(e, "not-yet")).toEqual({ door: "not-yet" } satisfies HandOff);
  });
});

describe("a member leaves build a strategy with a view or a shadow test, never a live order (criterion 5)", () => {
  const ES = build(AI, ADA);

  const play = (status: AuthoredPlayRecord["status"], symbol = "NVDA"): AuthoredPlayRecord => ({
    id: `acct-ada:${symbol.toLowerCase()}-play`,
    name: `${symbol} play`,
    status,
    spec: {
      slug: `${symbol.toLowerCase()}-play`,
      authorAccountId: "acct-ada",
      authorDisplayName: "Ada",
      symbols: [symbol],
      thesis: "Runs up into its print.",
      trigger: { kind: "pre-print-window", enterDaysBefore: 20, exitDaysBefore: 5 },
      size: { conservative: 0.01, standard: 0.015, aggressive: 0.02 },
    },
    ...(status === "shadow" ? { shadowSince: "2026-11-09T00:00:00Z" } : {}),
    createdAt: "2026-11-09T00:00:00Z",
    updatedAt: "2026-11-09T00:00:00Z",
  });

  const view = (falsifier: string, steers = ["CRWV-WHEEL"]) => {
    const outcome = draftConviction(
      {
        title: "CRWV view",
        checkOn: "2026-12-18",
        steers,
        claims: [
          {
            tag: "underrated",
            statement: "CRWV's backlog holds.",
            bucket: "forward",
            evidence: "docs/research/crwv.md",
            falsifier: "CRWV closes under $45 on or before 2026-12-18.",
            scoreBy: "2026-12-18",
          },
        ],
      },
      {
        owner: "Ada",
        statedOn: TODAY,
        takenIds: new Set(),
        subscribed: new Set(["CRWV-WHEEL"]),
      },
    );
    if (!outcome.ok) throw new Error(outcome.problems.join("; "));
    const c = outcome.conviction;
    return { ...c, claims: c.claims.map((claim) => ({ ...claim, falsifier })) };
  };

  it("refuses to move on with nothing saved, and says what would carry the thesis out", () => {
    const leave = leaveBuildStrategy(ES, {});
    expect(leave.ok).toBe(false);
    if (!leave.ok)
      expect(leave.problems.at(-1)).toMatch(/view with a falsifier.*shadow test.*chain/);
  });

  it("a draft play does not count until its shadow test starts", () => {
    const leave = leaveBuildStrategy(ES, { plays: [play("draft")] });
    expect(leave.ok).toBe(false);
    if (!leave.ok) expect(leave.problems[0]).toContain("start its shadow test");
  });

  it("a play in its shadow test carries the thesis on to play mode", () => {
    expect(leaveBuildStrategy(ES, { plays: [play("shadow")] })).toEqual({
      ok: true,
      next: "play",
      holds: [{ door: "play", id: "acct-ada:nvda-play", symbol: "NVDA" }],
      notes: [],
    });
  });

  it("a promoted play, which can trade, never counts as what the mode built", () => {
    const leave = leaveBuildStrategy(ES, { plays: [play("promoted")] });
    expect(leave.ok).toBe(false);
    if (!leave.ok) expect(leave.problems[0]).toContain("never a play that trades");
  });

  it("a view counts when every claim carries a falsifier, and not when one is blank", () => {
    const ok = leaveBuildStrategy(ES, {
      views: [view("CRWV closes under $45 on or before 2026-12-18.")],
    });
    expect(ok.ok && ok.holds).toEqual([{ door: "view", id: "crwv-view-2026-11", symbol: "CRWV" }]);
    expect(leaveBuildStrategy(ES, { views: [view("  ")] }).ok).toBe(false);
  });

  it("a chain through a playbook on the campaign's names counts; it is saved shadow-only", () => {
    const chain: PlaybookChain = {
      id: "ada-crwv-chain",
      title: "Wheel, then the long call",
      source: "fixture",
      links: [{ from: "CRWV-WHEEL", on: { kind: "assigned" }, to: "CRWV-LONG-CALL" }],
    };
    expect(leaveBuildStrategy(ES, { chains: [chain] }).ok).toBe(true);
  });

  it("records on names outside this campaign's encounters belong to other campaigns", () => {
    expect(leaveBuildStrategy(ES, { plays: [play("shadow", "XOM")] }).ok).toBe(false);
  });

  it("returns where to go next and what carries the thesis, and nothing an order could be built from", () => {
    const leave = leaveBuildStrategy(ES, { plays: [play("shadow")] });
    expect(Object.keys(leave).sort()).toEqual(["holds", "next", "notes", "ok"]);
  });
});
