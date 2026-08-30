import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { behaviorVerifiedFacts, suiteRunnerArgv } from "../../scripts/envelope-scan.mjs";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// #852's broad slice (Eric, 2026-08-29: "the intent is behavioral tests and CI quality gates are
// to prevent the need for human review/intervention" — not just to speed the human up). A third
// path to additiveSafe:true, alongside pure insertion and safe structural widening (both covered by
// envelope.spec.ts): a diffAware rule's registered `invariantSuite`, untouched by the diff, passing
// right now. Split into its own file to stay under noExcessiveLinesPerFile, the same reason
// envelope-behavior.mjs exists as its own module rather than living in envelope-scan.mjs.
type Check = {
  path: string;
  protected: boolean;
  blocking: boolean;
  additiveSafe?: boolean;
  pattern?: string;
  why?: string;
  reason?: string;
};

describe("suiteRunnerArgv — the overridable command behind behaviorVerified", () => {
  it("defaults to npx rstest run, and honors ENVELOPE_SUITE_RUNNER when set", () => {
    const original = process.env.ENVELOPE_SUITE_RUNNER;
    delete process.env.ENVELOPE_SUITE_RUNNER;
    try {
      expect(suiteRunnerArgv("some.spec.ts")).toEqual(["npx", ["rstest", "run", "some.spec.ts"]]);
      process.env.ENVELOPE_SUITE_RUNNER = "node fake-runner.mjs";
      expect(suiteRunnerArgv("some.spec.ts")).toEqual([
        "node",
        ["fake-runner.mjs", "some.spec.ts"],
      ]);
    } finally {
      if (original === undefined) delete process.env.ENVELOPE_SUITE_RUNNER;
      else process.env.ENVELOPE_SUITE_RUNNER = original;
    }
  });
});

describe("behaviorVerifiedFacts — the pure gate", () => {
  it("is true only when all three hold: registered, untouched, and passing", () => {
    expect(behaviorVerifiedFacts({ hasSuite: true, suiteUnchanged: true, suitePassed: true })).toBe(
      true,
    );
  });

  it("is false when there's no registered suite at all", () => {
    expect(
      behaviorVerifiedFacts({ hasSuite: false, suiteUnchanged: true, suitePassed: true }),
    ).toBe(false);
  });

  it("is false when the diff touched the suite itself, even if it 'passes'", () => {
    expect(
      behaviorVerifiedFacts({ hasSuite: true, suiteUnchanged: false, suitePassed: true }),
    ).toBe(false);
  });

  it("is false when the suite is untouched but fails", () => {
    expect(
      behaviorVerifiedFacts({ hasSuite: true, suiteUnchanged: true, suitePassed: false }),
    ).toBe(false);
  });
});

