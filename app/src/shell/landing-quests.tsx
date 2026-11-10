import type { ReactElement } from "react";
import {
  exitLines,
  expiresLine,
  HOUSE_CALL_WORD,
  QUESTS_SHOWN,
  type Quest,
  rateLines,
  rateTag,
  SOURCE_WORD,
  unreadLine,
} from "../live/quests";

/**
 * THE LANDING PAGE'S QUESTS, DRAWN (#7077 slice 3, #7028 slice 5). A quest is one paper move with
 * its reason, the house's base rate and its exits; the member fires it from a draft ticket, and
 * nothing here places an order. Placement is Eric's pick (#7018 round 1, "Each by its source"):
 * a market quest under the story it came from (`StoryQuests`, inside the story's tap-open detail),
 * and the account's quests in one part after the news (`AccountQuests`). His note on that part:
 * "This shows opportunity.. I want the capability to do this, but in an organic cohesive way that
 * fits with all the other features" — so a quest borrows the story's grammar: one line, closed,
 * its tag a WORD in a bordered box (never a colour alone), the detail on a tap.
 *
 * At most `QUESTS_SHOWN` show in the route's rank order; the rest fold under one "more" disclosure
 * (#7028 objection 3: "the ranking is the product").
 */

function QuestItem({ quest }: { readonly quest: Quest }): ReactElement {
  return (
    <li className="quest">
      <details className="quest-row">
        <summary className="quest-line">
          <span className="quest-label">{quest.move.label}</span>
          <span className="story-mark quest-tag">{rateTag(quest.baseRate)}</span>
        </summary>
        <div className="quest-body">
          <p className="quest-source">
            {SOURCE_WORD[quest.source]}
            {quest.atOpen ? " · market closed: a plan for the next open" : ""}
          </p>
          <ul className="quest-why">
            {quest.why.map((w) => (
              <li key={w.rule}>{w.text}</li>
            ))}
          </ul>
          <dl className="quest-facts">
            <div>
              <dt>Base rate</dt>
              <dd>
                {rateLines(quest.baseRate).map((l) => (
                  <p key={l}>{l}</p>
                ))}
              </dd>
            </div>
            <div>
              <dt>Exits</dt>
              <dd>
                {exitLines(quest).map((l) => (
                  <p key={l}>{l}</p>
                ))}
              </dd>
            </div>
            <div>
              <dt>House call</dt>
              <dd>
                <p>
                  {HOUSE_CALL_WORD[quest.houseCall]} · {quest.confidence} confidence
                </p>
              </dd>
            </div>
          </dl>
          <p className="quest-expires">{expiresLine(quest)}</p>
          <a className="btn quest-open" href={quest.move.href}>
            Review it on a draft ticket ›
          </a>
          <p className="quest-hint">Nothing is placed until you send it from the ticket.</p>
        </div>
      </details>
    </li>
  );
}

function QuestList({ quests }: { readonly quests: readonly Quest[] }): ReactElement {
  const shown = quests.slice(0, QUESTS_SHOWN);
  const rest = quests.slice(QUESTS_SHOWN);
  return (
    <>
      <ul className="quest-list">
        {shown.map((q) => (
          <QuestItem key={q.id} quest={q} />
        ))}
      </ul>
      {rest.length > 0 ? (
        <details className="story-more quest-rest">
          <summary>
            {rest.length === 1 ? "1 more quest" : `${String(rest.length)} more quests`}
          </summary>
          <ul className="quest-list">
            {rest.map((q) => (
              <QuestItem key={q.id} quest={q} />
            ))}
          </ul>
        </details>
      ) : null}
    </>
  );
}

/** A story's market quests, drawn after its asks inside the opened story. Nothing when none. */
export function StoryQuests({
  quests,
}: {
  readonly quests: readonly Quest[] | undefined;
}): ReactElement | null {
  if (!quests || quests.length === 0) return null;
  return (
    <section className="story-quests" aria-label="Quests from this story">
      <h5 className="story-sub">{quests.length === 1 ? "A quest" : "Quests"} from this story</h5>
      <QuestList quests={quests} />
    </section>
  );
}

/** The account's quests, one part after the news. Says so plainly when there are none. */
export function AccountQuests({
  quests,
  unread,
}: {
  readonly quests: readonly Quest[];
  readonly unread: readonly string[];
}): ReactElement {
  const missing = unreadLine(unread);
  return (
    <section className="quests" aria-labelledby="quests-title">
      <h2 id="quests-title" className="section-title">
        Your quests
      </h2>
      <p className="quests-note">
        Paper moves from your own positions and your cash under today's market, best first. Each
        says how much the house knows about it.
      </p>
      {quests.length > 0 ? (
        <QuestList quests={quests} />
      ) : (
        <p className="note">No quest for this account right now.</p>
      )}
      {missing ? <p className="quests-unread">{missing}</p> : null}
    </section>
  );
}
