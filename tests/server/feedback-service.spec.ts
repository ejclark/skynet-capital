import { issueBody, labelsFor, opaqueMemberId } from "../../src/server/feedback-issue.js";
import { createFeedbackIssue } from "../../src/server/feedback-service.js";

// The repo is public, so a filed issue's body is public. These specs are the privacy net for
// Eric's attribution ruling (2026-08-19, amended 2026-08-25): the email must never appear in an
// issue body — the opaque id is what makes items correlate, including across a future rename. The
// member's OAuth profile name MAY appear alongside the id (Eric, 2026-08-25: "the player name lets
// people in the project identify other contributors" — it may or may not be their real name).
describe("feedback-service issue body", () => {
  const input = {
    kind: "bug" as const,
    title: "It broke",
    details: "the chart wobbled",
    area: "Research",
    submitterEmail: "Member@Example.com",
  };

  it("never leaks the submitter's email — only the opaque member marker", () => {
    const body = issueBody(input);

    expect(body).not.toContain("Member@Example.com");
    expect(body).not.toContain("member@example.com");
    expect(body).toContain(`member \`${opaqueMemberId(input.submitterEmail)}\``);
  });

  it("names the submitter alongside the id when the session carries a profile name", () => {
    const body = issueBody({ ...input, submitterName: "Tony" });

    expect(body).toContain(
      `_Submitted from the app by **Tony** (member \`${opaqueMemberId(input.submitterEmail)}\`)._`,
    );
  });

  it("falls back to the id alone when no profile name is on the session", () => {
    const body = issueBody(input);

    expect(body).toContain(
      `_Submitted from the app by member \`${opaqueMemberId(input.submitterEmail)}\`._`,
    );
  });

  it("puts the metadata in a table, under the member's own words", () => {
    const body = issueBody(input);

    expect(body.indexOf("the chart wobbled")).toBeLessThan(body.indexOf("| **Kind** |"));
    expect(body).toContain("| **Kind** | 🐞 Bug |");
    expect(body).toContain("| **Where** | Research |");
  });

  it("omits the where row when the member didn't pick one", () => {
    expect(issueBody({ kind: "idea", title: "t", details: "d" })).not.toContain("**Where**");
  });

  it("derives a stable, case-insensitive member id", () => {
    expect(opaqueMemberId("Member@Example.com")).toBe(opaqueMemberId("  member@example.com "));
    expect(opaqueMemberId("member@example.com")).toHaveLength(10);
    expect(opaqueMemberId("other@example.com")).not.toBe(opaqueMemberId("member@example.com"));
  });

  it("still attributes anonymously when no email is on the session", () => {
    const body = issueBody({ kind: "idea", title: "t", details: "d" });

    expect(body).toContain("a league member");
  });
});

// Screenshots ride separately from the member's raw form input: feedback-service.ts uploads them
// first (feedback-images.ts) and hands issueBody the resulting SHA-pinned URLs, never a data URL.
describe("feedback-service issue body — attached screenshots", () => {
  it("embeds each uploaded image right under the member's own words, ahead of the metadata table", () => {
    const body = issueBody({ kind: "bug", title: "t", details: "the chart wobbled" }, [
      "https://raw.githubusercontent.com/x/y/abc/docs/shots/feedback/m/1.jpg",
    ]);

    expect(body).toContain(
      "![attachment 1](https://raw.githubusercontent.com/x/y/abc/docs/shots/feedback/m/1.jpg)",
    );
    expect(body.indexOf("the chart wobbled")).toBeLessThan(body.indexOf("![attachment 1]"));
    expect(body.indexOf("![attachment 1]")).toBeLessThan(body.indexOf("| **Kind** |"));
  });

  it("numbers multiple attachments in order", () => {
    const body = issueBody({ kind: "bug", title: "t", details: "d" }, ["url-a", "url-b"]);

    expect(body).toContain("![attachment 1](url-a)");
    expect(body).toContain("![attachment 2](url-b)");
  });

  it("omits any image markup when nothing uploaded", () => {
    expect(issueBody({ kind: "bug", title: "t", details: "d" })).not.toContain("attachment");
  });
});

