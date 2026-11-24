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
    sees:
      "After Sign out: a plain page reading “You're signed out”, with no way to sign back in;" +
      " Back or any app link returns to it.",
    why:
      "The real auth gate answers /logout (302 to /login, cookie cleared) and sends every page" +
      " to /login once signed out, as production does. Production's /login is the app's own" +
      " sign-in page with a “Continue with …” button per provider; each button hands off to the" +
      " identity provider, off the machine, so the world shows a plain page with no buttons.",
  },
  {
    route: "any link off the app (e.g. status line → Fleet details → “Open Actions” on github.com)",
    sees: "Nothing: the tap goes nowhere, or a blank tab.",
    why: "A study world aborts every request that would leave the machine; production opens it.",
  },
  {
    route: "status line (top bar) → Fleet details → Live stream",
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
    route: "Moneypenny's dock and every form",
    sees:
      "A sent message, a filed note, a Council line or a saved setting gets the page's success" +
      " path but nothing comes back from it (no reply, no new row).",
    why: "A world records writes and never applies or sends them (world-route.mjs).",
  },
  {
    route: "Moneypenny's dock → feedback",
    sees: "No feedback coach and no community milestone track.",
    why: "Both need production services (a model key, the community log) the world does not run.",
  },
];

/**
 * What the cross-feature world (cross-today, #8005 slice 4) adds to the shell's list: it stands on
 * a later instant than its prices were drawn for, and Moneypenny's chat is in members' hands.
 * @type {{route: string, sees: string, why: string}[]}
 */
export const CROSS_ARTIFACTS = [
  {
    route: "R&D, the landing page's market and calendar, any research write-up",
    sees: "Prices and positions that do not match what the research shelf says the market did that week.",
    why:
      "The book is the profile world's sanitized one, moved six weeks to 2026-11-19; the shelf and" +
      " the edition are the real ones written by then (inputs/cross-feature.json).",
  },
  {
    route: "Moneypenny's dock → a draft she offers to file",
    sees: "Once sent: “filed as #90001” (then #90002 …), and the link to it leads nowhere.",
    why:
      "A world never files anything: the draft is recorded as a finding (world-chat.mjs) and the" +
      " page is told a world number. Production files a real issue and links it.",
  },
  {
    route: "Moneypenny's dock → work status, the roadmap, similar requests, what members ask",
    sees: "She says she cannot look that up right now.",
    why:
      "Those lookups read GitHub and the production volume, which a world does not run; she" +
      " answers as production does when they are not wired (world-chat-server.mjs).",
  },
];
