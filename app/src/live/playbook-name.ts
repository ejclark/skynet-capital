import { playbookName, withPairNames } from "../../../src/playbooks/pair-table";

/**
 * A PAIR NAMED TO ITS OWNER, NEVER BY ITS ID (#4469 criterion 14, slice 3d). Wherever a fill, a
 * decision chip or a roll-call line names the playbook that placed it, the owner reads "the wheel on
 * CRWV", not `CRWV-WHEEL`. The ids still key every link, landing and record; only the words change.
 *
 * Named here, in the browser, from ids only the owner receives: the server withholds a bot's
 * playbook ids from anyone else and redacts them out of the free text by matching ids (#885,
 * #4442), so a name added on the server would be one more thing that redaction has to catch.
 */

export { playbookName, withPairNames };

/** "The wheel on CRWV" — the name where it opens a line: a card's title, a row's head. */
export function playbookTitle(id: string): string {
  const name = playbookName(id);
  return name.charAt(0).toUpperCase() + name.slice(1);
}
