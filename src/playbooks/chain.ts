/**
 * PLAYBOOK CHAINS (#6959 slice 1) — when one playbook's position reaches a named event, the next
 * playbook takes it over. Each playbook stays focused and separately tested; a chain is a handoff
 * between them, never two of them at once.
 *
 * THE THREE RULES A CHAIN KEEPS (the plan's interrogation):
 *   one owner     a position has one decision-maker at a time (`with-playbooks.ts`). A handoff passes
 *                 the position, or the cash it freed, and the first link stops deciding for it in the
 *                 same cycle (`nextOwner`).
 *   attribution   each link keeps its own result; a chain's total sits beside them, never instead.
 *   bounded       a chain is a form, like an authored play (`authored-play.ts`, #809): a playbook, an
 *                 event from the closed menu below, the next playbook. No condition, no expression,
 *                 no loop. `parseChain` refuses any key it does not name, so a free-form condition
 *                 cannot ride in on a record. The menu grows by adding events, never conditions.
 *
 * EVERY EVENT ON THE MENU IS ONE THE CODE ALREADY OBSERVES — none was invented for chains:
 *   filled        an order fills (`trading/round-trips.ts` TradeFill)
 *   take-profit   a playbook's own profit exit fires (`long-call-rules.ts` longCallExit → "profit")
 *   stopped       a playbook's own stop fires: the long call's time stop (longCallExit → "time"),
 *                 the long LEAP's (`long-leap-rules.ts` longLeapExit → "time"), COND-SCOUT's price
 *                 stop (`cond-scout-ledger.ts`)
 *   assigned      a written contract is assigned (`trading/option-lifecycle.ts` OPASN; on the wheel,
 *                 `wheelPhase` going from put-open to assigned)
 *   expired       a contract expires worthless (OPEXP; on the wheel, put-open going straight to flat)
 *   on-date       a session date arrives (`domain/market-day.ts` marketDayKey)
 *
 * An event names what happened to the WHOLE position, never to one leg of it: a covered call that
 * expires leaves the shares in place, so it is not the position expiring and hands nothing off.
 *
 * Paper only. This module is the record and its rules; nothing here places an order. The shadow
 * replay that runs a chain on history is `chain-replay.ts`; live handoff waits on per-playbook
 * ledgers (#4269, the plan's slice 2). Whether a link's next playbook can HOLD what it is handed is
 * `chain-form.ts` (slice 3a): this file knows the events, that one knows the playbooks.
 */

/** The closed menu. Adding an event here is the only way the menu grows. */
export const HANDOFF_EVENTS = [
  "filled",
  "take-profit",
  "stopped",
  "assigned",
  "expired",
  "on-date",
] as const;

export type HandoffKind = (typeof HANDOFF_EVENTS)[number];

/** One event from the menu. Only `on-date` carries a value, and it is a date, never a condition. */
export type HandoffEvent =
  | { readonly kind: Exclude<HandoffKind, "on-date"> }
  | { readonly kind: "on-date"; readonly date: string };

/** What a handoff passes to the next link: the position itself, or the cash its close freed. An
 *  expired or stopped position no longer exists, so its next owner starts from the cash. */
export const PASSES: Readonly<Record<HandoffKind, "position" | "cash">> = {
  filled: "position",
  "take-profit": "cash",
  stopped: "cash",
  assigned: "position",
  expired: "cash",
  "on-date": "position",
};

/** One link: when `from`'s position reaches `on`, `to` owns it from then on. */
export interface ChainLink {
  readonly from: string;
  readonly on: HandoffEvent;
  readonly to: string;
}

export interface PlaybookChain {
  readonly id: string;
  /** What the chain does, in plain words. */
  readonly title: string;
  /** Where the idea came from: a conviction, a plan issue. */
  readonly source: string;
  readonly links: readonly ChainLink[];
}

/** At most this many links (the plan's open question, its recommended default). */
export const MAX_LINKS = 3;

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const CHAIN_KEYS = new Set(["id", "title", "source", "links"]);
const LINK_KEYS = new Set(["from", "on", "to"]);

const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);

const nonEmpty = (x: unknown): x is string => typeof x === "string" && x.trim() !== "";

