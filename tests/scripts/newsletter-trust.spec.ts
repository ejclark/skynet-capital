// The newsletter's reads keep only what this repo's people and bots wrote (#6872). The repo is
// public: a stranger can comment on any issue, post text shaped like a state block or an audit
// receipt, or file a "[fitness]" issue, and none of it may reach a public edition.
import { describe, expect, it } from "@rstest/core";
// @ts-expect-error plain .mjs script, no declarations
import { fitnessIssues, stateBlocks, tracker } from "../../scripts/newsletter/gather.mjs";
// @ts-expect-error plain .mjs script, no declarations
import { windowOf } from "../../scripts/newsletter/week.mjs";

const W45 = windowOf("2026-W45", Date.parse("2026-11-09T00:05:00Z"));
const owner = { author_association: "OWNER", user: { login: "ejclark", type: "User" } };
const bot = { author_association: "NONE", user: { login: "moneypenny[bot]", type: "Bot" } };
const stranger = { author_association: "NONE", user: { login: "someone", type: "User" } };

/** A REST stub: the first page of a listing, by the path's first match; one issue by number. */
function restFor(listings: Record<string, unknown[]>, issue = { title: "t", body: "b" }) {
  return {
    api: (path: string) => {
      const listing = Object.keys(listings).find((key) => path.includes(key));
      if (listing) return path.includes("page=1") ? listings[listing] : [];
      return issue;
    },
  };
}

describe("the newsletter reads only trusted authors", () => {
  it("keeps the owner's and the bots' #4153 comments, and drops a stranger's audit receipt", () => {
    const rest = restFor({
      "issues/4153/comments": [
        { ...owner, id: 1, created_at: "2026-11-03T00:00:00Z", body: "audit A" },
        { ...bot, id: 2, created_at: "2026-11-04T00:00:00Z", body: "audit B" },
        { ...stranger, id: 3, created_at: "2026-11-05T00:00:00Z", body: "<!-- audit-receipt -->" },
      ],
    });
    expect(tracker(rest, W45).comments.map((c: { id: number }) => c.id)).toEqual([1, 2]);
  });

  it("drops a state block a stranger posted, so its Log lines never become milestones", () => {
    const block = "### State block\n\n**Log**\n- 2026-11-08 · shipped";
    const rest = restFor({
      "issues/comments?": [
        { ...owner, issue_url: "https://x/issues/10", body: block },
        { ...stranger, issue_url: "https://x/issues/11", body: block },
        { ...owner, issue_url: "https://x/issues/12", body: "not a state block" },
      ],
    });
    expect(stateBlocks(rest, W45).map((b: { issue: number }) => b.issue)).toEqual([10]);
  });

  it("counts only trusted [fitness] issues, so a stranger cannot turn a contract red", () => {
    const rest = restFor({
      "search/issues": [
        { ...owner, number: 1, title: "[fitness] a", created_at: "2026-11-03T00:00:00Z" },
        { ...stranger, number: 2, title: "[fitness] b", created_at: "2026-11-03T00:00:00Z" },
      ],
    });
    // searchIssues reads `{ items }` pages; the stub answers with the items wrapped.
    const wrapped = {
      api: (path: string) => {
        const page = rest.api(path);
        return path.includes("search/issues") ? { items: page, total_count: 2 } : page;
      },
    };
    expect(fitnessIssues(wrapped).issues.map((i: { number: number }) => i.number)).toEqual([1]);
  });
});
