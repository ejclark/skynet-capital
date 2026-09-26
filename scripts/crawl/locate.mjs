// Turn a finding's text snippet into a `file:line` in the app's source — a fixed-string grep over
// app/src and src, first hit wins — so a ledger row names where the copy lives without the probe
// knowing anything about the code. Honest limits: a string built at runtime (a number, a name
// interpolated in) does not grep; the row then reads "—" and the judge chore locates it by hand.

import { execFileSync } from "node:child_process";

const cache = new Map();

/** @param {string} snippet  @param {string|undefined} pinned  a `where` the journey file already names */
export function locate(snippet, pinned) {
  if (pinned) return pinned;
  const needle = needleOf(snippet);
  if (!needle) return "—";
  if (cache.has(needle)) return cache.get(needle);
  let hit = "—";
  try {
    const out = execFileSync(
      "grep",
      ["-rnF", "-m1", "--include=*.tsx", "--include=*.ts", needle, "app/src", "src"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    const first = out.split("\n").find((l) => l.length > 0);
    if (first) hit = first.split(":").slice(0, 2).join(":");
  } catch {
    /* no hit — grep exits 1 */
  }
  cache.set(needle, hit);
  return hit;
}

/** The longest plain run of the snippet a JSX string literal would contain verbatim. */
function needleOf(snippet) {
  const clean = String(snippet ?? "")
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  const runs = clean.split(/[0-9$%]+|[—–·]/).map((s) => s.trim());
  const best = runs.sort((a, b) => b.length - a.length)[0] ?? "";
  return best.length >= 12 ? best.slice(0, 48) : "";
}
