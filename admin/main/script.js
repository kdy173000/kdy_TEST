(function(){
  var raw = sessionStorage.getItem('fb_user');
  if (!raw) { window.location.replace('../../login/index.html'); return; }
  try { var u = JSON.parse(raw); if (!u || u.role !== 'admin') { window.location.replace('../../login/index.html'); return; } }
  catch(e) { window.location.replace('../../login/index.html'); }
})();

function toggleTheme() {
  const h = document.documentElement, dark = h.dataset.theme === 'dark';
  h.dataset.theme = dark ? 'light' : 'dark';
  document.getElementById('t-ico').textContent = dark ? '🌙' : '☀️';
}
function doLogout() { if(!confirm('로그아웃 하시겠습니까?')) return; sessionStorage.removeItem('fb_user'); window.location.href = '../../login/index.html'; }

function openProfile() {
  const u=JSON.parse(sessionStorage.getItem('fb_user')||'{}');
  document.getElementById('pfName').textContent=u.name||u.id||'관리자';
  document.getElementById('pfId').textContent=u.id||'';
  ['pfPwOld','pfPwNew','pfPwConfirm'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('pfPwMsg').textContent='';
  renderLoginLog();
  document.getElementById('profileModal').style.display='flex';
}
function closeProfile() { document.getElementById('profileModal').style.display='none'; }
function changePw() {
  const u=JSON.parse(sessionStorage.getItem('fb_user')||'{}');
  const oldPw=document.getElementById('pfPwOld').value;
  const newPw=document.getElementById('pfPwNew').value;
  const cfm=document.getElementById('pfPwConfirm').value;
  const msg=document.getElementById('pfPwMsg');
  if(!oldPw||!newPw||!cfm){ msg.style.color='#d95f5f'; msg.textContent='모든 항목을 입력해주세요.'; return; }
  if(newPw!==cfm){ msg.style.color='#d95f5f'; msg.textContent='새 비밀번호가 일치하지 않습니다.'; return; }
  if(newPw.length<4){ msg.style.color='#d95f5f'; msg.textContent='4자 이상 입력해주세요.'; return; }
  const accounts=JSON.parse(localStorage.getItem('fb_accounts')||'[]');
  const idx=accounts.findIndex(a=>a.id===u.id);
  if(idx===-1){
    const FIXED='adminfireball';
    const stored=localStorage.getItem('admin_account_pw')||FIXED;
    if(oldPw!==stored){ msg.style.color='#d95f5f'; msg.textContent='현재 비밀번호가 올바르지 않습니다.'; return; }
    localStorage.setItem('admin_account_pw',newPw);
  } else {
    if(accounts[idx].pw!==oldPw){ msg.style.color='#d95f5f'; msg.textContent='현재 비밀번호가 올바르지 않습니다.'; return; }
    accounts[idx].pw=newPw;
    localStorage.setItem('fb_accounts',JSON.stringify(accounts));
  }
  msg.style.color='#52a874'; msg.textContent='✅ 비밀번호가 변경되었습니다.';
  ['pfPwOld','pfPwNew','pfPwConfirm'].forEach(id=>document.getElementById(id).value='');
}
function renderLoginLog() {
  const u=JSON.parse(sessionStorage.getItem('fb_user')||'{}');
  const log=JSON.parse(localStorage.getItem('fb_login_log')||'[]').filter(r=>r.id===u.id);
  const body=document.getElementById('logBody');
  if(!log.length){ body.innerHTML='<tr><td colspan="2" class="log-empty">로그인 기록이 없습니다.</td></tr>'; return; }
  body.innerHTML=log.slice().reverse().map(r=>{
    const d=new Date(r.ts);
    const ts=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+' '+
      String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')+':'+String(d.getSeconds()).padStart(2,'0');
    const dev=(r.deviceId||'').slice(0,8);
    const ua=(r.ua||'').replace(/Mozilla\/[\d.]+\s\(/,'').replace(/\).*$/,'').slice(0,42);
    return `<tr><td>${ts}</td><td><div style="color:var(--text);font-weight:500">${r.platform||'-'} · #${dev}</div><div style="color:var(--text3);font-size:10.5px;margin-top:1px">${ua}</div><div style="color:var(--text3);font-size:10.5px">${r.screen||''}</div></td></tr>`;
  }).join('');
}
