import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useId, useState } from "react";
import {
  fetchSettings,
  type OwnedAccount,
  removeAccountRequest,
  rotateCredentialsRequest,
  type SettingsIndex,
  type SettingsWriteResult,
  saveProfile,
} from "../live/settings";
import { AccountLinksCard, GuestListCard, OpsStatusCard } from "../shell/admin-cards";
import { BotSwitch } from "../shell/bot-switch";
import { PageFrame } from "../shell/frame";
import { MissionControl } from "../shell/mission-control";

/**
 * SETTINGS (#738 phase 5c) — the catalog's Settings patterns on the member's own accounts:
 * a rail of sections, explicit Save on text fields (autosave is for switch-class controls only),
 * and the Danger Zone with GitHub's typed confirmation. The page shows ONLY what the session
 * owns; identity, authorization, and the typed-name check all live in the account service —
 * every refusal rendered here is the server's own sentence.
 */

function ResultLine({
  result,
}: {
  readonly result: SettingsWriteResult | null;
}): ReactElement | null {
  if (!result) return null;
  return result.ok ? (
    <p className="set-ok">Saved — {result.displayName} is up to date.</p>
  ) : (
    <p className="set-err">{result.error}</p>
  );
}

function ProfileForm({
  account,
  timezones,
  onSaved,
}: {
  readonly account: OwnedAccount;
  readonly timezones: SettingsIndex["timezones"];
  readonly onSaved: () => void;
}): ReactElement {
  const [name, setName] = useState(account.profile?.displayName ?? account.name);
  const [timezone, setTimezone] = useState(account.profile?.timezone ?? "");
  const [result, setResult] = useState<SettingsWriteResult | null>(null);
  const [busy, setBusy] = useState(false);
  const nameId = useId();
  const tzId = useId();
  const dirty =
    name.trim() !== (account.profile?.displayName ?? account.name) ||
    timezone !== (account.profile?.timezone ?? "");

  const save = async () => {
    setBusy(true);
    try {
      const changedName = name.trim() !== (account.profile?.displayName ?? account.name);
      setResult(
        await saveProfile({
          id: account.id,
          ...(changedName ? { displayName: name.trim() } : {}),
          timezone,
        }),
      );
      onSaved();
    } catch (error) {
      setResult({ ok: false, error: String(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="set-fields">
      <div className="field">
        <label htmlFor={nameId}>Display name</label>
        <input
          id={nameId}
          value={name}
          maxLength={60}
          disabled={account.kind === "bot"}
          onChange={(e) => setName(e.target.value)}
        />
        {account.kind === "bot" ? (
          <p className="set-hint">A bot's name is its identity — renaming is remove + re-add.</p>
        ) : (
          <p className="set-hint">
            Your name is how your sign-in finds this account — it must keep matching your session.
          </p>
        )}
      </div>
      <div className="field">
        <label htmlFor={tzId}>Timezone</label>
        <select id={tzId} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
          <option value="">No timezone</option>
          {timezones.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        <p className="set-hint">Sets how your desk's day boundaries are drawn.</p>
      </div>
      <button
        type="button"
        className="btn btn-primary set-save"
        disabled={!dirty || busy}
        onClick={save}
      >
        {busy ? "Saving…" : "Save profile"}
      </button>
      <ResultLine result={result} />
    </div>
  );
}

/** The catalog's token UX: replace, never reveal — existing keys are never shown; the pasted
 *  pair verifies against Alpaca before anything is stored, and the old key streams until then. */
function RotateSection({ account }: { readonly account: OwnedAccount }): ReactElement {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [result, setResult] = useState<SettingsWriteResult | null>(null);
  const [busy, setBusy] = useState(false);
  const keyId = useId();
  const secretId = useId();

  const rotate = async () => {
    setBusy(true);
    try {
      const outcome = await rotateCredentialsRequest({ id: account.id, apiKey, apiSecret });
      setResult(outcome);
      if (outcome.ok) {
        setApiKey("");
        setApiSecret("");
      }
    } catch (error) {
      setResult({ ok: false, error: String(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="set-rotate">
      <button
        type="button"
        className="set-rotate-head"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        Rotate Alpaca credentials
        <span className="set-rotate-chev" aria-hidden="true">
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open ? (
        <div className="set-rotate-body">
          <p className="set-hint">
            Paste the regenerated key pair from the Alpaca dashboard. The new key is verified
            against Alpaca before anything is stored — your existing key keeps streaming until it
            passes, and is never displayed here.
          </p>
          <div className="field">
            <label htmlFor={keyId}>New API key ID</label>
            <input
              id={keyId}
              type="password"
              value={apiKey}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor={secretId}>New API secret</label>
            <input
              id={secretId}
              type="password"
              value={apiSecret}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setApiSecret(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary set-save"
            disabled={busy || apiKey.trim() === "" || apiSecret.trim() === ""}
            onClick={rotate}
          >
            {busy ? "Verifying against Alpaca…" : "Verify & replace key"}
          </button>
          {result?.ok ? (
            <p className="set-ok">
              Key replaced — {result.displayName} streams on the new credential.
            </p>
          ) : (
            <ResultLine result={result} />
          )}
        </div>
      ) : null}
    </div>
  );
}

function DangerZone({
  account,
  onRemoved,
}: {
  readonly account: OwnedAccount;
  readonly onRemoved: () => void;
}): ReactElement {
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<SettingsWriteResult | null>(null);
  const [busy, setBusy] = useState(false);
  const confirmId = useId();
  const armed = typed === account.name;

  const remove = async () => {
    setBusy(true);
    try {
      const outcome = await removeAccountRequest({ id: account.id, confirmName: typed });
      setResult(outcome);
      if (outcome.ok) onRemoved();
    } catch (error) {
      setResult({ ok: false, error: String(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="set-danger">
      <p className="set-danger-head">Remove this account from the board</p>
      <p className="set-hint">
        The desk, its history, and its place on the standings go with it. Type{" "}
        <strong>{account.name}</strong> to arm the button — the server verifies the name again.
      </p>
      <div className="set-danger-row">
        <label className="visually-hidden" htmlFor={confirmId}>
          Type the account name to confirm
        </label>
        <input
          id={confirmId}
          value={typed}
          placeholder={account.name}
          spellCheck={false}
          onChange={(e) => setTyped(e.target.value)}
        />
        <button type="button" className="btn set-remove" disabled={!armed || busy} onClick={remove}>
          {busy ? "Removing…" : "Remove account"}
        </button>
      </div>
      <ResultLine result={result} />
    </div>
  );
}

function AccountCard({
  account,
  timezones,
  fleetSuspended,
  onChanged,
}: {
  readonly account: OwnedAccount;
  readonly timezones: SettingsIndex["timezones"];
  readonly fleetSuspended: boolean;
  readonly onChanged: () => void;
}): ReactElement {
  return (
    <section className="set-card" id={`account-${account.id}`}>
      <h2 className="set-card-h">
        {account.name}
        <span className={`chip chip-${account.kind}`}>
          {account.kind === "bot" ? "BOT" : "HUMAN"}
        </span>
      </h2>
      {account.hostConfigured ? (
        <>
          <p className="note">
            This account is configured on the host and rebuilt from the environment every restart —
            profile edits and removal aren't available here. A dead or regenerated Alpaca key is its
            one self-service fix, below.
          </p>
          <BotSwitch account={account} fleetSuspended={fleetSuspended} onChanged={onChanged} />
          <RotateSection account={account} />
        </>
      ) : (
        <>
          <ProfileForm account={account} timezones={timezones} onSaved={onChanged} />
          <BotSwitch account={account} fleetSuspended={fleetSuspended} onChanged={onChanged} />
          {account.kind === "bot" ? (
            <div className="set-links">
              <a href="#mission-control">Mission Control ↓</a>
            </div>
          ) : null}
          <RotateSection account={account} />
          <DangerZone account={account} onRemoved={onChanged} />
        </>
      )}
    </section>
  );
}

function SettingsPage(): ReactElement {
  const queryClient = useQueryClient();
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["settings"] });

  if (settings.isPending)
    return (
      <PageFrame>
        <p className="note">Reading your accounts…</p>
      </PageFrame>
    );
  if (settings.isError)
    return (
      <PageFrame>
        <p className="note">Settings are unreachable.</p>
      </PageFrame>
    );

  const { authConfigured, adminWired, accounts, timezones } = settings.data;
  const rail = (
    <>
      <p className="rail-label">Settings</p>
      {accounts.map((a) => (
        <a key={a.id} href={`#account-${a.id}`}>
          {a.name}
        </a>
      ))}
      <hr />
      <a href="/app/join">Add an account</a>
    </>
  );

  return (
    <PageFrame rail={accounts.length > 0 ? rail : undefined}>
      <header className="page-header">
        <h1>Settings</h1>
        <p>
          Your accounts, your rules: profile, timezone, credential rotation, and the door out.
          Owners find the fleet's switchboard — Mission Control — at the bottom.
        </p>
      </header>
      {!authConfigured ? (
        <p className="note">
          Settings need a signed-in session to know which accounts are yours — this deployment runs
          without sign-in, so there's nothing to edit here.
        </p>
      ) : !adminWired ? (
        <p className="note">Account management isn't wired in this deployment.</p>
      ) : accounts.length === 0 ? (
        <p className="note">
          Your sign-in doesn't resolve to an account yet — ask Eric to link one from /claim, or add
          your own from <a href="/app/join">the join page</a>.
        </p>
      ) : (
        accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            timezones={timezones}
            fleetSuspended={settings.data.fleetSuspended}
            onChanged={refresh}
          />
        ))
      )}
      <div id="mission-control">
        <MissionControl />
      </div>
      <GuestListCard />
      <AccountLinksCard />
      <OpsStatusCard />
    </PageFrame>
  );
}

export const Route = createFileRoute("/settings")({ component: SettingsPage });
