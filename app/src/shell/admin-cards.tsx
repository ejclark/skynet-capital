import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useState } from "react";
import {
  type AdminAnswer,
  fetchClaims,
  fetchGuestList,
  fetchOpsStatus,
  inviteRequest,
  type LinkedAccount,
  linkRequest,
} from "../live/admin";

/**
 * THE OWNER'S CARDS (#738 phase 9e) — `/invite`, `/claim`, and `/ops-status` on the settings
 * page, self-gating exactly like Mission Control: each renders only when its API says the
 * session is an owner, and a member's settings page simply doesn't have them. Sentences render
 * verbatim from the server; linking stays deliberately owner-only (it grants order placement).
 */

function useAnswer() {
  const [note, setNote] = useState<{ ok: boolean; text: string } | undefined>();
  const apply = (answer: AdminAnswer) =>
    setNote({ ok: answer.ok, text: answer.message ?? answer.error ?? "" });
  const fail = (err: unknown) =>
    setNote({ ok: false, text: err instanceof Error ? err.message : String(err) });
  return { note, apply, fail };
}

/** @category admin */
export function GuestListCard(): ReactElement | null {
  const queryClient = useQueryClient();
  const list = useQuery({ queryKey: ["admin-invite"], queryFn: fetchGuestList });
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const { note, apply, fail } = useAnswer();
  if (!list.data?.owner) return null;
  const add = async () => {
    setBusy(true);
    try {
      apply(await inviteRequest(email.trim()));
      setEmail("");
      await queryClient.invalidateQueries({ queryKey: ["admin-invite"] });
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="set-card adm">
      <h2 className="set-card-h">🎟 Guest list</h2>
      <p className="mc-sub">
        Anyone here can sign in. Owners are configured on the host and aren't listed below.
      </p>
      <div className="adm-rows">
        {list.data.entries.length === 0 ? (
          <p className="note">Nobody invited yet — the owners on the host can always sign in.</p>
        ) : (
          list.data.entries.map((entry) => (
            <div key={entry.email} className="adm-row">
              <span className="adm-main">{entry.email}</span>
              <span className="adm-meta num">
                added {entry.addedAt.slice(0, 10)} by {entry.addedBy}
              </span>
              <span className={`adm-chip${entry.joinedAt ? " adm-ok" : ""}`}>
                {entry.joinedAt ? `joined ${entry.joinedAt.slice(0, 10)}` : "not yet"}
              </span>
            </div>
          ))
        )}
      </div>
      {list.data.secure ? (
        <div className="adm-form">
          <input
            type="email"
            value={email}
            placeholder="friend@gmail.com"
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary mc-btn"
            disabled={busy || email.trim() === ""}
            onClick={() => void add()}
          >
            {busy ? "Adding…" : "Add to the guest list"}
          </button>
        </div>
      ) : (
        <p className="set-err">
          Invites are off: the guest list can't be written encrypted without the store secret.
        </p>
      )}
      {note ? <p className={note.ok ? "set-ok" : "set-err"}>{note.text}</p> : null}
    </section>
  );
}

function LinkRow({
  account,
  onChanged,
}: {
  readonly account: LinkedAccount;
  readonly onChanged: () => void;
}): ReactElement {
  const [busy, setBusy] = useState(false);
  const { note, apply, fail } = useAnswer();
  const unlink = async () => {
    setBusy(true);
    try {
      apply(await linkRequest({ id: account.id, unlink: true }));
      onChanged();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="adm-row">
      <span className="adm-main">
        {account.displayName}{" "}
        <small className="num">
          {account.id}
          {account.kind === "bot" ? " · bot" : ""}
        </small>
      </span>
      {account.owner ? (
        <span className="adm-meta">{account.owner}</span>
      ) : (
        <span className="adm-meta adm-warn">nobody — can't trade</span>
      )}
      <span className="adm-meta num">{account.source ?? "—"}</span>
      {account.linked ? (
        <button
          type="button"
          className="btn mc-btn mc-danger"
          disabled={busy}
          onClick={() => void unlink()}
        >
          {busy ? "…" : "Unlink"}
        </button>
      ) : null}
      {note ? <span className={note.ok ? "set-ok" : "set-err"}>{note.text}</span> : null}
    </div>
  );
}

/** The selected account's own ownership — a compact line, not a card, so it reads as part of
 *  THIS account's settings (Eric, 2026-09-05: deconstruct the all-accounts card, render ownership
 *  under the specified account) rather than a redundant roster of every account on the board.
 *  Only ever shows an owned account here: an account nobody owns yet isn't in the switcher that
 *  picked `accountId` in the first place — that case belongs to `UnclaimedAccountsCard`.
 *  @category admin */
export function AccountOwnershipLine({
  accountId,
  onChanged,
}: {
  readonly accountId: string;
  readonly onChanged: () => void;
}): ReactElement | null {
  const queryClient = useQueryClient();
  const claims = useQuery({ queryKey: ["admin-claim"], queryFn: fetchClaims });
  const [busy, setBusy] = useState(false);
  const { note, apply, fail } = useAnswer();
  if (!claims.data?.owner) return null;
  const account = claims.data.accounts.find((a) => a.id === accountId);
  if (!account?.owner) return null;
  const unlink = async () => {
    setBusy(true);
    try {
      apply(await linkRequest({ id: account.id, unlink: true }));
      void queryClient.invalidateQueries({ queryKey: ["admin-claim"] });
      onChanged();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <p className="set-hint set-ownership">
      Owned by {account.owner}
      <button
        type="button"
        className="set-ownership-unlink"
        disabled={busy}
        onClick={() => void unlink()}
      >
        {busy ? "…" : "Unlink"}
      </button>
      {note ? <span className={note.ok ? "set-ok" : "set-err"}> {note.text}</span> : null}
    </p>
  );
}

/** The residual roster admin needs a specified-account view can't cover: accounts nobody owns
 *  yet, so they aren't reachable from any per-account view. Shrunk from listing every account
 *  (owned included) to just the ones actually needing a first owner. @category admin */
export function UnclaimedAccountsCard(): ReactElement | null {
  const queryClient = useQueryClient();
  const claims = useQuery({ queryKey: ["admin-claim"], queryFn: fetchClaims });
  const [id, setId] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const { note, apply, fail } = useAnswer();
  if (!claims.data?.owner) return null;
  const unowned = claims.data.accounts.filter((a) => !a.owner);
  if (unowned.length === 0) return null;
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["admin-claim"] });
  const link = async () => {
    setBusy(true);
    try {
      apply(await linkRequest({ id: id || unowned[0]?.id || "", email: email.trim() }));
      setEmail("");
      refresh();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="set-card adm">
      <h2 className="set-card-h">🔗 Unclaimed accounts</h2>
      <p className="mc-sub">
        Nobody's linked to these yet — they keep their history and place on the board, but can't be
        traded until they're linked. Linking grants the power to place orders, so it is deliberately
        owner-only.
      </p>
      <div className="adm-rows">
        {unowned.map((account) => (
          <LinkRow key={account.id} account={account} onChanged={refresh} />
        ))}
      </div>
      <div className="adm-form">
        <select value={id || unowned[0]?.id} onChange={(e) => setId(e.target.value)}>
          {unowned.map((a) => (
            <option key={a.id} value={a.id}>
              {a.displayName}
            </option>
          ))}
        </select>
        <input
          type="email"
          value={email}
          placeholder="friend@gmail.com"
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-primary mc-btn"
          disabled={busy || email.trim() === ""}
          onClick={() => void link()}
        >
          {busy ? "Linking…" : "Link this account"}
        </button>
      </div>
      {note ? <p className={note.ok ? "set-ok" : "set-err"}>{note.text}</p> : null}
    </section>
  );
}

/** @category admin */
export function OpsStatusCard(): ReactElement | null {
  const ops = useQuery({ queryKey: ["admin-ops"], queryFn: fetchOpsStatus });
  if (!ops.data?.owner) return null;
  const { status } = ops.data;
  return (
    <section className="set-card adm">
      <h2 className="set-card-h">📡 Ops status</h2>
      <p className="mc-sub">
        Bots and deploy health, read-only — generated{" "}
        {status.generatedAt.slice(0, 16).replace("T", " ")} UTC
        {status.degraded ? " · running without a GitHub token, so the panel is smaller" : ""}.
      </p>
      <div className="adm-rows">
        {status.signals.map((signal) => (
          <div key={signal.id} className="adm-row">
            <span className={`adm-dot adm-${signal.verdict}`} aria-hidden="true" />
            <span className="adm-main">{signal.label}</span>
            <span className="adm-meta">{signal.detail}</span>
            {signal.link ? (
              <a href={signal.link.href} target="_blank" rel="noopener noreferrer">
                {signal.link.label}
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
