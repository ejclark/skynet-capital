import {
  type Asker,
  type CampaignQuestion,
  MAX_DISPLAY_NAME,
  MAX_PER_CAMPAIGN,
  type QuestionLog,
} from "../domain/campaign-questions.js";
import { askId, cleanQuestion, MAX_ASKERS } from "../domain/discovery-queue.js";
import { JsonFileStore } from "../storage/json-file-store.js";
import { isRecord } from "../storage/parse-guards.js";
import { siblingPath } from "../storage/sibling-path.js";
import { isKind, SCOPE_RE } from "./discovery-queue-store.js";

/**
 * THE QUESTIONS ASKED IN CAMPAIGNS, ON THE VOLUME (#6949 slice 6) — the log `domain/campaign-questions.ts`
 * describes, as plain JSON beside the discovery queue: a campaign scope, a subject, the first
 * asker's words and each asker's opaque key and display name (never an email). Reads are total and
 * writes atomic, the house `JsonFileStore` shape; a hand-edited entry that doesn't parse is dropped,
 * never served.
 */

function parseAsker(raw: unknown): Asker | undefined {
  if (!isRecord(raw)) return undefined;
  const { key, name } = raw;
  if (typeof key !== "string" || key.length === 0 || key.length > 64) return undefined;
  if (typeof name !== "string" || name.length === 0 || name.includes("@")) return undefined;
  return { key, name: name.slice(0, MAX_DISPLAY_NAME) };
}

function parseQuestion(raw: unknown): CampaignQuestion | undefined {
  if (!isRecord(raw)) return undefined;
  const { id, campaign, kind, subject, question, askedAt, askers } = raw;
  if (!(typeof campaign === "string" && SCOPE_RE.test(campaign))) return undefined;
  if (!isKind(kind) || typeof subject !== "string" || subject.length === 0) return undefined;
  if (id !== askId(kind, subject, campaign)) return undefined;
  if (typeof askedAt !== "string" || Number.isNaN(Date.parse(askedAt))) return undefined;
  if (!Array.isArray(askers)) return undefined;
  const people = askers.flatMap((a) => parseAsker(a) ?? []).slice(0, MAX_ASKERS);
  if (people.length === 0) return undefined;
  const words = cleanQuestion(question);
  return {
    id,
    campaign,
    kind,
    subject,
    ...(words ? { question: words } : {}),
    askedAt,
    askers: people,
  };
}

export function parseQuestionLog(raw: unknown): QuestionLog | undefined {
  if (!Array.isArray(raw)) return undefined;
  const seen = new Set<string>();
  const parsed = raw.flatMap((item) => {
    const q = parseQuestion(item);
    if (!q || seen.has(q.id)) return [];
    seen.add(q.id);
    return [q];
  });
  // A hand-edited file over the bound keeps each campaign's newest, the same end `recordQuestion` keeps.
  const left = new Map<string, number>();
  const kept: CampaignQuestion[] = [];
  for (const q of parsed.reverse()) {
    const n = left.get(q.campaign) ?? 0;
    if (n >= MAX_PER_CAMPAIGN) continue;
    left.set(q.campaign, n + 1);
    kept.unshift(q);
  }
  return kept;
}

export class CampaignQuestionsStore {
  private readonly file: JsonFileStore<QuestionLog>;

  constructor(path: string, onReadError?: (message: string) => void) {
    this.file = new JsonFileStore({
      path,
      parse: parseQuestionLog,
      empty: [],
      label: "campaign-questions",
      ...(onReadError ? { onReadError } : {}),
    });
  }

  load(): QuestionLog {
    return this.file.load();
  }

  write(log: QuestionLog): void {
    this.file.write(log);
  }
}

export function campaignQuestionsFilePath(env: NodeJS.ProcessEnv): string {
  return siblingPath(
    env.SKYNET_SUBSCRIPTIONS_FILE ?? "data/playbook-subscriptions.json",
    "campaign-questions.json",
  );
}

export function createCampaignQuestionsStore(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): CampaignQuestionsStore {
  return new CampaignQuestionsStore(campaignQuestionsFilePath(env), onReadError);
}
