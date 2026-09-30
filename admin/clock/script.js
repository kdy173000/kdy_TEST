(function(){
  var raw = sessionStorage.getItem('fb_user');
  if (!raw) { window.location.replace('../../login/index.html'); return; }
  try { var u = JSON.parse(raw); if (!u || u.role !== 'admin') { window.location.replace('../../login/index.html'); return; } }
  catch(e) { window.location.replace('../../login/index.html'); }
})();

const ALL_TZ = [
  {v:'Asia/Seoul',l:'대한민국 / 서울'},{v:'Asia/Tokyo',l:'일본 / 도쿄'},
  {v:'Asia/Shanghai',l:'중국 / 상하이'},{v:'Asia/Singapore',l:'싱가포르'},
  {v:'Asia/Brunei',l:'브루나이'},{v:'Asia/Manila',l:'필리핀 / 마닐라'},
  {v:'Asia/Ho_Chi_Minh',l:'베트남 / 호치민'},{v:'Asia/Bangkok',l:'태국 / 방콕'},
  {v:'Asia/Jakarta',l:'인도네시아 / 자카르타'},{v:'Asia/Kolkata',l:'인도 / 뉴델리'},
  {v:'Asia/Tashkent',l:'우즈베키스탄 / 타슈켄트'},{v:'Asia/Dubai',l:'아랍에미리트 / 두바이'},
  {v:'Europe/London',l:'영국 / 런던'},{v:'Europe/Paris',l:'프랑스 / 파리'},
  {v:'Europe/Berlin',l:'독일 / 베를린'},{v:'Europe/Warsaw',l:'폴란드 / 바르샤바'},
  {v:'Europe/Kyiv',l:'우크라이나 / 키이우'},{v:'Europe/Istanbul',l:'튀르키에 / 이스탄불'},
  {v:'Europe/Moscow',l:'러시아 / 모스크바'},{v:'America/New_York',l:'미국 / 뉴욕'},
  {v:'America/Chicago',l:'미국 / 시카고'},{v:'America/Denver',l:'미국 / 덴버'},
  {v:'America/Los_Angeles',l:'미국 / 로스앤젤레스'},{v:'America/Toronto',l:'캐나다 / 토론토'},
  {v:'America/Puerto_Rico',l:'푸에르토리코'},{v:'America/Sao_Paulo',l:'브라질 / 상파울루'},
  {v:'America/Santiago',l:'칠레 / 산티아고'},{v:'Australia/Sydney',l:'호주 / 시드니'},
  {v:'Pacific/Auckland',l:'뉴질랜드 / 오클랜드'},
];
const KEY_DEFAULT='admin_tz_default', KEY_ENABLED='admin_tz_enabled';
const DEFAULT_TZ='Asia/Kolkata';
function getDefault() { return localStorage.getItem(KEY_DEFAULT) || DEFAULT_TZ; }
function getEnabled() { const s=localStorage.getItem(KEY_ENABLED); return s?JSON.parse(s):ALL_TZ.map(t=>t.v); }

function flashSaved() {
  const m=document.getElementById('liveMsg');
  m.classList.add('show');
  clearTimeout(window._sfx); window._sfx=setTimeout(()=>m.classList.remove('show'),1400);
}
function saveDefault() {
  const v=document.getElementById('defaultTzSel').value;
  if(!v) return;
  localStorage.setItem(KEY_DEFAULT,v);
  localStorage.setItem('tz', v);
  updatePreviewLabel();
  flashSaved();
}
function saveEnabled() {
  const checked=[...document.querySelectorAll('#tzList input:checked')].map(cb=>cb.value);
  if(!checked.length) return false;
  localStorage.setItem(KEY_ENABLED,JSON.stringify(checked));
  rebuildDefaultSelect();
  updatePreviewLabel();
  flashSaved();
  return true;
}
function rebuildDefaultSelect() {
  const defSel=document.getElementById('defaultTzSel');
  const enabled=getEnabled();
  const cur=getDefault();
  defSel.innerHTML='';
  ALL_TZ.filter(t=>enabled.includes(t.v)).forEach(t=>{
    const o=document.createElement('option'); o.value=t.v; o.textContent=t.l; defSel.appendChild(o);
  });
  if([...defSel.options].some(o=>o.value===cur)) defSel.value=cur;
  else { defSel.value=defSel.options[0]?.value||''; if(defSel.value) localStorage.setItem(KEY_DEFAULT,defSel.value); }
}
function updatePreviewLabel() {
  const found=ALL_TZ.find(t=>t.v===getDefault());
  document.getElementById('previewTzLabel').textContent=found?found.l:getDefault();
}
function toggleTheme() {
  const h=document.documentElement,dark=h.dataset.theme==='dark';
  h.dataset.theme=dark?'light':'dark';
  document.getElementById('t-ico').textContent=dark?'🌙':'☀️';
  if(window._applyTickColors) window._applyTickColors();
}
function doLogout() { if(!confirm('로그아웃 하시겠습니까?')) return; sessionStorage.removeItem('fb_user'); window.location.href='../../login/index.html'; }

