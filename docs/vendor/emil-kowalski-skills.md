# Emil Kowalski's animation skills (vendored)

Nine motion skills from [emilkowalski/skills](https://github.com/emilkowalski/skills), copied
verbatim into `.claude/skills/` at upstream commit `4061b67b8d976a186aca118594f54b638c5f718a`
(2026-11-11), at Eric's ask (2026-11-11, with the Campaign mission control handoff: "Include skills
for animations"). Emil built the motion at Vercel and Linear (Sonner, Vaul); these skills are the
mistakes agents make with motion and how to fix them.

| Skill | Use it for |
| --- | --- |
| `/animate` | Building one animation: should it move, which property, curve, duration, exit |
| `/choreograph` | Several things moving together: what leads, what follows, what stays still |
| `/review-animations` | A strict review of motion in a diff. **User-only** (`disable-model-invocation`): Eric runs it; a session checks `/animate`'s *Never Ship* table instead |
| `/improve-animations` | Auditing the whole app's motion into ranked, self-contained plans |
| `/find-animation-opportunities` | Where motion would help, and where it should not go |
| `/remove-animations` | Taking out motion the app does not need |
| `/animation-performance` | An animation that drops frames |
| `/animation-vocabulary` | Naming a motion effect, so Eric can ask for it in words (CLAUDE.md: give him vocabulary) |
| `/emil-design-eng` | The philosophy behind all of the above, plus UI polish |

Not taken: `animate-expo`, `write-swift`, `mobile-native`, `gestures`, `apple-design` (React Native,
Swift, or no drag/sheet work here yet), `ask-sonner`, `pick-ui-library`, `prototype`, `break-ui`
(not motion). Take one the day a surface needs it.

## House rules win where they meet

This section is ours to edit; the copies are not.

- **One curve, two speeds.** Map a skill's curve to `--ease-spatial` and its duration to
  `--dur-quick` (press and tooltip bands) or `--dur-spatial` (everything that moves through space),
  in `app/src/styles/theme.css` ("two speeds, one easing"). The skills' `--ease-out`,
  `--ease-in-out`, `--ease-drawer` and five duration bands are not added: a second curve or a third
  speed is its own decision, never a skill default (the skills' own Hard Rule 3 calls a parallel
  token system a defect).
- **Reduced motion zeroes the tokens** (`theme.css` → `prefers-reduced-motion`,
  `docs/ENGINEERING.md` → *Honor prefers-reduced-motion*): the end state appears at once. The skills
  say "gentler, not zero"; here zero is the house rule, and an audit does not report it.
- **No motion library and no Base UI.** The app animates with CSS. Translate a Motion/Framer recipe
  to CSS or WAAPI; adding a dependency is its own decision. Recipes that read Base UI's
  `var(--transform-origin)` or `[data-starting-style]` do nothing here: set `transform-origin` to the
  trigger's side by hand and enter with `@starting-style`.
- **Names that exist only upstream.** `pick-ui-library` is not vendored, so a component starts from
  `app/src/ui` (its `CATALOG.md`); `src/styles/tokens.css` is `app/src/styles/theme.css`; the
  `/vocabulary` page is upstream's site, not a route here.
- **Plans go to GitHub issues, never a `plans/` folder.** `/improve-animations` and
  `/find-animation-opportunities` hand each plan to an issue (one capsule per plan, `docs/ISSUES.md`),
  and `reconcile` reads that issue.
- **Celebrations** go through `app/src/shell/takeover.tsx`, which also stills them under the member's
  Settings → Display → Tower motion = Still, and never fire without plain words on what happened
  (`docs/BRAND.md` → *Celebration pairs with explanation*). The fanfare budget goes to what goes right
  (CLAUDE.md → Positive reinforcement).
- **Name by job, never by coinage** (CLAUDE.md): `emil-design-eng`'s "naming creates identity"
  principle does not apply to member copy.
- **The tower is not DOM motion.** The 3D tower and the Eye stay with `/vision` and `/telestrator`;
  these skills cover DOM and CSS motion.
- **Call a skill with its task.** Each skill's *Initial Response* greeting is for a person typing a
  bare `/name`; a session mid-task passes the task as the argument and skips it.
- **Broad triggers, known.** `remove-animations` ("feels slow"), `improve-animations` ("make this app
  feel better"), `find-animation-opportunities` and `emil-design-eng` can catch unrelated asks. A
  "feels slow" is usually load time here, not motion; reach for these only when the ask is about
  motion. Making them user-only is a `.claude/settings.json` `skillOverrides` change, which is
  envelope-protected and waits for Eric's held batch.

## Refresh

Re-clone upstream, copy the nine directories over, and ship the diff as its own PR. Never hand-edit
the copies; house overrides live in this file.

## License

MIT License

Copyright (c) 2026 Emil Kowalski

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