describe("behaviorVerified end to end, through the real CLI and the real envelope.json", () => {
  // A FIXTURE diffAware+invariantSuite rule, not a real business file (#928 opened
  // option-ticket.ts, this suite's original target, since it carries no account-identity check —
  // this mechanism test shouldn't be coupled to which real files happen to be protected today).
  // ENVELOPE_SUITE_RUNNER swaps the real `npx rstest run` for a trivial always-pass/always-fail
  // command, so these stay hermetic and fast — no real test environment needed inside the temp
  // fixture, and the suite file's actual content never runs for real.
  const suitePath = "tests/trading/fixture-ticket-invariants.property.spec.ts";
  const fixtureEnvelope = {
    lanes: ["feedback/", "research/", "design/"],
    protected: [
      {
        pattern: "src/trading/fixture-ticket.ts",
        why: "fixture — behaviorVerified mechanism test only",
        diffAware: true,
        invariantSuite: suitePath,
      },
      {
        pattern: "src/alpaca/fixture-client.ts",
        why: "fixture — diffAware with no invariantSuite registered, mechanism test only",
        diffAware: true,
      },
    ],
  };

  const setup = () => {
    const dir = mkdtempSync(join(tmpdir(), "envelope-behavior-verified-"));
    const run = (...args: string[]): string =>
      execFileSync("git", ["-c", "user.email=spec@example.com", "-c", "user.name=spec", ...args], {
        cwd: dir,
        encoding: "utf8",
        env: hermeticGitEnv(),
      });
    const ticketPath = join(dir, "src/trading/fixture-ticket.ts");
    const writeFixtureEnvelope = () =>
      writeFileSync(join(dir, "envelope.json"), JSON.stringify(fixtureEnvelope));
    const checkTemp = (runnerCmd: string | undefined, ...args: string[]): Check[] =>
      JSON.parse(
        execFileSync(
          "node",
          [join(process.cwd(), "scripts/envelope-scan.mjs"), "--check", ...args],
          {
            cwd: dir,
            encoding: "utf8",
            env: hermeticGitEnv(
              runnerCmd ? { ENVELOPE_SUITE_RUNNER: runnerCmd } : { ENVELOPE_SUITE_RUNNER: "" },
            ),
          },
        ),
      ) as Check[];
    return { dir, run, ticketPath, checkTemp, writeFixtureEnvelope };
  };

  // A change to an EXISTING line — not a pure insertion, and not a union-widening shape either —
  // so classifyDiff and structurallySafe both miss, leaving behaviorVerified as the only path left.
  const modifyExistingLine = (ticketPath: string) =>
    writeFileSync(ticketPath, "export const existing = 2; // modified, not a pure insertion\n");

  it("reports additiveSafe:true with reason 'behavior-verified' when the suite is untouched and passes", () => {
    const { dir, run, ticketPath, checkTemp, writeFixtureEnvelope } = setup();
    try {
      run("init", "-b", "main");
      mkdirSync(join(dir, "src/trading"), { recursive: true });
      writeFixtureEnvelope();
      writeFileSync(ticketPath, "export const existing = 1;\n");
      run("add", "-A");
      run("commit", "-m", "base");

      run("checkout", "-b", "feedback/1");
      modifyExistingLine(ticketPath);
      run("add", "-A");
      run("commit", "-m", "modifies an existing line");

      // A trivial always-succeeds command stands in for a real `npx rstest run`.
      const result = checkTemp(
        "node -e process.exit(0) --",
        "src/trading/fixture-ticket.ts",
        "--base",
        "main",
      );
      expect(result[0]).toMatchObject({
        protected: true,
        additiveSafe: true,
        blocking: false,
        reason: "behavior-verified",
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("stays gated when the suite is untouched but the runner fails", () => {
    const { dir, run, ticketPath, checkTemp, writeFixtureEnvelope } = setup();
    try {
      run("init", "-b", "main");
      mkdirSync(join(dir, "src/trading"), { recursive: true });
      writeFixtureEnvelope();
      writeFileSync(ticketPath, "export const existing = 1;\n");
      run("add", "-A");
      run("commit", "-m", "base");

      run("checkout", "-b", "feedback/2");
      modifyExistingLine(ticketPath);
      run("add", "-A");
      run("commit", "-m", "modifies an existing line");

      const result = checkTemp(
        "node -e process.exit(1) --",
        "src/trading/fixture-ticket.ts",
        "--base",
        "main",
      );
      expect(result[0]).toMatchObject({ protected: true, additiveSafe: false, blocking: true });
      expect(result[0]?.reason).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("stays gated when the SAME diff also touches the invariant suite — a diff cannot loosen its own proof", () => {
    const { dir, run, ticketPath, checkTemp, writeFixtureEnvelope } = setup();
    try {
      run("init", "-b", "main");
      mkdirSync(join(dir, "src/trading"), { recursive: true });
      mkdirSync(join(dir, "tests/trading"), { recursive: true });
      writeFixtureEnvelope();
      writeFileSync(ticketPath, "export const existing = 1;\n");
      writeFileSync(join(dir, suitePath), "describe('placeholder', () => {});\n");
      run("add", "-A");
      run("commit", "-m", "base");

      run("checkout", "-b", "feedback/3");
      modifyExistingLine(ticketPath);
      // The diff ALSO edits the suite it would otherwise be judged by.
      writeFileSync(join(dir, suitePath), "describe('weakened', () => {});\n");
      run("add", "-A");
      run("commit", "-m", "modifies both the ticket and its own invariant suite");

      // Even a runner that would always pass must not matter here — suiteUnchanged is false.
      const result = checkTemp(
        "node -e process.exit(0) --",
        "src/trading/fixture-ticket.ts",
        "--base",
        "main",
      );
      expect(result[0]).toMatchObject({ protected: true, additiveSafe: false, blocking: true });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("stays gated (no crash) when no invariant suite is registered for the rule at all", () => {
    const { dir, run, checkTemp, writeFixtureEnvelope } = setup();
    const clientPath = join(dir, "src/alpaca/fixture-client.ts");
    try {
      run("init", "-b", "main");
      mkdirSync(join(dir, "src/alpaca"), { recursive: true });
      writeFixtureEnvelope();
      writeFileSync(clientPath, "export const existing = 1;\n");
      run("add", "-A");
      run("commit", "-m", "base");

      run("checkout", "-b", "feedback/4");
      writeFileSync(clientPath, "export const existing = 2;\n");
      run("add", "-A");
      run("commit", "-m", "modifies an existing line, no invariantSuite on this rule");

      // Even a runner that would always pass must not matter — this rule names no suite at all.
      const result = checkTemp(
        "node -e process.exit(0) --",
        "src/alpaca/fixture-client.ts",
        "--base",
        "main",
      );
      expect(result[0]).toMatchObject({ protected: true, additiveSafe: false, blocking: true });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
