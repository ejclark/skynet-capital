import type { ReactElement } from "react";
import { useState } from "react";
import { isScreenshotId, SCREENSHOT_GONE_LINE, screenshotUrl } from "../live/mp-screenshots";

/**
 * ONE ATTACHED SCREENSHOT IN A CONVERSATION (#6007 criteria 5, 20) — a saved line holds ids only,
 * so the picture is read back from the server by id each time it is drawn. It opens full size in
 * a new tab. When the store has removed it (oldest first, once it is full) the read fails and the
 * words `Screenshot no longer kept` stand in its place — a line of text, never a broken image,
 * and never colour alone.
 * @category feedback
 */
function Shot({ id }: { readonly id: string }): ReactElement {
  const [gone, setGone] = useState(false);
  if (gone) return <span className="mp-shot-gone">{SCREENSHOT_GONE_LINE}</span>;
  return (
    <a href={screenshotUrl(id)} target="_blank" rel="noopener noreferrer" className="mp-shot">
      <img
        src={screenshotUrl(id)}
        alt="Screenshot you attached"
        loading="lazy"
        onError={() => setGone(true)}
      />
    </a>
  );
}

/** The screenshots on one line, in the order they were attached; ids that are not ids are skipped. */
export function MessageShots({
  ids,
}: {
  readonly ids: readonly string[] | undefined;
}): ReactElement | null {
  const shown = (ids ?? []).filter(isScreenshotId);
  if (shown.length === 0) return null;
  return (
    <div className="mp-shots">
      {shown.map((id) => (
        <Shot key={id} id={id} />
      ))}
    </div>
  );
}
