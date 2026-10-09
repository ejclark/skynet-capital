// The native picker's stand-in — its RULES, as pure functions (#4943). The page side that draws it
// is measure-picker.mjs; it runs these very functions in the page (their source is composed into the
// init script), so what a tap on a select does is decided here and specced here
// (tests/scripts/study-picker.spec.ts), never re-implemented in the browser.
//
// WHY: a native <select> opens a popup the OS draws — a sheet on a phone, a dropdown list on a
// desktop — and headless Chromium never paints it into a page screenshot. The thin slice's member
// tapped the account picker four times, saw nothing open, and gave up (ease 1/7): the harness's
// blindness, reported as the app's failure. So the recorder draws a plain, system-styled stand-in
// IN the page, the next frame shows it, and choosing a row sets the select exactly as a person's
// choice would (input + change).
//
// Every function the page runs is self-contained (no imports, no closure over module scope): it
// is serialised by its source. `nativePickerOf` is node-side only.

/** The platform's picker shape for a frame: a bottom sheet on a touch screen, else a dropdown. */
export function pickerMode(hasTouch) {
  return hasTouch ? "sheet" : "dropdown";
}

/**
 * Does a tap on this target open the stand-in? `target`: {kind: "select"|"label", disabled,
 * multiple, size}. A disabled select opens nothing; a multiple or size>1 select is an inline list
 * box with no popup. A select's label opens it only on a phone (iOS opens the picker when the
 * field takes focus); a desktop browser's label click focuses the select and opens nothing.
 */
export function opensPicker(target, mode) {
  if (!target || target.disabled || target.multiple || target.size > 1) return false;
  if (target.kind === "select") return true;
  return target.kind === "label" && mode === "sheet";
}

/**
 * One event through the picker. `state`: null (closed) or {mode, name, options: [{value, label,
 * disabled}], index} — `index` the select's selectedIndex when it opened. Events:
 *   {type: "open", mode, name, options, index} · {type: "choose", index} ·
 *   {type: "confirm"} (Enter: the current row) · {type: "dismiss", via}
 * Returns {state, moment, set}: `moment` is the trace's record of it (null when nothing happened),
 * `set` the {index, value} the select must take (null when its value stays).
 *  - open while closed → opened; open while open (the select tapped again) → dismissed, via select
 *  - choose an enabled row → chose, `changed` false when it is the current one (no events fire,
 *    as natively); a disabled or missing row takes no tap and the picker stays open
 *  - confirm → chose the current row; with no current row, dismissed via enter
 *  - dismiss → dismissed with its `via` (outside · escape · scroll · navigation)
 *  - anything but open while closed → nothing
 */
export function pickerStep(state, event) {
  const moment = (s, kind, index, extra) => ({
    event: kind,
    name: s.name,
    options: s.options.map((o) => o.label),
    value: s.options[index]?.value ?? null,
    label: s.options[index]?.label ?? null,
    ...extra,
  });
  const closed = (kind, index, extra) => ({
    state: null,
    moment: moment(state, kind, index, extra),
    set: null,
  });
  const none = { state, moment: null, set: null };
  if (event.type === "open") {
    if (state) return closed("dismissed", state.index, { via: "select" });
    const s = {
      mode: event.mode,
      name: event.name ?? "",
      options: event.options ?? [],
      index: Number.isInteger(event.index) ? event.index : -1,
    };
    return { state: s, moment: moment(s, "opened", s.index), set: null };
  }
  if (!state) return none;
  if (event.type === "dismiss")
    return closed("dismissed", state.index, { via: event.via ?? "outside" });
  if (event.type === "confirm" && !state.options[state.index])
    return closed("dismissed", state.index, { via: "enter" });
  if (event.type !== "choose" && event.type !== "confirm") return none;
  const index = event.type === "confirm" ? state.index : event.index;
  const row = state.options[index];
  if (!row || row.disabled) return none;
  const changed = index !== state.index;
  return {
    state: null,
    moment: moment(state, "chose", index, {
      changed,
      from: state.options[state.index]?.value ?? null,
    }),
    set: changed ? { index, value: row.value } : null,
  };
}

/**
 * Where the desktop dropdown goes: under the select, at its left edge and at least its width —
 * or above it when the room below is short and there is more above. Clamped to the frame;
 * `maxHeight` is the list's (it scrolls inside when the rows do not fit).
 */
export function dropdownPlacement({ rect, vw, vh, rows, rowH = 22, pad = 4 }) {
  const want = rows * rowH + pad * 2 + 2;
  const below = vh - rect.bottom - 4;
  const above = rect.top - 4;
  const down = below >= want || below >= above;
  const height = Math.max(Math.min(want, down ? below : above), rowH + pad * 2);
  const minWidth = Math.min(Math.max(rect.width, 0), vw);
  const left = Math.max(0, Math.min(rect.left, vw - minWidth));
  return { left, top: down ? rect.bottom : rect.top - height, maxHeight: height, minWidth, down };
}

/**
 * Node side: the trace record's `nativePicker` from the moments the page logged during one action
 * (the last, without its timestamp), or null. One tap makes at most one moment; were there more,
 * the last is the state the frame shows, and `of` says how many there were.
 */
export function nativePickerOf(moments) {
  if (!Array.isArray(moments) || moments.length === 0) return null;
  const { t: _t, ...last } = moments.at(-1);
  return moments.length > 1 ? { ...last, of: moments.length } : last;
}
