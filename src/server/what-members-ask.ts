/**
 * WHAT MEMBERS ACROSS THE LEAGUE ARE ASKING FOR, as counts only — the read behind Moneypenny's
 * `get_what_members_ask` (#7286, named next slice 4; the evidence #7029 asks a change to cite).
 *
 * WHY: one of her four jobs (#7286) is to notice when what members are trying to do has outgrown
 * the app and propose the change, as a feedback draft a person sends. Without a read of what the
 * rest of the league asked for, a proposal could only cite the one member in front of her. This
 * gives her two counts over a recent window (7, 30 or 90 days):
 *   1. questions on the research list, by subject — the waiting asks (`discovery-queue.ts`) joined
 *      with the campaign question log (`campaign-questions.ts`), which keeps a campaign's question
 *      after the research run takes it off the list; one ask on both counts once;
 *   2. feedback filed from the app, by kind (bug, feature, idea), off the feedback log
 *      (`feedback-log.ts`).
 *
 * COUNTS ONLY — NEVER WHO, NEVER THEIR WORDS. Every source here holds other members' keys, display
 * names, campaign scopes and their own words (a question, a filing's title). None of those leaves
 * this module: the answer is numbers plus a subject drawn from the app's own catalogs (a ticker
 * shape, a GICS sector, a market id). A subject that fails those checks is dropped, so no free text
 * written to the volume can ride through a subject field. SMALL COUNTS ARE KEPT ON PURPOSE: in a
 * friends-and-family league a "1" can hint at who asked, but it names nobody and carries nothing a
 * member wrote, and #7286 settled that counts are fine where words and names are not. Rounding a
 * small count away would make the evidence a change proposal cites dishonest.
 *
 * HONEST ABOUT WHAT IT CANNOT SEE. A source that fails to read says `available: false`, never zero
 * (zero would read as "nobody asked"), and `notCounted` names the gaps a reader would otherwise
 * miss: a bare question the research run already answered leaves the list and is not counted.
 *
 * Read-only: nothing here writes, and nothing here imports a trading or order module
 * (`tests/companion/companion-no-order-path.spec.ts` guards the companion side).
 */
import type { CampaignQuestion, QuestionLog } from "../domain/campaign-questions.js";
import { SYMBOL_RE } from "../domain/campaigns.js";
import type { DiscoveryKind, DiscoveryQueue } from "../domain/discovery-queue.js";
import { marketById } from "../domain/market-catalog.js";
import { GICS_SECTORS } from "../domain/sector-coverage.js";
import { DAY_MS } from "../domain/time.js";
import { createCampaignQuestionsStore } from "./campaign-questions-store.js";
import { createDiscoveryQueueStore } from "./discovery-queue-store.js";
import type { FeedbackKind } from "./feedback-issue.js";
import type { FeedbackLogEntry, FeedbackLogStore } from "./feedback-log.js";

/** The windows a read may cover, in days. Fixed choices keep the model from inventing a span. */
export const ASK_WINDOWS = [7, 30, 90] as const;
export type AskWindow = (typeof ASK_WINDOWS)[number];
export const DEFAULT_ASK_WINDOW: AskWindow = 30;
/** The most subjects one read lists; the rest are counted in `more`. */
export const SUBJECT_ROWS = 8;

const FEEDBACK_KINDS: readonly FeedbackKind[] = ["bug", "feature", "idea"];

/** Said on every read, so no rendering of it can drop what the numbers are and are not. */
export const WHAT_MEMBERS_ASK_NOTE =
  "Counts only: no names, no member ids and nobody's words. A count is how many asked, never a vote and never a promise that anything gets built.";

const NOT_COUNTED: readonly string[] = [
  "a question the daily research run already answered and took off the list, unless it was asked inside a campaign",
  "issues filed on GitHub directly rather than from the app",
];

export interface SubjectCount {
  readonly kind: DiscoveryKind;
  readonly subject: string;
  /** Asks about it: one per campaign it was asked in, plus one if it was asked outside any. */
  readonly questions: number;
  /** Distinct members who asked about it. */
  readonly askedBy: number;
}

export type ResearchListCounts =
  | {
      readonly available: true;
      readonly questions: number;
      readonly askedBy: number;
      readonly bySubject: readonly SubjectCount[];
      readonly more: number;
    }
  | { readonly available: false };

export type FilingCounts =
  | {
      readonly available: true;
      readonly total: number;
      readonly filedBy: number;
      readonly byKind: Readonly<Record<FeedbackKind, number>>;
    }
  | { readonly available: false };

