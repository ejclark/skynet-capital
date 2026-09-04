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
  if (text.length === 0) {
    return { status: response.status, body: null };
  }
  try {
    return { status: response.status, body: JSON.parse(text) };
  } catch {
    // A non-JSON body (an HTML error/challenge page from a proxy or WAF in front of the real
    // API, most often) throws a bare "Unexpected token '<'" with no way to tell an auth block
    // from a gateway outage from the wrong host — the status and a body snippet turn that into
    // an actionable log line instead of a callers' guessing game.
    throw new Error(
      `fetchJson: non-JSON response (status ${response.status}) from ${method} ${url}: ${text.slice(0, 200)}`,
    );
  }
}
