// THE SHELL WRAPPER — every postmaster module that shells out to `gh`/`git`/`curl` goes through
// this one call, so every caller gets the same encoding/stdio behaviour and there's one place to
// change it. Split out of postmaster.mjs (2026-08-26, the noExcessiveLinesPerFile split).
import { execFileSync } from "node:child_process";

export const sh = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { encoding: "utf8", stdio: "pipe", ...opts }).trim();
