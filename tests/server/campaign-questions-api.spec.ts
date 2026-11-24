import { mkdtemp, rm } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rstest } from "@rstest/core";
import type { Lesson } from "../../src/domain/campaign-lessons.js";
import type { CampaignQuestion } from "../../src/domain/campaign-questions.js";
import { CAMPAIGNS, type Campaign } from "../../src/domain/campaigns.js";
import type { DiscoveryAsk, QueueOutcome } from "../../src/domain/discovery-queue.js";
import {
  CAMPAIGN_MAX_ID,
  coveringCandidates,
  logAsked,
  questionsFor,
  readableCampaign,
  serveCampaignQuestions,
  suggestionsFor,
} from "../../src/server/campaign-questions-api.js";
import { CampaignQuestionsStore } from "../../src/server/campaign-questions-store.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { DiscoveryQueueStore } from "../../src/server/discovery-queue-store.js";
import { MemberCampaignStore } from "../../src/server/member-campaign-store.js";
import { plantHostileShelf } from "../support/member-campaigns-harness.js";

/**
 * WHAT THE PARTY ASKED, SERVED (#6949 slice 6): which campaigns a member can read, the log write
 * when a question is asked inside one, and the read that lists every question asked in a campaign.
 *
 * WHEN a member asks for a campaign id, a house one wins, then their own, then one the party shares;
 * another member's draft answers exactly like a campaign that does not exist. WHEN a question is
 * asked inside a campaign it is logged by display name, a bare ask is not, and a failed log write
 * never fails the ask. WHEN the list is read, each question says where it stands.
 */

// Every read here runs on a shelf that already holds NVDA and AMD write-ups for the AI buildout
// (#8224): a read that skips the `campaignShelfAnswered` seam sees them and its answers go red.
plantHostileShelf();

const ada = "adakey0001";
const grace = "gracekey02";
const AI = "ai-buildout";

const retail = (id: string, title = id): Campaign => ({
  id,
  title,
  storyline: "Grocers and discounters racing for the weekly shop.",
  sector: "Consumer Staples",
  cast: [{ role: "Grocers", symbols: ["WMT", "COST", "XLP"], source: "docs/research/retail.md" }],
  forces: [],
  openQuestions: [],
});

const lesson = (answers: string): Lesson => ({
  id: "capex-holds",
  kind: "on-watch",
  idea: "Capex guidance holds through the next print.",
  symbols: ["NVDA"],
  on: "2026-11-18",
  recheckOn: "2026-12-18",
  falsifier: "A hyperscaler cuts its capex guide.",
  source: "docs/research/events/nvda-2026-11-18-print.md",
  answers,
});

const nameAsk = (subject: string, campaign?: string, askers: string[] = [ada]): DiscoveryAsk => ({
  id: campaign ? `${campaign}/name:${subject}` : `name:${subject}`,
  kind: "name",
  subject,
  askedAt: "2026-11-20T10:00:00.000Z",
  askers,
  ...(campaign ? { campaign } : {}),
});

const logged = (
  subject: string,
  campaign: string,
  askedAt: string,
  over: Partial<CampaignQuestion> = {},
): CampaignQuestion => ({
  id: `${campaign}/name:${subject}`,
  campaign,
  kind: "name",
  subject,
  askedAt,
  askers: [{ key: ada, name: "Ada" }],
  ...over,
});

interface Reply {
  status?: number;
  body: string;
}

function fakeRes(): { res: ServerResponse; out: Reply } {
  const out: Reply = { body: "" };
  const res = {
    writeHead(status: number) {
      out.status = status;
      return res;
    },
    end(body?: string) {
      out.body = body ?? "";
    },
  } as unknown as ServerResponse;
  return { res, out };
}

const getReq = (url: string, method = "GET"): IncomingMessage =>
  ({ method, url, headers: {} }) as unknown as IncomingMessage;

