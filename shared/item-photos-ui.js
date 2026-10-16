'use strict';
window.Photos = (() => {
  let visited = new WeakMap(), revision = 0, target = null, busy = false;
  const urls = new Map();
  const esc = value => UI.esc(String(value));
  const icon = '<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><rect x="5" y="7" width="22" height="18" rx="4" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="13" r="2" fill="currentColor"/><path d="m7 23 7-7 4 4 3-3 5 6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
  function markup(kind, id, label, mode = 'detail') {
    return `<div class="item-photo item-photo-${mode}" data-photo-kind="${esc(kind)}" data-photo-id="${esc(id)}" data-photo-label="${esc(label)}" data-photo-mode="${esc(mode)}"></div>`;
  }
  async function fill(slot) {
    const {photoKind: kind, photoId: id, photoLabel: label, photoMode: mode} = slot.dataset;
    const signature = [kind, id, revision, ItemPhotos.canEdit()].join('|');
    if (visited.get(slot) === signature) return;
    visited.set(slot, signature);
    let record = null, failed = false;
    try { record = await ItemPhotos.get(kind, id); } catch { failed = true; }
    if (!slot.isConnected || visited.get(slot) !== signature) return;
    const itemKey = kind + ':' + id;
    let url = urls.get(itemKey);
    if (record && !url) { url = URL.createObjectURL(record.blob); urls.set(itemKey, url); }
    slot.replaceChildren();
    slot.hidden = mode === 'list' && !record;
    if (record) {
      const img = document.createElement('img'); img.src = url; img.alt = label + ' 사진'; img.loading = 'lazy'; slot.append(img);
    } else if (mode !== 'list') {
      const empty = document.createElement('span'); empty.className = 'item-photo-empty'; empty.innerHTML = icon; empty.setAttribute('aria-label', '사진 없음'); slot.append(empty);
    }
    if (mode === 'detail') {
      const note = document.createElement('span'); note.className = 'item-photo-note'; note.textContent = failed ? '사진을 불러올 수 없습니다.' : record ? '품목 사진 · BOM과 함께 사용' : '사진 없이도 품목을 관리할 수 있어요.'; slot.append(note);
    }
    if (mode !== 'list' && ItemPhotos.canEdit()) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'item-photo-edit'; button.textContent = record ? '사진 수정' : '사진 등록'; button.setAttribute('aria-label', label + ' ' + button.textContent);
      button.onclick = () => open(kind, id, label); slot.append(button);
    }
  }
  function refresh() { document.querySelectorAll('[data-photo-kind]').forEach(slot => { void fill(slot); }); }
  const dialog = document.createElement('dialog'); dialog.className = 'item-photo-dialog'; dialog.setAttribute('aria-labelledby', 'itemPhotoTitle');
  dialog.innerHTML = '<div class="modalhead"><h2 id="itemPhotoTitle">품목 사진</h2><button type="button" data-photo-close aria-label="사진 창 닫기">✕</button></div><p class="page-note" data-photo-name></p><div class="item-photo-preview"></div><p class="page-note">자재와 BOM에서 같은 사진을 사용합니다. 사진 등록은 선택 사항입니다.</p><input type="file" accept="image/jpeg,image/png,image/webp" hidden data-photo-file><p role="alert" data-photo-error></p><div class="modalfoot"><button type="button" data-photo-remove>사진 삭제</button><button type="button" class="primary" data-photo-choose>사진 선택</button></div>';
  document.body.append(dialog);
  const find = selector => dialog.querySelector(selector);
  function lock(value) { busy = value; dialog.querySelectorAll('button').forEach(button => { button.disabled = value; }); }
  async function open(kind, id, label) {
    if (!ItemPhotos.canEdit()) { UI.toast('사진 편집은 디자이너·발주팀 권한이 필요합니다.'); return; }
    target = {kind, id}; find('[data-photo-name]').textContent = label; find('[data-photo-error]').textContent = ''; find('[data-photo-file]').value = '';
    const preview = find('.item-photo-preview'); preview.innerHTML = markup(kind, id, label, 'list');
    find('[data-photo-remove]').hidden = true; dialog.showModal(); refresh();
    try { const record = await ItemPhotos.get(kind, id); if (target && target.kind === kind && target.id === id) find('[data-photo-remove]').hidden = !record; } catch (error) { find('[data-photo-error]').textContent = error.message; }
  }
  find('[data-photo-close]').onclick = () => { if (!busy) dialog.close(); };
  dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  find('[data-photo-choose]').onclick = () => { if (ItemPhotos.canEdit()) find('[data-photo-file]').click(); };
  find('[data-photo-file]').onchange = async event => {
    const file = event.target.files[0]; if (!file || !target || busy) return;
    lock(true); find('[data-photo-error]').textContent = '';
    try { await ItemPhotos.save(target.kind, target.id, file); dialog.close(); UI.toast('사진을 저장했습니다. 자재와 BOM에 함께 반영됩니다.'); }
    catch (error) { find('[data-photo-error]').textContent = error.message; }
    finally { lock(false); event.target.value = ''; }
  };
  find('[data-photo-remove]').onclick = async () => {
    if (!target || busy || !confirm('이 품목의 사진을 삭제할까요? 자재와 BOM에서 함께 삭제됩니다.')) return;
    lock(true); try { await ItemPhotos.remove(target.kind, target.id); dialog.close(); UI.toast('품목 사진을 삭제했습니다.'); } catch (error) { find('[data-photo-error]').textContent = error.message; } finally { lock(false); }
  };
  ItemPhotos.subscribe(itemKey => { const url = urls.get(itemKey); if (url) URL.revokeObjectURL(url); urls.delete(itemKey); revision++; refresh(); });
  window.addEventListener('storage', event => { if (event.key === 'fb_accounts') { visited = new WeakMap(); refresh(); } });
  window.addEventListener('focus', refresh);
  return {markup, refresh};
})();
