// What a member can still meet in a study world that production would not show them (#4943) —
// the known-world-artifacts list the checker reads before it calls a finding real. Declared here,
// once, for every world built on the app's shell; compose.mjs writes it beside each run as
// `<run>/<world>-artifacts.json`, and parity.mjs adds every surface it STRUCK and every read or
// page the world left unanswered (parity-judge.mjs → worldArtifacts). A finding that matches a
// row is a world artifact (`checks.json` verdict `world-artifact`), never a member's problem.
//
// Each row: the route, what a member would see there, and why the world differs. Copy the app
// prints is quoted from the app, so a checker can match it against a finding's words.

/** @type {{route: string, sees: string, why: string}[]} */
export const SHELL_ARTIFACTS = [
  {
    route: "/login",
    sees: "After Sign out: a plain page reading “You're signed out”, with no way to sign back in.",
    why:
      "The real auth gate answers /logout (302 to /login, cookie cleared); production's /login is" +
      " the identity provider's sign-in, which leaves the machine, so the world shows a plain page.",
  },
  {
    route: "Status (header) → Live stream",
    sees: "“This page is current — live · seq 0.”",
    why: "The world's board feed is live but never publishes, so its sequence stays 0.",
  },
  {
    route: "/app/settings?section=account (and Guests)",
    sees: "No Mission Control, no unclaimed-accounts card, no Guests section.",
    why:
      "Those cards answer only to the fund owner (env-listed); no world member is one, so the real" +
      " handlers answer {owner:false}. Production shows them to the fund owner.",
  },
  {
    route: "/app/activity (Builds)",
    sees: "No merged change in the feed.",
    why: "Production lists the app's real merges from GitHub; the world has no GitHub.",
  },
  {
    route: "Moneypenny (✦) and every form",
    sees:
      "A sent message, a filed note, a Council line or a saved setting gets the page's success" +
      " path but nothing comes back from it (no reply, no new row).",
    why: "A world records writes and never applies or sends them (world-route.mjs).",
  },
  {
    route: "Moneypenny (✦) → feedback",
    sees: "No feedback coach and no community milestone track.",
    why: "Both need production services (a model key, the community log) the world does not run.",
  },
];
