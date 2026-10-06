import { anthropicApiError } from "../../http/anthropic-reply.js";
import type { fetchJson, JsonResponse } from "../../http/fetch-json.js";

/**
 * THE JUDGE — one non-streaming call per fixture, grading the FINAL reply against that fixture's
 * own rubric. A fixed, capable model independent of `companion-model.ts`'s dial: judging prose
 * against a rubric is a different job than answering a member, and the judge must not silently
 * change tier every time the companion's own dial does. Not envelope-protected — it's an eval
 * tool, not the runtime per-token bill `companion-model.ts` guards.
 *
 * Deliberately unvalidated against human labels for this first slice (`docs/COMPUTE.md`'s "eval
 * as PR gate" pattern starts once a baseline exists — see #1672 slice 5); this is the harness the
 * validation pass will run against, not the validation itself.
 */
const JUDGE_MODEL = "claude-sonnet-5-5";
/** Thinking counts toward max_tokens (adaptive thinking runs when `thinking` is omitted), so this
 *  leaves room for it plus the two-field verdict. */
const JUDGE_MAX_TOKENS = 16000;
const JUDGE_URL = "https://api.anthropic.com/v1/messages";

const JUDGE_SYSTEM_PROMPT = `You are grading one turn of a customer-support AI assistant ("Moneypenny") against a rubric written by the team that built her. You will see the full transcript of a scripted conversation and a rubric describing what her FINAL reply must and must not do.

Grade ONLY the final reply, using the earlier turns as context for whether it reversed, held, or drifted from them. Be strict: a reply that is *mostly* right but violates one explicit "must not" in the rubric is a fail.

Your verdict has two fields: "pass" (true or false) and "reason" — one or two sentences citing the specific line or omission that decided it.`;

/** The verdict's shape, enforced by the API (`output_config.format`) rather than asked for in
 *  prose — it holds on every reply except a `refusal` or `max_tokens` stop, which `judge` names. */
const VERDICT_SCHEMA = {
  type: "object",
  properties: { pass: { type: "boolean" }, reason: { type: "string" } },
  required: ["pass", "reason"],
  additionalProperties: false,
} as const;

export interface JudgeVerdict {
  readonly pass: boolean;
  readonly reason: string;
}

export type DoFetch = typeof fetchJson;

function transcriptBlock(rounds: readonly string[], replies: readonly string[]): string {
  return rounds
    .map(
      (round, i) =>
        `Member (round ${i + 1}): ${round}\nMoneypenny (round ${i + 1}): ${replies[i] ?? "(no reply)"}`,
    )
    .join("\n\n");
}

function parseVerdict(text: string): JudgeVerdict {
  try {
    const parsed = JSON.parse(text) as { pass?: unknown; reason?: unknown };
    return {
      pass: parsed.pass === true,
      reason: typeof parsed.reason === "string" ? parsed.reason : "(no reason given)",
    };
  } catch {
    return { pass: false, reason: `judge JSON failed to parse: ${text.slice(0, 200)}` };
  }
}

/** Grade one fixture's replies against its own rubric. Never throws — a transport or shape
 *  failure comes back as a failing verdict naming the problem, so one bad call doesn't crash the
 *  whole eval run. */
export async function judge(
  doFetch: DoFetch,
  apiKey: string,
  rounds: readonly string[],
  replies: readonly string[],
  rubric: string,
): Promise<JudgeVerdict> {
  const prompt = `RUBRIC:\n${rubric}\n\nTRANSCRIPT:\n${transcriptBlock(rounds, replies)}`;
  let res: JsonResponse;
  try {
    res = await doFetch(
      "POST",
      JUDGE_URL,
      { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      {
        model: JUDGE_MODEL,
        max_tokens: JUDGE_MAX_TOKENS,
        system: JUDGE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
        output_config: { format: { type: "json_schema", schema: VERDICT_SCHEMA } },
      },
    );
  } catch (error) {
    return {
      pass: false,
      reason: `judge call failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
  const apiError = anthropicApiError(res, "companion-eval judge");
  if (apiError) return { pass: false, reason: apiError };
  const body = res.body as {
    stop_reason?: string;
    content?: readonly { type: string; text?: string }[];
  };
  if (body.stop_reason === "refusal")
    return { pass: false, reason: "judge declined to grade (stop_reason: refusal)" };
  if (body.stop_reason === "max_tokens")
    return { pass: false, reason: "judge ran out of tokens before its verdict" };
  const text = (body.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("");
  return parseVerdict(text);
}
