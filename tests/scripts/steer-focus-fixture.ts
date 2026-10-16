// A round page whose question carries a `focus` (focus.mjs), for the focus and outcome specs: one
// design question whose Today phone frame names its sections, with one pin inside the crop and one
// outside it. The focus is the section "Order card" ({20, 40, 60, 20}), so the crop — 4% round it —
// is {16, 36, 68, 28}. The options carry no sections, so they have no focus and render as before.
import { designDecisions, designRound } from "../../scripts/steer/design.mjs";
import { renderPage } from "../../scripts/steer/render.mjs";
import { type Docs, open, type Win } from "./steer-pins-harness";

const NOW = "2026-10-14T18:00:00Z";
export const SECTIONS = [
  { label: "The order card", x: 0, y: 30, w: 100, h: 40 },
  { label: "Order card", x: 20, y: 40, w: 60, h: 20 },
  { label: "Footer", x: 0, y: 90, w: 100, h: 10 },
];
export const focusQuestion = (over: Record<string, unknown> = {}) => ({
  q: 1,
  title: "How should the order card read?",
  rec: "A",
  focus: "order card",
  today: {
    phone: "today-phone.jpg",
    sections: SECTIONS,
    source: "scripts/redesign/shoot.mjs",
    caption: "Today.",
    pins: [
      { n: 1, x: 50, y: 50, label: "the order line" },
      { n: 2, x: 50, y: 10, label: "the header" },
    ],
  },
  options: [
    { key: "A", name: "Total first", delta: "The total moves up.", phone: "a.jpg" },
    { key: "B", name: "Nothing moves", delta: "The control.", phone: "b.jpg" },
  ],
  ...over,
});
export const roundOf = (q: Record<string, unknown> = focusQuestion()) =>
  designRound({ 5300: designDecisions([q], { issue: 5300, round: 2 }) }, { now: NOW });
export const ROUND = roundOf();
export const REC = `tp/${ROUND.id}/decisions/5300-q1`;
export const pageOf = (tp = ROUND) => renderPage(tp, { img: (p) => ("src" in p ? p.src : null) });

/** The focused Today frame. */
export const TODAY = '.shot[data-option="today"][data-frame="phone"]';
/** The whole frame is 500 × 1000 CSS px; in the focused view the crop's corner is at the window's
 *  origin, so the frame's own box starts 16% and 36% of it up and to the left — as real layout
 *  places the plane inside the clip. Every other element is a 400 × 800 box at the origin. */
export const FRAME = { width: 500, height: 1000 };
const rect = (left: number, top: number, width: number, height: number) =>
  ({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  }) as DOMRect;
export const laidOut = (w: Win) => {
  w.HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    if (this.matches(".frame") && this.closest('.shot[data-view="focus"]'))
      return rect(-0.16 * FRAME.width, -0.36 * FRAME.height, FRAME.width, FRAME.height);
    return rect(0, 0, 400, 800);
  };
};
export const view = (docs: Docs | null, html = pageOf()) => open(docs, { html, before: laidOut });
