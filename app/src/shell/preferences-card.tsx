import { type ReactElement, useId } from "react";
import { type Crest, type Density, type Theme, usePrefs } from "./prefs";
import { Toggle } from "./toggle";
import { useMediaQuery } from "./use-media";

/**
 * SETTINGS → PREFERENCES (#738 phase 5c; lifted out of `routes/settings.tsx` in #3807 slice 3b-1):
 * display settings for this browser, applied at once, tied to no account.
 *
 * TOWER MOTION (#3807 slice 3b-1): the tower moves by default — Eric's pick, 2026-09-27 ("the
 * subtle animation in the background offers opportunities") — and "Still" is the member's own
 * pause for that motion (WCAG 2.2.2: motion that runs longer than five seconds beside content
 * needs a control the member owns; the OS's reduced-motion setting is not a page control). It
 * applies to every tower view (`prefs.ts` → `crest`). The reason is visible text, never a tooltip.
 * When the device asks for reduced motion the scene already draws one frame and never animates, so
 * the toggle reads Still, disabled, and the line says why.
 */

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function TowerMotion(): ReactElement {
  const crest = usePrefs((s) => s.crest);
  const setCrest = usePrefs((s) => s.setCrest);
  const reduced = useMediaQuery(REDUCED_MOTION);
  const reasonId = useId();
  return (
    <div className="field">
      <span className="set-pref-label">Tower motion</span>
      <Toggle<Crest>
        label="Tower motion"
        value={reduced ? "still" : crest}
        options={[
          ["live", "Moving"],
          ["still", "Still"],
        ]}
        onPick={setCrest}
        disabled={reduced}
        describedBy={reasonId}
      />
      <p className="set-hint" id={reasonId}>
        {reduced
          ? "Your device asks for reduced motion, so the tower stays still."
          : "Still shows one frame and moves only when the Eye looks at something you pick."}
      </p>
    </div>
  );
}

export function PreferencesCard(): ReactElement {
  const theme = usePrefs((s) => s.theme);
  const density = usePrefs((s) => s.density);
  const setTheme = usePrefs((s) => s.setTheme);
  const setDensity = usePrefs((s) => s.setDensity);
  return (
    <section className="set-card">
      <h2 className="set-card-h">Preferences</h2>
      <p className="set-hint">
        Display settings for this browser — they apply immediately and aren't tied to any account.
      </p>
      <div className="set-fields">
        <div className="field">
          <span className="set-pref-label">Density</span>
          <Toggle<Density>
            label="Density"
            value={density}
            options={[
              ["comfortable", "Comfortable"],
              ["compact", "Compact"],
            ]}
            onPick={setDensity}
          />
        </div>
        <TowerMotion />
        <div className="field">
          <span className="set-pref-label">Theme</span>
          <Toggle<Theme>
            label="Theme"
            value={theme}
            options={[
              ["dark", "Dark"],
              ["light", "Light"],
            ]}
            onPick={setTheme}
          />
        </div>
      </div>
    </section>
  );
}
