import { describe, expect, it } from "@rstest/core";
import { FOCUS_WORDS } from "../../scripts/steer/focus.mjs";
import { FRAME, REC, TODAY, view } from "./steer-focus-fixture";
import { type Docs, settle } from "./steer-pins-harness";

// The focused view in a JSDOM window (focus-client.js): it opens cropped, hides the pins and marks
// past the crop, switches to the whole screen and back on its one button, and a tap in the crop
// still saves a % of the WHOLE frame — plus whether the spot sat inside the focus box.

type Mark = { x: number; y: number; inFocus?: boolean } | null;
const marksOf = (docs: Docs) => Object.values((docs[REC]?.marks ?? {}) as Record<string, Mark>);

describe("the focused view", () => {
  it("opens cropped, hiding the pin past the crop and keeping the one inside it", async () => {
    const v = await view({});
    const shot = v.doc.querySelector<HTMLElement>(TODAY);
    expect(shot?.dataset.view).toBe("focus");
    expect(v.pin("today:phone:1").hidden).toBe(false);
    expect(v.pin("today:phone:2").hidden).toBe(true);
  });

  it("hides a mark painted back from outside the crop, and shows it on the whole screen", async () => {
    const id = "today:phone:mfar1";
    const v = await view({
      [REC]: {
        pins: { [id]: "up" },
        marks: { [id]: { x: 50, y: 95, at: "2026-10-14T18:00:00Z", beforeReveal: false } },
      },
    });
    const mark = () => v.doc.querySelector<HTMLElement>(`.pin[data-pin="${id}"]`);
    expect(mark()?.closest(".fplane")).not.toBeNull();
    expect(mark()?.hidden).toBe(true);
    await v.click(v.doc.querySelector(`${TODAY} .ftoggle`));
    expect(mark()?.hidden).toBe(false);
  });

  it("switches to the whole screen and back on its one button", async () => {
    const v = await view({});
    const btn = () => v.doc.querySelector<HTMLButtonElement>(`${TODAY} .ftoggle`);
    await v.click(btn());
    const shot = v.doc.querySelector<HTMLElement>(TODAY);
    expect(shot?.dataset.view).toBe("whole");
    expect(btn()?.textContent).toBe(FOCUS_WORDS.part);
    expect(btn()?.getAttribute("aria-pressed")).toBe("true");
    expect(v.pin("today:phone:2").hidden).toBe(false);
    await v.click(btn());
    expect(shot?.dataset.view).toBe("focus");
    expect(btn()?.textContent).toBe("Show the whole screen");
    expect(btn()?.getAttribute("aria-pressed")).toBe("false");
    expect(v.pin("today:phone:2").hidden).toBe(true);
  });

  it("places no mark when the button is pressed", async () => {
    const v = await view({});
    await v.click(v.doc.querySelector(`${TODAY} .ftoggle`));
    expect(v.doc.querySelectorAll(".pin.mark")).toHaveLength(0);
  });
});

describe("a tap in the cropped view", () => {
  /** Tap the window at (cx, cy) px — the crop's corner is the origin — and say Like. */
  async function tapAndLike(v: Awaited<ReturnType<typeof view>>, cx: number, cy: number) {
    const img = v.doc.querySelector(`${TODAY} .frame img`);
    img?.dispatchEvent(
      new v.window.MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        clientX: cx,
        clientY: cy,
      }),
    );
    await settle();
    await v.click(v.choices().find((c) => c.textContent?.includes("Like")));
  }

  it("saves the spot as % of the whole frame, and that it was in the focus", async () => {
    const docs: Docs = {};
    const v = await view(docs);
    // 100px right of the crop's corner is 16% of 500 + 100 = 180px of the frame: 36%; 100px down
    // is 36% of 1000 + 100 = 460px: 46% — inside the focus box {20, 40, 60, 20}.
    await tapAndLike(v, 100, 100);
    expect(marksOf(docs)).toEqual([expect.objectContaining({ x: 36, y: 46, inFocus: true })]);
    const mark = v.doc.querySelector<HTMLElement>(".pin.mark");
    expect(mark?.style.left).toBe("36%");
    expect(mark?.closest(".fplane")).not.toBeNull();
    expect(FRAME.width).toBe(500);
  });

  it("saves a spot in the crop's margin as outside the focus", async () => {
    const docs: Docs = {};
    const v = await view(docs);
    // 10px in: (80 + 10) / 500 = 18% across — left of the focus box, still inside the crop.
    await tapAndLike(v, 10, 10);
    expect(marksOf(docs)).toEqual([expect.objectContaining({ x: 18, y: 37, inFocus: false })]);
  });

  it("records no inFocus on a frame with no focus", async () => {
    const docs: Docs = {};
    const v = await view(docs);
    const img = v.doc.querySelector('.shot[data-option="A"] .frame img');
    img?.dispatchEvent(
      new v.window.MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        clientX: 200,
        clientY: 400,
      }),
    );
    await settle();
    await v.click(v.choices().find((c) => c.textContent?.includes("Like")));
    const [m] = marksOf(docs);
    expect(m).toMatchObject({ x: 50, y: 50 });
    expect(m && "inFocus" in m).toBe(false);
  });
});
