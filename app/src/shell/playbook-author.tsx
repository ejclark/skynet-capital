import { type ReactElement, useId, useState } from "react";
import { PLAYBOOK_MODES, type PlaybookMode } from "../../../src/domain/types";
import { AUTHORED_PLAY_BOUNDS } from "../../../src/playbooks/authored-play";
import {
  AUTHORED_STRATEGIES,
  type AuthoredPlayForm,
  type AuthoredStrategyId,
  emptyForm,
  type FormField,
  type FormRefusal,
  initialSettings,
  MAX_NAME_LENGTH,
  MAX_SIZE_PERCENT,
  type SettingKey,
  type StrategySetting,
  specFromForm,
  strategyById,
} from "../../../src/playbooks/authored-play-form";
import { type AuthoredPlayView, saveDraftRequest } from "../live/authored-plays";
import type { OwnedAccount } from "../live/settings";
import { InlineResult } from "../ui";

/**
 * THE AUTHORING FORM (#5457 slice 1, #809 slice 3; shaped by #5451's rounds) — a member picks what
 * the playbook does, sets its numbers inside the strategy's limits, names it, says why in a line,
 * and saves a DRAFT. No code, no condition to write: the strategies are the model's closed menu
 * (`authored-play-form.ts`), and a number is either inside its limit or refused in a sentence that
 * names the limit.
 *
 * ONE JUDGE. The form asks `specFromForm` — the same function the save runs on the server — after
 * every change, so a refusal shows under its field the moment the member leaves it (or all at once
 * after Save is tapped), and the server's answer can only ever repeat what the screen already said.
 * A refusal rides a ✕ and a sentence, never a colour alone; the strategy picked is a filled dot and a
 * heavier outline, not a hue.
 *
 * PHONE FIRST. One column at 390px, in the order a member decides: what it does, on which ticker,
 * its numbers, how big, its name and the one-line why, which bot. A wide container only adds a
 * second column (the strategy and its numbers beside the name and thesis) — no new fields.
 *
 * WHAT IT IS NOT. Not a shadow test, not a subscription, not a way to publish: a saved play is a
 * draft that trades nothing, said once under the button. Those are later steps (#5457 slices 2–5).
 */

const MODE_LABEL: Readonly<Record<PlaybookMode, string>> = {
  conservative: "Conservative",
  standard: "Standard",
  aggressive: "Aggressive",
};

/** The text of a number field: a blank stays blank, and typing never rewrites what was typed. */
const shown = (value: number | null | undefined): string =>
  value === null || value === undefined ? "" : String(value);

const asNumber = (text: string): number | null => {
  if (text.trim() === "") return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
};

const botName = (bot: OwnedAccount): string => bot.profile?.displayName ?? bot.name;

/** The hint under a setting: its own ceiling, or how it relates to the other number. */
function limitHint(setting: StrategySetting): string {
  if (setting.key === "exitDaysBefore") return "fewer days than the buy";
  return setting.max === undefined
    ? ""
    : `${setting.min}–${setting.max} ${setting.unit}, the strategy's own limit`;
}

function Reason({ refusal }: { readonly refusal: FormRefusal | undefined }): ReactElement | null {
  return refusal ? (
    <InlineResult as="p" tone="err" live={false} className="pba-reason">
      {refusal.reason}
    </InlineResult>
  ) : null;
}

