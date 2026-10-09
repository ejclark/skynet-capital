import type { JsonResponse } from "../../src/http/fetch-json.js";
import type { RunMarker } from "../../src/server/run-marker.js";
import {
  INCIDENT_LABEL,
  INCIDENT_TITLE,
  REPORT_COOLDOWN_MS,
  reportUncleanRestart,
  resolveIncidentConfig,
} from "../../src/server/unclean-restart-report.js";

// The unclean-restart incident (#4618): one open issue at a time, once per crash loop, and only
// from a live run with the feedback token — never from a dev laptop.
const NOW = new Date("2026-10-09T10:07:00Z");
const previous: RunMarker = {
  bootedAt: "2026-10-09T09:00:00.000Z",
  gitSha: "abc123",
  pid: 7,
  lastSeenAt: "2026-10-09T10:05:00.000Z",
  lastRssMb: 340,
  peakRssMb: 362,
  lastLoopMaxMs: 1800,
};
const config = { token: "t0k", repo: "o/r" };

type Call = { method: string; url: string; body?: unknown };
function github(openIssues: Array<{ number: number; title: string }> = []) {
  const calls: Call[] = [];
  const answer = (method: string, url: string): JsonResponse => {
    if (method === "GET") return { status: 200, body: openIssues };
    if (url.endsWith("/issues")) return { status: 201, body: { number: 99 } };
    if (url.endsWith("/labels")) return { status: 200, body: [] };
    return { status: 201, body: {} };
  };
  const doFetch = (method: string, url: string, _h: unknown, body?: unknown) => {
    calls.push({ method, url, ...(body === undefined ? {} : { body }) });
    return Promise.resolve(answer(method, url));
  };
  return { calls, doFetch: doFetch as never };
}

function deps(over: Partial<Parameters<typeof reportUncleanRestart>[1]> = {}) {
  const logs: string[] = [];
  const reported: Date[] = [];
  return {
    logs,
    reported,
    deps: {
      config,
      live: true,
      now: NOW,
      log: (l: string) => logs.push(l),
      reported: (d: Date) => reported.push(d),
      ...over,
    },
  };
}

describe("reporting an unclean restart", () => {
  it("files an incident, then labels it in a separate call so lanes see `labeled`", async () => {
    const gh = github();
    const d = deps({ doFetch: gh.doFetch });
    expect(await reportUncleanRestart(previous, d.deps)).toBe("filed");
    const create = gh.calls.find((c) => c.method === "POST" && c.url.endsWith("/issues"));
    expect(create?.body).toMatchObject({ title: INCIDENT_TITLE });
    expect(create?.body).not.toHaveProperty("labels");
    const body = String((create?.body as { body?: string } | undefined)?.body);
    expect(body).toContain("340 MB last, 362 MB peak");
    expect(body).toContain("an OOM kill is the likely cause");
    expect(body).toContain("/retro");
    expect(gh.calls.at(-1)).toMatchObject({
      url: "https://api.github.com/repos/o/r/issues/99/labels",
      body: { labels: [INCIDENT_LABEL] },
    });
    expect(d.reported).toEqual([NOW]);
    expect(d.logs.some((l) => l.includes("did not exit cleanly"))).toBe(true);
  });

  it("comments on the open incident instead of filing a second one", async () => {
    const gh = github([
      { number: 5, title: "Something else" },
      { number: 41, title: INCIDENT_TITLE },
    ]);
    const d = deps({ doFetch: gh.doFetch });
    expect(await reportUncleanRestart(previous, d.deps)).toBe("commented");
    expect(gh.calls.filter((c) => c.method === "POST")).toEqual([
      expect.objectContaining({ url: "https://api.github.com/repos/o/r/issues/41/comments" }),
    ]);
  });

  it("holds off inside the cooldown, so a crash loop reports once", async () => {
    const gh = github();
    const recent = new Date(NOW.getTime() - REPORT_COOLDOWN_MS + 60_000).toISOString();
    const d = deps({ doFetch: gh.doFetch });
    expect(await reportUncleanRestart({ ...previous, reportedAt: recent }, d.deps)).toBe(
      "cooldown",
    );
    expect(gh.calls).toEqual([]);
  });

  it("reports again once the cooldown has passed", async () => {
    const gh = github();
    const old = new Date(NOW.getTime() - REPORT_COOLDOWN_MS - 1).toISOString();
    const d = deps({ doFetch: gh.doFetch });
    expect(await reportUncleanRestart({ ...previous, reportedAt: old }, d.deps)).toBe("filed");
  });

  it("only logs from an offline run or without a token", async () => {
    const gh = github();
    expect(
      await reportUncleanRestart(previous, deps({ live: false, doFetch: gh.doFetch }).deps),
    ).toBe("inert");
    expect(
      await reportUncleanRestart(previous, deps({ config: undefined, doFetch: gh.doFetch }).deps),
    ).toBe("inert");
    expect(gh.calls).toEqual([]);
  });

  it("never throws when GitHub refuses — it logs and the boot carries on", async () => {
    const d = deps({
      doFetch: (async () => ({ status: 403, body: { message: "no" } })) as never,
    });
    expect(await reportUncleanRestart(previous, d.deps)).toBe("failed");
    expect(d.reported).toEqual([]);
    expect(d.logs.at(-1)).toContain("could not file");
  });

  it("reuses the feedback token and repo, and is inert without the token", () => {
    expect(resolveIncidentConfig({})).toBeUndefined();
    expect(resolveIncidentConfig({ SKYNET_FEEDBACK_GITHUB_TOKEN: "x" })).toEqual({
      token: "x",
      repo: "ejclark/skynet-capital",
    });
  });
});
