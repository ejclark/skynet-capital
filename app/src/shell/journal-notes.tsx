import type { ReactElement } from "react";
import type { JournalNoteView, TradeNoteView } from "../live/journal";

/**
 * THE JOURNAL'S NOTES (#8190) — the member's own experience and trade notes, newest first, as the
 * server lists them. Private: no one else's notes are ever read (the server keys them by the
 * session), and nothing here is filed or sent to Moneypenny. Member words render as plain text —
 * React escapes them, and nothing parses markdown or HTML out of them.
 *
 * The kind of note is a word ("What happened", "Trade note"), never a colour.
 */

const TRADE_LINES: readonly (readonly [
  keyof TradeNoteView & ("whyIn" | "leaveIf" | "learned"),
  string,
])[] = [
  ["whyIn", "Why I'm in"],
  ["leaveIf", "What would make me leave"],
  ["learned", "What I learned"],
];

function NoteRow({ note }: { readonly note: JournalNoteView }): ReactElement {
  const saved = note.savedAt.slice(0, 10);
  if (note.kind === "experience") {
    return (
      <li className="jr-note">
        <span className="fb-meta num">
          <b className="jr-kind">What happened</b> · saved {saved}
        </span>
        <p className="jr-text">{note.text}</p>
      </li>
    );
  }
  return (
    <li className="jr-note">
      <span className="fb-meta num">
        <b className="jr-kind">Trade note</b>
        {note.symbol ? ` · ${note.symbol}` : ""} · saved {saved}
      </span>
      <dl className="jr-trade-lines">
        {TRADE_LINES.map(([key, label]) =>
          note[key] ? (
            <div key={key}>
              <dt>{label}</dt>
              <dd className="jr-text">{note[key]}</dd>
            </div>
          ) : null,
        )}
      </dl>
    </li>
  );
}

/** @category feedback */
export function JournalNotes({
  notes,
  available,
  reason,
}: {
  readonly notes: readonly JournalNoteView[];
  readonly available: boolean;
  readonly reason?: string;
}): ReactElement {
  return (
    <section className="jr-notes" aria-labelledby="jr-notes-h">
      <h2 id="jr-notes-h" className="fb-h">
        Your notes
      </h2>
      {!available ? (
        <p className="note">{reason ?? "Notes aren't stored on this deployment yet."}</p>
      ) : notes.length === 0 ? (
        <p className="note">
          No notes yet. What happened and trade notes land here, private to you.
        </p>
      ) : (
        <ul className="jr-list">
          {notes.map((note) => (
            <NoteRow key={note.uuid} note={note} />
          ))}
        </ul>
      )}
    </section>
  );
}
