/**
 * The Preview tab's client half — progressive enhancement on the `/feedback` details field.
 *
 * Plain concatenated strings and classic functions only: this ships inside a TS template literal,
 * where a backtick or dollar-brace is the recurring TS1005 trap (CLAUDE.md, ship loop).
 *
 * The tab bar is rendered `hidden` and unhidden here, so a member with no JS sees a plain textarea
 * rather than dead tabs. Rendering is a POST to /feedback/preview — the escape-first subset
 * renderer lives server-side with its specs (src/ui/markdown-preview.ts), never duplicated here.
 */
export const PREVIEW_SCRIPT = `
(function () {
  function init() {
    var tabs = document.getElementById('fdbk-tabs');
    var write = document.getElementById('fdbk-tab-write');
    var preview = document.getElementById('fdbk-tab-preview');
    var pane = document.getElementById('fdbk-preview');
    var area = document.getElementById('fdbk-details');
    if (!tabs || !write || !preview || !pane || !area) return;
    tabs.hidden = false;

    function show(which) {
      var previewing = which === 'preview';
      pane.hidden = !previewing;
      area.style.display = previewing ? 'none' : '';
      write.setAttribute('aria-selected', previewing ? 'false' : 'true');
      preview.setAttribute('aria-selected', previewing ? 'true' : 'false');
      write.classList.toggle('on', !previewing);
      preview.classList.toggle('on', previewing);
    }

    write.addEventListener('click', function () { show('write'); });

    preview.addEventListener('click', function () {
      show('preview');
      pane.innerHTML = '<p class="fdbk-preview-wait">Rendering…</p>';
      fetch('/feedback/preview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ markdown: area.value }),
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res && res.ok) pane.innerHTML = res.html;
          else pane.textContent = (res && res.error) || 'Preview is unavailable right now.';
        })
        .catch(function () {
          pane.textContent = 'Preview is unavailable right now — your markdown still sends fine.';
        });
    });

    show('write');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`;
