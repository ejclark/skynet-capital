import type { ServerResponse } from "node:http";
import { gradeCheck } from "../../src/domain/comprehension.js";
import { checkFor } from "../../src/domain/comprehension-checks.js";
import { answersFromForm, handleCheckPost } from "../../src/server/comprehension-routes.js";
import type { ProgressionService } from "../../src/server/progression-service.js";
import type { TradeRouteDeps } from "../../src/server/trade-ticket-route.js";

const firstBuy = checkFor("first-buy");
if (!firstBuy) throw new Error("the first-buy check is the fixture this spec is built on");

const capture = () => {
  const sent = { status: 0, body: "", location: "" };
  const res = {
    writeHead(status: number, headers?: Record<string, string>) {
      sent.status = status;
      sent.location = headers?.location ?? "";
    },
    end(body?: string) {
      sent.body = body ?? "";
    },
  } as unknown as ServerResponse;
  return { sent, res };
};

/** Records every grading call so the spec can prove the server graded, not the browser. */
const graded: { id: string; milestoneId: string; answers: Map<string, string> }[] = [];

const progression = (): ProgressionService =>
  ({
    submitCheck: (id: string, milestoneId: string, answers: ReadonlyMap<string, string>) => {
      graded.push({ id, milestoneId, answers: new Map(answers) });
      const check = checkFor(milestoneId);
      return Promise.resolve(check ? gradeCheck(check, answers) : undefined);
    },
  }) as unknown as ProgressionService;

const deps = (service: ProgressionService | undefined): TradeRouteDeps =>
  ({
    snapshotFor: () => undefined,
    requesterId: "ann",
    tradingEnabled: true,
    ...(service ? { progression: service } : {}),
    nav: { active: "trade" as const, canAdd: false, authed: true },
    document: (_title: string, body: string) => body,
  }) as unknown as TradeRouteDeps;

const form = (entries: Record<string, string>) => new URLSearchParams(entries);
const perfect = Object.fromEntries(
  firstBuy.questions.map((q) => [`a_${q.id}`, String(q.answerIndex)]),
);

describe("the comprehension check POST — grading is the server's, never the browser's", () => {
  beforeEach(() => {
    graded.length = 0;
  });

  it("declines a form that isn't a check, so the order path is untouched", async () => {
    const { res, sent } = capture();
    expect(await handleCheckPost(res, form({ symbol: "AAPL" }), deps(progression()), "ann")).toBe(
      false,
    );
    expect(sent.status).toBe(0);
  });

  it("grades server-side from posted indices and renders the result page", async () => {
    const { res, sent } = capture();
    const handled = await handleCheckPost(
      res,
      form({ check: "first-buy", back: "/learn", ...perfect }),
      deps(progression()),
      "ann",
    );
    expect(handled).toBe(true);
    expect(sent.status).toBe(200);
    expect(sent.body).toContain("🎉 Understood");
    expect(graded).toHaveLength(1);
    expect(graded[0]?.id).toBe("ann");
    expect(graded[0]?.milestoneId).toBe("first-buy");
  });

  it("ignores a posted verdict — only the answer fields reach the grader", async () => {
    const { res } = capture();
    await handleCheckPost(
      res,
      form({ check: "first-buy", passed: "true", correct: "4", ...perfect }),
      deps(progression()),
      "ann",
    );
    expect([...(graded[0]?.answers.keys() ?? [])].sort()).toEqual(
      firstBuy.questions.map((q) => q.id).sort(),
    );
  });

  it("renders a miss as a retry, never as a block", async () => {
    const { res, sent } = capture();
    await handleCheckPost(
      res,
      form({ check: "first-buy", back: "/learn" }),
      deps(progression()),
      "ann",
    );
    expect(sent.status).toBe(200);
    expect(sent.body).toContain("Take it again →");
  });

  it("sends an ungated milestone id back where it came from, with no fabricated verdict", async () => {
    const { res, sent } = capture();
    expect(
      await handleCheckPost(
        res,
        form({ check: "not-a-milestone", back: "/learn" }),
        deps(progression()),
        "ann",
      ),
    ).toBe(true);
    expect(sent.status).toBe(303);
    expect(sent.location).toBe("/learn");
    expect(sent.body).toBe("");
  });

  it("degrades to a redirect when no progression service is wired at all", async () => {
    const { res, sent } = capture();
    await handleCheckPost(res, form({ check: "first-buy" }), deps(undefined), "ann");
    expect(sent.status).toBe(303);
    expect(sent.location).toBe("/trade");
  });

  it("never redirects off-site, whatever the hidden back field claims", async () => {
    for (const back of ["//evil.example", "https://evil.example", "/\\evil.example"]) {
      const { res, sent } = capture();
      await handleCheckPost(
        res,
        form({ check: "not-a-milestone", back }),
        deps(progression()),
        "ann",
      );
      expect(sent.location).toBe("/trade");
    }
  });

  it("reads only the namespaced answer fields out of a form", () => {
    const answers = answersFromForm(form({ a_own: "1", check: "first-buy", back: "/learn" }));
    expect([...answers]).toEqual([["own", "1"]]);
  });
});
