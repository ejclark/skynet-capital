import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useId } from "react";
import { fetchDesk } from "../live/desk";
import { fetchPlays, type PlayInfo } from "../live/options";
import { fetchSettings, type OwnedAccount } from "../live/settings";
import { DraftOrderBuilder } from "../shell/draft-order-builder";
import { PageFrame } from "../shell/frame";
import { LadderGateCard } from "../shell/ladder-gate";
import { MilestoneStrip } from "../shell/milestone-strip";
import { OptionGate } from "../shell/option-gate";
import { OptionPositionsCard } from "../shell/option-positions";
import { TradeGate } from "../shell/trade-gate";

/**
 * THE TRADE TICKET (#738, live-review round; options since phase 10b) — the dedicated trading
 * workflow surface. `?desk=` picks the account; `?play=` picks the rung from the six-play
 * catalog (101/102 side the share gate, 201+ open the options gate) — both typed, shareable
 * search params, which is also what the learn milestones' "open the ticket" links carry.
 *
 * Account choice is a FIELD of the ticket (`AccountField`), not a gatekeeper screen the ticket
 * waits behind — the form is always on-screen, defaulting to the session's own first account.
 * The options list is `/api/settings`'s `accounts`, which only ever names accounts the session
 * owns (`ownsAccount`'s doc comment) — the same server-side identity the desk gate re-checks at
 * submit, so nothing here can offer, let alone place, a ticket against someone else's desk.
 */

const PLAY_CODES = new Set(["101", "102", "201", "202", "301", "302"]);

function AccountField({
  accounts,
  deskId,
  onChange,
}: {
  readonly accounts: readonly OwnedAccount[];
  readonly deskId: string;
  readonly onChange: (id: string) => void;
}): ReactElement {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>Account</label>
      <select id={id} value={deskId} onChange={(e) => onChange(e.target.value)}>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function DeskTicket({ desk, code }: { readonly desk: string; readonly code: string }) {
  const plays = useQuery({ queryKey: ["plays"], queryFn: fetchPlays });
  const deskData = useQuery({
    queryKey: ["desk", desk],
    queryFn: () => fetchDesk(desk),
  });
  const info: PlayInfo | undefined = plays.data?.plays.find((p) => p.code === code);
  // The feedback gate (#1119): while it holds, every rung that OPENS a position shows the gate card
  // instead of a ticket. A sell (102) is an exit and stays open — the server holds the same line.
  const gate = plays.data?.gate;
  const gated = gate !== undefined && code !== "102";
  return (
    <>
      {plays.data ? (
        <MilestoneStrip
          deskId={desk}
          current={code}
          plays={plays.data.plays}
          wheels={plays.data.wheels}
          gate={plays.data.gate}
          nextUp={plays.data.nextUp}
        />
      ) : null}
      {gated ? (
        <LadderGateCard note={gate.note} />
      ) : info && info.kind === "option" ? (
        <OptionGate key={info.code} deskId={desk} play={info} />
      ) : (
        <TradeGate key={code} deskId={desk} initialAction={code === "102" ? "sell" : "buy"} />
      )}
      {deskData.data ? (
        <OptionPositionsCard deskId={desk} positions={deskData.data.desk.positions} />
      ) : null}
      <DraftOrderBuilder deskId={desk} />
    </>
  );
}

function TradePage(): ReactElement {
  const { desk, play } = Route.useSearch();
  const navigate = Route.useNavigate();
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const accounts = settings.data?.accounts ?? [];
  // A bookmarked or shared `?desk=` only sticks if it's still an account the session owns —
  // otherwise fall back to the first owned account, same as having no `?desk=` at all.
  const activeDesk = (desk && accounts.some((a) => a.id === desk) ? desk : accounts[0]?.id) as
    | string
    | undefined;
  // #784 naming pass: no second rail item here yet. The Trading Outpost link that used to sit
  // below "The ticket" pointed at content #885 superseded and renamed to the Playbook Store,
  // which now lives on the per-desk rail (`desk-rail.tsx`), not here — keeping the old link would
  // have sent people to a page marked for retirement under a name that no longer exists. Growing
  // this rail to "critical mass" with real items (Portfolio, a Backtesting/Strategy Lab
  // placeholder) is #784's own slice 7, not bundled into the naming pass.
  const rail = (
    <>
      <p className="rail-label">Trading</p>
      <span className="rail-current" aria-current="page">
        The ticket
      </span>
      <hr />
      {activeDesk ? (
        <Link to="/u/$id" params={{ id: activeDesk }}>
          ← Back to the desk
        </Link>
      ) : (
        <Link to="/" search={{ by: "equity" }}>
          ← Accounts
        </Link>
      )}
    </>
  );
  return (
    <PageFrame rail={rail}>
      <header className="page-header">
        <h1>Trade</h1>
        <p>
          Paper account · the gate reviews every ticket before anything is sent, and the desk
          re-checks the live account at submit.
        </p>
      </header>
      {settings.isLoading ? null : accounts.length === 0 ? (
        <p className="note">No accounts are linked to your session yet.</p>
      ) : activeDesk ? (
        <>
          {accounts.length > 1 ? (
            <AccountField
              accounts={accounts}
              deskId={activeDesk}
              onChange={(id) => navigate({ search: (prev) => ({ ...prev, desk: id }) })}
            />
          ) : null}
          <DeskTicket desk={activeDesk} code={play ?? "101"} />
        </>
      ) : null}
    </PageFrame>
  );
}

export const Route = createFileRoute("/trade")({
  validateSearch: (search: Record<string, unknown>) => {
    // The router JSON-parses search values, so a legacy ?play=201 arrives as a NUMBER — normalize
    // through String before gating against the catalog's codes.
    const play = typeof search.play === "object" ? "" : String(search.play ?? "");
    return {
      ...(typeof search.desk === "string" && search.desk.length > 0 && search.desk.length <= 100
        ? { desk: search.desk }
        : {}),
      ...(PLAY_CODES.has(play) ? { play: play as PlayInfo["code"] } : {}),
    };
  },
  component: TradePage,
});
