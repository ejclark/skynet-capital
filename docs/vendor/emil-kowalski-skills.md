# Emil Kowalski's animation skills (vendored)

Nine motion skills from [emilkowalski/skills](https://github.com/emilkowalski/skills), copied
verbatim into `.claude/skills/` at upstream commit `4061b67b8d976a186aca118594f54b638c5f718a`
(2026-11-12), at Eric's ask (2026-11-11, with the Campaign mission control handoff: "Include skills
for animations"). Emil built the motion at Vercel and Linear (Sonner, Vaul); these skills are the
mistakes agents make with motion and how to fix them.

| Skill | Use it for |
| --- | --- |
| `/animate` | Building one animation: should it move, which property, curve, duration, exit |
| `/choreograph` | Several things moving together: what leads, what follows, what stays still |
| `/review-animations` | A strict review of motion in a diff (only when asked; it does not self-trigger) |
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

- **Tokens first.** Durations and easing come from `app/src/styles/theme.css` (`--dur-quick`,
  `--dur-spatial`, `--ease-spatial`), which collapse to 0ms under `prefers-reduced-motion`. A value
  a skill recommends becomes a token, never a literal in a component.
- **Reduced motion is a rule, not a preference** (`docs/BRAND.md` → Accessibility): the end state
  appears at once.
- **No motion library.** The app animates with CSS; a skill's Motion/Framer recipe is translated to
  CSS or WAAPI, and adding a dependency is its own decision.
- **The fanfare budget goes to what goes right** (CLAUDE.md → Positive reinforcement): celebrate
  wins, render losses without spectacle.

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
