// A round-0 page that opens on clean frames (marks.mjs), for the marks, reveal and page-note specs:
// one problems question with `"opening": true`, three problems pinned on Today's one phone frame
// (plus a desk frame), each option naming its pin instead of carrying pictures. The JSDOM window
// gets a fixed 400×800 box for every element, so a tap at (x%, y%) of a frame lands where it says.
import { designDecisions, designRound } from "../../scripts/steer/design.mjs";
import { renderPage } from "../../scripts/steer/render.mjs";
import { type Docs, open, settle, type Win } from "./steer-pins-harness";

const NOW = "2026-10-14T15:00:00Z";
const pin = (n: number, x: number, y: number, label: string) => ({ n, x, y, label });
export const openingQuestion = (over: Record<string, unknown> = {}) => ({
  q: 1,
  kind: "problems",
  opening: true,
  title: "Which problem should the next round fix first?",
  ask: "Three problems on today's rules card.",
  rec: "B",
  today: {
    phone: "today-phone.jpg",
    desk: "today-desk.jpg",
    source: "scripts/redesign/shoot.mjs",
    caption: "Today, real screenshot.",
    pins: [pin(1, 30, 20, "the rule list"), pin(2, 50, 50, "the score"), pin(3, 70, 80, "footer")],
  },
  options: [
    { key: "A", name: "The rules read as a wall", delta: "Nine rules, one weight.", pin: 1 },
    { key: "B", name: "The score hides", delta: "The score sits mid-card.", pin: 2 },
    { key: "C", name: "The footer crowds", delta: "Two links fight the total.", pin: 3 },
  ],
  ...over,
});
export const tpOf = (q: Record<string, unknown> = openingQuestion(), round = 0) =>
  designRound({ 5200: designDecisions([q], { issue: 5200, round }) }, { now: NOW });
export const TP = tpOf();
export const REC = `tp/${TP.id}/decisions/5200-q1`;
export const META = `tp/${TP.id}`;
export const pageOf = (tp = TP) => renderPage(tp, { img: (p) => ("src" in p ? p.src : null) });

const BOX = { left: 0, top: 0, width: 400, height: 800, right: 400, bottom: 800, x: 0, y: 0 };
/** Every element is a 400×800 box at the origin (JSDOM lays nothing out). */
export const sized = (w: Win) => {
  w.HTMLElement.prototype.getBoundingClientRect = () => ({ ...BOX, toJSON: () => BOX }) as DOMRect;
};
export const view = (
  docs: Docs | null,
  { html = pageOf(), writes = [] as string[] }: { html?: string; writes?: string[] } = {},
) => open(docs, { html, before: sized, writes });

export type View = Awaited<ReturnType<typeof view>>;
/** The clean Today phone frame of the opening stage, or another frame by selector. */
export const CLEAN = '.opening .markable[data-option="today"][data-frame="phone"]';
/** Tap a frame's picture at x% across and y% down. */
export async function tapFrame(v: View, x: number, y: number, frame = CLEAN) {
  const img = v.doc.querySelector(`${frame} .frame img`);
  if (!img) throw new Error(`no picture in ${frame}`);
  img.dispatchEvent(
    new v.window.MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      clientX: x * 4,
      clientY: y * 8,
    }),
  );
  await settle();
}
export const marks = (v: View) => [...v.doc.querySelectorAll<HTMLButtonElement>(".pin.mark")];
export const choose = async (v: View, word: string) =>
  v.click(v.choices().find((c) => c.textContent?.includes(word)));
export const pressEscape = async (v: View) => {
  v.key("Escape");
  await settle();
};
