import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// The deploy runner behind `release · deploy`, driven through its real entrypoint with a stub
// `flyctl` on the FLYCTL_BIN seam — no fake for the retry loop itself, so these specs exercise the
// same process plumbing the pipeline does.
//
// The anchor is run 37094550247 (#4523): `flyctl deploy --remote-only` lost its socket on the first
// Machines-API call (`Error: Get "https://api.machines.dev/v1/apps/skynet-capital": EOF`) and the
// bare `run:` line had no second attempt, so a closed socket stranded a merged `main` undeployed.
// The asymmetry these specs pin: a TRANSPORT failure must get another try, and a real rejection —
// auth, a bad image, health checks that never pass — must not, because re-flinging a bad release at
// the cluster is worse than a red run.
const EOF_ERROR = 'Error: Get "https://api.machines.dev/v1/apps/skynet-capital": EOF';

type Run = { status: number; stdout: string; stderr: string; attempts: number };

/** Run the real CLI against a stub flyctl that fails `failTimes` times with `message`, then succeeds. */
const deploy = (
  args: string[],
  { failTimes = 0, message = EOF_ERROR, exitCode = 1, attempts = "3" } = {},
): Run => {
  const dir = mkdtempSync(join(tmpdir(), "fly-deploy-"));
  const stub = join(dir, "flyctl");
  const counter = join(dir, "attempts");
  writeFileSync(counter, "0");
  writeFileSync(
    stub,
    [
      "#!/usr/bin/env bash",
      'n=$(( $(cat "$STUB_COUNTER") + 1 ))',
      'echo "$n" > "$STUB_COUNTER"',
      'echo "args: $*"',
      'if [ "$n" -le "$STUB_FAIL_TIMES" ]; then',
      '  echo "$STUB_MESSAGE" >&2',
      '  exit "$STUB_EXIT"',
      "fi",
      'echo "deployed"',
    ].join("\n"),
  );
  chmodSync(stub, 0o755);

  const result = spawnSync("node", ["scripts/fly-deploy.mjs", ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      FLYCTL_BIN: stub,
      FLY_DEPLOY_ATTEMPTS: attempts,
      FLY_DEPLOY_BACKOFF_MS: "1",
      STUB_COUNTER: counter,
      STUB_FAIL_TIMES: String(failTimes),
      STUB_MESSAGE: message,
      STUB_EXIT: String(exitCode),
    },
  });

  return {
    status: result.status ?? -1,
    stdout: result.stdout,
    stderr: result.stderr,
    attempts: Number(readFileSync(counter, "utf8").trim()),
  };
};

describe("fly deploy runner (transient-failure retry)", () => {
  it("survives the run-37094550247 socket close — one EOF, then a green release", () => {
    const run = deploy(["--remote-only"], { failTimes: 1 });
    expect(run.attempts).toBe(2);
    expect(run.status).toBe(0);
    expect(run.stderr).toContain("transient Fly API error");
  });

  it("gives up red once the attempts are spent — a deploy that never happened stays a failure", () => {
    const run = deploy(["--remote-only"], { failTimes: 99 });
    expect(run.attempts).toBe(3);
    expect(run.status).toBe(1);
  });

  it("honours FLY_DEPLOY_ATTEMPTS", () => {
    expect(deploy(["--remote-only"], { failTimes: 99, attempts: "2" }).attempts).toBe(2);
  });

  it("refuses to retry an auth rejection — a second try only repeats a 401", () => {
    const run = deploy(["--remote-only"], { failTimes: 99, message: "Error: Unauthorized" });
    expect(run.attempts).toBe(1);
    expect(run.status).toBe(1);
  });

  it("refuses to retry failed health checks — never re-fling a bad release at the cluster", () => {
    const run = deploy(["--remote-only"], {
      failTimes: 99,
      message: "Error: timeout reached waiting for health checks to pass for machine 148e2",
    });
    expect(run.attempts).toBe(1);
  });

  it("refuses to retry a build failure", () => {
    const run = deploy(["--remote-only"], {
      failTimes: 99,
      message: "Error: failed to build: npm run build exited with code 1",
    });
    expect(run.attempts).toBe(1);
  });

  it("retries a 503 from Fly's API", () => {
    const run = deploy(["--remote-only"], {
      failTimes: 1,
      message: "Error: failed to get app: 503 Service Unavailable",
    });
    expect(run.attempts).toBe(2);
    expect(run.status).toBe(0);
  });

  // Run 37476037256 (#4796): Fly's API found the dashboard's freshly pushed image, then the bots
  // machine's host 404'd pulling the same digest — registry lag, not a bad reference.
  const MANIFEST_404 =
    'failed to get manifest registry.fly.io/skynet-capital@sha256:f6d1: request failed: not found [http 404]: {"errors":[{"code":"MANIFEST_UNKNOWN","message":"manifest unknown"}]}';

  it("retries a manifest 404 once Fly's API has vouched for the image — the run-37476037256 lag", () => {
    const run = deploy(["--image", "registry.fly.io/skynet-capital@sha256:f6d1"], {
      failTimes: 1,
      message: `image found: img_y7nxpk88g1k2p8w2\n${MANIFEST_404}`,
    });
    expect(run.attempts).toBe(2);
    expect(run.status).toBe(0);
  });

  it("refuses to retry a manifest 404 Fly's API never found — a bad reference stays red at once", () => {
    const run = deploy(["--image", "registry.fly.io/skynet-capital@sha256:dead"], {
      failTimes: 99,
      message: MANIFEST_404,
    });
    expect(run.attempts).toBe(1);
    expect(run.status).toBe(1);
  });

  it("passes flyctl's arguments through verbatim, under the `deploy` subcommand", () => {
    const run = deploy(["--config", "/tmp/fly.bots.deploy.toml", "--image", "reg/app@sha256:abc"]);
    expect(run.stdout).toContain(
      "args: deploy --config /tmp/fly.bots.deploy.toml --image reg/app@sha256:abc",
    );
    expect(run.status).toBe(0);
  });

  it("propagates flyctl's own exit code on a non-transient failure", () => {
    expect(
      deploy(["--remote-only"], { failTimes: 99, message: "Error: App not found", exitCode: 3 })
        .status,
    ).toBe(3);
  });
});