const strayKeys = (x: Record<string, unknown>, allowed: ReadonlySet<string>): string[] =>
  Object.keys(x).filter((k) => !allowed.has(k));

function parseEvent(raw: unknown, at: string, problems: string[]): HandoffEvent | undefined {
  if (!isRecord(raw)) {
    problems.push(`${at}: the event must be one of ${HANDOFF_EVENTS.join(", ")}`);
    return undefined;
  }
  const { kind } = raw;
  if (!HANDOFF_EVENTS.includes(kind as HandoffKind)) {
    problems.push(`${at}: "${String(kind)}" is not on the menu (${HANDOFF_EVENTS.join(", ")})`);
    return undefined;
  }
  const allowed = new Set(kind === "on-date" ? ["kind", "date"] : ["kind"]);
  const stray = strayKeys(raw, allowed);
  if (stray.length > 0) {
    problems.push(`${at}: an event carries no condition (${stray.join(", ")})`);
    return undefined;
  }
  if (kind === "on-date") {
    const { date } = raw;
    if (typeof date !== "string" || !ISO_DAY.test(date)) {
      problems.push(`${at}: on-date needs a YYYY-MM-DD date`);
      return undefined;
    }
    return { kind, date };
  }
  return { kind: kind as Exclude<HandoffKind, "on-date"> };
}

function parseLink(raw: unknown, i: number, problems: string[]): ChainLink | undefined {
  const at = `link ${i + 1}`;
  if (!isRecord(raw)) {
    problems.push(`${at}: a link is a playbook, an event and the next playbook`);
    return undefined;
  }
  const stray = strayKeys(raw, LINK_KEYS);
  if (stray.length > 0) problems.push(`${at}: a link carries no condition (${stray.join(", ")})`);
  const { from, to } = raw;
  if (!nonEmpty(from)) problems.push(`${at}: names no playbook to hand off from`);
  if (!nonEmpty(to)) problems.push(`${at}: names no playbook to hand off to`);
  if (nonEmpty(from) && from === to) problems.push(`${at}: ${from} cannot hand off to itself`);
  const on = parseEvent(raw.on, at, problems);
  if (stray.length > 0 || !nonEmpty(from) || !nonEmpty(to) || from === to || !on) return undefined;
  return { from, on, to };
}

/** Two links on the same playbook and event would name two next owners: the same key twice. */
const eventKey = (from: string, on: HandoffEvent): string =>
  on.kind === "on-date" ? `${from}|on-date|${on.date}` : `${from}|${on.kind}`;

/** Whether `to` already reaches `from` through `links` — a link from `from` back to `to` would close
 *  a loop. A playbook may receive from two events (expired or stopped, both to B); only a cycle is
 *  refused. */
function reaches(links: readonly ChainLink[], to: string, from: string): boolean {
  const seen = new Set<string>();
  const queue = [to];
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    if (id === from) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const l of links) if (l.from === id) queue.push(l.to);
  }
  return false;
}

/** Rules the links break as a set: one start, every later link reachable from it, no event handed
 *  off twice, no loop, and every playbook known when `known` is given. */
function shapeProblems(links: readonly ChainLink[], known?: ReadonlySet<string>): string[] {
  const problems: string[] = [];
  const root = links[0]?.from;
  const owned = new Set(root ? [root] : []);
  const seen = new Set<string>();
  links.forEach((link, i) => {
    const at = `link ${i + 1}`;
    if (!owned.has(link.from)) {
      problems.push(`${at}: ${link.from} owns nothing yet — each link starts from an earlier one`);
    }
    if (reaches(links.slice(0, i), link.to, link.from)) {
      problems.push(`${at}: ${link.to} hands back to ${link.from}; a chain has no loops`);
    }
    const key = eventKey(link.from, link.on);
    if (seen.has(key)) {
      problems.push(
        `${at}: ${link.from} already hands off on ${link.on.kind}; one next owner each`,
      );
    }
    seen.add(key);
    owned.add(link.to);
    for (const id of [link.from, link.to]) {
      if (known && !known.has(id)) problems.push(`${at}: no playbook ${id}`);
    }
  });
  return [...new Set(problems)];
}

