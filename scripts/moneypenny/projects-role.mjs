// THE BOARD'S ROLE FIELD — #6886 slice 1b. Eric, 2026-11-05: "one view in our project could be
// geared around digital team members roles/personas.. the work in their queue that they pump out."
// Decided 2026-11-07 (shape A, seat swimlanes): the board groups cards by Role, one lane per seat.
//
// A ROLE IS A SEAT, NOT A FILE. The seat registry (docs/agents/seats.json, slice 1a) already names
// every seat; a seat that pulls work off the board carries two more keys there:
//   role  — the option name the board shows, named by the job ("Plan builds"), never a coined name
//   pulls — the labels whose cards sit in that seat's queue
// and the registry's `roleOrder` says which seat wins when a card's labels match more than one
// (a plan that also carries `needs-session` waits on a live session, not on the plan lane).
//
// WHAT "PULLS" MEANS, said plainly: the seat that will build or pursue the card next — the same split
// the retry sweep makes (`plan` → the plan lane, any other ready issue → the feedback lane,
// index.mjs `lane`). Who must act FIRST is a different question, and "Waiting on" answers it: a
// `needs-eric` plan stays in Plan builds with "Eric to decide" beside it. A card no seat pulls (a bare
// `enhancement` nobody has triaged) gets no Role, so it lands in the board's "No Role" lane — which is
// itself the honest picture.
//
// ONE-WAY, unlike Priority. Role is a copy of the registry and the labels; a drag between Role lanes
// is overwritten by the next sync, because no lane reads the board (#4064) and a seat is not
// something a card can be dragged into.
//
// Pure apart from `readSeatRegistry` (one file read, memoised). The IO is projects-sync.mjs (one
// issue) and projects-reconcile.mjs (the sweep, which also keeps the field's option list in step).
import { readFileSync } from "node:fs";
import { labelNames } from "./labels.mjs";
import { ROLE } from "./projects.mjs";

export { ROLE };

const REGISTRY_PATH = new URL("../../docs/agents/seats.json", import.meta.url);
let registry;

/** The seat registry, read once per process. A missing or broken file reads as no seats. */
export function readSeatRegistry() {
  if (registry) return registry;
  try {
    registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
  } catch {
    registry = { seats: [], roleOrder: [] };
  }
  return registry;
}

/**
 * The seats that pull board cards, in `roleOrder` (first match wins), as
 * `[{id, role, pulls, job}]`. A seat named in `roleOrder` without a role or pulls is skipped — the
 * org-chart spec fails on that, so it never reaches main. Pure.
 */
export function pullingSeats(reg = {}) {
  const byId = new Map((reg.seats ?? []).map((s) => [s.id, s]));
  return (reg.roleOrder ?? [])
    .map((id) => byId.get(id))
    .filter((s) => s?.role && Array.isArray(s.pulls) && s.pulls.length)
    .map((s) => ({ id: s.id, role: s.role, pulls: s.pulls, job: s.job ?? "" }));
}

/** The Role field's option names, in `roleOrder`. Pure. */
export function roleOptionNames(reg = {}) {
  return pullingSeats(reg).map((s) => s.role);
}

/**
 * The Role an issue's labels give it: the first seat in `roleOrder` that pulls any of them, or ""
 * when none does. Takes a REST issue (label objects) or flat names. Pure.
 */
export function wantedRoleOf(issue, reg = {}) {
  const have = new Set(labelNames(issue?.labels));
  const seat = pullingSeats(reg).find((s) => s.pulls.some((l) => have.has(l)));
  return seat ? seat.role : "";
}

/**
 * The role to plan against the LIVE field: `wanted` when the field carries it as an option (or it
 * is "", a clear), else undefined — the sweep adds the option first, and a sync that runs before it
 * leaves the card alone rather than failing on a missing option. Pure.
 */
export function liveRole(wanted, liveOptions = []) {
  if (wanted === undefined) return undefined;
  if (wanted === "") return "";
  return liveOptions.includes(wanted) ? wanted : undefined;
}

// GitHub's option input requires a colour; one neutral colour for every seat, because the lane's
// name carries the meaning and hue never does alone (CLAUDE.md, the colourblind reader).
const ROLE_COLOR = "GRAY";

/** The option inputs the Role field should carry, each described by its seat's job. Pure. */
export function roleFieldOptions(reg = {}) {
  return pullingSeats(reg).map((s) => ({ name: s.role, color: ROLE_COLOR, description: s.job }));
}

/**
 * What to send `updateProjectV2Field` so the live Role field carries every seat's option — or null
 * when it already does. Ids are kept for every option that survives (a card keeps its lane), a
 * stale description is rewritten, and an option no seat names any more is KEPT, never removed:
 * deleting one would blank every card in that lane, and the cards move on their next sync anyway.
 * `current` is the live field's `[{id, name, color, description}]`. Pure.
 */
export function roleFieldUpdate(current = [], reg = {}) {
  const live = new Map(current.filter((o) => o?.id && o?.name).map((o) => [o.name, o]));
  const wanted = roleFieldOptions(reg);
  const drifts = wanted.some((o) => {
    const have = live.get(o.name);
    return !have || (have.description ?? "") !== o.description;
  });
  if (!drifts) return null;
  const names = new Set(wanted.map((o) => o.name));
  const kept = wanted.map((o) => {
    const have = live.get(o.name);
    return have ? { id: have.id, ...o, color: have.color ?? o.color } : o;
  });
  const extras = [...live.values()]
    .filter((o) => !names.has(o.name))
    .map((o) => ({
      id: o.id,
      name: o.name,
      color: o.color ?? ROLE_COLOR,
      description: o.description ?? "",
    }));
  return [...kept, ...extras];
}
