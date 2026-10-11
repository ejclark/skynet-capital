// PIN REACTIONS on a round page (#5143) — inlined by render.mjs ahead of page-client.js, which
// calls `steerPins(api)` once with the page's own state. Never run by node.
//
// Eric, 2026-10-11: "i wish the process had thumbs up/down and 'mixed' icons to give granular
// feedback at the comment level for the iterations." Each numbered pin baked into a round's
// picture has a button on its badge (pins.mjs). A tap opens ONE popover, set right after that pin
// inside its picture, offering three reactions as glyph AND word — he is red/green colourblind, so
// colour never carries the meaning. A choice goes to the page script, which saves it in the
// decision's own record (merged in one key at a time); the badge then shows the glyph with a
// heavier border, and the same choice again clears it. Escape, a tap outside or focus leaving
// closes it. It opens below the pin, or above it when the Done bar would cover it, clamped inside
// an 8px gutter — so it never covers its own pin and never scrolls the page sideways.
globalThis.steerPins = (api) => {
  const PINS = api.pins; // { glyph, words: { design, problems } } from pins.mjs
  if (!PINS) return null;
  const REACTIONS = ["up", "down", "mixed"];
  const GUTTER = 8;
  const GAP = 8;
  let pop = null;
  let openPin = null;

  const keyOf = (pin) => pin.closest(".pinned")?.dataset.key;
  const words = (pin) => PINS.words[api.problems(keyOf(pin)) ? "problems" : "design"];
  const saved = (pin) => {
    const v = api.saved(keyOf(pin))?.pins?.[pin.dataset.pin];
    return REACTIONS.includes(v) ? v : null;
  };

  /** The three choices for this pin, its saved one pressed. */
  function fill(pin) {
    const w = words(pin);
    const now = saved(pin);
    pop.setAttribute("aria-label", pin.dataset.name);
    pop.replaceChildren(
      ...REACTIONS.map((v) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "pc";
        b.dataset.r = v;
        b.setAttribute("aria-pressed", now === v ? "true" : "false");
        const glyph = document.createElement("span");
        glyph.setAttribute("aria-hidden", "true");
        glyph.textContent = PINS.glyph[v];
        b.append(glyph, ` ${w[v]}`);
        return b;
      }),
    );
  }

  /** Below the pin, or above it when the bar would cover it; never past the 8px gutter. */
  function place(pin) {
    const frame = pin.closest(".pinned").getBoundingClientRect();
    const r = pin.getBoundingClientRect();
    const vw = document.documentElement.clientWidth || window.innerWidth;
    const bar = document.querySelector(".bar")?.getBoundingClientRect();
    const floor = bar && bar.top > 0 ? bar.top : window.innerHeight;
    const w = pop.offsetWidth;
    const h = pop.offsetHeight;
    const left = Math.max(GUTTER, Math.min(r.left + r.width / 2 - w / 2, vw - GUTTER - w));
    const below = r.bottom + GAP + h <= floor || r.top - GAP - h < 0;
    pop.style.left = `${left - frame.left}px`;
    pop.style.top = `${(below ? r.bottom + GAP : r.top - GAP - h) - frame.top}px`;
    pop.dataset.side = below ? "below" : "above";
  }

  function open(pin) {
    close(false);
    if (!pop) {
      pop = document.createElement("div");
      pop.className = "pinpop";
      pop.id = "pinpop";
      pop.setAttribute("role", "group");
    }
    fill(pin);
    pin.after(pop);
    pop.hidden = false;
    pin.setAttribute("aria-expanded", "true");
    pin.setAttribute("aria-controls", pop.id);
    openPin = pin;
    place(pin);
    (pop.querySelector('[aria-pressed="true"]') || pop.querySelector(".pc")).focus();
  }

  function close(focusPin) {
    if (!openPin) return;
    const pin = openPin;
    openPin = null;
    pop.hidden = true;
    pin.setAttribute("aria-expanded", "false");
    if (focusPin) pin.focus();
  }

  /** Each pin as the record has it: the chosen glyph on its badge, its name with the choice. */
  function paint() {
    const off = api.locked();
    for (const pin of document.querySelectorAll(".pin")) {
      const v = saved(pin);
      if (v) pin.dataset.r = v;
      else delete pin.dataset.r;
      pin.querySelector(".pg").textContent = v ? PINS.glyph[v] : "";
      const name = pin.dataset.name;
      pin.setAttribute("aria-label", v ? `${name} — ${words(pin)[v]}` : name);
      pin.disabled = off;
    }
    if (off) close(false);
  }

  document.addEventListener("click", (ev) => {
    const t = ev.target;
    const choice = t.closest?.(".pc");
    if (choice && openPin && pop.contains(choice)) {
      const pin = openPin;
      api.react(keyOf(pin), pin.dataset.pin, choice.dataset.r);
      return close(true);
    }
    const pin = t.closest?.(".pin");
    if (pin) {
      if (api.locked()) return;
      return openPin === pin ? close(true) : open(pin);
    }
    if (openPin && !pop.contains(t)) close(false);
  });
  document.addEventListener("keydown", (ev) => {
    if (!openPin) return;
    if (ev.key === "Escape") return close(true);
    if (ev.key !== "ArrowRight" && ev.key !== "ArrowLeft") return;
    const all = [...pop.querySelectorAll(".pc")];
    const i = all.indexOf(document.activeElement);
    const step = ev.key === "ArrowRight" ? 1 : all.length - 1;
    all[i < 0 ? 0 : (i + step) % all.length].focus();
  });
  document.addEventListener("focusin", (ev) => {
    if (openPin && ev.target !== openPin && !pop.contains(ev.target)) close(false);
  });
  window.addEventListener("resize", () => {
    if (openPin) place(openPin);
  });
  return { paint };
};