// Provenance (2026-08-22). Before this, a filed issue recorded NOTHING about how it was written, so
// a fully-interrogated spec and a one-line paste looked identical to the build lane and both had
// to be treated as the vaguer one. The `curated` label plus the fenced spec block is what lets
// the lane build a curated ask unattended instead of routing it to Eric.
describe("feedback provenance", () => {
  const spec = {
    rounds: 2,
    criteria: ["When a member opens /feedback, the form shall span 900px."],
    assumptions: [],
    outOfScope: [],
    readiness: "spec-complete" as const,
  };

  it("labels a coach-written submission `curated`, and a bare one not", () => {
    expect(labelsFor({ kind: "feature", title: "t", details: "d", spec })).toEqual([
      "enhancement",
      "feedback",
      "curated",
    ]);
    expect(labelsFor({ kind: "feature", title: "t", details: "d" })).toEqual([
      "enhancement",
      "feedback",
    ]);
  });

  // Every issue here is filed by the same bot token, so GitHub's own `author:` search can't
  // isolate one member's items — this label is what makes that filterable (Eric, 2026-08-25).
  it("adds a per-member label keyed by the opaque id, so a member's items are filterable in GitHub search", () => {
    const email = "member@example.com";
    const labels = labelsFor({ kind: "bug", title: "t", details: "d", submitterEmail: email });

    expect(labels).toContain(`member-${opaqueMemberId(email)}`);
  });

  it("omits the member label entirely for an anonymous submission", () => {
    expect(labelsFor({ kind: "bug", title: "t", details: "d" })).toEqual(["bug", "feedback"]);
  });

  // The envelope check moved to intake: an ask that was always going to need Eric is flagged at the
  // form, so it costs a sentence instead of a whole build session discovering it (#449 spent 48
  // minutes and three of Eric's comments learning this the other way round).
  it("flags `needs-eric` at intake when the coach found an owner-only ask", () => {
    const labels = labelsFor({
      kind: "feature",
      title: "t",
      details: "d",
      spec: { ...spec, needsEric: "provisions a new API key" },
    });

    expect(labels).toContain("needs-eric");
  });

  // A partial capsule waits on the MEMBER, never on Eric — that is the whole point of the split.
  it("routes an unresolved ask to `needs-info`, not to Eric", () => {
    const labels = labelsFor({
      kind: "bug",
      title: "t",
      details: "d",
      spec: { ...spec, readiness: "partial", assumptions: ["never said which page"] },
    });

    expect(labels).toContain("needs-info");
    expect(labels).not.toContain("needs-eric");
  });

  it("emits the machine-readable spec block the build lane reads as the spec", () => {
    const body = issueBody({ kind: "feature", title: "t", details: "Wider form", spec });

    expect(body).toContain("**Acceptance criteria**");
    expect(body).toContain("```skynet-spec");
    expect(JSON.parse(body.split("```skynet-spec\n")[1]?.split("\n```")[0] ?? "{}")).toEqual(spec);
  });

  it("omits the spec block entirely for a bare submission", () => {
    expect(issueBody({ kind: "idea", title: "t", details: "just a thought" })).not.toContain(
      "skynet-spec",
    );
  });
});

