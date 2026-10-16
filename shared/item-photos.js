'use strict';
window.ItemPhotos = (() => {
  const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  let database;
  const listeners = new Set();
  const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('fb-item-photos') : null;
  function canEdit() {
    if (window.FBSession && !window.FBSession.check()) return false;
    const user = FB.user();
    return !!user && (user.perms || []).some(permission => ['디자이너', '발주팀'].includes(permission));
  }
  function key(kind, id) {
    if (!['product', 'material'].includes(kind) || typeof id !== 'string' || !id) throw Error('품목을 확인해주세요.');
    return kind + ':' + id;
  }
  function entity(kind, id) {
    const item = (kind === 'product' ? FB.data.products : FB.data.materials).find(item => item.id === id && !item.deleted);
    if (!item) throw Error('품목을 찾을 수 없습니다.');
    return item;
  }
  function permission() { if (!canEdit()) throw Error('사진 편집은 디자이너·발주팀 권한이 필요합니다.'); }
  function open() {
    if (!database) database = new Promise((resolve, reject) => {
      const request = indexedDB.open('fireball-item-photos', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('photos', {keyPath: 'key'});
      request.onsuccess = () => { const db = request.result; db.onversionchange = () => { db.close(); database = null; }; resolve(db); };
      request.onerror = () => reject(Error('사진 저장소를 열 수 없습니다. 브라우저 저장 공간 설정을 확인해주세요.'));
    }).catch(error => { database = null; throw error; });
    return database;
  }
  async function get(kind, id) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const request = db.transaction('photos', 'readonly').objectStore('photos').get(key(kind, id));
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(Error('사진을 불러오지 못했습니다.'));
    });
  }
  function announce(itemKey) { listeners.forEach(fn => fn(itemKey)); }
  if (channel) channel.onmessage = event => { if (typeof event.data === 'string') announce(event.data); };
  async function write(kind, id, blob) {
    permission(); entity(kind, id);
    const itemKey = key(kind, id), db = await open();
    permission(); entity(kind, id);
    await new Promise((resolve, reject) => {
      const tx = db.transaction('photos', 'readwrite'), store = tx.objectStore('photos');
      if (blob) store.put({key: itemKey, blob, updatedAt: Date.now(), updatedBy: FB.user().id});
      else store.delete(itemKey);
      tx.oncomplete = resolve;
      tx.onerror = tx.onabort = () => reject(Error('사진을 저장하지 못했습니다. 브라우저 저장 공간을 확인해주세요.'));
    });
    announce(itemKey); if (channel) channel.postMessage(itemKey);
  }
  async function prepare(file) {
    if (!file || !TYPES.includes(file.type)) throw Error('JPG·PNG·WebP 사진을 선택해주세요.');
    if (file.size > 15 * 1024 * 1024) throw Error('15MB 이하의 사진을 선택해주세요.');
    const bitmap = await createImageBitmap(file);
    try {
      if (!bitmap.width || !bitmap.height) throw Error('사진 파일을 확인해주세요.');
      const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext('2d'); if (!ctx) throw Error('사진을 처리하지 못했습니다.');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      return await new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(Error('사진을 처리하지 못했습니다.')), 'image/jpeg', .85));
    } finally { bitmap.close(); }
  }
  async function save(kind, id, file) { permission(); entity(kind, id); const blob = await prepare(file); await write(kind, id, blob); }
  async function remove(kind, id) { await write(kind, id, null); }
  return {canEdit, get, save, remove, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }};
})();
