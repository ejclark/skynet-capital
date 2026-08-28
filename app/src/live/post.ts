/**
 * The one JSON-POST helper every write in the shell rides — same-origin credentials, an explicit
 * application/json content type (the server's CSRF seam requires it), and non-2xx surfaced as a
 * thrown error carrying the server's own sentence when it sent one.
 */
export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(detail.error ?? `POST ${url} → ${res.status}`);
  }
  return (await res.json()) as T;
}