// The postmaster feedback lane triggers only on the `issues.labeled` webhook event — GitHub never
// emits that event for labels present at creation time, only `issues.opened`. #674 shipped with
// `feedback` baked into the creating POST and was never claimed as a result. The fix: create bare,
// then label in a second call, so the event the workflow actually listens for fires.
describe("feedback-service — issue creation never bundles labels into the create call", () => {
  it("POSTs the issue with no `labels` key, then labels it in a separate call", async () => {
    const calls: { method: string; url: string; body?: unknown }[] = [];
    const doFetch = (method: string, url: string, _headers: unknown, body?: unknown) => {
      calls.push({ method, url, body });
      if (method === "POST" && url.endsWith("/issues")) {
        return Promise.resolve({
          status: 201,
          body: { html_url: "https://github.com/x/y/issues/1", number: 1 },
        });
      }
      if (method === "GET" && url.endsWith("/issues/1/labels")) {
        return Promise.resolve({ status: 200, body: [] });
      }
      return Promise.resolve({ status: 200, body: {} });
    };
    const submit = createFeedbackIssue(
      { token: "t", repo: "x/y" },
      doFetch as unknown as typeof import("../../src/http/fetch-json.js").fetchJson,
    );

    await submit({ kind: "feature", title: "t", details: "d" });

    const createCall = calls.find((c) => c.method === "POST" && c.url.endsWith("/issues"));
    expect(createCall?.body).not.toHaveProperty("labels");

    const labelPost = calls.find((c) => c.method === "POST" && c.url.endsWith("/issues/1/labels"));
    expect(labelPost?.body).toEqual({ labels: ["enhancement", "feedback"] });
  });

  it("still returns ok when labeling fails — a filed-but-unlabeled issue beats a lost report", async () => {
    const doFetch = (method: string, url: string) => {
      if (method === "POST" && url.endsWith("/issues")) {
        return Promise.resolve({
          status: 201,
          body: { html_url: "https://github.com/x/y/issues/2", number: 2 },
        });
      }
      return Promise.resolve({ status: 500, body: {} });
    };
    const submit = createFeedbackIssue(
      { token: "t", repo: "x/y" },
      doFetch as unknown as typeof import("../../src/http/fetch-json.js").fetchJson,
    );

    const result = await submit({ kind: "bug", title: "t", details: "d" });

    expect(result).toEqual({ ok: true, url: "https://github.com/x/y/issues/2", number: 2 });
  });
});

// #716's stall: GitHub recorded two real `POST .../labels` calls for one filing, a second apart —
// six distinct label-event ids, ruled out as a double form submit (that would file a second
// issue; only one existed). Nothing here names an idempotency key, so nothing stops a transport-
// level duplicate send from reaching GitHub as a second write. These specs pin the fix: a
// duplicate call must never re-fire `labeled` events for labels the issue already carries.
describe("feedback-service — label application is idempotent (#716's stall)", () => {
  const doFetch =
    (calls: { method: string; url: string; body?: unknown }[], currentLabels: string[]) =>
    (method: string, url: string, _headers: unknown, body?: unknown) => {
      calls.push({ method, url, body });
      if (method === "POST" && url.endsWith("/issues")) {
        return Promise.resolve({
          status: 201,
          body: { html_url: "https://github.com/x/y/issues/1", number: 1 },
        });
      }
      if (method === "GET" && url.endsWith("/issues/1/labels")) {
        return Promise.resolve({ status: 200, body: currentLabels.map((name) => ({ name })) });
      }
      return Promise.resolve({ status: 200, body: {} });
    };

  it("skips the write entirely when every label is already on the issue — a duplicate call is a no-op", async () => {
    const calls: { method: string; url: string; body?: unknown }[] = [];
    const submit = createFeedbackIssue(
      { token: "t", repo: "x/y" },
      doFetch(calls, [
        "enhancement",
        "feedback",
      ]) as unknown as typeof import("../../src/http/fetch-json.js").fetchJson,
    );

    await submit({ kind: "feature", title: "t", details: "d" });

    expect(calls.some((c) => c.method === "POST" && c.url.endsWith("/issues/1/labels"))).toBe(
      false,
    );
  });

  it("posts only the labels genuinely missing, when the issue already carries some", async () => {
    const calls: { method: string; url: string; body?: unknown }[] = [];
    const submit = createFeedbackIssue(
      { token: "t", repo: "x/y" },
      doFetch(calls, [
        "enhancement",
      ]) as unknown as typeof import("../../src/http/fetch-json.js").fetchJson,
    );

    await submit({ kind: "feature", title: "t", details: "d" });

    const labelPost = calls.find((c) => c.method === "POST" && c.url.endsWith("/issues/1/labels"));
    expect(labelPost?.body).toEqual({ labels: ["feedback"] });
  });

  it("reads current labels before writing — GET precedes any POST to the labels endpoint", async () => {
    const calls: { method: string; url: string; body?: unknown }[] = [];
    const submit = createFeedbackIssue(
      { token: "t", repo: "x/y" },
      doFetch(calls, []) as unknown as typeof import("../../src/http/fetch-json.js").fetchJson,
    );

    await submit({ kind: "feature", title: "t", details: "d" });

    const labelCalls = calls.filter((c) => c.url.endsWith("/issues/1/labels"));
    expect(labelCalls.map((c) => c.method)).toEqual(["GET", "POST"]);
  });
});
