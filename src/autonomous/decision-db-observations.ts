import type { DatabaseSync } from "node:sqlite";
import {
  mergeObservation,
  observationSlot,
  type PlaybookObservation,
} from "../domain/playbook-observation.js";

/**
 * What the dark playbooks would have done (#5489), kept beside the verdicts so thirty observed
 * days can be scored. A side table, never `ALTER TABLE` — the house precedent `decision-db.ts`
 * set for `playbook_verdicts`: CREATE IF NOT EXISTS reaches a database that already exists.
 *
 * One row per observation key (playbook, ticker, kind, session, bar) — a signal per bar, a day's
 * reading per session (its slot is 0; the newest bar read rides in the body). A pass that says an
 * observation again MERGES into its row (`mergeObservation`): the outcome moves on, the quote read
 * at the signal and the worst level reached are kept. Not keyed by persona: the bars are the same
 * for every bot that subscribes, and a signal is one fact however many bots watched it.
 *
 * Never throws on the write path — an observation is a recording, and losing one must not cost the
 * decision record it rode in on.
 */
export const OBSERVATION_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS playbook_observations (
    playbook_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    kind TEXT NOT NULL,
    session TEXT NOT NULL,
    minutes INTEGER NOT NULL,
    first_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    body_json TEXT NOT NULL,
    PRIMARY KEY (playbook_id, symbol, kind, session, minutes)
  );
  CREATE INDEX IF NOT EXISTS playbook_observations_session ON playbook_observations(playbook_id, session);`;

export interface ObservationTables {
  /** Upserts each observation, merging into the row it already has. Never throws. */
  write(at: number, observations: readonly PlaybookObservation[]): void;
  /** One playbook's observations, oldest session first; `fromSession` (`YYYY-MM-DD`) bounds it. */
  list(playbookId: string, opts?: { readonly fromSession?: string }): PlaybookObservation[];
}

export function openObservationTables(db: DatabaseSync): ObservationTables {
  db.exec(OBSERVATION_TABLES_SQL);
  const select = db.prepare(
    "SELECT body_json FROM playbook_observations WHERE playbook_id = ? AND symbol = ? AND kind = ? AND session = ? AND minutes = ?",
  );
  const insert = db.prepare(
    "INSERT INTO playbook_observations (playbook_id, symbol, kind, session, minutes, first_at, updated_at, body_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const update = db.prepare(
    "UPDATE playbook_observations SET updated_at = ?, body_json = ? WHERE playbook_id = ? AND symbol = ? AND kind = ? AND session = ? AND minutes = ?",
  );
  const selectFor = db.prepare(
    "SELECT body_json FROM playbook_observations WHERE playbook_id = ? AND session >= ? ORDER BY session ASC, minutes ASC, symbol ASC, kind ASC",
  );

  const parse = (json: unknown): PlaybookObservation | undefined => {
    try {
      return JSON.parse(String(json)) as PlaybookObservation;
    } catch {
      return undefined;
    }
  };

  return {
    write(at, observations) {
      for (const o of observations) {
        try {
          const key = [o.playbookId, o.symbol, o.kind, o.session, observationSlot(o)] as const;
          const row = select.get(...key) as { body_json: string } | undefined;
          if (!row) {
            insert.run(...key, at, at, JSON.stringify(o));
          } else {
            const merged = mergeObservation(parse(row.body_json), o);
            update.run(at, JSON.stringify(merged), ...key);
          }
        } catch {
          // A recording must never cost the decision it rode in on; the next pass says it again.
        }
      }
    },
    list(playbookId, opts = {}) {
      const rows = selectFor.all(playbookId, opts.fromSession ?? "") as { body_json: string }[];
      return rows.flatMap((r) => {
        const o = parse(r.body_json);
        return o ? [o] : [];
      });
    },
  };
}