export function AuthorPlaybook({
  bots,
  editing,
  onSaved,
  onCancel,
  onDiscard,
  discarding = false,
}: {
  /** The viewer's own bot accounts — the only accounts that run a playbook in Season 1 (#4610). */
  readonly bots: readonly OwnedAccount[];
  /** The draft being changed. Absent = a new playbook. */
  readonly editing?: AuthoredPlayView;
  readonly onSaved: (play: AuthoredPlayView) => void;
  readonly onCancel: () => void;
  /** Throw the draft away (Change only); asks once here before it calls. */
  readonly onDiscard?: (id: string) => void;
  readonly discarding?: boolean;
}): ReactElement {
  const ids = { name: useId(), symbol: useId(), thesis: useId(), runsOn: useId() };
  const [form, setForm] = useState<AuthoredPlayForm>(
    () => editing?.form ?? emptyForm(bots[0]?.id ?? ""),
  );
  const [touched, setTouched] = useState<ReadonlySet<FormField>>(new Set());
  const [attempted, setAttempted] = useState(false);
  const [said, setSaid] = useState<readonly FormRefusal[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);

  // The credit line is the server's (the session's name); the account is the form's own pick.
  const verdict = specFromForm(form, "Member");
  const refusals = verdict.ok ? [] : verdict.refusals;
  // What a field says: the server's last answer wins until the field changes again.
  const refusalOn = (field: FormField): FormRefusal | undefined => {
    const heard = said.find((r) => r.field === field);
    if (heard) return heard;
    return attempted || touched.has(field) ? refusals.find((r) => r.field === field) : undefined;
  };
  const touch = (field: FormField) => setTouched((now) => new Set(now).add(field));
  const change = (next: Partial<AuthoredPlayForm>, field?: FormField) => {
    setForm((now) => ({ ...now, ...next }));
    setSaid((now) => (field ? now.filter((r) => r.field !== field) : []));
    setError(undefined);
  };
  const pickStrategy = (strategy: AuthoredStrategyId) => {
    if (strategy !== form.strategy) {
      change({ strategy, settings: initialSettings(strategy) });
      setTouched(new Set());
    }
  };
  const setSetting = (key: SettingKey, text: string) =>
    change({ settings: { ...form.settings, [key]: asNumber(text) } }, key);
  const setSize = (mode: PlaybookMode, text: string) =>
    change({ sizePercent: { ...form.sizePercent, [mode]: asNumber(text) } }, `size.${mode}`);

  const save = async () => {
    setAttempted(true);
    if (refusals.length > 0) return;
    setBusy(true);
    setError(undefined);
    try {
      const answer = await saveDraftRequest(form, editing?.id);
      if (answer.ok) onSaved(answer.play);
      else if (answer.refusals && answer.refusals.length > 0) setSaid(answer.refusals);
      else setError(answer.error ?? "It couldn't be saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const strategy = strategyById(form.strategy);
  const thesisLength = form.thesis.trim().length;
  const sizeRefusal = refusalOn("size");
  return (
    <form
      className="pba-form"
      noValidate
      aria-label={editing ? `Change ${editing.name}` : "New playbook"}
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <div className="pba-col">
        <fieldset className="pba-strategies">
          <legend>What it does</legend>
          {AUTHORED_STRATEGIES.map((option) => (
            <label
              key={option.id}
              className="pba-strategy"
              data-on={option.id === form.strategy || undefined}
            >
              <input
                type="radio"
                name="pba-strategy"
                checked={option.id === form.strategy}
                disabled={busy}
                onChange={() => pickStrategy(option.id)}
              />
              <span className="pba-dot" aria-hidden="true">
                {option.id === form.strategy ? "●" : "○"}
              </span>
              <span className="pba-strategy-text">
                <b>{option.name}</b>
                <span>{option.line}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="field">
          <label htmlFor={ids.symbol}>Ticker</label>
          <input
            id={ids.symbol}
            className="num"
            value={form.symbol}
            maxLength={10}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            placeholder="NVDA"
            disabled={busy}
            aria-invalid={refusalOn("symbol") ? true : undefined}
            onChange={(e) => change({ symbol: e.target.value.toUpperCase() }, "symbol")}
            onBlur={() => touch("symbol")}
          />
          <Reason refusal={refusalOn("symbol")} />
        </div>

        <div className="pba-numbers">
          {strategy.settings.map((setting) => {
            const id = `${ids.name}-${setting.key}`;
            return (
              <div className="field" key={setting.key}>
                <label htmlFor={id}>{setting.label}</label>
                <input
                  id={id}
                  className="num"
                  type="number"
                  inputMode="numeric"
                  min={setting.min}
                  step={1}
                  value={shown(form.settings[setting.key])}
                  disabled={busy}
                  aria-invalid={refusalOn(setting.key) ? true : undefined}
                  onChange={(e) => setSetting(setting.key, e.target.value)}
                  onBlur={() => touch(setting.key)}
                />
                <span className="pba-hint">{limitHint(setting)}</span>
                <Reason refusal={refusalOn(setting.key)} />
              </div>
            );
          })}
        </div>

        <fieldset className="pba-size">
          <legend>
            Size, as a share of the account{" "}
            <span className="pba-hint">· at most {MAX_SIZE_PERCENT}%</span>
          </legend>
          <div className="pba-size-row">
            {PLAYBOOK_MODES.map((mode) => {
              const id = `${ids.name}-size-${mode}`;
              return (
                <div className="field" key={mode}>
                  <label htmlFor={id}>{MODE_LABEL[mode]}</label>
                  <div className="pba-percent">
                    <input
                      id={id}
                      className="num"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={0.5}
                      value={shown(form.sizePercent[mode])}
                      disabled={busy}
                      aria-invalid={refusalOn(`size.${mode}`) ? true : undefined}
                      onChange={(e) => setSize(mode, e.target.value)}
                      onBlur={() => touch(`size.${mode}`)}
                    />
                    <span aria-hidden="true">%</span>
                  </div>
                </div>
              );
            })}
          </div>
          {PLAYBOOK_MODES.map((mode) => (
            <Reason key={mode} refusal={refusalOn(`size.${mode}`)} />
          ))}
          <Reason refusal={sizeRefusal} />
        </fieldset>
      </div>

      <div className="pba-col">
        <div className="field">
          <label htmlFor={ids.name}>Name</label>
          <input
            id={ids.name}
            value={form.name}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="off"
            placeholder="My NVDA run-up"
            disabled={busy}
            aria-invalid={refusalOn("name") ? true : undefined}
            onChange={(e) => change({ name: e.target.value }, "name")}
            onBlur={() => touch("name")}
          />
          <Reason refusal={refusalOn("name")} />
        </div>

        <div className="field">
          <label htmlFor={ids.thesis}>Why it should work</label>
          <textarea
            id={ids.thesis}
            rows={3}
            value={form.thesis}
            maxLength={AUTHORED_PLAY_BOUNDS.maxThesisLength + 40}
            placeholder="In your own words, one line."
            disabled={busy}
            aria-invalid={refusalOn("thesis") ? true : undefined}
            onChange={(e) => change({ thesis: e.target.value }, "thesis")}
            onBlur={() => touch("thesis")}
          />
          <span className="pba-hint num">
            {thesisLength} / {AUTHORED_PLAY_BOUNDS.maxThesisLength}
          </span>
          <Reason refusal={refusalOn("thesis")} />
        </div>

        <div className="field">
          <label htmlFor={ids.runsOn}>Runs on</label>
          <select
            id={ids.runsOn}
            value={form.runsOn}
            disabled={busy}
            onChange={(e) => change({ runsOn: e.target.value }, "runsOn")}
          >
            {bots.map((bot) => (
              <option key={bot.id} value={bot.id}>
                {botName(bot)} · bot
              </option>
            ))}
          </select>
          <Reason refusal={refusalOn("runsOn")} />
        </div>

        <div className="pba-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Saving…" : editing ? "Save changes" : "Save draft"}
          </button>
          <button type="button" className="btn mc-btn" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
        </div>
        <p className="pba-hint">A draft doesn't trade.</p>
        {editing && onDiscard ? (
          asking ? (
            <fieldset className="pba-discard">
              <legend>Discard {editing.name}?</legend>
              <button
                type="button"
                className="btn mc-btn"
                disabled={discarding}
                onClick={() => onDiscard(editing.id)}
              >
                {discarding ? "Discarding…" : "Discard"}
              </button>
              <button type="button" className="btn mc-btn" onClick={() => setAsking(false)}>
                Keep
              </button>
            </fieldset>
          ) : (
            <button
              type="button"
              className="btn mc-btn pba-discard-ask"
              disabled={busy}
              onClick={() => setAsking(true)}
            >
              Discard draft
            </button>
          )
        ) : null}
        {error ? (
          <InlineResult as="p" tone="err">
            {error}
          </InlineResult>
        ) : null}
      </div>
    </form>
  );
}
