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
export const settle = async () => {
  for (let i = 0; i < 10; i++) await new Promise((r) => setTimeout(r, 5));
};

export async function open(
  docs: Docs | null,
  {
    html = pageOf(),
    before = (_w: Win): void => undefined,
    writes = [] as string[],
    gate = Promise.resolve(),
  } = {},
) {
  const { window } = new JSDOM(html, {
    runScripts: "dangerously",
    beforeParse(w) {
      if (docs)
        w.claude = {
          use: (name: string) =>
            Promise.resolve(name === "db" ? memoryStore(docs, writes, gate) : null),
        };
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
  return { window, doc, pin, pop, choices, click, choose, key, line };
}
