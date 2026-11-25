// The face a LIVE side is measured in, for `./mermaid-pairs.mjs` (plan #3981, slice 2).
//
// WHY THIS EXISTS. Every house diagram sets `classDef default font-size:20px,font-family:Verdana`
// (docs/PICTURES.md rule 13), and Verdana is not installed in the cloud container. Chromium did not
// say so: it drew a narrow Times fallback (Liberation Serif), and rule 13's phone number (the door's
// 15.7 px, the held-PR picture's 20) was read off that fallback while Eric's phone drew Verdana. The
// renders and the phone were never the same frame (slice 1 measured the gap: with a Verdana-width
// stand-in the door is 13.1 px, not 15.6).
//
// WHAT IT PROMISES:
//  - **The live side names its face and the page proves it loaded.** The pipeline embeds the
//    stand-in under the family name "Verdana", so a diagram that names Verdana draws in it, on any
//    host (a machine that owns the real Verdana does not change the number), and the shot line and
//    the sidecar say which face measured. A face that does not load stops the run (exit 5), the same
//    rule the ink faces already hold; it never falls back.
//  - **The stand-in is a stand-in, said out loud.** DejaVu Sans is the closest wide humanist sans
//    the container can carry under a free licence; real Verdana is not measured here, so the number is
//    the stand-in's, never "Verdana's".
//  - **The number follows the face because the width does.** Rule 13's number is 390 ÷ the drawing's
//    natural width × the font size, and the natural width is whatever the drawn face made it; nothing
//    in the formula changed, only which face the live side is drawn in.
import { fontFaceRules } from "./mermaid-pairs-ink.mjs";

/** The face a live side is drawn in. `family` is what the diagram source names; `standIn` is what is
 *  actually embedded. Licence and provenance: ./fonts/README.md, ./fonts/DEJAVU-LICENSE.txt. */
export const LIVE_FACE = {
  family: "Verdana",
  standIn: "DejaVu Sans",
  label: "DejaVu Sans, a Verdana-width stand-in",
  files: { 400: "live-dejavu-regular.woff2", 700: "live-dejavu-bold.woff2" },
};

/** The `@font-face` rules that make the family a source names resolve to the embedded stand-in. */
export const liveFaceCss = () => fontFaceRules(LIVE_FACE.family, LIVE_FACE.files);

/** What a sidecar records for a pair that has a live diagram side, so a number never travels
 *  without the face that produced it. */
export const liveFaceRecord = () => ({
  family: LIVE_FACE.family,
  standIn: LIVE_FACE.standIn,
  label: LIVE_FACE.label,
});
