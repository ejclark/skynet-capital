// The known-world-artifacts list (#4943) — everything a member could meet in a study world that
// production would not show them, in one file per world the checker reads before calling a
// finding real: `<run>/<world>-artifacts.json`. Pure, so the list is specced without a browser
// (tests/scripts/study-parity.spec.ts). Area-agnostic: rows come from the world's own declaration,
// the composer's manifest and the parity table, never from a surface named here.
//
// Three sources, each row tagged with where it came from:
//  - `declared` — the world says so itself (worlds/*: `artifacts`), with the reason;
//  - `compose`  — a read answered by a declared fixture instead of a real handler;
//  - `parity`   — a surface the world struck, a read or page it left unanswered, a request off the
//                 machine it aborted. compose.mjs writes the first two; parity.mjs rewrites the
//                 file with all three.
//
// NOT a parity MISS: a surface that did not render is either a world hole or the app's own defect
// (an absent-expect that the app shows — a real bug at the pin), and parity cannot tell which. It
// fails the parity run instead; listing it here would let a checker discount a real finding.

/** @typedef {{route: string, sees: string, why: string, source: string}} WorldArtifact */

/**
 * Every known artifact of one world.
 * @param {object} input
 * @param {{route: string, sees: string, why: string}[]} [input.declared]
 * @param {{key: string, source: string}[]} [input.payloads]  manifest rows of this world
 * @param {{surface: {label: string, route?: string, struck?: string}}[]} [input.rows]
 * @param {string[]} [input.unstubbed]  "<viewer>: GET <url>" or "<viewer>: PAGE <path>"
 * @param {string[]} [input.offsite]    "<viewer>: GET <origin><path>" — aborted off-origin requests
 * @returns {WorldArtifact[]}
 */
export function worldArtifacts({
  declared = [],
  payloads = [],
  rows = [],
  unstubbed = [],
  offsite = [],
}) {
  const out = declared.map((d) => ({ ...d, source: "declared" }));
  const fixtures = new Map();
  for (const p of payloads) {
    if (p.source.startsWith("fixture")) fixtures.set(p.key, p.source.replace(/^fixture: /, ""));
  }
  for (const [key, why] of fixtures) {
    out.push({
      route: key,
      sees: "a declared fixture, not the server's answer",
      why,
      source: "compose",
    });
  }
  for (const r of rows) {
    if (!r.surface.struck) continue;
    out.push({
      route: r.surface.route ?? "",
      sees: `${r.surface.label}: not shown`,
      why: r.surface.struck,
      source: "parity: struck",
    });
  }
  for (const u of new Set(unstubbed)) {
    const page = /PAGE (\S+)$/.exec(u);
    out.push({
      route: page ? page[1] : u.replace(/^[^:]*: /, ""),
      sees: page
        ? "a bare “not found” page"
        : "the page's own error or empty state (the read answers 404)",
      why: `the world has no answer for it (${u})`,
      source: "parity: unstubbed",
    });
  }
  for (const o of new Set(offsite.map((u) => u.replace(/^[^:]*: /, "")))) {
    out.push({
      route: o,
      sees: "nothing: the link or request goes nowhere (aborted)",
      why: "a study world lets nothing leave the machine; production reaches it",
      source: "parity: off-origin",
    });
  }
  return out;
}
