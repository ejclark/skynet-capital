import { describe, expect, it } from "@rstest/core";
import { pickerInitScript } from "../../scripts/study/measure-picker.mjs";
import type { PickerOption, PickerState } from "../../scripts/study/picker.mjs";
import {
  dropdownPlacement,
  nativePickerOf,
  opensPicker,
  pickerMode,
  pickerStep,
} from "../../scripts/study/picker.mjs";

// The native picker's stand-in (#4943): headless Chromium never paints a <select>'s popup into a
// frame, so the recorder draws the platform's picker in the page. These are its rules — the page
// runs these very functions (measure-picker.mjs composes their source into the init script).

const OPTIONS: PickerOption[] = [
  { value: "all", label: "All accounts" },
  { value: "eric", label: "Eric · Human" },
  { value: "sauron", label: "Sauron · Bot" },
  { value: "old", label: "Retired · Bot", disabled: true },
];

const open = (index = 1, mode: "sheet" | "dropdown" = "sheet") =>
  pickerStep(null, { type: "open", mode, name: "Account", options: OPTIONS, index });

const openState = (index = 1): PickerState => open(index).state as PickerState;

describe("pickerMode — the platform's shape for a frame", () => {
  it("is a bottom sheet on a touch screen and a dropdown list otherwise", () => {
    expect(pickerMode(true)).toBe("sheet");
    expect(pickerMode(false)).toBe("dropdown");
  });
});

describe("opensPicker — which taps open the stand-in", () => {
  it("opens on a tap on a single-choice select, on either platform", () => {
    expect(opensPicker({ kind: "select" }, "sheet")).toBe(true);
    expect(opensPicker({ kind: "select", size: 1 }, "dropdown")).toBe(true);
  });

  it("never opens on a disabled select, a multiple select, or a size>1 list box (no popup)", () => {
    expect(opensPicker({ kind: "select", disabled: true }, "sheet")).toBe(false);
    expect(opensPicker({ kind: "select", multiple: true }, "dropdown")).toBe(false);
    expect(opensPicker({ kind: "select", size: 4 }, "sheet")).toBe(false);
  });

  it("opens on the select's label on a phone, where focus opens the picker, but not on a desktop", () => {
    expect(opensPicker({ kind: "label" }, "sheet")).toBe(true);
    expect(opensPicker({ kind: "label" }, "dropdown")).toBe(false);
    expect(opensPicker({ kind: "label", disabled: true }, "sheet")).toBe(false);
  });

  it("ignores anything that is not a select or its label", () => {
    expect(opensPicker(null, "sheet")).toBe(false);
    expect(opensPicker({ kind: "button" }, "sheet")).toBe(false);
  });
});

describe("pickerStep — the stand-in's state machine", () => {
  it("opens with every row's label and the current value, and records an opened moment", () => {
    const r = open(1);
    expect(r.state).toEqual({ mode: "sheet", name: "Account", options: OPTIONS, index: 1 });
    expect(r.set).toBeNull();
    expect(r.moment).toEqual({
      event: "opened",
      name: "Account",
      options: ["All accounts", "Eric · Human", "Sauron · Bot", "Retired · Bot"],
      value: "eric",
      label: "Eric · Human",
    });
  });

  it("choosing another row closes it and sets the select — the value a person's choice sets", () => {
    const r = pickerStep(openState(1), { type: "choose", index: 0 });
    expect(r.state).toBeNull();
    expect(r.set).toEqual({ index: 0, value: "all" });
    expect(r.moment).toMatchObject({
      event: "chose",
      value: "all",
      label: "All accounts",
      changed: true,
      from: "eric",
    });
  });

  it("choosing the current row closes it with no change, so no input or change event fires", () => {
    const r = pickerStep(openState(1), { type: "choose", index: 1 });
    expect(r.state).toBeNull();
    expect(r.set).toBeNull();
    expect(r.moment).toMatchObject({ event: "chose", value: "eric", changed: false });
  });

  it("a disabled or missing row takes no tap: the picker stays open and nothing is recorded", () => {
    const s = openState(1);
    for (const index of [3, 9, -1]) {
      const r = pickerStep(s, { type: "choose", index });
      expect(r.state).toBe(s);
      expect(r.moment).toBeNull();
      expect(r.set).toBeNull();
    }
  });

  it("a tap elsewhere, Escape, Tab, or a scroll closes it with no change and says how", () => {
    for (const via of ["outside", "escape", "tab", "scroll", "navigation"]) {
      const r = pickerStep(openState(2), { type: "dismiss", via });
      expect(r.state).toBeNull();
      expect(r.set).toBeNull();
      expect(r.moment).toMatchObject({ event: "dismissed", via, value: "sauron" });
    }
    expect(pickerStep(openState(2), { type: "dismiss" }).moment?.via).toBe("outside");
  });

  it("tapping the select again while it is open closes it, as the native control does", () => {
    const r = pickerStep(openState(1), { type: "open", mode: "dropdown", options: OPTIONS });
    expect(r.state).toBeNull();
    expect(r.moment).toMatchObject({ event: "dismissed", via: "select" });
  });

  it("Enter chooses the current row; with no current row it closes, via enter", () => {
    expect(pickerStep(openState(2), { type: "confirm" }).moment).toMatchObject({
      event: "chose",
      changed: false,
      value: "sauron",
    });
    const blank = open(-1).state as PickerState;
    expect(pickerStep(blank, { type: "confirm" }).moment).toMatchObject({
      event: "dismissed",
      via: "enter",
      value: null,
    });
  });

  it("leaves a hidden option out, as the native popup does: never listed, never chosen", () => {
    const options = [...OPTIONS.slice(0, 3), { value: "x", label: "Hidden", hidden: true }];
    const s = pickerStep(null, { type: "open", mode: "sheet", name: "A", options, index: 1 });
    expect(s.moment?.options).toEqual(["All accounts", "Eric · Human", "Sauron · Bot"]);
    const tap = pickerStep(s.state, { type: "choose", index: 3 });
    expect(tap).toEqual({ state: s.state, moment: null, set: null });
    const onHidden = pickerStep(null, { type: "open", mode: "sheet", options, index: 3 });
    expect(pickerStep(onHidden.state, { type: "confirm" }).moment).toMatchObject({
      event: "dismissed",
      via: "enter",
    });
  });

  it("does nothing while closed except open", () => {
    for (const event of [
      { type: "choose", index: 0 } as const,
      { type: "dismiss", via: "escape" } as const,
      { type: "confirm" } as const,
    ]) {
      expect(pickerStep(null, event)).toEqual({ state: null, moment: null, set: null });
    }
  });

  it("an open with no selected index or options still opens, reporting no current value", () => {
    const r = pickerStep(null, { type: "open", mode: "sheet" });
    expect(r.state).toEqual({ mode: "sheet", name: "", options: [], index: -1 });
    expect(r.moment).toMatchObject({ event: "opened", value: null, label: null, options: [] });
  });
});

