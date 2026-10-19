import { PLAYBOOK_MODES } from "../../src/domain/types.js";
import { AUTHORED_PLAY_BOUNDS, validateAuthoredPlay } from "../../src/playbooks/authored-play.js";
import {
  AUTHORED_STRATEGIES,
  type AuthoredPlayForm,
  emptyForm,
  formFromSpec,
  MAX_SIZE_PERCENT,
  parseAuthoredPlayForm,
  settingsLine,
  slugFromName,
  specFromForm,
} from "../../src/playbooks/authored-play-form.js";

/**
 * THE AUTHORING FORM, AS DATA (#5457 slice 1).
 *
 * WHEN a member fills the form inside the limits, it SHALL become the model's own spec.
 * WHEN a setting is outside its strategy's limit, the form SHALL be refused with a sentence that names
 * the limit — a setting only narrows, never widens — and every refusal SHALL come back at once.
 */

const AUTHOR = "Ada";

const filled = (over: Partial<AuthoredPlayForm> = {}): AuthoredPlayForm => ({
  ...emptyForm("futurist"),
  name: "My NVDA run-up",
  symbol: "nvda",
  thesis: "Long the drift into the print, out before the dead final week.",
  ...over,
});

const reasons = (form: AuthoredPlayForm) => {
  const result = specFromForm(form, AUTHOR);
  return result.ok ? [] : result.refusals;
};
const reasonOn = (form: AuthoredPlayForm, field: string) =>
  reasons(form).find((r) => r.field === field)?.reason;

describe("the form becomes the model's spec", () => {
  it("a filled run-up form is a spec the model accepts, ticker upper-cased and sizes as fractions", () => {
    const result = specFromForm(filled(), AUTHOR);
    expect(result).toEqual({
      ok: true,
      spec: {
        slug: "my-nvda-run-up",
        authorAccountId: "futurist",
        authorDisplayName: "Ada",
        symbols: ["NVDA"],
        thesis: "Long the drift into the print, out before the dead final week.",
        trigger: { kind: "pre-print-window", enterDaysBefore: 20, exitDaysBefore: 5 },
        size: { conservative: 0.01, standard: 0.02, aggressive: 0.03 },
      },
    });
    if (result.ok) expect(validateAuthoredPlay(result.spec)).toEqual({ ok: true });
  });

  it("keeps the thesis as one trimmed line", () => {
    const result = specFromForm(
      filled({ thesis: "  Long the drift into the print, out early.  " }),
      AUTHOR,
    );
    expect(result.ok && result.spec.thesis).toBe("Long the drift into the print, out early.");
  });

  it("the news-event strategy carries its hold in minutes", () => {
    const form = filled({ strategy: "event-window", settings: { holdMinutes: 90 } });
    const result = specFromForm(form, AUTHOR);
    expect(result.ok && result.spec.trigger).toEqual({ kind: "event-window", holdMinutes: 90 });
  });

  it("every strategy opens inside its own limits, so a first save needs no editing", () => {
    for (const strategy of AUTHORED_STRATEGIES) {
      const form = filled({
        strategy: strategy.id,
        settings: emptyForm("f", strategy.id).settings,
      });
      expect(reasons(form)).toEqual([]);
    }
  });

  it("the limits shown are the model's own, read from its bounds", () => {
    const runUp = AUTHORED_STRATEGIES.find((s) => s.id === "pre-print-window");
    const event = AUTHORED_STRATEGIES.find((s) => s.id === "event-window");
    expect(runUp?.settings[0]?.max).toBe(AUTHORED_PLAY_BOUNDS.maxEnterDaysBefore);
    expect(event?.settings[0]?.max).toBe(AUTHORED_PLAY_BOUNDS.maxHoldMinutes);
    expect(MAX_SIZE_PERCENT).toBeCloseTo(AUTHORED_PLAY_BOUNDS.maxSizeFraction * 100);
  });
});

describe("a setting outside its strategy's limit is refused, with the limit in the reason", () => {
  it("buying more days ahead than the strategy allows", () => {
    const form = filled({ settings: { enterDaysBefore: 90, exitDaysBefore: 5 } });
    const reason = reasonOn(form, "enterDaysBefore");
    expect(reason).toContain("90 days");
    expect(reason).toContain(String(AUTHORED_PLAY_BOUNDS.maxEnterDaysBefore));
    expect(reason).toContain("can only narrow");
  });

  it("holding longer than the strategy allows", () => {
    const form = filled({ strategy: "event-window", settings: { holdMinutes: 600 } });
    const reason = reasonOn(form, "holdMinutes");
    expect(reason).toContain("600 minutes");
    expect(reason).toContain(String(AUTHORED_PLAY_BOUNDS.maxHoldMinutes));
  });

  it("a share of the account past the house ceiling", () => {
    const form = filled({
      sizePercent: { conservative: 1, standard: 2, aggressive: 5 },
    });
    const reason = reasonOn(form, "size.aggressive");
    expect(reason).toContain("5%");
    expect(reason).toContain(`${MAX_SIZE_PERCENT}%`);
    expect(reason).toContain("can only narrow");
  });

  it("selling no sooner than buying", () => {
    const reason = reasonOn(
      filled({ settings: { enterDaysBefore: 10, exitDaysBefore: 10 } }),
      "exitDaysBefore",
    );
    expect(reason).toContain("has to come after");
  });

  it("a size that falls from conservative to aggressive", () => {
    const form = filled({ sizePercent: { conservative: 3, standard: 2, aggressive: 1 } });
    expect(reasonOn(form, "size")).toContain("can't fall");
  });

  it("a blank or fractional number is said on its own field, not guessed", () => {
    expect(
      reasonOn(
        filled({ settings: { enterDaysBefore: null, exitDaysBefore: 5 } }),
        "enterDaysBefore",
      ),
    ).toBe("Enter a number of days.");
    expect(
      reasonOn(
        filled({ settings: { enterDaysBefore: 20.5, exitDaysBefore: 5 } }),
        "enterDaysBefore",
      ),
    ).toBe("Use a whole number of days.");
    expect(
      reasonOn(
        filled({ sizePercent: { conservative: null, standard: 2, aggressive: 3 } }),
        "size.conservative",
      ),
    ).toContain("Enter conservative's share");
  });

  it("a zero or negative share is refused as above zero", () => {
    expect(
      reasonOn(
        filled({ sizePercent: { conservative: 0, standard: 2, aggressive: 3 } }),
        "size.conservative",
      ),
    ).toContain("above 0%");
  });

  it("never clamps: nothing is returned for a refused form", () => {
    const result = specFromForm(
      filled({ settings: { enterDaysBefore: 90, exitDaysBefore: 5 } }),
      AUTHOR,
    );
    expect(result.ok).toBe(false);
    expect(result).not.toHaveProperty("spec");
  });
});