// ─ Profile ─
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
    // 고정 관리자 계정 (fireballadmin) — admin_account_pw 키로 별도 관리
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

// ─ 시계 (메인과 동일) ─
document.addEventListener('DOMContentLoaded',function(){
  rebuildDefaultSelect();
  const enabled=getEnabled();
  const list=document.getElementById('tzList');
  ALL_TZ.forEach(t=>{
    const item=document.createElement('div'); item.className='tz-item';
    const cb=document.createElement('input'); cb.type='checkbox'; cb.value=t.v; cb.checked=enabled.includes(t.v);
    const lbl=document.createElement('span'); lbl.textContent=t.l; if(cb.checked) lbl.className='checked';
    cb.addEventListener('change',()=>{
      lbl.className=cb.checked?'checked':'';
      if(!saveEnabled()){ cb.checked=true; lbl.className='checked'; alert('최소 한 개 이상 선택해야 합니다.'); }
    });
    item.appendChild(cb); item.appendChild(lbl);
    item.addEventListener('click',e=>{ if(e.target!==cb){ cb.checked=!cb.checked; cb.dispatchEvent(new Event('change')); } });
    list.appendChild(item);
  });
  updatePreviewLabel();

  const face=document.getElementById('clockFace');
  const timeStr=document.getElementById('timeStr');
  const dateStr=document.getElementById('dateStr');
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.style.cssText='position:absolute;top:0;left:0;pointer-events:none;';
  face.appendChild(svg);
  function applyTickColors(){
    const st=getComputedStyle(document.documentElement);
    const major=st.getPropertyValue('--tick-major').trim();
    const minor=st.getPropertyValue('--tick-minor').trim();
    [...svg.querySelectorAll('line')].forEach((l,i)=>l.setAttribute('stroke',i%3===0?major:minor));
  }
  window._applyTickColors=applyTickColors;
  function drawTicks(){
    const S=face.clientWidth,CX=S/2,CY=S/2;
    svg.setAttribute('width',S); svg.setAttribute('height',S); svg.innerHTML='';
    for(let i=0;i<12;i++){
      const rad=(i*30-90)*Math.PI/180,outerR=CX-(S*0.033);
      const len=i%3===0?S*0.047:S*0.03,innerR=outerR-len;
      const line=document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1',CX+outerR*Math.cos(rad)); line.setAttribute('y1',CY+outerR*Math.sin(rad));
      line.setAttribute('x2',CX+innerR*Math.cos(rad)); line.setAttribute('y2',CY+innerR*Math.sin(rad));
      line.setAttribute('stroke-width',i%3===0?'2':'1.5'); line.setAttribute('stroke-linecap','round');
      svg.appendChild(line);
    }
    applyTickColors();
  }
  ['hour','minute','second'].forEach(cls=>{
    const d=document.createElement('div'); d.className='c-hand '+cls; face.appendChild(d); face['_'+cls]=d;
  });
  face.appendChild(Object.assign(document.createElement('div'),{className:'c-center-dot'}));
  function getTimeParts(tz){
    const now=new Date();
    const fmt=new Intl.DateTimeFormat('ko-KR',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',weekday:'short',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
    const map={}; fmt.formatToParts(now).forEach(p=>{map[p.type]=p.value;});
    return { month:Number(map.month),day:Number(map.day),weekday:map.weekday,hour:Number(map.hour),minute:Number(map.minute),second:Number(map.second),ms:now.getMilliseconds() };
  }
  function tick(){
    const t=getTimeParts(getDefault());
    const ss=t.second+(t.ms/1000),mm=t.minute+(ss/60),hh=(t.hour%12)+(mm/60);
    face._hour.style.transform=`rotate(${hh*30}deg)`;
    face._minute.style.transform=`rotate(${mm*6}deg)`;
    face._second.style.transform=`rotate(${ss*6}deg)`;
    timeStr.textContent=[t.hour,t.minute,t.second].map(x=>String(x).padStart(2,'0')).join(':');
    dateStr.textContent=`${String(t.month).padStart(2,'0')}월 ${String(t.day).padStart(2,'0')}일 (${t.weekday})`;
    requestAnimationFrame(tick);
  }
  window.addEventListener('resize',drawTicks);
  drawTicks(); tick();

  // 다른 탭에서 설정이 바뀌면 즉시 반영
  window.addEventListener('storage', e=>{
    if(e.key===KEY_DEFAULT||e.key===KEY_ENABLED){ rebuildDefaultSelect(); updatePreviewLabel(); }
  });
});