describe("dropdownPlacement — where the desktop list goes", () => {
  const rect = { left: 100, top: 200, bottom: 230, width: 180 };

  it("hangs under the select at its left edge, at least its width, as tall as its rows", () => {
    const p = dropdownPlacement({ rect, vw: 1280, vh: 900, rows: 4 });
    expect(p).toEqual({ left: 100, top: 230, maxHeight: 4 * 22 + 10, minWidth: 180, down: true });
  });

  it("flips above the select when the room below is short and there is more above", () => {
    const low = { left: 100, top: 800, bottom: 830, width: 180 };
    const p = dropdownPlacement({ rect: low, vw: 1280, vh: 900, rows: 10 });
    expect(p.down).toBe(false);
    expect(p.top + p.maxHeight).toBe(800);
  });

  it("caps the list at the room there is, so a long list scrolls inside instead of off the frame", () => {
    const p = dropdownPlacement({ rect, vw: 1280, vh: 900, rows: 200 });
    expect(p.down).toBe(true);
    expect(p.maxHeight).toBe(900 - 230 - 4);
  });

  it("is clamped inside the frame on the right", () => {
    const edge = { left: 1200, top: 200, bottom: 230, width: 180 };
    expect(dropdownPlacement({ rect: edge, vw: 1280, vh: 900, rows: 2 }).left).toBe(1100);
  });
});

describe("nativePickerOf — the trace record's nativePicker", () => {
  it("is null when the page logged no picker moment during the action", () => {
    expect(nativePickerOf([])).toBeNull();
    expect(nativePickerOf(undefined)).toBeNull();
  });

  it("is the moment, without its page timestamp", () => {
    const m = { ...(open(1).moment as NonNullable<ReturnType<typeof open>["moment"]>), t: 812 };
    expect(nativePickerOf([m])).toEqual(open(1).moment);
  });

  it("keeps the last of several, the state the frame shows, and says how many there were", () => {
    const opened = open(1).moment as NonNullable<ReturnType<typeof open>["moment"]>;
    const chose = pickerStep(openState(1), { type: "choose", index: 2 }).moment;
    expect(nativePickerOf([opened, chose as typeof opened])).toMatchObject({
      event: "chose",
      value: "sauron",
      of: 2,
    });
  });
});

describe("pickerInitScript — the page runs these very rules", () => {
  it("composes installPicker with picker.mjs's functions into one parseable script", () => {
    const src = pickerInitScript("sheet");
    expect(() => new Function(src)).not.toThrow();
    expect(src).toContain('mode: "sheet"');
    expect(src).toContain(pickerStep.toString());
    expect(src).toContain(opensPicker.toString());
    expect(src).toContain(dropdownPlacement.toString());
  });
});
