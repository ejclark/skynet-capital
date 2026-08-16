# INTEGRATE.md — automated integration routine (Claude Code)

This bundle is self-managing: drop it in the repo and hand Claude Code the kickoff prompt. The routine is idempotent — re-running it after a bundle update re-syncs the implementation to the README (treat README.md as the source of truth on conflicts).

## Setup
1. Unzip as `design_handoff_trailer_and_field_guide/` at the repo root of `ejclark/skynet-capital`.
2. (Optional) Export the trailer video from the design tool (timeline → export video) to `public/assets/trailer.mp4`.
3. From the repo root, run Claude Code with the prompt below.

## Kickoff prompt (paste verbatim)
> Read design_handoff_trailer_and_field_guide/README.md end to end; it is the source of truth. Then, following this repo's existing stack, router, and component patterns:
> 1. Implement "The Field Guide" as a /guide route per the README's Section 1 (layout, copy verbatim, flame tokens, sticky progressive header with its three step links).
> 2. Wire links: Join/Get started → /add, Trade & climb → /login, Engage/Ask a question/Propose a mechanic → /feedback, Watch the trailer → /trailer.
> 3. Implement /trailer: play public/assets/trailer.mp4 if present (poster = the end-card component); otherwise render the end-card component from README Section 2 as the placeholder, including the glowing "THE FIELD GUIDE → GETTING STARTED" link to /guide.
> 4. Never import the bundle's HTML/JSX or runtime files into the build — they are references only.
> 5. Self-review: run the app, walk the acceptance checklist in INTEGRATE.md, fix every miss, then summarize what changed and anything intentionally deferred.

## Acceptance checklist
- [ ] /guide matches README at 960px content width: banner flush under the title, baseline-aligned 01/02/03, divider hugging the titles, FAQ tiers and copy verbatim
- [ ] Sticky header appears after the hero; step links condense in after the banner; all three navigate correctly
- [ ] Flame palette + fading rules + outlined buttons; no pure black/white, headings ≤ w500
- [ ] /trailer plays the video or shows the end card; the Field Guide link glows and navigates to /guide
- [ ] External links open in new tabs with rel="noopener"
- [ ] Trailer page does not autoplay audio; playback is user-initiated

## Re-sync routine (bundle updated later)
Re-unzip over the old folder, then re-run the kickoff prompt with this prefix: "The design bundle was updated — diff README.md against the current /guide and /trailer implementations and apply only the deltas."
