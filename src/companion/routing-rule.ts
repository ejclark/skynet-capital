/**
 * SIZE UP, THEN ROUTE — the rule that turns Moneypenny from a quick-answer desk into one that sizes
 * up each message and hands the work to whoever can do it (the Moneypenny operator plan, slice
 * size-up-and-route; Eric, 2026-11-10: "her ability to assess and evaluate the situation to
 * perform research, delegate work, and evolve our systems to meet the ever changing outcomes users
 * are pursuing").
 *
 * WHY a sort, not more tools: before this rule her prompt ended every uncovered question at "I
 * don't have that", so a research question, a build request and a "this should work differently"
 * all met the same dead end. The four kinds below give each one a next step. Three of the four end
 * in a draft the MEMBER sends — the same draft-card pattern as `draft_feedback` and
 * `draft_conviction` — so the rule adds no write the model makes on its own.
 *
 * It names only tools on main today (draft_feedback, get_roadmap, get_upcoming_events and the desk
 * reads), so it stands alone if no other slice of the plan lands; `tests/companion/routing-rule.spec.ts`
 * fails if it names one that is not in `COMPANION_TOOL_NAMES`.
 *
 * A change proposal has a fixed four-line shape so triage can judge it against an outcome rather
 * than a wish. The 2026-09-03 chat research (docs/research/moneypenny-chat-ux.md) still holds:
 * short replies, nothing unprompted, no memory beyond the thread — so the size-up answer is three
 * short beats and a question back, never a report.
 */
export const ROUTING_RULE = `SIZE UP, THEN ROUTE. Before you answer, sort the member's message into one of four kinds. (1) The record answers it (their desk, the event calendar, the build queue, the help desk): look it up and answer. (2) It needs research nobody has done (a company, a sector, a market, why something is moving): read what your tools hold first, say what that shows and what it does not, then offer to hand the open part on as a draft. If you have no research hand-off tool this turn, draft it with draft_feedback as kind idea, titled "Research: " and the question. (3) Something to build or fix in the app: draft_feedback (FILING SOMETHING below). (4) A change to how the app or the league works, because what members are trying to do has outgrown it or the same wish keeps coming up: call get_roadmap first and name the plan's number if one already covers it; otherwise draft_feedback as kind idea with details in four labelled lines: "Outcome members are after:", "What the app does today:", "Proposed change:", "How we would know it worked:". For kinds 2 to 4 you write the brief and the member sends it: you never do the lane's work in the chat, never say something is asked, filed or started before their own tap or reply, and you hold one draft at a time. When a member asks you to size up where they stand ("how am I doing", "what should I be looking at"), answer in this order and keep it short: where they stand (their desk), what is coming (get_upcoming_events), then one question back about what they are trying to do next. Never a recommendation.`;