export interface WhatMembersAsk {
  readonly days: AskWindow;
  /** The first day (UTC, YYYY-MM-DD) the window covers. */
  readonly since: string;
  readonly researchList: ResearchListCounts;
  readonly filings: FilingCounts;
  readonly notCounted: readonly string[];
  readonly note: string;
}

/** What one count reads. `undefined` means that source could not be read. */
export interface WhatMembersAskInput {
  readonly days: AskWindow;
  readonly now: Date;
  readonly queue: DiscoveryQueue | undefined;
  readonly questions: QuestionLog | undefined;
  readonly filings: readonly FeedbackLogEntry[] | undefined;
}

/** Whether a subject is one the app's own catalogs know — the same checks the ask route makes. */
function knownSubject(kind: DiscoveryKind, subject: string): boolean {
  if (kind === "sector") return GICS_SECTORS.some((s) => s.name === subject);
  if (kind === "market") return marketById(subject) !== undefined;
  return SYMBOL_RE.test(subject);
}

function inWindow(at: string, from: number, to: number): boolean {
  const t = Date.parse(at);
  return !Number.isNaN(t) && t >= from && t <= to;
}

/** One ask with its askers' keys, joined across the list and the question log by its id. Keys are
 *  used only to count distinct members and never leave this module. */
interface JoinedAsk {
  readonly kind: DiscoveryKind;
  readonly subject: string;
  readonly askedAt: string;
  readonly keys: Set<string>;
}

function joinAsks(queue: DiscoveryQueue, log: QuestionLog): Map<string, JoinedAsk> {
  const byId = new Map<string, JoinedAsk>();
  const add = (
    id: string,
    kind: DiscoveryKind,
    subject: string,
    askedAt: string,
    keys: string[],
  ) => {
    const prior = byId.get(id);
    if (!prior) {
      byId.set(id, { kind, subject, askedAt, keys: new Set(keys) });
      return;
    }
    for (const k of keys) prior.keys.add(k);
    // The first time anyone asked is the ask's time, whichever record holds it.
    if (Date.parse(askedAt) < Date.parse(prior.askedAt)) byId.set(id, { ...prior, askedAt });
  };
  for (const a of queue) add(a.id, a.kind, a.subject, a.askedAt, [...a.askers]);
  for (const q of log as readonly CampaignQuestion[])
    add(
      q.id,
      q.kind,
      q.subject,
      q.askedAt,
      q.askers.map((p) => p.key),
    );
  return byId;
}

function countResearchList(
  queue: DiscoveryQueue,
  log: QuestionLog,
  from: number,
  to: number,
): ResearchListCounts {
  const bySubject = new Map<
    string,
    { kind: DiscoveryKind; subject: string; n: number; keys: Set<string> }
  >();
  const everyone = new Set<string>();
  let questions = 0;
  for (const a of joinAsks(queue, log).values()) {
    if (!(inWindow(a.askedAt, from, to) && knownSubject(a.kind, a.subject))) continue;
    questions += 1;
    const key = `${a.kind}:${a.subject}`;
    const row = bySubject.get(key) ?? { kind: a.kind, subject: a.subject, n: 0, keys: new Set() };
    row.n += 1;
    for (const k of a.keys) {
      row.keys.add(k);
      everyone.add(k);
    }
    bySubject.set(key, row);
  }
  const rows: SubjectCount[] = [...bySubject.values()]
    .map((r) => ({ kind: r.kind, subject: r.subject, questions: r.n, askedBy: r.keys.size }))
    .sort(
      (x, y) =>
        y.askedBy - x.askedBy ||
        y.questions - x.questions ||
        `${x.kind}:${x.subject}`.localeCompare(`${y.kind}:${y.subject}`),
    );
  return {
    available: true,
    questions,
    askedBy: everyone.size,
    bySubject: rows.slice(0, SUBJECT_ROWS),
    more: Math.max(0, rows.length - SUBJECT_ROWS),
  };
}

function countFilings(
  filings: readonly FeedbackLogEntry[],
  from: number,
  to: number,
): FilingCounts {
  const byKind: Record<FeedbackKind, number> = { bug: 0, feature: 0, idea: 0 };
  const filers = new Set<string>();
  let total = 0;
  for (const f of filings) {
    if (!(inWindow(f.filedAt, from, to) && FEEDBACK_KINDS.includes(f.kind))) continue;
    byKind[f.kind] += 1;
    filers.add(f.opaqueMemberId);
    total += 1;
  }
  return { available: true, total, filedBy: filers.size, byKind };
}

