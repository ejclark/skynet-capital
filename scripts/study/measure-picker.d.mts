// Type surface for measure-picker.mjs (scripts/ is plain ESM with `allowJs` off).

import type { PickerMode } from "./picker.mjs";

/** In-page init script; serialised by its source, never called in node. */
export function installPicker(cfg: unknown): void;
/** The init script's source: `installPicker` called with picker.mjs's own rules. */
export function pickerInitScript(mode: PickerMode): string;
