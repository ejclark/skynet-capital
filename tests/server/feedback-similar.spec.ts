import {
  createSimilarFeedbackSearch,
  fetchOpenFeedbackIssues,
  findSimilarIssues,
  type OpenFeedbackIssue,
  resolveSimilarFeedback,
  tokenSimilarity,
} from "../../src/server/feedback-similar.js";

/**
 * Advisory dedup on a drafted filing (#1867 slice 1) — before `draft_feedback` hands the rail a
 * draft, this searches currently-open `feedback`-labeled issues for ones that look like the same
 * report. Behavior this locks down: the search is a plain lexical heuristic (no new spend
 * surface), it caps at 3 matches, and it degrades to "no matches" — never a thrown error or a
 * blocked draft — on any GitHub failure.
 */

describe("tokenSimilarity — the lexical heuristic", () => {
  it("scores near-identical wording high", () => {
    expect(
      tokenSimilarity(
        "The options chain never loads on mobile",
        "Options chain fails to load on mobile",
      ),
    ).toBeGreaterThan(0.3);
  });

  it("scores unrelated text at zero", () => {
    expect(tokenSimilarity("Add a dark mode toggle", "Leaderboard rank tiers feel off")).toBe(0);
  });

  it("is 0 when either side has no meaningful tokens", () => {
    expect(tokenSimilarity("", "the options chain")).toBe(0);
    expect(tokenSimilarity("the options chain", "")).toBe(0);
  });
});

describe("findSimilarIssues", () => {
  const issues: readonly OpenFeedbackIssue[] = [
    {
      number: 101,
      title: "Options chain never loads on mobile Safari",
      body: "Open the ticket on an iPhone, the chain spinner never resolves.",
    },
    {
      number: 202,
      title: "Leaderboard rank tiers feel arbitrary",
      body: "Points needed per rank jump unevenly between tiers.",
    },
    {
      number: 303,
      title: "Chain spinner hangs forever on mobile",
      body: "Same as opening a ticket on mobile — spinner never resolves for the options chain.",
    },
  ];

  it("returns the issues whose wording overlaps the draft, on-topic issues only", () => {
    const result = findSimilarIssues(
      {
        title: "Options chain stuck loading on my phone",
        details: "The chain spinner just spins forever when I open a ticket on mobile.",
      },
      issues,
    );

    expect(result.map((r) => r.number).sort()).toEqual([101, 303]);
    expect(result).not.toContainEqual({
      number: 202,
      title: "Leaderboard rank tiers feel arbitrary",
    });
  });

  it("sorts the strongest wording match first", () => {
    const result = findSimilarIssues(
      {
        title: "Chain spinner hangs forever on mobile",
        details: "Options chain never loads at all when I open a ticket on my phone.",
      },
      issues,
    );

    // The exact-title match (303) must outrank the merely topic-adjacent one (101).
    expect(result[0]?.number).toBe(303);
  });

  it("returns nothing when no open issue clears the threshold", () => {
    const result = findSimilarIssues(
      { title: "Dark mode toggle please", details: "Would love a theme switch in settings." },
      issues,
    );

    expect(result).toEqual([]);
  });

  it("caps at 3 matches even when more issues clear the threshold", () => {
    const manyMobileIssues: readonly OpenFeedbackIssue[] = Array.from({ length: 6 }, (_, i) => ({
      number: 1000 + i,
      title: "Options chain never loads on mobile Safari",
      body: "Open the ticket on an iPhone, the chain spinner never resolves.",
    }));

    const result = findSimilarIssues(
      {
        title: "Options chain never loads on mobile",
        details: "Chain spinner never resolves on an iPhone when I open a ticket.",
      },
      manyMobileIssues,
    );

    expect(result).toHaveLength(3);
  });
});

describe("fetchOpenFeedbackIssues", () => {
  it("scopes the request to open, feedback-labeled issues", async () => {
    const calls: { method: string; url: string }[] = [];
    const doFetch = (method: string, url: string) => {
      calls.push({ method, url });
      return Promise.resolve({ status: 200, body: [] });
    };

    await fetchOpenFeedbackIssues(
      { token: "t", repo: "x/y" },
      doFetch as unknown as typeof import("../../src/http/fetch-json.js").fetchJson,
    );

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(
      "https://api.github.com/repos/x/y/issues?state=open&labels=feedback&per_page=100",
    );
  });

  it("maps the GitHub payload down to number/title/body", async () => {
    const doFetch = () =>
      Promise.resolve({
        status: 200,
        body: [
          { number: 1, title: "A bug", body: "details" },
          { number: 2, title: "No body field" },
        ],
      });

    const result = await fetchOpenFeedbackIssues(
      { token: "t", repo: "x/y" },
      doFetch as unknown as typeof import("../../src/http/fetch-json.js").fetchJson,
    );

    expect(result).toEqual([
      { number: 1, title: "A bug", body: "details" },
      { number: 2, title: "No body field", body: "" },
    ]);
  });

  it("degrades to an empty list on a non-200, never throwing", async () => {
    const doFetch = () => Promise.resolve({ status: 500, body: { message: "boom" } });

    const result = await fetchOpenFeedbackIssues(
      { token: "t", repo: "x/y" },
      doFetch as unknown as typeof import("../../src/http/fetch-json.js").fetchJson,
    );

    expect(result).toEqual([]);
  });

  it("degrades to an empty list when the fetch itself rejects (network down)", async () => {
    const doFetch = () => Promise.reject(new Error("network down"));

    const result = await fetchOpenFeedbackIssues(
      { token: "t", repo: "x/y" },
      doFetch as unknown as typeof import("../../src/http/fetch-json.js").fetchJson,
    );

    expect(result).toEqual([]);
  });
});

describe("createSimilarFeedbackSearch — fetch then score, end to end", () => {
  it("hands back matches from the live open queue", async () => {
    const doFetch = () =>
      Promise.resolve({
        status: 200,
        body: [
          {
            number: 55,
            title: "Options chain never loads on mobile Safari",
            body: "Spinner never resolves.",
          },
        ],
      });

    const search = createSimilarFeedbackSearch(
      { token: "t", repo: "x/y" },
      doFetch as unknown as typeof import("../../src/http/fetch-json.js").fetchJson,
    );

    const result = await search({
      title: "Options chain stuck loading on mobile",
      details: "Spinner never resolves on my phone.",
    });

    expect(result).toEqual([{ number: 55, title: "Options chain never loads on mobile Safari" }]);
  });
});

describe("resolveSimilarFeedback — env-gated, same shape as resolveFeedback", () => {
  it("is undefined with no filing token set — inert, not a thrown error", () => {
    expect(resolveSimilarFeedback({})).toBeUndefined();
  });

  it("is a callable search once the filing token is set", () => {
    const search = resolveSimilarFeedback({ SKYNET_FEEDBACK_GITHUB_TOKEN: "t" });
    expect(typeof search).toBe("function");
  });
});