describe("every refusal comes back at once, under its own field", () => {
  it("a form wrong in five places names all five", () => {
    const form = filled({
      name: " ",
      symbol: "not a ticker",
      thesis: "short",
      settings: { enterDaysBefore: 90, exitDaysBefore: 5 },
      runsOn: "",
    });
    const fields = reasons(form)
      .map((r) => r.field)
      .sort();
    expect(fields).toEqual(["enterDaysBefore", "name", "runsOn", "symbol", "thesis"]);
  });

  it("names the playbook, the ticker and the bot in the member's words", () => {
    expect(reasonOn(filled({ name: "" }), "name")).toBe("Give the playbook a name.");
    expect(reasonOn(filled({ symbol: "toolongticker" }), "symbol")).toContain("isn't a ticker");
    expect(reasonOn(filled({ symbol: "  " }), "symbol")).toBe(
      "Enter a ticker, like NVDA or BTC/USD.",
    );
    expect(reasonOn(filled({ thesis: "too short" }), "thesis")).toContain("12–200 characters");
    expect(reasonOn(filled({ runsOn: "" }), "runsOn")).toBe("Pick the bot that will run it.");
  });

  it("a name with no letters or digits cannot make a slug", () => {
    expect(reasonOn(filled({ name: "!!!" }), "name")).toContain("letters or digits");
  });

  it("one reason per field", () => {
    const fields = reasons(
      filled({ settings: { enterDaysBefore: null, exitDaysBefore: null } }),
    ).map((r) => r.field);
    expect(new Set(fields).size).toBe(fields.length);
  });
});

describe("the name, the saved spec and the wire", () => {
  it("makes a slug from the name: words, single hyphens, cut at the limit", () => {
    expect(slugFromName("  My NVDA run-up!  ")).toBe("my-nvda-run-up");
    expect(slugFromName("a".repeat(60))).toHaveLength(AUTHORED_PLAY_BOUNDS.maxSlugLength);
    expect(slugFromName("ab ".repeat(20)).endsWith("-")).toBe(false);
  });

  it("Edit opens on what was saved", () => {
    const result = specFromForm(
      filled({ sizePercent: { conservative: 0.5, standard: 1.5, aggressive: 2.5 } }),
      AUTHOR,
    );
    if (!result.ok) throw new Error("expected a spec");
    const back = formFromSpec("My NVDA run-up", result.spec);
    expect(back.sizePercent).toEqual({ conservative: 0.5, standard: 1.5, aggressive: 2.5 });
    expect(back.settings).toEqual({ enterDaysBefore: 20, exitDaysBefore: 5 });
    expect(specFromForm(back, AUTHOR)).toEqual(result);
  });

  it("says the settings on one line", () => {
    const run = specFromForm(filled(), AUTHOR);
    const event = specFromForm(
      filled({ strategy: "event-window", settings: { holdMinutes: 1 } }),
      AUTHOR,
    );
    expect(run.ok && settingsLine(run.spec)).toBe("buy 20 days before the report, sell 5 before");
    expect(event.ok && settingsLine(event.spec)).toBe("hold 1 minute after the news");
  });

  it("parses a body strictly and takes nothing it cannot read", () => {
    const body = JSON.parse(JSON.stringify(filled()));
    expect(parseAuthoredPlayForm(body)).toEqual(filled());
    expect(parseAuthoredPlayForm({ ...body, strategy: "code" })).toBeUndefined();
    expect(parseAuthoredPlayForm({ ...body, settings: { enterDaysBefore: "20" } })).toBeUndefined();
    expect(parseAuthoredPlayForm({ ...body, sizePercent: { conservative: 1 } })).toBeUndefined();
    expect(parseAuthoredPlayForm({ ...body, name: 5 })).toBeUndefined();
    expect(parseAuthoredPlayForm([])).toBeUndefined();
    expect(parseAuthoredPlayForm(null)).toBeUndefined();
  });

  it("covers every mode in the size row", () => {
    expect(Object.keys(emptyForm().sizePercent)).toEqual([...PLAYBOOK_MODES]);
  });
});
