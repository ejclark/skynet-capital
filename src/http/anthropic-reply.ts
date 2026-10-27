import type { JsonResponse } from "./fetch-json.js";

/**
 * The response-validation preamble every Anthropic Messages API caller needs (`feedback-coach.ts`
 * and `companion-chat.ts` each drafted this independently before `scripts/clone-scan.mjs` flagged
 * the paste — promoted here rather than kept twice). A non-200 status or a body that isn't a JSON
 * object reads as one honest error string naming the caller (`label`) plus the upstream's own
 * error text when it has one. Returns `undefined` for a usable 200 JSON object — extracting the
 * actual `content` shape out of it stays the caller's job, since a single-turn reply (the coach)
 * and a tool-capable one (the companion) want different slices of it.
 */
export function anthropicApiError(res: JsonResponse, label: string): string | undefined {
  if (res.status === 200 && res.body && typeof res.body === "object") return undefined;
  const message =
    res.body && typeof res.body === "object"
      ? ((res.body as { error?: { message?: string } }).error?.message ?? "")
      : "";
  return `${label} responded ${res.status}${message ? `: ${message}` : ""}`;
}

/** The token counts a Messages API reply reports under `usage` — on a buffered reply's body, or
 *  split across a stream's `message_start` (input + cache) and `message_delta` (output). */
export interface AnthropicUsage {
  readonly input_tokens?: number;
  readonly output_tokens?: number;
  readonly cache_read_input_tokens?: number;
  readonly cache_creation_input_tokens?: number;
}

/** The `usage` object off a reply body or a stream event, or undefined when it carries none. */
export function usageOf(value: unknown): AnthropicUsage | undefined {
  const usage = (value as { usage?: unknown } | undefined)?.usage;
  return usage && typeof usage === "object" ? (usage as AnthropicUsage) : undefined;
}

/**
 * One line per completed Claude call (#6080) — the token accounting a prompt or cache change is
 * measured against. Key=value so `fly logs | grep claude-usage` sums by surface (`label`). `log` is
 * the sink a composition root under `src/scripts/` wires to stdout (the same injected-`logLine`
 * seam as `dashboard-server-config.ts`); a caller with no sink logs nothing. A reply that reported
 * no `usage` (only a fake in a spec does) logs nothing rather than a line of zeros.
 */
export function logAnthropicUsage(
  label: string,
  model: string,
  usage: AnthropicUsage | undefined,
  log: ((line: string) => void) | undefined,
): void {
  if (!(usage && log)) return;
  const n = (v: number | undefined): number => (typeof v === "number" ? v : 0);
  log(
    `claude-usage surface=${label} model=${model} input=${n(usage.input_tokens)} ` +
      `output=${n(usage.output_tokens)} cache_read=${n(usage.cache_read_input_tokens)} ` +
      `cache_creation=${n(usage.cache_creation_input_tokens)}`,
  );
}
