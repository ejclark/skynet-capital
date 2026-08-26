import {
  CONFIRM_BUTTON_STYLE,
  CONFIRM_LABELS,
  type ConfirmButtonOptions,
  type ConfirmState,
  renderConfirmButton,
} from "../../src/ui/confirm-button.js";

// The control exists to kill one specific failure: the bare greyed-out box that tells a member
// nothing about whether their order went in. So the load-bearing assertion is boring and absolute —
// EVERY state renders a visible label. The colour assertions are the honesty half: `done` must not
// borrow the P/L green, because a submitted paper order is an app event, not a profit.

const STATES: readonly ConfirmState[] = ["idle", "confirming", "done", "failed"];

describe("when any state is rendered", () => {
  it("always shows a non-empty label on a submit button", () => {
    for (const state of STATES) {
      const html = renderConfirmButton(state);
      expect(html).toContain('type="submit"');
      expect(html).toContain(`data-state="${state}"`);
      expect(CONFIRM_LABELS[state].length).toBeGreaterThan(0);
      expect(html).toContain(`>${CONFIRM_LABELS[state]}</button>`);
    }
  });

  it("names its state in a class so the page styles it without re-deriving anything", () => {
    for (const state of STATES) {
      expect(renderConfirmButton(state)).toContain(`class="cbtn cbtn-${state}"`);
    }
  });
});

describe("when the submit is in flight", () => {
  it("is disabled AND labelled AND announced busy — never a silent grey box", () => {
    const html = renderConfirmButton("confirming");
    expect(html).toContain("disabled");
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Confirming…");
  });

  it("leaves every other state pressable", () => {
    for (const state of STATES.filter((s) => s !== "confirming")) {
      expect(renderConfirmButton(state)).not.toContain("disabled");
    }
  });
});

describe("when the submit resolves", () => {
  it("celebrates `done` in ACCENT, never in the P/L green", () => {
    // Mirrors src/observatory/milestone-banner.ts: green everywhere on this desk means the market
    // moved your way. A submitted order has not made anyone a cent yet.
    expect(CONFIRM_BUTTON_STYLE).toContain(".cbtn-done .cbtn-btn{ border-color:var(--accent);");
    expect(CONFIRM_BUTTON_STYLE).not.toContain("var(--pos)");
  });

  it("keeps `failed` a real, retryable state rather than dressing an error as success", () => {
    const html = renderConfirmButton("failed");
    expect(html).not.toContain("disabled");
    expect(CONFIRM_BUTTON_STYLE).toContain(".cbtn-failed .cbtn-btn{ border-color:var(--neg);");
  });

  it("pairs the celebration with an explanation when the caller supplies one", () => {
    const html = renderConfirmButton("done", { note: "Paper order queued — SIM only." });
    expect(html).toContain('<span class="cbtn-note">Paper order queued — SIM only.</span>');
  });
});

describe("when the caller customises the control", () => {
  it("overrides copy per state and escapes it", () => {
    const opts: ConfirmButtonOptions = {
      labels: { idle: '<b>Place</b> "paper" trade' },
      name: "action",
      value: "submit",
    };
    const html = renderConfirmButton("idle", opts);
    expect(html).not.toContain("<b>");
    expect(html).toContain("&lt;b&gt;Place&lt;/b&gt; &quot;paper&quot; trade");
    expect(html).toContain('name="action"');
    expect(html).toContain('value="submit"');
    // An override for one state leaves the others on the house copy.
    expect(renderConfirmButton("done", opts)).toContain(CONFIRM_LABELS.done);
  });
});

describe("when the reader has asked for stillness", () => {
  it("drops the pulse but keeps the state named in words", () => {
    expect(CONFIRM_BUTTON_STYLE).toContain("@media (prefers-reduced-motion:reduce)");
    expect(CONFIRM_BUTTON_STYLE).toContain(".cbtn-confirming .cbtn-btn{ animation:none; }");
    expect(CONFIRM_LABELS.confirming).toBe("Confirming…");
  });

  it("borrows the shared tokens rather than inventing a parallel palette", () => {
    expect(CONFIRM_BUTTON_STYLE).not.toContain("#");
    expect(CONFIRM_BUTTON_STYLE).toContain("var(--surface)");
  });
});
