/**
 * The live board's client half — the code that replaced `root.innerHTML = …` on every hub tick.
 *
 * It applies seq-numbered patches to KEYED nodes: `[data-field-key]` blocks get their `[data-field]`
 * text, `[data-field-tone]` P/L class and `[data-field-bar]` width written in place; `[data-sortable]`
 * lists reorder by moving the existing rows rather than rebuilding them. Nothing is destroyed and
 * recreated, so an in-flight odometer roll, a canvas, a text selection and a focused control all
 * survive a push — which is the whole reason this channel exists (GAMEBOARD-PLAN, "live transport").
 *
 * Three guarantees, in the same order the acceptance criteria state them:
 *  - **Idempotent by seq.** A patch at or below the last applied seq is dropped, so a reconnect
 *    replay can only ever re-apply what was already true. Every op states an absolute value.
 *  - **Never a silent lie.** A patch this page cannot fully express — a row appearing, a compare on
 *    screen, a gap in the seq run — triggers ONE fresh frame fetch instead of a half-applied update.
 *  - **Reduced motion suppresses the flourish, never the update.** The text is written on the same
 *    line for every reader; only the `patched` flash class is withheld (and its keyframe is
 *    media-queried off as a second net). A still reader sees the correct number, never a stale one.
 *
 * Ceremony cues are re-dispatched as a plain `skynet:cue` DOM event and given no visual treatment
 * here — that is S5's slice, and this module deliberately stops at delivery.
 *
 * Plain concatenated strings and classic functions only: this ships inside a TS template literal,
 * where a backtick or dollar-brace is the recurring TS1005 trap (CLAUDE.md, ship loop).
 */

/** The patch flash. The resting state IS the new value — the keyframe only fades it in. */
export const BOARD_PATCH_STYLE = `<style>
  .patched{ animation:patch-flash .45s ease-out both; }
  @keyframes patch-flash{ from{ opacity:.4; } to{ opacity:1; } }
  @media (prefers-reduced-motion:reduce){ .patched{ animation:none; } }
</style>`;

export const BOARD_PATCH_SCRIPT = `
(function () {
  var reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var lastSeq = -1;
  var framing = false;

  function reframe() {
    if (framing) return;
    framing = true;
    var done = function () { framing = false; };
    fetch('/board/frame' + location.search, { headers: { accept: 'text/html' } })
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (html) {
        var root = document.getElementById('root');
        if (root && html !== null) root.innerHTML = html;
        done();
      })
      .catch(done);
  }

  function flash(el) {
    if (reduced) return;
    el.classList.remove('patched');
    void el.offsetWidth;
    el.classList.add('patched');
  }

  function setText(scope, name, value) {
    var el = scope.querySelector('[data-field="' + name + '"]');
    if (!el) return false;
    if (el.textContent !== value) { el.textContent = value; flash(el); }
    return true;
  }

  function setTone(scope, name, tone) {
    var el = scope.querySelector('[data-field-tone="' + name + '"]');
    if (!el) return false;
    var p = el.getAttribute('data-tone-prefix') || '';
    el.classList.remove(p + 'pos', p + 'neg', p + 'flat');
    el.classList.add(p + tone);
    return true;
  }

  function setBar(scope, name, value) {
    var el = scope.querySelector('[data-field-bar="' + name + '"]');
    if (!el) return false;
    var axis = el.getAttribute('data-bar-axis') || 'width';
    el.style[axis] = value.toFixed(1) + '%';
    return true;
  }

  function applyField(op) {
    var scope = document.querySelector('[data-field-key="' + op.key + '"]');
    if (!scope) return false;
    var ok = true, k;
    if (op.text) { for (k in op.text) { if (!setText(scope, k, op.text[k])) ok = false; } }
    if (op.tone) { for (k in op.tone) { if (!setTone(scope, k, op.tone[k])) ok = false; } }
    if (op.bar) { for (k in op.bar) { if (!setBar(scope, k, op.bar[k])) ok = false; } }
    if (typeof op.sortValue === 'number') scope.setAttribute('data-sort', String(op.sortValue));
    return ok;
  }

  // World-state ops address pieces and empires by their stable keys. A page that draws no towers
  // simply has no node to update, which is not a failure — only FIELD ops gate the reframe.
  function applyWorld(op) {
    if (op.kind === 'piece-set') {
      var piece = document.querySelector('[data-piece-key="' + op.piece.key + '"]');
      if (!piece) return;
      piece.setAttribute('data-mass', String(op.piece.mass));
      piece.setAttribute('data-footprint', String(op.piece.footprint));
      piece.setAttribute('data-health', String(op.piece.health));
      piece.setAttribute('data-market-value', String(op.piece.marketValue));
      return;
    }
    var empire = document.querySelector('[data-empire-key="' + op.empireId + '"]');
    if (!empire) return;
    empire.setAttribute('data-equity', String(op.vitals.equity));
    empire.setAttribute('data-theme', op.vitals.theme);
  }

  // Reorder by MOVING the existing rows, never by rebuilding them — node identity is what carries
  // an in-flight animation across a rank change. The medals follow the new order so a row can never
  // wear a podium class it no longer holds.
  function resort() {
    var list = document.querySelector('[data-sortable]');
    if (!list) return;
    var rows = Array.prototype.slice.call(list.querySelectorAll('[data-sort]'));
    rows.sort(function (a, b) {
      return Number(b.getAttribute('data-sort')) - Number(a.getAttribute('data-sort'));
    });
    var moved = false;
    for (var i = 0; i < rows.length; i++) { if (list.children[i] !== rows[i]) moved = true; }
    if (moved) { for (var j = 0; j < rows.length; j++) { list.appendChild(rows[j]); } }
    for (var n = 0; n < rows.length; n++) {
      rows[n].classList.remove('rank-top', 'rank-1', 'rank-2', 'rank-3');
      if (n < 3) { rows[n].classList.add('rank-top'); rows[n].classList.add('rank-' + (n + 1)); }
    }
  }

  function applyOps(ops) {
    var complete = true, reordered = false;
    for (var i = 0; i < ops.length; i++) {
      var op = ops[i];
      if (op.kind === 'field') {
        if (!applyField(op)) complete = false;
        if (typeof op.sortValue === 'number') reordered = true;
      } else if (op.kind === 'piece-set' || op.kind === 'empire-vitals') {
        applyWorld(op);
      } else if (op.kind === 'cue') {
        document.dispatchEvent(new CustomEvent('skynet:cue', { detail: op.cue }));
      } else {
        complete = false;
      }
    }
    if (reordered) resort();
    return complete;
  }

  function onPatch(patch) {
    if (patch.seq <= lastSeq) return;
    var gap = lastSeq >= 0 && patch.seq !== lastSeq + 1;
    lastSeq = patch.seq;
    if (!applyOps(patch.ops) || gap) reframe();
  }

  function connect() {
    var source = new EventSource('/events' + location.search);
    source.addEventListener('hello', function (e) { lastSeq = JSON.parse(e.data).seq; });
    source.addEventListener('resync', function (e) {
      lastSeq = JSON.parse(e.data).seq;
      reframe();
    });
    source.addEventListener('patch', function (e) { onPatch(JSON.parse(e.data)); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', connect);
  } else {
    connect();
  }
})();
`;
