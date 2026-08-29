/**
 * CLI: capture the WIRE SHAPE of option lifecycle activities from a live paper account (#837).
 *
 * This exists to answer exactly one open question, and then get out of the way: which field on an
 * `OPTRD` activity carries its side. `src/trading/option-lifecycle.ts` keeps `OPTRD` out of the
 * equity round-trip ledger until that is confirmed against a real payload rather than guessed from
 * documentation — so this script is the step that unblocks it, not the fix itself. Nothing here
 * writes to the ledger, places an order, or changes what the app reports; it reads and describes.
 *
 * Output is redacted by default (`option-lifecycle-shape.ts` explains why: this repo is public, so
 * a member's symbols, quantities and prices must not land in an issue comment) and the redacted
 * block is safe to paste as-is. `--raw` prints the verbatim payload for local inspection only.
 *
 * Usage:
 *   set -a && source .env && set +a
 *   npm run capture:lifecycle          # redacted shape report — paste this into #837
 *   npm run capture:lifecycle -- --raw # verbatim JSON, LOCAL ONLY (real account activity)
 */
import type { AlpacaAccountActivity } from "../alpaca/alpaca-options-client.js";
import { LIFECYCLE_MAX_PAGES, LIFECYCLE_PAGE_SIZE } from "../observatory/activity-backfill.js";
import { mergeRoster } from "../participants/participant.js";
import { createParticipantStore } from "../participants/participant-store.js";
import { resolveDataSource } from "../runtime/data-source.js";
import {
  describeLifecycleShapes,
  renderLifecycleShapes,
} from "../trading/option-lifecycle-shape.js";

async function readLifecycleActivities(
  list: (after?: string) => Promise<AlpacaAccountActivity[]>,
): Promise<{ rows: AlpacaAccountActivity[]; pages: number }> {
  const rows: AlpacaAccountActivity[] = [];
  let after: string | undefined;
  let pages = 0;
  while (pages < LIFECYCLE_MAX_PAGES) {
    const page = await list(after);
    if (page.length === 0) break;
    pages += 1;
    rows.push(...page);
    const oldest = page[page.length - 1]?.id;
    if (page.length < LIFECYCLE_PAGE_SIZE || !oldest || oldest === after) break;
    after = oldest;
  }
  return { rows, pages };
}

async function main(): Promise<void> {
  const raw = process.argv.includes("--raw");
  const dataSource = resolveDataSource(process.env);
  if (dataSource.mode === "offline") {
    console.error(
      "Offline mode serves committed fixtures — a fixture cannot confirm a live wire shape, which is",
    );
    console.error(
      "the entire point of this capture. Run it in live mode (unset SKYNET_DATA_SOURCE).",
    );
    process.exit(1);
  }

  const roster = mergeRoster(
    dataSource.loadParticipants(),
    createParticipantStore(process.env).load(),
  );
  if (roster.length === 0) {
    console.error("No participants configured — nothing to capture.");
    process.exit(1);
  }

  const collected: AlpacaAccountActivity[] = [];
  let failures = 0;

  for (const participant of roster) {
    // Credential preflight. `getOptionLifecycleActivities` fails SOFT (an empty array on any
    // error), which is right for history rendering and wrong for a diagnostic: without this, a
    // rejected key and a genuinely quiet account are indistinguishable, and the whole value of
    // this script is being able to report "confirmed: no OPTRD yet" as a fact rather than a shrug.
    try {
      await dataSource.clientFactory(participant).getAccount();
    } catch (error) {
      failures += 1;
      console.error(`[${participant.id}] credentials rejected — ${error}`);
      continue;
    }

    const options = dataSource.optionsClientFactory(participant);
    const { rows, pages } = await readLifecycleActivities((after) =>
      options.getOptionLifecycleActivities(after),
    );
    const optrd = rows.filter((row) => row.activity_type === "OPTRD").length;
    console.log(
      `[${participant.id}] authenticated — ${rows.length} lifecycle activit${rows.length === 1 ? "y" : "ies"} over ${pages} page(s), ${optrd} of them OPTRD.`,
    );
    collected.push(...rows);
  }

  if (failures > 0) {
    console.error(`${failures} account(s) failed to authenticate — fix credentials and re-run.`);
    process.exit(1);
  }

  const optrdRows = collected.filter((row) => row.activity_type === "OPTRD");
  console.log("");

  if (raw) {
    console.log("!! VERBATIM PAYLOAD — real paper-account activity. Do NOT paste into a public");
    console.log("!! issue; re-run without --raw for the redacted, publishable report.");
    console.log(JSON.stringify(collected, null, 2));
    console.log("");
  }

  console.log("────────── safe to paste into issue #837 ──────────");
  console.log(renderLifecycleShapes(describeLifecycleShapes(collected)));
  console.log("───────────────────────────────────────────────────");
  console.log("");

  if (optrdRows.length === 0) {
    console.log(
      "No OPTRD activity found. Every account above authenticated, so this is a confirmed absence,",
    );
    console.log(
      "not a failed read — the roster simply has not had an option exercised or assigned yet.",
    );
    console.log(
      "#837 stays blocked until one settles; re-run then. (Nothing in the app is wrong meanwhile:",
    );
    console.log("OPTRD is journaled and shown, just held out of round-trip P/L.)");
    return;
  }

  console.log(
    `Captured ${optrdRows.length} OPTRD row(s). The field carrying side is whichever name above shows`,
  );
  console.log('a literal "buy"/"sell" under OPTRD — paste the block into #837 to unblock it.');
}

main().catch((error) => {
  console.error("Capture failed:", error);
  process.exit(1);
});
