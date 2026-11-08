import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DISCOVERY_KINDS,
  type DiscoveryAsk,
  type DiscoveryKind,
  type DiscoveryQueue,
  MAX_ASKERS,
  MAX_QUEUED,
} from "../domain/discovery-queue.js";
import { JsonFileStore } from "../storage/json-file-store.js";
import { isRecord } from "../storage/parse-guards.js";
import { siblingPath } from "../storage/sibling-path.js";

/**
 * THE DISCOVERY QUEUE ON THE VOLUME (#6952 slice 2b) — the questions members asked about things no
 * campaign covers, first in first out. Plain JSON beside the member campaigns: a kind, a subject,
 * a time and opaque member keys (never emails). Reads are total and atomic writes, the house
 * `JsonFileStore` shape; a hand-edited ask that doesn't parse is dropped, never served.
 *
 * The rules that keep it from raising the research ceiling live in `domain/discovery-queue.ts`.
 */

const isKind = (v: unknown): v is DiscoveryKind =>
  (DISCOVERY_KINDS as readonly unknown[]).includes(v);

function parseAsk(raw: unknown): DiscoveryAsk | undefined {
  if (!isRecord(raw)) return undefined;
  const { id, kind, subject, askedAt, askers } = raw;
  if (!isKind(kind) || typeof subject !== "string" || subject.length === 0) return undefined;
  if (id !== `${kind}:${subject}` || typeof askedAt !== "string") return undefined;
  if (!(Array.isArray(askers) && askers.every((a) => typeof a === "string"))) return undefined;
  return { id, kind, subject, askedAt, askers: askers.slice(0, MAX_ASKERS) };
}

export function parseDiscoveryQueue(raw: unknown): DiscoveryQueue | undefined {
  if (!Array.isArray(raw)) return undefined;
  const seen = new Set<string>();
  const asks = raw.flatMap((item) => {
    const ask = parseAsk(item);
    if (!ask || seen.has(ask.id)) return [];
    seen.add(ask.id);
    return [ask];
  });
  return asks.slice(0, MAX_QUEUED);
}

export class DiscoveryQueueStore {
  private readonly file: JsonFileStore<DiscoveryQueue>;

  constructor(path: string, onReadError?: (message: string) => void) {
    this.file = new JsonFileStore({
      path,
      parse: parseDiscoveryQueue,
      empty: [],
      label: "discovery-queue",
      ...(onReadError ? { onReadError } : {}),
    });
  }

  load(): DiscoveryQueue {
    return this.file.load();
  }

  write(queue: DiscoveryQueue): void {
    this.file.write(queue);
  }
}

export function discoveryQueueFilePath(env: NodeJS.ProcessEnv): string {
  return siblingPath(
    env.SKYNET_SUBSCRIPTIONS_FILE ?? "data/playbook-subscriptions.json",
    "discovery-queue.json",
  );
}

export function createDiscoveryQueueStore(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): DiscoveryQueueStore {
  return new DiscoveryQueueStore(discoveryQueueFilePath(env), onReadError);
}

/**
 * The asks the research lane takes per pass at `normal`, read from `work-mode.json` (the one place
 * the number lives). Used only to tell a member roughly when: an unreadable file answers 1, the
 * longer wait, so the estimate never promises sooner than the lane could deliver.
 */
export function discoveryPerPass(root: string = process.cwd()): number {
  try {
    const n = JSON.parse(readFileSync(join(root, "work-mode.json"), "utf8")).positions?.normal
      ?.researchPerTick;
    return Number.isInteger(n) && n >= 1 ? n : 1;
  } catch {
    return 1;
  }
}