/**
 * Read a chain record, refusing anything off the form: a missing field, an event off the menu, any
 * extra key (where a free-form condition would hide), more than `MAX_LINKS` links, a loop, a link
 * starting from a playbook that owns nothing yet, or one event handed to two owners. Pass `known`
 * (the registry's ids) to refuse a playbook that does not exist.
 */
export function parseChain(
  raw: unknown,
  known?: ReadonlySet<string>,
):
  | { readonly ok: true; readonly chain: PlaybookChain }
  | { readonly ok: false; readonly problems: readonly string[] } {
  if (!isRecord(raw)) return { ok: false, problems: ["a chain is a record"] };
  const problems: string[] = [];
  const stray = strayKeys(raw, CHAIN_KEYS);
  if (stray.length > 0) problems.push(`a chain carries no condition (${stray.join(", ")})`);
  const { id, title, source, links } = raw;
  if (!nonEmpty(id)) problems.push("a chain needs an id");
  if (!nonEmpty(title)) problems.push("a chain needs a title saying what it does");
  if (!nonEmpty(source)) problems.push("a chain needs a source");
  if (!Array.isArray(links) || links.length === 0) {
    problems.push("a chain needs at least one link");
    return { ok: false, problems };
  }
  if (links.length > MAX_LINKS) problems.push(`a chain has at most ${MAX_LINKS} links`);
  const parsed = links.map((l, i) => parseLink(l, i, problems));
  const whole = parsed.filter((l): l is ChainLink => l !== undefined);
  if (whole.length === parsed.length) problems.push(...shapeProblems(whole, known));
  if (problems.length > 0 || !nonEmpty(id) || !nonEmpty(title) || !nonEmpty(source)) {
    return { ok: false, problems };
  }
  return { ok: true, chain: { id, title, source, links: whole } };
}

/** The playbook a chain starts with: the first link's `from`. */
export const chainStart = (chain: PlaybookChain): string => {
  const first = chain.links[0];
  if (!first) throw new Error(`chain ${chain.id} has no links`);
  return first.from;
};

const sameEvent = (a: HandoffEvent, b: HandoffEvent): boolean =>
  a.kind === b.kind && (a.kind !== "on-date" || (b.kind === "on-date" && a.date === b.date));

/**
 * Who owns the position after `owner`'s position reaches `event`. A link for it hands off: the
 * next playbook owns it from this cycle on, starting from what `PASSES` says. No link keeps the
 * current owner and its own exit plan (criterion 6) — a chain never leaves a position unowned.
 */
export function nextOwner(
  chain: PlaybookChain,
  owner: string,
  event: HandoffEvent,
):
  | { readonly owner: string; readonly handedOff: false }
  | { readonly owner: string; readonly handedOff: true; readonly passes: "position" | "cash" } {
  const link = chain.links.find((l) => l.from === owner && sameEvent(l.on, event));
  return link
    ? { owner: link.to, handedOff: true, passes: PASSES[event.kind] }
    : { owner, handedOff: false };
}

/**
 * ERIC'S AI-DIP VIEW ON CRWV, AS A CHAIN (`docs/research/convictions/ai-dip-2026-10.md`): "sell
 * cash-secured puts now while premiums are rich, then buy calls after earnings if the price is
 * still low". The wheel sells the put; if it expires, the cash it secured passes to the long call,
 * which buys on its own rules — its conviction fence holds every buy until 6 sessions after the
 * print, so "after earnings" is the receiving playbook's rule, not a condition on the chain. "If
 * the price is still low" is not on the menu and is not smuggled in: the replay reports how often
 * it held, as an observation.
 *
 * Assigned has no link on purpose: the wheel's own exit plan for assigned shares IS the covered
 * call, so the position keeps its owner (criterion 6). That answers the plan's open question with
 * its least-change default — the wheel stays one playbook; a chain does not split it.
 */
export const AI_DIP_CHAIN: PlaybookChain = {
  id: "AI-DIP-CRWV",
  title: "Sell a CRWV put; if it expires, a long call takes the freed cash after the print",
  source: "docs/research/convictions/ai-dip-2026-10.md (Eric, 2026-10-16) · #6959",
  links: [{ from: "CRWV-WHEEL", on: { kind: "expired" }, to: "CRWV-LONG-CALL" }],
};
