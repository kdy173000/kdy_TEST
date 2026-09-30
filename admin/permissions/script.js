const me = JSON.parse(sessionStorage.getItem('fb_user') || 'null');
if (!me || me.role !== 'admin') { window.location.href = '../../login/index.html'; }

const PERMS = ['관리자','재고조회','입출고관리','제품 신고 관리','원료관리'];
const PERM_STYLE = {
  '관리자':        { color:'#d95f5f', bg:'rgba(220,80,80,.15)',   border:'rgba(220,80,80,.35)' },
  '재고조회':      { color:'#52a874', bg:'rgba(82,168,116,.15)',  border:'rgba(82,168,116,.35)' },
  '입출고관리':    { color:'#6488e0', bg:'rgba(100,136,224,.15)', border:'rgba(100,136,224,.35)' },
  '제품 신고 관리':{ color:'#c89a3c', bg:'rgba(200,154,60,.15)',  border:'rgba(200,154,60,.35)' },
  '원료관리':      { color:'#b06ed6', bg:'rgba(176,110,214,.15)', border:'rgba(176,110,214,.35)' },
};
const KEY_LINKS  = 'fb_perm_links';
const KEY_CUSTOM = 'fb_custom_perms';
const DEFAULT_STYLE = { color:'#9090a0', bg:'rgba(144,144,160,.15)', border:'rgba(144,144,160,.35)' };

function getLinks()        { return JSON.parse(localStorage.getItem(KEY_LINKS)  || '{}'); }
function getCustomPerms()  { return JSON.parse(localStorage.getItem(KEY_CUSTOM) || '[]'); }
function saveCustomPerms(list) { localStorage.setItem(KEY_CUSTOM, JSON.stringify(list)); }
function getAllPerms()     { return [...PERMS, ...getCustomPerms()]; }

function addCustomPerm() {
  const input = document.getElementById('newPermName');
  const name  = input.value.trim();
  if (!name) { input.focus(); return; }
  if (getAllPerms().includes(name)) { alert('이미 존재하는 항목입니다.'); return; }
  const custom = getCustomPerms();
  custom.push(name);
  saveCustomPerms(custom);
  input.value = '';
  render();
}

function deleteCustomPerm(name) {
  if (!confirm(`'${name}' 항목을 삭제하시겠습니까?\n저장된 URL도 함께 삭제됩니다.`)) return;
  saveCustomPerms(getCustomPerms().filter(p => p !== name));
  const links = getLinks();
  delete links[name];
  localStorage.setItem(KEY_LINKS, JSON.stringify(links));
  render();
}

function render() {
  const links  = getLinks();
  const custom = getCustomPerms();
  const el     = document.getElementById('permCards');
  el.innerHTML = getAllPerms().map(p => {
    const s   = PERM_STYLE[p] || DEFAULT_STYLE;
    const val = (links[p] || '').replace(/"/g, '&quot;');
    const isCustom = custom.includes(p);
    const pEsc = p.replace(/'/g, "\\'");
    const delBtn = isCustom ? `<button class="del-item-btn" onclick="deleteCustomPerm('${pEsc}')">삭제</button>` : '';
    return `
    <div class="perm-card">
      <div class="perm-card-header">
        <span class="perm-badge" style="color:${s.color};background:${s.bg};border:1px solid ${s.border}">${p}</span>
        <span class="perm-card-desc">이 권한이 있는 직원이 접근 가능한 URL</span>
        ${delBtn}
      </div>
      <div class="link-row">
        <span class="link-label">페이지 URL</span>
        <input class="link-input" id="link-${p}" type="text" placeholder="https://..." value="${val}">
        <button class="link-test" onclick="testLink(this.dataset.p)" data-p="${p}">테스트 →</button>
      </div>
    </div>`;
  }).join('');
}

function testLink(p) {
  const url = document.getElementById('link-' + p).value.trim();
  if (!url) { alert('URL을 먼저 입력해 주세요.'); return; }
  window.open(url, '_blank');
}

function saveLinks() {
  const data = {};
  getAllPerms().forEach(p => {
    const el = document.getElementById('link-' + p);
    if (el) data[p] = el.value.trim();
  });
  localStorage.setItem(KEY_LINKS, JSON.stringify(data));
  const msg = document.getElementById('saveMsg');
  msg.style.display = 'inline';
  setTimeout(() => msg.style.display = 'none', 2500);
}

function doLogout() { sessionStorage.removeItem('fb_user'); window.location.href = '../../login/index.html'; }

render();
