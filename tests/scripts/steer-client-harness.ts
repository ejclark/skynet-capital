import { createRequire } from "node:module";
import { renderPage } from "../../scripts/steer/render.mjs";
import { fixture, ROUND } from "./steer-fixture";

// The decisions page's script in a JSDOM window, with a fake store and comments surface — shared by
// steer-client.spec.ts and steer-listening.spec.ts.

export type Win = Window & typeof globalThis & { claude?: unknown };
const { JSDOM } = createRequire(import.meta.url)("jsdom") as {
  JSDOM: new (
    html: string,
    opts: { runScripts: "dangerously"; beforeParse: (w: Win) => void },
  ) => { window: Win };
};

export const page = renderPage(fixture());
export const N = fixture().decisions.length;
/** The round's own document: the page's meta, and what the session writes back. */
export const META = `tp/${ROUND}`;

export type Docs = Record<string, Record<string, unknown>>;
type Snap = { exists: boolean; data: () => Record<string, unknown> | undefined };
const isMap = (v: unknown): v is Record<string, unknown> =>
  Boolean(v) && typeof v === "object" && !Array.isArray(v);
/** `update`'s merge (db.d.ts): nested objects merge recursively; anything else replaces. */
function merged(into: Record<string, unknown>, body: Record<string, unknown>) {
  const out = { ...into };
  for (const [k, v] of Object.entries(body))
    out[k] = isMap(v) && isMap(out[k]) ? merged(out[k] as Record<string, unknown>, v) : v;
  return out;
}
/** The store's surface the page uses (contract db.d.ts): a doc's get / set / update / onSnapshot
 *  and a collection's get. `update` merges recursively and requires the doc, as the contract's does; every
 *  write reaches the doc's listeners, so a test calling `update` plays the session's ArtifactData
 *  update. */
export function store(docs: Docs, { fail = false } = {}) {
  const read = <T>(v: T) => (fail ? Promise.reject(new Error("unreadable")) : Promise.resolve(v));
  const listeners = new Map<string, Set<(s: Snap) => void>>();
  const errors = new Map<string, (e: { code: string; message: string }) => void>();
  const snap = (path: string): Snap => ({ exists: path in docs, data: () => docs[path] });
  const notify = (path: string) => {
    for (const next of listeners.get(path) ?? []) next(snap(path));
  };
  const subscribed: string[] = [];
  /** Writes reject from now on, as a full store does (`quota_exceeded`). */
  let full = false;
  const rejectFull = () => Promise.reject({ code: "quota_exceeded", message: "full" });
  return {
    subscribed,
    fill: () => {
      full = true;
    },
    /** End the doc's subscription with a terminal error, as db.d.ts allows (`revoked`, …). */
    kill: (path: string, code = "revoked") => {
      listeners.delete(path);
      errors.get(path)?.({ code, message: "terminal" });
    },
    doc: (path: string) => ({
      get: () => read(snap(path)),
      set: (body: Record<string, unknown>) => {
        if (full) return rejectFull();
        docs[path] = body;
        notify(path);
        return Promise.resolve();
      },
      update: (body: Record<string, unknown>) => {
        if (full) return rejectFull();
        if (!(path in docs)) return Promise.reject({ code: "invalid_argument", message: "absent" });
        docs[path] = merged(docs[path] ?? {}, body);
        notify(path);
        return Promise.resolve();
      },
      onSnapshot: (
        next: (s: Snap) => void,
        error?: (e: { code: string; message: string }) => void,
      ) => {
        subscribed.push(path);
        const set = listeners.get(path) ?? new Set();
        set.add(next);
        listeners.set(path, set);
        if (error) errors.set(path, error);
        setTimeout(() => next(snap(path)), 0);
        return () => set.delete(next);
      },
    }),
    collection: (path: string) => ({
      get: () =>
        read({
          docs: Object.entries(docs)
            .filter(([p]) => p.startsWith(`${path}/`) && !p.slice(path.length + 1).includes("/"))
            .map(([p, v]) => ({ id: p.slice(path.length + 1), data: () => v })),
        }),
    }),
  };
}

type Target = { anchor?: unknown; threadId?: string; text: string };
export const ANCHOR = { path: "div.bar", x: 10, y: 20 };
/** The comments surface the page uses (contract comments.d.ts): canSendToClaude, anchorFor and
 *  sendToClaude, each call recorded. `send` decides what a send does: resolve, or reject a code. */
export function commentsWith({
  can = "available",
  send = () => Promise.resolve({ threadId: "t1", commentId: "c1" }),
  anchor = () => Promise.resolve(ANCHOR),
}: {
  can?: string;
  send?: (t: Target) => Promise<unknown>;
  anchor?: () => Promise<unknown>;
} = {}) {
  const sent: Target[] = [];
  const anchored: Element[] = [];
  const api = {
    canSendToClaude: () => Promise.resolve(can),
    anchorFor: (el: Element) => {
      anchored.push(el);
      return anchor();
    },
    sendToClaude: (t: Target) => {
      sent.push(t);
      return send(t);
    },
  };
  return { api, sent, anchored };
}

export const claudeWith = (db: unknown, comments: unknown = null) => ({
  use: (name: string) =>
    name === "db" ? db : Promise.resolve(name === "comments" ? comments : null),
});
export const settle = async () => {
  for (let i = 0; i < 10; i++) await new Promise((r) => setTimeout(r, 5));
};

/** Open the built page (or `html`), with or without a `window.claude`, and record every line the
 *  bar shows. `before` runs on the window before the page's script does. */
export async function open(claude?: unknown, html = page, before?: (w: Win) => void) {
  const shown: string[] = [];
  const { window } = new JSDOM(html, {
    runScripts: "dangerously",
    beforeParse(w) {
      if (claude) w.claude = claude;
      before?.(w);
      new w.MutationObserver((records) => {
        for (const r of records) {
          if ((r.target as Element).id !== "save-state") continue;
          for (const n of r.addedNodes) shown.push(n.textContent ?? "");
        }
      }).observe(w.document, { childList: true, subtree: true });
    },
  });
  await settle();
  const doc = window.document;
  return {
    doc,
    shown,
    line: doc.getElementById("save-state")?.textContent ?? "",
    controls: [
      ...doc.querySelectorAll<HTMLButtonElement | HTMLTextAreaElement>(".rb, [data-note]"),
    ],
    pressed: doc.querySelectorAll('[aria-pressed="true"]').length,
  };
}

/** A round Eric has opened and answered all but one decision of. */
export function answered(meta: Record<string, unknown> = {}): Docs {
  const docs: Docs = { [META]: { openedAt: "2026-10-10T21:30:00Z", taps: [], ...meta } };
  for (const d of fixture().decisions.slice(0, N - 1))
    docs[`tp/${ROUND}/decisions/${d.key}`] = { verdict: "more" };
  return docs;
}
/** The page open on `docs`, with helpers to read an element, press a control and read Done's line. */
export async function openWith(docs: Docs, comments: unknown = commentsWith().api) {
  const db = store(docs);
  const v = await open(claudeWith(Promise.resolve(db), comments));
  const el = (id: string) => v.doc.getElementById(id) as HTMLElement;
  const press = async (id: string) => {
    (el(id) as HTMLButtonElement).click();
    await settle();
  };
  const told = () => (el("told").hidden ? "" : (el("told").textContent ?? ""));
  return { ...v, db, el, press, told };
}
