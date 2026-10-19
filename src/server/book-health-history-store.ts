import {
  appendSample,
  type HealthSample,
  MAX_FINDINGS,
  MAX_SAMPLES,
} from "../observatory/book-health-history.js";
import { JsonFileStore } from "../storage/json-file-store.js";
import { isRecord } from "../storage/parse-guards.js";
import { siblingPath } from "../storage/sibling-path.js";

/**
 * The book-health history on the mounted volume (#5493 slice 5): per account, the findings that
 * stood at each hourly sample (`observatory/book-health-history.ts` shapes and bounds them). One
 * small plain-JSON file beside the already-pinned controls file — no new env var, no `fly.toml`
 * change (envelope-protected), the same move `council-store.ts` makes — on the house
 * `JsonFileStore` (atomic writes, total reads that degrade a bad file to empty, loudly).
 *
 * Bounded three ways so it can never grow without limit: each account's samples by age and count
 * (`appendSample`), and the number of accounts here by `MAX_ACCOUNTS` (an account that stopped
 * being sampled — a removed member — falls out as the least recently sampled).
 */

export const MAX_ACCOUNTS = 200;

export interface BookHealthHistoryState {
  readonly accounts: Readonly<Record<string, readonly HealthSample[]>>;
}

const EMPTY: BookHealthHistoryState = { accounts: {} };

/** What the desk payload and the sampler read and write — a port, so specs need no file. */
export interface BookHealthHistoryPort {
  samples(accountId: string): readonly HealthSample[];
  record(accountId: string, sample: HealthSample): void;
}

function parseSample(raw: unknown): HealthSample | undefined {
  if (!isRecord(raw) || typeof raw.at !== "string" || !Array.isArray(raw.f)) return undefined;
  if (!Number.isFinite(Date.parse(raw.at)) || raw.f.length > MAX_FINDINGS) return undefined;
  const f: HealthSample["f"][number][] = [];
  for (const item of raw.f) {
    if (
      !isRecord(item) ||
      typeof item.k !== "string" ||
      (item.l !== "signal" && item.l !== "gate") ||
      typeof item.s !== "number" ||
      !Number.isFinite(item.s)
    ) {
      return undefined;
    }
    f.push({ k: item.k, l: item.l, s: item.s });
  }
  return { at: raw.at, f };
}

/** Total parse: the exact shape or nothing — a hand-edited file degrades to empty, loudly. */
export function parseBookHealthHistory(raw: unknown): BookHealthHistoryState | undefined {
  if (!(isRecord(raw) && isRecord(raw.accounts))) return undefined;
  const accounts: Record<string, HealthSample[]> = {};
  for (const [id, list] of Object.entries(raw.accounts)) {
    if (!Array.isArray(list) || list.length > MAX_SAMPLES) return undefined;
    const samples: HealthSample[] = [];
    for (const item of list) {
      const sample = parseSample(item);
      if (!sample) return undefined;
      samples.push(sample);
    }
    accounts[id] = samples;
  }
  return { accounts };
}

const newest = (samples: readonly HealthSample[]): number =>
  Date.parse(samples[samples.length - 1]?.at ?? "") || 0;

export class BookHealthHistoryStore implements BookHealthHistoryPort {
  private readonly file: JsonFileStore<BookHealthHistoryState>;

  constructor(path: string, onReadError?: (message: string) => void) {
    this.file = new JsonFileStore({
      path,
      parse: parseBookHealthHistory,
      empty: EMPTY,
      label: "book-health-history",
      ...(onReadError ? { onReadError } : {}),
    });
  }

  samples(accountId: string): readonly HealthSample[] {
    return this.file.load().accounts[accountId] ?? [];
  }

  record(accountId: string, sample: HealthSample): void {
    const state = this.file.load();
    const next = appendSample(state.accounts[accountId] ?? [], sample);
    if (next === state.accounts[accountId]) return;
    const accounts = { ...state.accounts, [accountId]: next };
    const ids = Object.keys(accounts);
    if (ids.length > MAX_ACCOUNTS) {
      ids
        .sort((a, b) => newest(accounts[a] ?? []) - newest(accounts[b] ?? []))
        .slice(0, ids.length - MAX_ACCOUNTS)
        .forEach((id) => {
          delete accounts[id];
        });
    }
    this.file.write({ accounts });
  }
}

export function bookHealthHistoryPathFrom(controlsFilePath: string): string {
  return siblingPath(controlsFilePath, "book-health-history.json");
}

/** Build the store from the environment, riding the same volume `bot-controls-store.ts` resolves. */
export function createBookHealthHistoryStore(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): BookHealthHistoryStore {
  return new BookHealthHistoryStore(
    bookHealthHistoryPathFrom(env.SKYNET_CONTROLS_FILE ?? "data/bot-controls.json"),
    onReadError,
  );
}
