import type { IncomingMessage, ServerResponse } from "node:http";
import { readBody } from "./page-shell.js";

/**
 * `/invite`'s owner gate and GET/POST form dispatch — the last surviving corner of what used to
 * be a much larger self-service module (`/add`/`/rotate` moved to the shell's own JSON APIs in
 * #738; the rest of this file was deleted whole in phase 9f-2). What's left is kept here only
 * because `invite-form.ts` is envelope-protected ("the invite gate — who gets into the shared
 * universe") and stays frozen pending Eric's own sign-off, and its `handleInvite` still calls
 * both of these.
 */

/**
 * The owner gate the admin forms share: resolves the viewer to a lowercased owner email, or
 * writes the 403 and returns null. Deliberately identical for "not signed in" and "signed in but
 * not an owner" — a member probing an owner page learns nothing about whether it exists.
 */
export function requireOwner(
  res: ServerResponse,
  viewerEmail: string | undefined,
  isOwner: (email: string) => boolean,
  page: (title: string, inner: string) => string,
): string | null {
  const email = viewerEmail?.toLowerCase();
  if (email && isOwner(email)) return email;
  res.writeHead(403, { "content-type": "text/html; charset=utf-8" });
  res.end(page("Not available", `<p class="err">This page isn't available on your account.</p>`));
  return null;
}

/** "GET serves a form, POST parses it and submits" — only the form fields and the
 *  submit/render callbacks differ between callers. */
export async function handleSelfServiceForm<TResult extends { ok: boolean }>(
  req: IncomingMessage,
  res: ServerResponse,
  method: string,
  renderForm: () => string,
  submit: (form: URLSearchParams) => Promise<TResult>,
  renderResult: (result: TResult) => string,
): Promise<void> {
  if (method === "GET") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(renderForm());
    return;
  }
  if (method !== "POST") {
    res.writeHead(405, { "content-type": "text/plain" });
    res.end("method not allowed");
    return;
  }
  await submitSelfServiceForm(req, res, submit, renderResult);
}

/** Just the POST half — for routes whose GET does something other than render a form. */
async function submitSelfServiceForm<TResult extends { ok: boolean }>(
  req: IncomingMessage,
  res: ServerResponse,
  submit: (form: URLSearchParams) => Promise<TResult>,
  renderResult: (result: TResult) => string,
): Promise<void> {
  const form = new URLSearchParams(await readBody(req));
  const result = await submit(form);
  res.writeHead(result.ok ? 200 : 400, { "content-type": "text/html; charset=utf-8" });
  res.end(renderResult(result));
}
