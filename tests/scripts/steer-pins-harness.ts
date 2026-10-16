// The round page in a JSDOM window, for the pin specs (steer-pins-client, steer-pin-notes): one
// design question whose option B carries two pins, an in-memory store with db.d.ts's semantics, and
// the taps a spec needs. `gate` makes the store slow: its reads wait until the spec releases them,
// so a tap lands while the page is still connecting (#5243).
import { createRequire } from "node:module";
import { designDecisions, designRound } from "../../scripts/steer/design.mjs";
import { renderPage } from "../../scripts/steer/render.mjs";

export type Win = Window & typeof globalThis & { claude?: unknown };
const { JSDOM } = createRequire(import.meta.url)("jsdom") as {
  JSDOM: new (
    html: string,
    opts: { runScripts: "dangerously"; beforeParse: (w: Win) => void },
  ) => { window: Win };
};

const NOW = "2026-10-11T18:00:00Z";
const pic = (k: string) => ({ phone: `${k}-phone.jpg`, desk: `${k}-desk.jpg` });
export const question = (over: Record<string, unknown> = {}) => ({
  q: 1,
  title: "What leads the trade form at phone width?",
  rec: "B",
  today: { ...pic("today"), source: "scripts/redesign/shoot.mjs", caption: "Today." },
  options: [
    { key: "A", name: "The chain first", delta: "Nothing moves.", ...pic("A") },
    {
      key: "B",
      name: "The order sentence first",
      delta: "The order sentence moves up.",
      ...pic("B"),
      pins: [
        { n: 1, x: 50, y: 12, label: "range strip" },
        { n: 2, x: 30, y: 40, label: "order line" },
      ],
    },
  ],
  ...over,
});
export const roundOf = (q = question(), round = 1) =>
  designRound({ 5150: designDecisions([q], { issue: 5150, round }) }, { now: NOW });
export const ROUND = roundOf();
export const REC = `tp/${ROUND.id}/decisions/5150-q1`;
export const pageOf = (tp = ROUND) => renderPage(tp, { img: (p) => ("src" in p ? p.src : null) });

export type Docs = Record<string, Record<string, unknown>>;
/** `update` as db.d.ts defines it: nested objects merge recursively, anything else replaces. */
function merge(into: Record<string, unknown>, body: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...into };
  for (const [k, v] of Object.entries(body)) {
    const was = out[k];
    const both = [v, was].every((x) => x && typeof x === "object" && !Array.isArray(x));
    out[k] = both ? merge(was as Record<string, unknown>, v as Record<string, unknown>) : v;
  }
  return out;
}
/** The store surface the page uses (db.d.ts): doc get / set / update / onSnapshot, collection get.
 *  Every read waits for `gate`. */
function memoryStore(docs: Docs, writes: string[], gate: Promise<void>) {
  const snap = (path: string) => ({ exists: path in docs, data: () => docs[path] });
  return {
    doc: (path: string) => ({
      get: () => gate.then(() => snap(path)),
      set: (body: Record<string, unknown>) => {
        writes.push(`set ${path}`);
        docs[path] = JSON.parse(JSON.stringify(body));
        return Promise.resolve();
      },
      update: (body: Record<string, unknown>) => {
        writes.push(`update ${path}`);
        if (!(path in docs)) return Promise.reject({ code: "invalid_argument" });
        docs[path] = merge(docs[path] ?? {}, JSON.parse(JSON.stringify(body)));
        return Promise.resolve();
      },
      onSnapshot: () => () => undefined,
    }),
    collection: (path: string) => ({
      get: () =>
        gate.then(() => ({
          docs: Object.entries(docs)
            .filter(([p]) => p.startsWith(`${path}/`) && !p.slice(path.length + 1).includes("/"))
            .map(([p, v]) => ({ id: p.slice(path.length + 1), data: () => v })),
        })),
    }),
  };
}
/** Let every promise chain the page started run to its end (a store read, then the write that
 *  follows it). It yields to the event loop ten times rather than sleeping 50 ms of wall clock, so
 *  how long it takes is CPU work and never a timer a busy machine can overrun (#5498). */
export const settle = async () => {
  for (let i = 0; i < 10; i++) await new Promise((r) => setImmediate(r));
};

/** The page's clock, in the spec's hands (#5498). A debounce the page waits out in real time — a
 *  note saves 900 ms after the last keystroke — made a spec sleep 1000 ms and hope the save had
 *  landed: a 100 ms margin a saturated machine overruns. `open(…, { frozen: true })` swaps the
 *  page's `setTimeout` for this one, and `v.tick(ms)` moves time and runs what comes due, in order, then
 *  settles the promises those callbacks started. Nothing fires until a spec ticks. */
export function pageClock() {
  let now = 0;
  let next = 1;
  const due = new Map<number, { at: number; run: () => void }>();
  return {
    install(w: Win) {
      w.setTimeout = ((fn: TimerHandler, ms = 0, ...args: unknown[]) => {
        const id = next++;
        due.set(id, {
          at: now + Number(ms),
          run: () => (fn as (...a: unknown[]) => void)(...args),
        });
        return id;
      }) as typeof w.setTimeout;
      w.clearTimeout = ((id?: number) => {
        if (id !== undefined) due.delete(id);
      }) as typeof w.clearTimeout;
    },
    async tick(ms: number) {
      const to = now + ms;
      for (;;) {
        const soonest = [...due.entries()]
          .filter(([, t]) => t.at <= to)
          .sort((a, b) => a[1].at - b[1].at)[0];
        if (!soonest) break;
        due.delete(soonest[0]);
        now = Math.max(now, soonest[1].at);
        soonest[1].run();
        await settle();
      }
      now = to;
      await settle();
    },
  };
}

export async function open(
  docs: Docs | null,
  {
    html = pageOf(),
    before = (_w: Win): void => undefined,
    writes = [] as string[],
    gate = Promise.resolve(),
    /** The store itself arrives only when this settles (`use("db")` pending), as #5247 specs it. */
    late = Promise.resolve(),
    /** The page's timers wait for `v.tick(ms)` instead of real time (see `pageClock`). */
    frozen = false,
  } = {},
) {
  const clock = frozen ? pageClock() : undefined;
  const { window } = new JSDOM(html, {
    runScripts: "dangerously",
    beforeParse(w) {
      if (docs)
        w.claude = {
          use: (name: string) =>
            name === "db"
              ? late.then(() => memoryStore(docs, writes, gate))
              : Promise.resolve(null),
        };
      clock?.install(w);
      before(w);
    },
  });
  await settle();
  const doc = window.document;
  const pin = (id: string) =>
    doc.querySelector<HTMLButtonElement>(`.pin[data-pin="${id}"]`) as HTMLButtonElement;
  const pop = () => doc.querySelector<HTMLElement>(".pinpop");
  const choices = () => [...doc.querySelectorAll<HTMLButtonElement>(".pinpop .pc")];
  const click = async (el: Element | null | undefined) => {
    (el as HTMLElement).click();
    await settle();
  };
  const choose = async (id: string, word: string) => {
    await click(pin(id));
    await click(choices().find((c) => c.textContent?.includes(word)));
  };
  const key = (k: string) =>
    doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: k, bubbles: true }));
  const line = () => doc.getElementById("save-state")?.textContent ?? "";
  const tick = (ms: number) =>
    clock
      ? clock.tick(ms)
      : Promise.reject(new Error("open with { frozen: true } to tick the page's clock"));
  return { window, doc, pin, pop, choices, click, choose, key, line, tick };
}