/** What the league asked for over the window. Pure: every source is passed in. */
export function whatMembersAsk(input: WhatMembersAskInput): WhatMembersAsk {
  const to = input.now.getTime();
  const from = to - input.days * DAY_MS;
  return {
    days: input.days,
    since: new Date(from).toISOString().slice(0, 10),
    researchList: input.queue
      ? countResearchList(input.queue, input.questions ?? [], from, to)
      : { available: false },
    filings: input.filings ? countFilings(input.filings, from, to) : { available: false },
    notCounted: NOT_COUNTED,
    note: WHAT_MEMBERS_ASK_NOTE,
  };
}

const BAD_WINDOW = `days must be one of ${ASK_WINDOWS.join(", ")}`;

/** The model's window: one of the fixed choices, 30 when none is given, refused otherwise. */
export function parseAskWindow(input: unknown): AskWindow | { readonly error: string } {
  const days = (input as { days?: unknown } | null | undefined)?.days;
  if (days === undefined) return DEFAULT_ASK_WINDOW;
  return (ASK_WINDOWS as readonly unknown[]).includes(days)
    ? (days as AskWindow)
    : { error: BAD_WINDOW };
}

/** The companion's reader: a window in, the counts out. */
export type ReadWhatMembersAsk = (days: AskWindow) => Promise<WhatMembersAsk>;

/** Where a live reader gets each source, read fresh on every call. */
export interface WhatMembersAskSources {
  readonly queue: () => DiscoveryQueue;
  readonly questions: () => QuestionLog;
  readonly filings: () => Promise<readonly FeedbackLogEntry[]>;
  readonly now?: () => Date;
}

function tryRead<T>(read: () => T): T | undefined {
  try {
    return read();
  } catch {
    return undefined;
  }
}

/** Bind the sources once. A source that throws reads as `available: false`, never as a thrown
 *  tool and never as zero; the question log only adds to the list, so losing it narrows the count
 *  to the waiting asks rather than hiding the list. */
export function createWhatMembersAskReader(sources: WhatMembersAskSources): ReadWhatMembersAsk {
  return async (days) => {
    let filings: readonly FeedbackLogEntry[] | undefined;
    try {
      filings = await sources.filings();
    } catch {
      filings = undefined;
    }
    return whatMembersAsk({
      days,
      now: sources.now ? sources.now() : new Date(),
      queue: tryRead(sources.queue),
      questions: tryRead(sources.questions) ?? [],
      filings,
    });
  };
}

/**
 * A store's `load` that throws when the file is there but did not parse. The house file store
 * degrades an unreadable file to empty (and reports it), which is right for a writer but would make
 * this read say "nobody asked" about a list it could not read; the throw turns that into
 * `available: false` here. A missing file is still empty: nobody has asked yet.
 */
export function strictLoad<T>(
  make: (onReadError: (message: string) => void) => { load(): T },
  warn: (message: string) => void = () => undefined,
): () => T {
  let failed: string | undefined;
  const store = make((message) => {
    failed = message;
    warn(message);
  });
  return () => {
    failed = undefined;
    const state = store.load();
    if (failed !== undefined) throw new Error(failed);
    return state;
  };
}

/** The boot wiring's reader: read-only handles on the two volume files and the feedback log the
 *  dashboard already holds. Each store re-reads its file on every load, so a new ask or filing
 *  shows up on the next turn. `warn` hears a file that did not parse. */
export function resolveWhatMembersAsk(
  env: NodeJS.ProcessEnv,
  feedbackLog: Pick<FeedbackLogStore, "list">,
  warn?: (message: string) => void,
): ReadWhatMembersAsk {
  return createWhatMembersAskReader({
    queue: strictLoad((onError) => createDiscoveryQueueStore(env, onError), warn),
    questions: strictLoad((onError) => createCampaignQuestionsStore(env, onError), warn),
    filings: () => feedbackLog.list(),
  });
}

/** The dispatcher's answer, in `CompanionToolResult`'s shape (kept structural, so this file and
 *  `companion-tools.ts` don't import each other). The window is checked before any read. */
export async function whatMembersAskResult(
  read: ReadWhatMembersAsk | undefined,
  input: unknown,
): Promise<
  { readonly ok: true; readonly result: unknown } | { readonly ok: false; readonly error: string }
> {
  const days = parseAskWindow(input);
  if (typeof days !== "number") return { ok: false, error: days.error };
  if (!read) {
    return { ok: false, error: "what members are asking for isn't available on this deployment" };
  }
  return { ok: true, result: await read(days) };
}