describe("the campaign questions API", () => {
  let dir: string;
  let members: MemberCampaignStore;
  let questions: CampaignQuestionsStore;
  let queue: DiscoveryQueueStore;
  let cfg: DashboardServerConfig;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-cq-api-"));
    members = new MemberCampaignStore(join(dir, "member-campaigns.json"));
    questions = new CampaignQuestionsStore(join(dir, "campaign-questions.json"));
    queue = new DiscoveryQueueStore(join(dir, "discovery-queue.json"));
    cfg = {
      memberCampaigns: members,
      campaignQuestions: questions,
      discoveryQueue: queue,
      campaignFindings: () => [],
      campaignShelfAnswered: () => false,
    } as unknown as DashboardServerConfig;
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  describe("when a member asks which campaign an id names", () => {
    it("reads a house campaign by its own id as its scope", () => {
      const got = readableCampaign(cfg, ada, AI);
      expect(got?.scope).toBe(AI);
      expect(got?.campaign.title).toBe("The AI buildout");
    });

    it("reads a house campaign even when the deployment has no member store", () => {
      expect(readableCampaign({} as DashboardServerConfig, ada, AI)?.scope).toBe(AI);
    });

    it("answers nothing for an id no campaign holds, with or without a member store", () => {
      expect(readableCampaign(cfg, ada, "nope")).toBeUndefined();
      expect(readableCampaign({} as DashboardServerConfig, ada, "nope")).toBeUndefined();
    });

    it("scopes a member's own campaign under their key", () => {
      members.save(ada, retail("corner-shops"), [], { share: false });
      const got = readableCampaign(cfg, ada, "corner-shops");
      expect(got?.scope).toBe(`${ada}~corner-shops`);
      expect(got?.campaign.sector).toBe("Consumer Staples");
    });

    it("reads a campaign another member shared with the party, scoped under its author", () => {
      members.save(grace, retail("grocers"), [], { share: { by: "Grace" } });
      expect(readableCampaign(cfg, ada, "grocers")?.scope).toBe(`${grace}~grocers`);
    });

    it("answers a draft of someone else's like a campaign that does not exist", () => {
      members.save(grace, retail("secret-plan"), [], { share: false });
      expect(readableCampaign(cfg, ada, "secret-plan")).toBeUndefined();
      expect(readableCampaign(cfg, grace, "secret-plan")?.scope).toBe(`${grace}~secret-plan`);
    });

    it("prefers the member's own campaign over a party one with the same id", () => {
      members.save(ada, retail("twin", "Ada's twin"), [], { share: false });
      members.save(grace, retail("twin", "Grace's twin"), [], { share: { by: "Grace" } });
      expect(readableCampaign(cfg, ada, "twin")?.campaign.title).toBe("Ada's twin");
      expect(readableCampaign(cfg, "otherkey03", "twin")?.campaign.title).toBe("Grace's twin");
    });

    it("lets a house id win over a member campaign that borrowed it", () => {
      members.save(ada, retail(AI, "Not the house one"), [], { share: false });
      const got = readableCampaign(cfg, ada, AI);
      expect(got?.scope).toBe(AI);
      expect(got?.campaign.title).toBe("The AI buildout");
    });
  });

  describe("when the campaigns that can cover a subject are listed", () => {
    const ids = (list: readonly { id: string }[]) => list.map((c) => c.id);

    it("is the house campaigns alone when nothing is shared", () => {
      expect(ids(coveringCandidates(cfg))).toEqual(CAMPAIGNS.map((c) => c.id));
      expect(ids(coveringCandidates({} as DashboardServerConfig))).toEqual(
        CAMPAIGNS.map((c) => c.id),
      );
    });

    it("adds each shared campaign after the house ones, marked as the party's and scoped by author", () => {
      members.save(grace, retail("grocers"), [], { share: { by: "Grace" } });
      members.save(ada, retail("private-draft"), [], { share: false });
      const list = coveringCandidates(cfg);
      expect(ids(list)).toEqual([...CAMPAIGNS.map((c) => c.id), "grocers"]);
      const shared = list[list.length - 1];
      expect(shared?.party).toBe(true);
      expect(shared?.scope).toBe(`${grace}~grocers`);
    });

    it("adds the draft a question is asked in, so it can still hold its own cast", () => {
      members.save(ada, retail("corner-shops"), [], { share: false });
      const askedIn = readableCampaign(cfg, ada, "corner-shops");
      const list = coveringCandidates(cfg, askedIn);
      const draft = list[list.length - 1];
      expect(draft?.id).toBe("corner-shops");
      expect(draft?.scope).toBe(`${ada}~corner-shops`);
      expect(draft?.party).toBeUndefined();
    });

    it("does not list the campaign a question is asked in twice", () => {
      members.save(grace, retail("grocers"), [], { share: { by: "Grace" } });
      const house = readableCampaign(cfg, ada, AI);
      const party = readableCampaign(cfg, ada, "grocers");
      expect(coveringCandidates(cfg, house)).toHaveLength(CAMPAIGNS.length + 1);
      expect(coveringCandidates(cfg, party)).toHaveLength(CAMPAIGNS.length + 1);
    });
  });

  describe("when the queue's outcomes are logged as questions", () => {
    const asker = { key: ada, name: "Ada" };
    const queuedOutcome = (ask: DiscoveryAsk): QueueOutcome => ({
      status: "queued",
      queue: [ask],
      ahead: 0,
    });

    it("logs a queued ask asked inside a campaign, by display name", () => {
      logAsked(cfg, [queuedOutcome(nameAsk("NVDA", AI))], asker);
      const log = questions.load();
      expect(log).toHaveLength(1);
      expect(log[0]?.campaign).toBe(AI);
      expect(log[0]?.subject).toBe("NVDA");
      expect(log[0]?.askers).toEqual([asker]);
    });

    it("logs a joined ask on the entry the queue holds at its position", () => {
      const first = nameAsk("AMD", AI);
      const second = nameAsk("NVDA", AI, [grace]);
      logAsked(cfg, [{ status: "joined", queue: [first, second], ahead: 1 }], asker);
      expect(questions.load().map((q) => q.subject)).toEqual(["NVDA"]);
    });

    it("logs an ask joined to a write-up already on the shelf, so the asker shows on it", () => {
      logAsked(cfg, [{ status: "answered", queue: [], ask: nameAsk("NVDA", AI) }], asker);
      expect(questions.load().map((q) => q.subject)).toEqual(["NVDA"]);
    });

    it("does not log a bare ask, a covered one, or a full queue", () => {
      logAsked(
        cfg,
        [
          queuedOutcome(nameAsk("NVDA")),
          { status: "covered", queue: [], campaign: AI },
          { status: "full", queue: [] },
        ],
        asker,
      );
      expect(questions.load()).toEqual([]);
    });

    it("adds a second asker to a question already logged, never the same one twice", () => {
      const outcome = queuedOutcome(nameAsk("NVDA", AI));
      logAsked(cfg, [outcome], asker);
      logAsked(cfg, [outcome], { key: grace, name: "Grace" });
      logAsked(cfg, [outcome], { key: grace, name: "Grace" });
      const log = questions.load();
      expect(log).toHaveLength(1);
      expect(log[0]?.askers.map((a) => a.name)).toEqual(["Ada", "Grace"]);
    });

    it("does nothing when the deployment keeps no question log", () => {
      expect(() =>
        logAsked(
          { discoveryQueue: queue } as unknown as DashboardServerConfig,
          [queuedOutcome(nameAsk("NVDA", AI))],
          asker,
        ),
      ).not.toThrow();
    });

    it("reports a log write that fails and never fails the ask", () => {
      const warn = rstest.spyOn(process, "emitWarning").mockImplementation(() => undefined);
      try {
        const broken = {
          campaignQuestions: {
            load: () => [],
            write: () => {
              throw new Error("disk full");
            },
          },
        } as unknown as DashboardServerConfig;
        expect(() => logAsked(broken, [queuedOutcome(nameAsk("NVDA", AI))], asker)).not.toThrow();
        expect(String(warn.mock.calls[0]?.[0])).toContain("write failed: disk full");
      } finally {
        warn.mockRestore();
      }
    });
  });

  describe("when the questions asked in a campaign are read", () => {
    const house = () =>
      readableCampaign(cfg, ada, AI) as NonNullable<ReturnType<typeof readableCampaign>>;

    it("answers an empty list when the deployment keeps no question log", () => {
      expect(questionsFor({} as DashboardServerConfig, house())).toEqual([]);
    });

    it("lists only the questions asked in that campaign, newest first", () => {
      questions.write([
        logged("NVDA", AI, "2026-11-10T10:00:00.000Z"),
        logged("AMD", AI, "2026-11-12T10:00:00.000Z"),
        logged("XOM", "oil-supply", "2026-11-13T10:00:00.000Z"),
      ]);
      expect(questionsFor(cfg, house()).map((q) => q.subject)).toEqual(["AMD", "NVDA"]);
    });

    it("shows every asker by display name and the first asker's words", () => {
      questions.write([
        logged("NVDA", AI, "2026-11-10T10:00:00.000Z", {
          question: "Does the print change the thesis?",
          askers: [
            { key: ada, name: "Ada" },
            { key: grace, name: "Grace" },
          ],
        }),
      ]);
      const [view] = questionsFor(cfg, house());
      expect(view?.askedBy).toEqual(["Ada", "Grace"]);
      expect(view?.question).toBe("Does the print change the thesis?");
      expect(JSON.stringify(view)).not.toContain(ada);
    });

    it("says found, with the finding, when the house campaign's lesson record answers it", () => {
      questions.write([logged("NVDA", AI, "2026-11-10T10:00:00.000Z")]);
      const found = { ...cfg, campaignFindings: (_c: string, id: string) => [lesson(id)] };
      const [view] = questionsFor(found as DashboardServerConfig, house());
      expect(view?.state).toBe("found");
      expect(view?.found[0]).toMatchObject({
        kind: "on-watch",
        idea: "Capex guidance holds through the next print.",
        falsifier: "A hyperscaler cuts its capex guide.",
      });
    });

    it("asks the lesson record by the campaign scope and the ask's id", () => {
      questions.write([logged("NVDA", AI, "2026-11-10T10:00:00.000Z")]);
      const seen: string[] = [];
      const spy = {
        ...cfg,
        campaignFindings: (campaign: string, id: string) => {
          seen.push(`${campaign} ${id}`);
          return [];
        },
      };
      questionsFor(spy as DashboardServerConfig, house());
      expect(seen).toEqual([`${AI} ${AI}/name:NVDA`]);
    });

    it("says waiting, with how many asks are ahead, while the ask is still on the queue", () => {
      questions.write([logged("NVDA", AI, "2026-11-10T10:00:00.000Z")]);
      queue.write([nameAsk("AMD", AI), nameAsk("NVDA", AI)]);
      const [view] = questionsFor(cfg, house());
      expect(view?.state).toBe("waiting");
      expect(view?.ahead).toBe(1);
    });

    it("says on-the-shelf when the lane wrote it up but no lesson carries it", () => {
      questions.write([logged("NVDA", AI, "2026-11-10T10:00:00.000Z")]);
      const shelved = { ...cfg, campaignShelfAnswered: () => true };
      expect(questionsFor(shelved as DashboardServerConfig, house())[0]?.state).toBe(
        "on-the-shelf",
      );
    });

    it("says no-finding-yet, plainly, when nothing holds", () => {
      questions.write([logged("NVDA", AI, "2026-11-10T10:00:00.000Z")]);
      const [view] = questionsFor(cfg, house());
      expect(view?.state).toBe("no-finding-yet");
      expect(view?.found).toEqual([]);
    });

    it("marks a question outside the cast as a suggestion and one inside it as not", () => {
      questions.write([
        logged("NVDA", AI, "2026-11-10T10:00:00.000Z"),
        logged("WMT", AI, "2026-11-11T10:00:00.000Z"),
      ]);
      const byName = Object.fromEntries(questionsFor(cfg, house()).map((q) => [q.subject, q]));
      expect(byName.NVDA?.suggestion).toBe(false);
      expect(byName.WMT?.suggestion).toBe(true);
    });

    it("never borrows a house lesson for a member's campaign, which has none yet", () => {
      members.save(ada, retail("corner-shops"), [], { share: false });
      const scope = `${ada}~corner-shops`;
      questions.write([logged("TSLA", scope, "2026-11-10T10:00:00.000Z")]);
      const found = { ...cfg, campaignFindings: (_c: string, id: string) => [lesson(id)] };
      const mine = readableCampaign(cfg, ada, "corner-shops") as NonNullable<
        ReturnType<typeof readableCampaign>
      >;
      const [view] = questionsFor(found as DashboardServerConfig, mine);
      expect(view?.state).toBe("no-finding-yet");
      expect(view?.found).toEqual([]);
    });
  });

  describe("when an author reads the suggestions their campaign was asked", () => {
    it("is the questions that point outside the cast, and nothing else", () => {
      members.save(ada, retail("corner-shops"), [], { share: { by: "Ada" } });
      const scope = `${ada}~corner-shops`;
      questions.write([
        logged("WMT", scope, "2026-11-10T10:00:00.000Z"),
        logged("TSLA", scope, "2026-11-11T10:00:00.000Z"),
      ]);
      const campaign = retail("corner-shops");
      expect(suggestionsFor(cfg, ada, campaign).map((q) => q.subject)).toEqual(["TSLA"]);
    });

    it("is empty when the deployment keeps no question log", () => {
      expect(suggestionsFor({} as DashboardServerConfig, ada, retail("corner-shops"))).toEqual([]);
    });
  });

  describe("when GET /api/campaigns/questions is served", () => {
    const serve = (url: string, method = "GET", memberKey = ada) => {
      const { res, out } = fakeRes();
      serveCampaignQuestions(getReq(url, method), res, cfg, memberKey);
      return out;
    };
    const refusal = { ok: false, error: "That campaign isn't one you can read." };

    it("answers the campaign and its questions as JSON", () => {
      questions.write([logged("NVDA", AI, "2026-11-10T10:00:00.000Z")]);
      const out = serve(`/api/campaigns/questions?campaign=${AI}`);
      expect(out.status).toBe(200);
      const body = JSON.parse(out.body);
      expect(body.campaign).toBe(AI);
      expect(body.questions.map((q: { subject: string }) => q.subject)).toEqual(["NVDA"]);
    });

    it("reads a campaign the party shares, for a member who is not its author", () => {
      members.save(grace, retail("grocers"), [], { share: { by: "Grace" } });
      questions.write([logged("TSLA", `${grace}~grocers`, "2026-11-10T10:00:00.000Z")]);
      const body = JSON.parse(serve("/api/campaigns/questions?campaign=grocers").body);
      expect(body.questions.map((q: { subject: string }) => q.subject)).toEqual(["TSLA"]);
    });

    it("refuses anything but GET with a 405", () => {
      const out = serve(`/api/campaigns/questions?campaign=${AI}`, "POST");
      expect(out.status).toBe(405);
      expect(out.body).toBe("GET only");
    });

    it("answers the same refusal for a missing id, an unknown one and a draft that is not theirs", () => {
      members.save(grace, retail("secret-plan"), [], { share: false });
      for (const url of [
        "/api/campaigns/questions",
        "/api/campaigns/questions?campaign=",
        "/api/campaigns/questions?campaign=nope",
        "/api/campaigns/questions?campaign=secret-plan",
      ]) {
        const out = serve(url);
        expect(out.status).toBe(200);
        expect(JSON.parse(out.body)).toEqual(refusal);
      }
    });

    it("refuses an id longer than a member id can be", () => {
      const tooLong = "a".repeat(CAMPAIGN_MAX_ID + 1);
      expect(JSON.parse(serve(`/api/campaigns/questions?campaign=${tooLong}`).body)).toEqual(
        refusal,
      );
    });

    it("reads a draft for its own author", () => {
      members.save(grace, retail("secret-plan"), [], { share: false });
      const body = JSON.parse(
        serve("/api/campaigns/questions?campaign=secret-plan", "GET", grace).body,
      );
      expect(body).toEqual({ campaign: "secret-plan", questions: [] });
    });
  });
});
