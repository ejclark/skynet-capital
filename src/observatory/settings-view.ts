import { escapeHtml } from "../ui/escape-html.js";
import { type DashboardViewOptions, renderShell } from "./dashboard-shell.js";
import { DESK_STYLE } from "./desk-style.js";
import { type DeskNotice, deskFrame, deskNoticeBanner } from "./desk-tabs.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";
import { profileHref } from "./render-atoms.js";

/**
 * SETTINGS — the owner-only desk tab that MISSION CONTROL now lives on (#475).
 *
 * It used to be `/controls`, a standalone page wrapped in the bare form shell. That put it outside
 * the app-wide template, so the left rail disappeared the moment you opened it — the defect the
 * member reported. Rendering it as a desk tab through `renderShell` fixes that structurally rather
 * than by copying a rail into one more place: the switchboard now inherits the same drawer, the
 * same tokens and the same tab strip as every other logged-in view.
 *
 * Two sections, in the order an owner reads them:
 *  1. **This account** — the switch for the desk you're standing on, which is why the page is an
 *     account setting at all.
 *  2. **The fleet** — the everything-stops switch and the full roster, so the tab is still the one
 *     switchboard and not a per-bot fragment of one.
 *
 * The honesty rules from the old page carry over unchanged: latency is stated (~30 s, no restart),
 * a suspended bot is red and a trading one green (the market-color rule, docs/BRAND.md), and a
 * human account says plainly that it has nothing autonomous to suspend rather than rendering a
 * dead switch that implies otherwise.
 */

/** One bot as the switchboard sees it: who it is, and whether it is standing down. */
interface FleetBot {
  readonly id: string;
  readonly displayName: string;
  readonly suspended: boolean;
}

/** The fleet's control state, flattened for rendering — no store, no server types. */
export interface FleetControls {
  /** The global stand-down. When true, every bot is halted regardless of its own switch. */
  readonly allSuspended: boolean;
  /** The bots eligible for the switchboard — known personas only (a planted row never appears). */
  readonly bots: readonly FleetBot[];
  readonly updatedAt?: string;
  readonly updatedBy?: string;
}

export interface SettingsViewOptions extends DashboardViewOptions {
  readonly isSelf?: boolean;
  readonly generatedAt?: string;
  readonly controls: FleetControls;
  /** Result of the switch that was just flipped. */
  readonly notice?: DeskNotice;
}

/** Where this tab's forms post: back to the desk they were rendered on. */
export function settingsAction(participantId: string): string {
  return `${profileHref(participantId)}?tab=settings`;
}

function stateChip(suspended: boolean): string {
  return suspended
    ? `<span class="neg"><b>SUSPENDED</b></span>`
    : `<span class="pos"><b>TRADING</b></span>`;
}

function switchForm(action: string, botId: string, suspended: boolean): string {
  return `<form class="rowform" method="post" action="${action}">
        <input type="hidden" name="bot" value="${escapeHtml(botId)}">
        <input type="hidden" name="action" value="${suspended ? "resume" : "suspend"}">
        <button class="btn${suspended ? " btn-primary" : " btn-sell"}" type="submit">${
          suspended ? "Resume trading" : "Suspend trading"
        }</button>
      </form>`;
}

/**
 * Section 1 — the desk you are standing on. A registered bot gets its own switch; anything else
 * says why it hasn't got one, because a missing control with no explanation reads as a bug.
 */
function thisAccountPanel(snapshot: ParticipantSnapshot, controls: FleetControls): string {
  const mine = controls.bots.find((bot) => bot.id === snapshot.id);
  if (!mine) {
    const why =
      snapshot.kind === "bot"
        ? `This account is marked as a bot but isn't one of the league's registered personas, so no autonomous runner reads its switch.`
        : `This account is traded by a person, so there's nothing autonomous to stand down. The fleet controls below cover the bots.`;
    return `<section class="panel">
      <h2 class="panel-title">This account</h2>
      <p class="panel-sub">${escapeHtml(why)}</p>
    </section>`;
  }
  const halted = controls.allSuspended || mine.suspended;
  return `<section class="panel">
      <h2 class="panel-title">Autonomous trading — ${escapeHtml(snapshot.displayName)}</h2>
      <p class="panel-sub">Status: ${stateChip(halted)}${
        controls.allSuspended && !mine.suspended
          ? ` — held down by the fleet-wide suspend below, not by this account's own switch.`
          : ""
      }</p>
      ${switchForm(settingsAction(snapshot.id), mine.id, mine.suspended)}
      <p class="desk-note">Takes effect within ~30 seconds — no restart, no env push. Suspending
      stops new (paper) orders; positions already open are left exactly as they are.</p>
    </section>`;
}

/** Section 2 — the everything-stops switch and the whole roster, one row per bot. */
function fleetPanel(snapshot: ParticipantSnapshot, controls: FleetControls): string {
  const action = settingsAction(snapshot.id);
  const globalSwitch = controls.allSuspended
    ? `<p class="note-stop"><b>ALL AUTONOMOUS TRADING IS SUSPENDED.</b> Lift it and each bot returns to its own setting below.</p>
       <form class="rowform" method="post" action="${action}"><input type="hidden" name="action" value="resume-all">
       <button class="btn btn-primary" type="submit">Lift global suspend</button></form>`
    : `<form class="rowform" method="post" action="${action}"><input type="hidden" name="action" value="suspend-all">
       <button class="btn btn-sell" type="submit">Suspend ALL autonomous trading</button></form>
       <p class="desk-note">The everything-stops switch — <b>every</b> bot on the board (and the beta
       scout) stands down within ~30 seconds, not just this desk.</p>`;
  const rows = controls.bots.length
    ? controls.bots
        .map(
          (bot) => `<tr>
      <td><a href="${profileHref(bot.id)}">${escapeHtml(bot.displayName)}</a><br><span class="desk-note">${escapeHtml(bot.id)}</span></td>
      <td>${stateChip(controls.allSuspended || bot.suspended)}</td>
      <td>${switchForm(action, bot.id, bot.suspended)}</td>
    </tr>`,
        )
        .join("")
    : `<tr><td colspan="3"><span class="desk-empty">No bots on the board.</span></td></tr>`;
  const audit = controls.updatedAt
    ? `<p class="desk-note">Last change ${escapeHtml(
        controls.updatedAt.slice(0, 16).replace("T", " "),
      )} UTC by ${escapeHtml(controls.updatedBy ?? "unknown")}</p>`
    : "";
  return `<section class="panel">
      <h2 class="panel-title">Mission Control — the whole fleet</h2>
      <p class="panel-sub">Every control here takes effect within ~30 seconds, for every bot in the
      league. Safety nets are independent of this page — the readiness gate, risk guards, circuit
      breakers and the host kill switch all still apply.</p>
      ${globalSwitch}
      <div class="blotter-wrap">
        <table class="blotter">
          <thead><tr><th>Bot</th><th>Status</th><th>Switch</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${audit}
    </section>`;
}

export function renderSettingsBody(
  snapshot: ParticipantSnapshot,
  options: SettingsViewOptions,
): string {
  const { asOf, header } = deskFrame(snapshot, "settings", options, {
    title: "Settings",
    sub: "Mission Control — the switchboard for this account and for the autonomous fleet.",
  });
  return renderShell(
    options.nav,
    `${DESK_STYLE}<section class="desk">
    ${header}
    ${deskNoticeBanner(options.notice)}
    ${thisAccountPanel(snapshot, options.controls)}
    ${fleetPanel(snapshot, options.controls)}
  </section>`,
    asOf,
  );
}
