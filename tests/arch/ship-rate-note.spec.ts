import { execFileSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { hermeticGitEnv } from "../support/hermetic-git.js";

/**
 * ship.sh's rate-limit caller line must be heard once per run, not merely spent once (#8391).
 *
 * rate_note (#8289) prints one stderr line naming the caller once the shared REST allowance drops
 * under 1,000, and keeps a flag file so a run says it only once. The flag used to be set before the
 * echo, whatever stderr was. `ship.sh open`'s first REST call is the freshness check,
 * `api GET /commits/main 2>/dev/null`, so under 1,000 left the line went to /dev/null, the flag
 * stayed, and the later POST /pulls stayed silent. The most common ship command never named itself.
 *
 * These specs source the real ship.sh against a stub curl that reports 500 left, then replay
 * cmd_open's call order: the discarded GET, the POST /pulls, the label POST.
 */
describe("ship rate_note — the caller line survives a discarded first call", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "ship-rate-note-"));
    mkdirSync(join(dir, "bin"));
    mkdirSync(join(dir, "tmp"));
    // A curl that writes rate-limit headers into its -D file and answers 200 with a tiny body.
    writeFileSync(
      join(dir, "bin", "curl"),
      `#!/bin/bash
prev=""; hdr=""
for a in "$@"; do [ "$prev" = "-D" ] && hdr="$a"; prev="$a"; done
case " $* " in *" --data-binary @- "*) cat > /dev/null ;; esac
[ -z "$hdr" ] || printf 'HTTP/2 200\\r\\nx-ratelimit-remaining: %s\\r\\nx-ratelimit-resource: core\\r\\nx-ratelimit-reset: 1700000000\\r\\n\\r\\n' "$STUB_LEFT" > "$hdr"
printf '{"sha":"abc","number":7}\\n__SHIP_HTTP__200'
`,
    );
    chmodSync(join(dir, "bin", "curl"), 0o755);
  });

  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  /** Source ship.sh as `ship.sh open`, run `calls`, and return stdout and stderr together. */
  const run = (calls: string, left = "500") => {
    const script = `source "${resolve("scripts/ship.sh")}"
repo() { echo owner/repo; }
SHIP_SUBCOMMAND=open
{
${calls}
} 2>&1`;
    return execFileSync("bash", ["-c", script], {
      cwd: dir,
      env: hermeticGitEnv({
        GH_TOKEN: "test-token-never-used",
        PATH: `${join(dir, "bin")}:${process.env.PATH ?? ""}`,
        TMPDIR: join(dir, "tmp"),
        STUB_LEFT: left,
        GITHUB_RUN_ID: "",
        CLAUDE_CODE_SESSION_ID: "",
      }),
      stdio: "pipe",
    }).toString();
  };
  const lines = (out: string) => out.split("\n").filter((l) => l.startsWith("rate-limit: REST"));

  it("prints the caller line on the first call that can be heard, after open's discarded GET", () => {
    const out = run(`r="$(api GET /commits/main 2>/dev/null)"
r="$(api POST /pulls '{"title":"t"}')"
r="$(api POST /issues/7/labels '{"labels":["x"]}')"`);
    expect(lines(out)).toHaveLength(1);
    expect(out).toContain("rate-limit: REST 500 left");
    expect(out).toContain("caller: ship.sh open");
  });

  it("still says it only once per run when every call is heard", () => {
    const out = run(`r="$(api POST /pulls '{"title":"t"}')"
r="$(api POST /issues/7/labels '{"labels":["x"]}')"`);
    expect(lines(out)).toHaveLength(1);
  });

  it("leaves no flag behind when every call is discarded, so nothing was spent", () => {
    run(`r="$(api GET /commits/main 2>/dev/null)"`);
    expect(readdirSync(join(dir, "tmp")).filter((f) => f.startsWith("skynet-ship-rate."))).toEqual(
      [],
    );
  });

  it("stays quiet above 1,000 left", () => {
    expect(lines(run(`r="$(api POST /pulls '{"title":"t"}')"`, "4000"))).toEqual([]);
  });
});
