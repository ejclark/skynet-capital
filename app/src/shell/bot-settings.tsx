import type { ReactElement } from "react";
import { useId, useState } from "react";
import {
  type BotSettingChange,
  type BotSettings,
  botSettingsRequest,
  type OwnedAccount,
} from "../live/settings";
import { InlineResult } from "../ui";

/**
 * A BOT'S OWN SETTINGS (#4535 slice 3b) — the hardcore build and the forced daily pick's count,
 * under the own-bot switch on the account card. Until now each was an ops workflow run that
 * restarted the bots; the bots app now reads both at every check-in (slices 2b/2c), so the owner
 * changes them here and nothing restarts.
 *
 * Each control is drawn only where it does something: the build only on a bot that has a hardcore
 * build, the count only on the one bot the forced pick runs on (the server decides both). "The
 * operations setting" is the honest third choice: the app cannot see the bots app's own value, so
 * it never claims one, and choosing it hands the setting back.
 *
 * Under them, the change log: every change to this bot's settings, suspend included, with who
 * proposed it, who approved it, before and after (the plan's criterion 4). Ownership is the only
 * gate, so one person does both and the line says so once. The Playbook Store's writes land here
 * too (slice 3c): a subscription line reads as the server's one-line summary, an allocation as
 * dollars.
 * @category desk
 */

const OPS = "the operations setting";

/** Each setting's name in a change line. */
const SETTING_NAMES: Readonly<Record<string, string>> = {
  suspended: "Trading",
  hardcore: "Build",
  betaPicks: "Forced picks per day",
};

const SUBSCRIPTION = "subscription:";
const ALLOCATION = "allocation:";

/** A change line's name: the controls settings by name, a Store line by its playbook or strategy. */
function settingName(setting: string): string {
  if (setting.startsWith(SUBSCRIPTION)) return setting.slice(SUBSCRIPTION.length);
  if (setting.startsWith(ALLOCATION)) {
    return `Allocation to ${setting.slice(ALLOCATION.length).replaceAll("-", " ")}`;
  }
  return SETTING_NAMES[setting] ?? setting;
}

/** A stored value in words; `null` = nothing stored, so the operations setting stands. */
function valueWords(setting: string, value: BotSettingChange["before"]): string {
  if (setting.startsWith(SUBSCRIPTION)) return value === null ? "not subscribed" : String(value);
  if (setting.startsWith(ALLOCATION)) {
    return typeof value === "number" ? `$${value.toLocaleString("en-US")}` : "none";
  }
  if (setting === "suspended") return value === true ? "suspended" : "on";
  if (value === null) return OPS;
  if (setting === "hardcore") return value === true ? "hardcore" : "standard";
  if (setting === "betaPicks") return value === 0 ? "0 (off)" : String(value);
  return String(value);
}

function byWords(change: BotSettingChange): string {
  return change.proposedBy === change.approvedBy
    ? `by ${change.proposedBy}`
    : `proposed by ${change.proposedBy}, approved by ${change.approvedBy}`;
}

const whenWords = (at: string): string =>
  new Date(at).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

function ChangeLog({ changes }: { readonly changes: readonly BotSettingChange[] }): ReactElement {
  return (
    <div className="bot-settings-log">
      <h4 className="bot-settings-sub">Recent changes</h4>
      {changes.length === 0 ? (
        <p className="mc-note">No changes recorded yet.</p>
      ) : (
        <ul className="bot-settings-changes">
          {changes.map((c) => (
            <li key={`${c.at}-${c.setting}`}>
              <b>{settingName(c.setting)}</b> {valueWords(c.setting, c.before)} →{" "}
              {valueWords(c.setting, c.after)}
              <span className="mc-note">
                {" "}
                · {byWords(c)} · <time dateTime={c.at}>{whenWords(c.at)}</time>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 0 through the server's ceiling. */
const pickCounts = (max: number): number[] => [...Array(max + 1).keys()];

/** A `<select>` value for a stored setting: "" is the operations setting. */
const choiceOf = (value: boolean | number | null | undefined): string =>
  value === null || value === undefined ? "" : String(value);

export function BotSettingsPanel({
  account,
  onChanged,
}: {
  readonly account: OwnedAccount;
  readonly onChanged: () => void;
}): ReactElement | null {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const buildId = useId();
  const picksId = useId();
  const settings: BotSettings | undefined = account.settings;
  if (!settings) return null;
  const hasBuild = settings.hardcore !== undefined;
  const hasPicks = settings.betaPicks !== undefined;

  const save = async (change: { hardcore?: boolean | null; betaPicks?: number | null }) => {
    setBusy(true);
    setError(undefined);
    try {
      const answer = await botSettingsRequest({ id: account.id, ...change });
      if (answer.ok) onChanged();
      else setError(answer.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bot-settings">
      {hasBuild ? (
        <div className="bot-settings-field">
          <label htmlFor={buildId}>Build</label>
          <select
            id={buildId}
            value={choiceOf(settings.hardcore)}
            disabled={busy}
            onChange={(e) =>
              void save({ hardcore: e.target.value === "" ? null : e.target.value === "true" })
            }
          >
            <option value="">{`Use ${OPS}`}</option>
            <option value="false">Standard</option>
            <option value="true">Hardcore</option>
          </select>
          <p className="mc-note">
            Hardcore is this bot's research build: trades about a tenth the size, far more often and
            in every market condition, with 90 seconds between orders in a name instead of 5
            minutes. Switching re-runs its readiness check, and a build that isn't ready only
            watches, placing nothing, until it is.
          </p>
        </div>
      ) : null}
      {hasPicks ? (
        <div className="bot-settings-field">
          <label htmlFor={picksId}>Forced picks per day</label>
          <select
            id={picksId}
            value={choiceOf(settings.betaPicks)}
            disabled={busy}
            onChange={(e) =>
              void save({ betaPicks: e.target.value === "" ? null : Number(e.target.value) })
            }
          >
            <option value="">{`Use ${OPS}`}</option>
            {pickCounts(settings.maxBetaPicks).map((n) => (
              <option key={`picks-${n}`} value={String(n)}>
                {n === 0 ? "0 — off" : String(n)}
              </option>
            ))}
          </select>
          <p className="mc-note">
            On a day no bot has traded by its first check, the forced daily pick buys up to this
            many small picks on this bot — only while it is also subscribed to BETA-SCOUT in the
            Playbook Store. 0 stops new picks; picks it holds are still sold the next trading day.
          </p>
        </div>
      ) : null}
      {hasBuild || hasPicks ? (
        <p className="mc-note">
          Applies at the bots' next check-in, about 30 seconds — no restart.
        </p>
      ) : null}
      {error ? (
        <InlineResult as="span" tone="err">
          {error}
        </InlineResult>
      ) : null}
      <ChangeLog changes={settings.changes} />
    </div>
  );
}
