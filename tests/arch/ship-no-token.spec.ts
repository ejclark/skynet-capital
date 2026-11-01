import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join, resolve } from "node:path";

/**
 * Only a command that calls GitHub asks for a token. The check used to sit at the top of ship.sh, so
 * a spec shelling out to `checkbody` passed on a laptop with a gh login and failed on CI, which has
 * neither: one such line kept #6440 red for 39 hours. The fake gh below makes this machine answer as
 * CI does, whatever login it has.
 */
const SHIP = resolve("scripts/ship.sh");
const NO_TOKEN = "no GH_TOKEN/GITHUB_TOKEN";

describe("ship with no token and no gh login", () => {
  let dir: string;
  let env: NodeJS.ProcessEnv;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "ship-no-token-"));
    const bin = join(dir, "bin");
    mkdirSync(bin);
    writeFileSync(join(bin, "gh"), "#!/bin/sh\nexit 1\n");
    chmodSync(join(bin, "gh"), 0o755);
    env = {
      ...process.env,
      GH_TOKEN: "",
      GITHUB_TOKEN: "",
      PATH: `${bin}${delimiter}${process.env.PATH}`,
    };
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  const ship = (args: string[], opts: { cwd?: string; input?: string } = {}) =>
    spawnSync("bash", [SHIP, ...args], {
      cwd: opts.cwd ?? process.cwd(),
      env,
      input: opts.input ?? "",
      encoding: "utf8",
    });
  const bodyFile = (content: string) => {
    const f = join(dir, `${Math.random().toString(36).slice(2)}.md`);
    writeFileSync(f, content);
    return f;
  };

  describe("the commands that read only local files or stdin still run", () => {
    it("checkbody passes a good body", () => {
      const good = bodyFile(
        "## The picture\n\nPicture: waived — a one-word fix\n\n## Summary\n\n- a fix\n",
      );
      const r = ship(["checkbody", good]);
      expect(r.stderr).not.toContain(NO_TOKEN);
      expect(r.status).toBe(0);
    });

    it("checkbody reaches its own refusal on a bad one", () => {
      const r = ship(["checkbody", bodyFile("no picture here\n")]);
      expect(r.status).not.toBe(0);
      expect(r.stderr).toContain("ship checkbody:");
      expect(r.stderr).not.toContain(NO_TOKEN);
    });

    it("checkverify reads stdin", () => {
      const r = ship(["checkverify"], { input: '{"check_runs":[]}' });
      expect(r.stdout.trim()).toBe("none");
      expect(r.status).toBe(0);
    });

    it("checkarm reads the envelope", () => {
      const r = ship(["checkarm", "a/path/nothing/protects.txt"]);
      expect(r.stderr).not.toContain(NO_TOKEN);
      expect(r.status).toBe(0);
    });

    it("pinshots rewrites a file", () => {
      const f = bodyFile("https://raw.githubusercontent.com/o/r/main/docs/shots/a.png\n");
      const r = ship(["pinshots", f, "a".repeat(40)]);
      expect(r.stdout).toContain(`/o/r/${"a".repeat(40)}/docs/shots/a.png`);
      expect(r.status).toBe(0);
    });

    // push authenticates through git's own credential, and the ledger reads the local log. Neither
    // can finish here, so the oracle is only which wall it stopped at.
    it.each([
      ["push", ["push"]],
      ["platter ledger", ["platter", "ledger"]],
      ["the usage line", []],
    ])("%s does not stop at the token check", (_name, args) => {
      const r = ship(args as string[], { cwd: dir });
      expect(r.stderr).not.toContain(NO_TOKEN);
    });
  });

  // From a directory that is not a repo, so a command that lost its check fails on git and goes red
  // here instead of checking out a branch in this worktree.
  describe("the commands that call GitHub stop at once and say why", () => {
    it.each([
      ["open", ["open", "fix: a title"]],
      ["merge", ["merge", "1"]],
      ["automerge", ["automerge", "1"]],
      ["platter open", ["platter", "open", "an-item"]],
      ["platter board", ["platter", "board", "an-item"]],
      ["platter sync", ["platter", "sync"]],
    ])("%s", (_name, args) => {
      const r = ship(args as string[], { cwd: dir });
      expect(r.stderr).toContain(NO_TOKEN);
      expect(r.status).toBe(1);
    });
  });
});
