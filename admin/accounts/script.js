const me = JSON.parse(sessionStorage.getItem('fb_user') || 'null');
if (!me || me.role !== 'admin') { window.location.href = '../../login/index.html'; }

const KEY_USERS = 'fb_accounts';
const PERMS = ['관리자','재고조회','입출고관리','제품 신고 관리','원료관리'];
const PERM_STYLE = {
  '관리자':        { color:'#d95f5f', bg:'rgba(220,80,80,.15)',   border:'rgba(220,80,80,.35)' },
  '재고조회':      { color:'#52a874', bg:'rgba(82,168,116,.15)',  border:'rgba(82,168,116,.35)' },
  '입출고관리':    { color:'#6488e0', bg:'rgba(100,136,224,.15)', border:'rgba(100,136,224,.35)' },
  '제품 신고 관리':{ color:'#c89a3c', bg:'rgba(200,154,60,.15)',  border:'rgba(200,154,60,.35)' },
  '원료관리':      { color:'#b06ed6', bg:'rgba(176,110,214,.15)', border:'rgba(176,110,214,.35)' },
};

function getUsers()       { return JSON.parse(localStorage.getItem(KEY_USERS) || '[]'); }
function saveUsers(list)  { localStorage.setItem(KEY_USERS, JSON.stringify(list)); }

function renderPermBtns(containerId, selected = []) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  PERMS.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'perm-btn' + (selected.includes(p) ? ' on' : '');
    btn.textContent = p;
    btn.onclick = () => btn.classList.toggle('on');
    el.appendChild(btn);
  });
}

function getSelectedPerms(containerId) {
  return [...document.querySelectorAll(`#${containerId} .perm-btn.on`)].map(b => b.textContent);
}

function renderList() {
  const users = getUsers();
  const el = document.getElementById('userList');
  document.getElementById('countText').textContent = `전체 ${users.length}명`;
  if (users.length === 0) {
    el.innerHTML = '<div class="empty-row">등록된 직원이 없습니다.</div>';
    return;
  }
  el.innerHTML = users.map((u, i) => {
    const perms = u.perms || [];
    const tags = perms.map(p => {
      const s = PERM_STYLE[p] || { color:'#9b1b30', bg:'rgba(155,27,48,.15)', border:'rgba(155,27,48,.35)' };
      return `<span class="perm-tag" style="color:${s.color};background:${s.bg};border:1px solid ${s.border}">${p}</span>`;
    }).join('');
    return `
    <div class="tbl-row">
      <div class="num">${i+1}</div>
      <div>${u.name || '-'}</div>
      <div style="font-weight:600">${u.id}</div>
      <div class="pw-cell">
        <span class="pw-text" id="pw-${i}">••••••</span>
        <button class="eye-btn" onclick="togglePw(${i},'${u.pw}')">👁</button>
      </div>
      <div style="font-size:12px;color:var(--text2)">${roleLabelMap[u.role] || '직원'}</div>
      <div class="perm-tags">${tags || '<span style="color:var(--text3);font-size:12px">없음</span>'}</div>
      <div class="actions">
        <button class="act-btn" onclick="openEdit(${i})">수정</button>
        <button class="act-btn del" onclick="deleteUser(${i})">삭제</button>
      </div>
    </div>`;
  }).join('');
}

function togglePw(i, pw) {
  const el = document.getElementById('pw-' + i);
  el.textContent = el.textContent === '••••••' ? pw : '••••••';
}

const roleLabelMap = { admin:'관리자', manager:'관리부', user:'직원' };
const roleRedirectMap = { admin:'../main/index.html', manager:'../../main/index.html', user:'../../main/index.html' };

function addUser() {
  const name  = document.getElementById('newName').value.trim();
  const id    = document.getElementById('newId').value.trim();
  const pw    = document.getElementById('newPw').value.trim();
  const role  = document.getElementById('newRole').value;
  const perms = getSelectedPerms('newPerms');
  const err   = document.getElementById('addErr');
  if (!name) { err.textContent = '이름을 입력해 주세요.'; return; }
  if (!id)   { err.textContent = '아이디를 입력해 주세요.'; return; }
  if (!pw)   { err.textContent = '비밀번호를 입력해 주세요.'; return; }
  const users = getUsers();
  if (users.some(u => u.id === id)) { err.textContent = '이미 사용 중인 아이디입니다.'; return; }
  users.push({ name, id, pw, role, perms, redirect: roleRedirectMap[role] });
  saveUsers(users);
  err.textContent = '';
  document.getElementById('newName').value = '';
  document.getElementById('newId').value = '';
  document.getElementById('newPw').value = '';
  document.getElementById('newRole').value = 'user';
  renderPermBtns('newPerms');
  renderList();
}

let editIdx = -1;
function openEdit(i) {
  const u = getUsers()[i];
  editIdx = i;
  document.getElementById('eName').value = u.name || '';
  document.getElementById('eId').value   = u.id;
  document.getElementById('ePw').value   = u.pw;
  document.getElementById('eRole').value = u.role || 'user';
  renderPermBtns('editPerms', u.perms || []);
  document.getElementById('editOverlay').style.display = 'flex';
}
function closeEdit() { document.getElementById('editOverlay').style.display = 'none'; editIdx = -1; }
function saveEdit() {
  if (editIdx < 0) return;
  const name  = document.getElementById('eName').value.trim();
  const id    = document.getElementById('eId').value.trim();
  const pw    = document.getElementById('ePw').value.trim();
  const role  = document.getElementById('eRole').value;
  const perms = getSelectedPerms('editPerms');
  if (!name || !id || !pw) { alert('모든 항목을 입력해 주세요.'); return; }
  const users = getUsers();
  if (users.some((u, i) => u.id === id && i !== editIdx)) { alert('이미 사용 중인 아이디입니다.'); return; }
  users[editIdx] = { name, id, pw, role, perms, redirect: roleRedirectMap[role] };
  saveUsers(users);
  closeEdit();
  renderList();
}
function deleteUser(i) {
  const u = getUsers()[i];
  if (!confirm(`'${u.name || u.id}' 계정을 삭제하시겠습니까?`)) return;
  const users = getUsers(); users.splice(i, 1); saveUsers(users); renderList();
}
function toggleTheme() {
  const h = document.documentElement, dark = h.dataset.theme === 'dark';
  h.dataset.theme = dark ? 'light' : 'dark';
  document.getElementById('t-ico').textContent = dark ? '🌙' : '☀️';
}
function doLogout() { sessionStorage.removeItem('fb_user'); window.location.href = '../loge'; }

renderPermBtns('newPerms');
renderList();
