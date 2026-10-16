// Type surface for picker.mjs — scripts/ is plain ESM with `allowJs` off, so the spec that imports
// from it needs this (the same arrangement as metrics.d.mts).

export type PickerMode = "sheet" | "dropdown";

export interface PickerOption {
  value: string;
  label: string;
  disabled?: boolean;
  /** Not displayed (the `hidden` attribute, display:none) — a native popup leaves it out. */
  hidden?: boolean;
}

export interface PickerState {
  mode: PickerMode;
  name: string;
  options: PickerOption[];
  index: number;
}

export type PickerEvent =
  | { type: "open"; mode: PickerMode; name?: string; options?: PickerOption[]; index?: number }
  | { type: "choose"; index: number }
  | { type: "confirm" }
  | { type: "dismiss"; via?: string };

/** One moment the recorder keeps on a trace record as `nativePicker`. */
export interface NativePickerMoment {
  event: "opened" | "chose" | "dismissed";
  name: string;
  options: string[];
  value: string | null;
  label: string | null;
  changed?: boolean;
  from?: string | null;
  via?: string;
  of?: number;
}

export function pickerMode(hasTouch: boolean): PickerMode;
export function opensPicker(
  target: {
    kind: "select" | "label" | string;
    disabled?: boolean;
    multiple?: boolean;
    size?: number;
  } | null,
  mode: PickerMode,
): boolean;
export function pickerStep(
  state: PickerState | null,
  event: PickerEvent,
): {
  state: PickerState | null;
  moment: NativePickerMoment | null;
  set: { index: number; value: string } | null;
};
export function dropdownPlacement(opts: {
  rect: { left: number; top: number; bottom: number; width: number };
  vw: number;
  vh: number;
  rows: number;
  rowH?: number;
  pad?: number;
}): { left: number; top: number; maxHeight: number; minWidth: number; down: boolean };
export function nativePickerOf(
  moments: (NativePickerMoment & { t?: number })[] | null | undefined,
): NativePickerMoment | null;
