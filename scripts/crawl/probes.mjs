// The dead-end probes — DOM checks, one page at a time, for the classes of dead end the plan's
// read-through found by hand (docs/members/README.md → "the eight dead ends"). Each probe is a
// heuristic and says so; the judge chore (docs/grind/journey-judge.instructions.md) grades what a
// probe cannot. Every finding carries a `snippet` the ledger later locates in the source
// (`locate.mjs`), so a row names a file:line without the probe knowing the code.
//
//  - disabled-reason-hidden: a disabled control whose reason exists only in `title`/`aria-label`
//    — invisible on a phone, where there is no hover (dead end 8).
//  - disabled-no-reason: a disabled control with a label and no reason anywhere, outside a form
//    that is merely waiting for input.
//  - promise-no-target: a note or footer sentence that tells the reader to click / pick / connect
//    something and contains no control at all (dead ends 3 and 5).
//  - dangling-anchor: a same-page `#hash` link whose target id does not exist (dead end 5).
//  - repeated-sentence: the same ≥40-char line three or more times on one page (dead end 2).
//  - jargon-without-gloss: a house term from a short list rendered outside a glossary term.
//  - link-into-redirect (node side, `linksIntoRedirects`): a same-origin link the server answers
//    with a 3xx — a legacy path still linked. Client-side router redirects are NOT seen (limit).

const JARGON = ["past the guards", "intents"];

/** Runs in the browser. Returns plain finding objects; never throws past the page. */
export function probeDeadEnds(page) {
  return page.evaluate((jargon) => {
    const out = [];
    const visible = (el) => el.getClientRects().length > 0;
    const text = (el) => (el.innerText ?? "").replace(/\s+/g, " ").trim();
    const push = (kind, what, snippet, severity, fix) =>
      out.push({ kind, what, snippet, severity, fix });

    // 1 + 2 — disabled controls and where their reason lives.
    const controls = document.querySelectorAll(
      "button, input, select, textarea, [role=button], a[aria-disabled=true]",
    );
    for (const el of controls) {
      const off = el.matches(":disabled") || el.getAttribute("aria-disabled") === "true";
      if (!(off && visible(el))) continue;
      const label = text(el) || el.getAttribute("value") || "";
      const reason = (el.getAttribute("title") || el.getAttribute("aria-label") || "")
        .replace(label, "")
        .replace(/^[\s—–-]+/, "")
        .trim();
      const box = el.closest("fieldset, form, section, article, li, .card, main") ?? document.body;
      if (reason.length > 12) {
        const needle = reason.slice(0, 24);
        if (!text(box).includes(needle)) {
          push(
            "disabled-reason-hidden",
            `disabled "${label}" — its reason is only in title/aria-label: "${reason}"`,
            reason,
            "high",
            "S",
          );
        }
      } else if (label && !box.querySelector("input, select, textarea")) {
        push(
          "disabled-no-reason",
          `disabled "${label}" with no reason anywhere`,
          label,
          "low",
          "S",
        );
      }
    }

    // 3 — a sentence that promises an interaction and holds no control.
    const promise = /\b(click|tap|pick|choose|connect|link(ed)?|ask|select)\b/i;
    for (const el of document.querySelectorAll("p, footer, small, .note, li")) {
      if (!visible(el) || el.closest("form, label, nav")) continue;
      const t = text(el);
      if (t.length < 12 || t.length > 220 || !promise.test(t)) continue;
      if (el.querySelector("a, button, input, select, [role=button]")) continue;
      if (el.querySelector("p, li")) continue;
      push(
        "promise-no-target",
        `"${t}" — names an action with no control in reach`,
        t,
        "medium",
        "S",
      );
    }

    // 4 — same-page anchors with no target.
    for (const a of document.querySelectorAll("a[href*='#']")) {
      const url = new URL(a.getAttribute("href"), location.href);
      if (url.pathname !== location.pathname || url.hash.length < 2) continue;
      const id = decodeURIComponent(url.hash.slice(1));
      if (!(document.getElementById(id) || document.getElementsByName(id).length)) {
        push(
          "dangling-anchor",
          `link to #${id} — no element carries that id here`,
          id,
          "high",
          "S",
        );
      }
    }

    // 5 — the same sentence, three times.
    const lines = text(document.querySelector("main") ?? document.body).split(/(?<=[.!?])\s+/);
    const counts = new Map();
    for (const line of lines) if (line.length >= 40) counts.set(line, (counts.get(line) ?? 0) + 1);
    for (const [line, n] of counts) {
      if (n >= 3) push("repeated-sentence", `"${line}" appears ${n} times`, line, "low", "S");
    }

    // 6 — house words without a glossary term around them.
    const main = document.querySelector("main") ?? document.body;
    const mainText = text(main);
    for (const term of jargon) {
      if (!mainText.includes(term)) continue;
      const glossed = [...main.querySelectorAll(".gloss, abbr, dfn")].some((g) =>
        text(g).includes(term),
      );
      if (!glossed) push("jargon-without-gloss", `"${term}" with no gloss`, term, "low", "S");
    }
    return out;
  }, JARGON);
}

/** Every same-origin link on the page, absolute, deduped — the input to `linksIntoRedirects`. */
export function sameOriginLinks(page) {
  return page.evaluate(() =>
    [
      ...new Set(
        [...document.querySelectorAll("a[href]")]
          .map((a) => a.href)
          .filter((h) => h.startsWith(location.origin) && !/\/(auth|logout)\b/.test(h))
          .map((h) => h.split("#")[0]),
      ),
    ].sort(),
  );
}

/**
 * Which of `links` the server answers with a redirect. `cache` spans the run (one fetch per
 * href per mode). Uses the page's own cookies so a session sees what the member sees.
 */
export async function linksIntoRedirects(page, links, cache) {
  const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
  const findings = [];
  for (const href of links) {
    if (!cache.has(href)) {
      try {
        const res = await fetch(href, { redirect: "manual", headers: cookie ? { cookie } : {} });
        cache.set(href, res.status >= 300 && res.status < 400 ? res.headers.get("location") : null);
      } catch {
        cache.set(href, null);
      }
    }
    const to = cache.get(href);
    if (to) {
      const path = new URL(href).pathname;
      findings.push({
        kind: "link-into-redirect",
        what: `link to ${path} — the server redirects it to ${to}`,
        snippet: path,
        severity: "low",
        fix: "S",
      });
    }
  }
  return findings;
}
