import { describe, expect, it } from "@rstest/core";
import { ghRest, withResponseBody, withRetry } from "../../../scripts/moneypenny/gh.mjs";
import { boardSyncSkip, isRateLimitExhausted } from "../../../scripts/moneypenny/projects.mjs";
import { readIssue } from "../../../scripts/moneypenny/projects-sync.mjs";

// #6224 — run 40421267754 (2026-10-26T23:39:58Z): two `sync project status` runs a second apart
// both died on `curl: (22) The requested URL returned error: 403` reading issue #4619. Bare `--fail`
// had thrown GitHub's body away, so the log could not say rate limit or bad credential, and the
// #4438 soft skip never saw its phrase. These specs drive the curl failure in the shape
// `execFileSync` throws it: exit 22, curl's wording on stderr, GitHub's JSON on stdout.

const STDERR_403 = "curl: (22) The requested URL returned error: 403\n";
const URL = "https://api.github.com/repos/ejclark/skynet-capital/issues/4619";
const SECONDARY =
  "You have exceeded a secondary rate limit. Please wait a few minutes before you try again.";
const PRIMARY = "API rate limit exceeded for user ID 3472134.";

const curlFailure = (stdout: string, stderr = STDERR_403) =>
  Object.assign(new Error(`Command failed: curl -sS --fail-with-body … ${URL}\n${stderr}`), {
    status: 22,
    stdout,
    stderr,
  });

const failingRun = (err: Error) => () => {
  throw err;
};

describe("ghRest keeps GitHub's reason when curl fails (#6224)", () => {
  it("asks curl for the body on failure, not bare --fail", () => {
    const seen: string[][] = [];
    ghRest("issues/4619", {
      token: "t",
      run: (_cmd: string, args: string[]) => {
        seen.push(args);
        return '{"number":4619}';
      },
    });
    expect(seen[0]).toContain("--fail-with-body");
    expect(seen[0]).not.toContain("--fail");
  });

  it("carries the error body's message into the thrown error, keeping curl's stderr intact", () => {
    const body = JSON.stringify({ message: SECONDARY, documentation_url: "https://docs…" });
    let caught: { message: string; stderr: string } | undefined;
    try {
      ghRest("issues/4619", { token: "t", run: failingRun(curlFailure(body)) });
    } catch (err) {
      caught = err as { message: string; stderr: string };
    }
    expect(caught?.message).toContain(`GitHub said: ${SECONDARY}`);
    expect(caught?.message).not.toContain("documentation_url");
    expect(caught?.stderr).toBe(STDERR_403);
  });

  it("keeps a non-JSON body as one capped line, and leaves a bodiless failure as it was", () => {
    const html = withResponseBody(curlFailure(`<html>\n${"x".repeat(1000)}\n</html>`));
    const line = html.message.split("\n").find((l: string) => l.startsWith("GitHub said:"));
    expect(line?.length).toBeLessThanOrEqual("GitHub said: ".length + 300);
    const bare = curlFailure("");
    const before = bare.message;
    expect(withResponseBody(bare).message).toBe(before);
  });

  it("still retries a 5xx on curl's wording once the body is appended", () => {
    let calls = 0;
    const out = withRetry(
      () => {
        calls += 1;
        if (calls === 1)
          throw withResponseBody(
            curlFailure(
              '{"message":"Server Error"}',
              "curl: (22) The requested URL returned error: 502\n",
            ),
          );
        return "ok";
      },
      { sleep: () => undefined, isTransient: (t: string) => /returned error: 5\d\d/.test(t) },
    );
    expect(out).toBe("ok");
  });
});

describe("a rate-limited issue read skips the board sync instead of reddening main (#6224)", () => {
  const NOW = Date.parse("2026-10-26T23:39:58Z");

  it("names GitHub's secondary-limit sentence a rate limit", () => {
    expect(isRateLimitExhausted(SECONDARY)).toBe(true);
    expect(isRateLimitExhausted(PRIMARY)).toBe(true);
    expect(isRateLimitExhausted("Resource not accessible by personal access token")).toBe(false);
  });

  it("soft-skips the failing run's read when the body says secondary limit — no GraphQL reset claimed", () => {
    let error: unknown;
    try {
      readIssue("4619", {
        read: (path: string) =>
          ghRest(path, {
            token: "t",
            run: failingRun(curlFailure(JSON.stringify({ message: SECONDARY }))),
          }),
        sleep: () => undefined,
      });
    } catch (err) {
      error = err;
    }
    const out = boardSyncSkip({ issueNumber: 4619, error, budget: { reset: 0 }, now: NOW });
    expect(out).toMatch(/^::warning title=Board sync skipped \(rate limit\)::issue #4619/);
    expect(out).toMatch(/secondary \(burst\) limit clears within minutes/);
    expect(out).not.toMatch(/GraphQL budget resets/);
    expect(out).not.toMatch(/\n/);
  });

  it("soft-skips a primary REST limit too, naming the reset", () => {
    const error = withResponseBody(curlFailure(JSON.stringify({ message: PRIMARY })));
    const reset = Math.floor(Date.parse("2026-10-27T00:10:00Z") / 1000);
    expect(boardSyncSkip({ issueNumber: 4619, error, budget: { reset }, now: NOW })).toMatch(
      /resets at 2026-10-27T00:10:00Z/,
    );
  });

  it("stays red — and now says why — on a 403 that is a credential, not a limit", () => {
    const error = withResponseBody(
      curlFailure(JSON.stringify({ message: "Resource not accessible by personal access token" })),
    );
    expect(boardSyncSkip({ issueNumber: 4619, error, now: NOW })).toBeNull();
    expect(error.message).toContain("Resource not accessible by personal access token");
  });

  it("stays red on a bare 403 with no body, exactly as before", () => {
    expect(boardSyncSkip({ issueNumber: 4619, error: curlFailure(""), now: NOW })).toBeNull();
  });
});
