/**
 * The one place that touches `fetch`. Both Alpaca transports (Broker + Trading) call
 * through here, so JSON encoding, header defaults, and response parsing live once.
 */
export interface JsonResponse {
  readonly status: number;
  readonly body: unknown;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export async function fetchJson(
  method: HttpMethod,
  url: string,
  headers: Readonly<Record<string, string>>,
  body?: unknown,
  signal?: AbortSignal,
): Promise<JsonResponse> {
  const response = await fetch(url, {
    method,
    headers: { Accept: "application/json", "Content-Type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
    ...(signal ? { signal } : {}),
  });
  const text = await response.text();
  return {
    status: response.status,
    body: text.length > 0 ? JSON.parse(text) : null,
  };
}
