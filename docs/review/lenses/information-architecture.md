# Information architecture lens

**Fires on:** `app/src/routes/`, `app/src/shell/`, `docs/IA.md`, when the diff adds, removes or
moves a route, a nav link, a section switch entry or a page's head.

**Kill rule:** under 0.1 confirmed findings per reviewed PR, or fewer than one in three surviving
the refuters, after 40 PRs: delete this file and retire its seat in `docs/agents/seats.json`.

**Size:** 3,845 characters.

**Status:** on trial, the seat registry's first hire. Its findings are scored by `review-replay`,
never filed.

Name where a member ends up and what goes wrong for them: a page they cannot reach, data shown at a
level it does not belong to, a decision the tree already wrote down that this diff contradicts.
That is the concrete failure or concrete cost. Zero findings is a normal answer: a reviewer told to
find gaps manufactures them. A later move of the same link is not proof of a defect; taste changes.

## Smells

**Orphaned route.** Spot it: the diff removes or moves a nav entry, and at the head no page, rail,
head or menu links the route any more; a keyboard chord does not count on a phone. Fix: re-home the
link in the same diff, or retire the route with a redirect. Not when: the route is a deep link by
design (a share URL, a redirect target) and a page still links it. Real: #815 dropped a topbar slot
and no page linked the route; #881 left another reachable by a chord only.

**Placed on the wrong key.** Spot it: a link or section placed inside a per-account card, list or
switcher when its data is fetched with no account id (the viewer's progress, the viewer's
filings), or account data on a viewer-level page. Fix: place it once at the level of its key.
Not when: the per-account copy filters by that account and says so. Real: #886 put the viewer's
milestones link inside every account card.

**Contradicts the written decision.** Spot it: `docs/IA.md` at the head (§5 groups, §8 the decision
and its doctrine rows, §10 upstream problems) names a home, a tab, an order or a name, and the diff
builds another. Fix: build the written call, or amend the doc in the same diff with the reason.
Not when: the diff amends the doc itself, or the doc marks the row proposed or open. Real: #7085
named the first tab and ordered the story against §5.9, which was in its own tree.

**A second home.** Spot it: a new route, top-level slot or section that lists what another page
already homes (one history in three places), instead of a row, field or link on that home. Fix:
co-locate on the existing home, or move the home and retire the old one in the same diff. Not when:
the diff retires the old home, or a written decision names the new one.
Real: `docs/IA.md:1268` records one order history living on three pages.

## Worth solving, or taste

The test: name the member who cannot reach it, or the false thing the placement says (the viewer's
own data drawn as an account's). No name, no finding.

Worth solving now: an orphaned route, data on the wrong key, a contradiction of `docs/IA.md`.
Worth a §10 row, not a block: an upstream problem the screen patched locally. Taste: link order,
labels, icon or text, which of two valid homes reads better, a move the doc leaves open.

## How to run it

1. Skip unless the fires-on condition holds. Say so.
2. Read `docs/IA.md` §5, §8 and §10 at the head with `git show <head>:docs/IA.md`, if it exists;
   else judge by the smells alone.
3. For each nav entry removed or moved, `git grep` the route at the head for a link from a page.
4. For each link placed in a repeated element, read the fetch behind it: does it take that key?
5. One finding per smell, naming the route or file and the member's path to the failure.

Refuter: trace only. At the head, is the route linked from a page, does the fetch take the key, and
does the doc row say what the finding quotes?
