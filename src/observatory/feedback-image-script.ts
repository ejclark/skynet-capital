/**
 * The screenshot-attachment client half of `/feedback` — progressive enhancement on the file
 * input added alongside the Write | Preview details field.
 *
 * Plain concatenated strings and classic functions only: this ships inside a TS template literal,
 * where a backtick or dollar-brace is the recurring TS1005 trap (CLAUDE.md, ship loop).
 *
 * The file input carries no `name` attribute on purpose — nothing about it rides the POST as
 * multipart. Instead each picked image is downscaled through a canvas (a phone photo can be
 * several MB; the server's per-image cap is ~1.5MB) and re-encoded as JPEG, then the result lands
 * in the `images` hidden field as JSON, exactly like the coach's `spec` field. A no-JS member never
 * sees the file input do anything — the rest of the form still submits fine without it.
 */
export const IMAGE_SCRIPT = `
(function () {
  var MAX_IMAGES = 3;
  var MAX_DIM = 1600;
  var QUALITY = 0.82;

  function init() {
    var input = document.getElementById('fdbk-image-input');
    var field = document.getElementById('fdbk-images-field');
    var list = document.getElementById('fdbk-image-list');
    if (!input || !field || !list) return;
    var items = [];

    function sync() {
      field.value = JSON.stringify(items.map(function (it) {
        return { name: it.name, type: it.type, dataUrl: it.dataUrl };
      }));
      render();
    }

    function render() {
      list.innerHTML = '';
      items.forEach(function (it, i) {
        var row = document.createElement('div');
        row.className = 'fdbk-img-row';
        var name = document.createElement('span');
        name.className = 'fdbk-img-name';
        name.textContent = it.name + ' (~' + Math.round((it.dataUrl.length * 0.75) / 1024) + 'KB)';
        var remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'fdbk-img-remove';
        remove.textContent = 'Remove';
        remove.addEventListener('click', function () {
          items.splice(i, 1);
          sync();
        });
        row.appendChild(name);
        row.appendChild(remove);
        list.appendChild(row);
      });
    }

    function addFile(file) {
      if (items.length >= MAX_IMAGES) return;
      if (file.type.indexOf('image/') !== 0) return;
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
          var canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          var ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          items.push({ name: file.name, type: 'image/jpeg', dataUrl: canvas.toDataURL('image/jpeg', QUALITY) });
          sync();
        };
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    }

    input.addEventListener('change', function () {
      var files = Array.prototype.slice.call(input.files || []);
      files.slice(0, MAX_IMAGES - items.length).forEach(addFile);
      input.value = '';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`;
