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
