import { streamAnthropicMessage } from "../../companion/companion-anthropic-stream.js";
import {
  type CompanionMessage,
  type CompanionTurnInput,
  createCompanionChat,
} from "../../companion/companion-chat.js";
import type { FeedbackDraft } from "../../companion/companion-tools.js";
import { fetchJson } from "../../http/fetch-json.js";
import type { CompanionFixture } from "./fixture.js";
import { type DoFetch, type JudgeVerdict, judge } from "./judge.js";

export type DoStream = typeof streamAnthropicMessage;

/**
 * THE COMPANION EVAL RUNNER — #1672 slice 1. Drives each fixture through the REAL conversation
 * engine (`createCompanionChat`, the exact code path `/api/companion/chat` runs), round by round,
 * then grades the final reply against that fixture's rubric (`judge.ts`). `doFetch`/`doStream` are
 * injectable — real by default, fakeable in specs exactly like `tests/companion/companion-chat.spec.ts`
 * fakes the same seam, so this harness's plumbing is testable with no network and no key.
 */
export interface FixtureResult {
  readonly fixture: CompanionFixture;
  readonly replies: readonly string[];
  readonly drafts: readonly (FeedbackDraft | undefined)[];
  readonly verdict: JudgeVerdict;
}

export interface CompanionEvalReport {
  readonly results: readonly FixtureResult[];
  readonly passed: number;
  readonly total: number;
}

/** One fixture, every round. Each round's own visible text becomes the next round's "assistant"
 *  turn — the same shape the real rail feeds back (`moneypenny.ts`'s `transcript()`): a drafted
 *  filing never rejoins the MODEL-facing history, only the judge-facing one, so a handoff can't
 *  be mistaken by the next round's model call for something it already said. */
async function runFixture(
  fixture: CompanionFixture,
  apiKey: string,
  doFetch: DoFetch,
  doStream: DoStream,
): Promise<FixtureResult> {
  const companion = createCompanionChat({ apiKey }, doFetch, doStream);
  const modelHistory: CompanionMessage[] = [];
  const judgeReplies: string[] = [];
  const drafts: (FeedbackDraft | undefined)[] = [];

  for (const round of fixture.rounds) {
    modelHistory.push({ role: "user", content: round });
    const input: CompanionTurnInput = { messages: [...modelHistory], context: fixture.context };
    let text = "";
    let draft: FeedbackDraft | undefined;
    let error: string | undefined;
    await new Promise<void>((resolve) => {
      void companion(input, {
        onText: (chunk) => {
          text += chunk;
        },
        onDone: resolve,
        onError: (message) => {
          error = message;
          resolve();
        },
        onHandoff: (d) => {
          draft = d;
        },
      });
    });
    const visible = error ? `(error: ${error})` : text;
    modelHistory.push({ role: "assistant", content: visible });
    judgeReplies.push(
      draft
        ? `${visible}\n[drafted filing: kind=${draft.kind} title="${draft.title}" details="${draft.details}"]`
        : visible,
    );
    drafts.push(draft);
  }

  const verdict = await judge(doFetch, apiKey, fixture.rounds, judgeReplies, fixture.rubric);
  return { fixture, replies: judgeReplies, drafts, verdict };
}

/** Run every fixture in sequence — deliberately not parallel, so a rate-limit or a bad key fails
 *  fast and legibly rather than as a wall of concurrent errors. Fine at 15 fixtures; revisit if
 *  the set grows enough to matter. */
export async function runCompanionEval(
  fixtures: readonly CompanionFixture[],
  apiKey: string,
  doFetch: DoFetch = fetchJson,
  doStream: DoStream = streamAnthropicMessage,
): Promise<CompanionEvalReport> {
  const results: FixtureResult[] = [];
  for (const fixture of fixtures) {
    results.push(await runFixture(fixture, apiKey, doFetch, doStream));
  }
  return {
    results,
    passed: results.filter((r) => r.verdict.pass).length,
    total: results.length,
  };
}

export function formatCompanionReport(report: CompanionEvalReport): string {
  const lines = [`Companion eval: ${report.passed}/${report.total} passed`, ""];
  for (const r of report.results) {
    lines.push(`${r.verdict.pass ? "✓" : "✗"} [${r.fixture.category}] ${r.fixture.id}`);
    if (!r.verdict.pass) lines.push(`    ${r.verdict.reason}`);
  }
  return lines.join("\n");
}
