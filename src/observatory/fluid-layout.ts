/**
 * The FLUID LAYOUT SCALE — the one place the observatory decides how wide anything is allowed to get.
 *
 * Every page column is a percentage of whatever room it is given, bounded by a cap from this scale
 * (`min(100%, …)`), never a bare pixel width. That is the whole trick: below the cap a column tracks
 * the window continuously, at the cap it stops. Views pick a cap by the SHAPE of what they hold —
 * dense grids read fine very wide, prose does not — so a laptop and a tablet get the same layout at
 * different sizes rather than one layout with dead space bolted on.
 *
 * `--shell-max` is the ceiling for the app itself: at 2560px (2.5k, the widest screen we design for)
 * the shell centres and stops expanding, so an ultrawide monitor shows a deliberate canvas instead of
 * a leaderboard row stretched across three feet of glass. (The shell pairs that cap with a spread
 * `box-shadow` in `--bg`, which paints our black past the ceiling — a box-shadow is ink, not layout,
 * so it letterboxes the page without adding a scrollbar or touching the embedding document's body.)
 *
 * The second half of the trick is WHERE a breakpoint measures. `.obs` — the box a view's content
 * actually fills — is declared a `stage` container, and every view collapses on `@container stage`
 * rather than `@media`. With the drawer in flow a 768px tablet hands its content roughly 500px, so a
 * viewport-keyed breakpoint fires hundreds of pixels too late; a container-keyed one is measuring the
 * thing that is actually too narrow, and it keeps working when the drawer is toggled shut.
 *
 * Kept in its own module rather than inlined into `dashboard-shell.ts` (which is at its size budget)
 * — the same doctrine as `desk-style.ts` and `calendar-widget.ts`. Injected once by the shared shell,
 * so every view's stylesheet can read the tokens without importing anything.
 */
export const FLUID_LAYOUT_TOKENS = `:root{
    --shell-max:2560px;
    --drawer-w:clamp(200px,17vw,280px);
    --col-wide:min(100%,1800px);
    --col-read:min(100%,1180px);
    --col-form:min(100%,900px);
    --col-narrow:min(100%,560px);
  }`;
