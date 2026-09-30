(function(){
  var raw = sessionStorage.getItem('fb_user');
  if (!raw) { window.location.replace('../../login/index.html'); return; }
  try {
    var u = JSON.parse(raw);
    if (!u || !u.id) { window.location.replace('../../login/index.html'); return; }
    if (u.role === 'admin') { window.location.replace('../../admin/main/index.html'); return; }
  } catch(e) { window.location.replace('../../login/index.html'); }
})();

const ALL_TZ = [
  {v:'Asia/Seoul',l:'대한민국 / 서울'},{v:'Asia/Tokyo',l:'일본 / 도쿄'},{v:'Asia/Shanghai',l:'중국 / 상하이'},
  {v:'Asia/Singapore',l:'싱가포르'},{v:'Asia/Brunei',l:'브루나이'},{v:'Asia/Manila',l:'필리핀 / 마닐라'},
  {v:'Asia/Ho_Chi_Minh',l:'베트남 / 호치민'},{v:'Asia/Bangkok',l:'태국 / 방콕'},{v:'Asia/Jakarta',l:'인도네시아 / 자카르타'},
  {v:'Asia/Kolkata',l:'인도 / 뉴델리'},{v:'Asia/Tashkent',l:'우즈베키스탄 / 타슈켄트'},{v:'Asia/Dubai',l:'아랍에미리트 / 두바이'},
  {v:'Europe/London',l:'영국 / 런던'},{v:'Europe/Paris',l:'프랑스 / 파리'},{v:'Europe/Berlin',l:'독일 / 베를린'},
  {v:'America/New_York',l:'미국 / 뉴욕'},{v:'America/Los_Angeles',l:'미국 / 로스앤젤레스'}
];
const KEY_DEFAULT='admin_tz_default', KEY_ENABLED='admin_tz_enabled', KEY_TZ='tz';
const DEFAULT_TZ='Asia/Kolkata';
function getDefaultTz(){ return localStorage.getItem(KEY_DEFAULT) || DEFAULT_TZ; }
function getEnabledList(){ const s=localStorage.getItem(KEY_ENABLED); return s?JSON.parse(s):ALL_TZ.map(t=>t.v); }
function buildTzDropdown(){
  const sel=document.getElementById('tzSel');
  const enabled=getEnabledList();
  const current=sel.value||localStorage.getItem(KEY_TZ)||getDefaultTz();
  sel.innerHTML='';
  ALL_TZ.filter(t=>enabled.includes(t.v)).forEach(t=>{
    const opt=document.createElement('option');
    opt.value=t.v; opt.textContent=t.l; sel.appendChild(opt);
  });
  if([...sel.options].some(o=>o.value===current)) sel.value=current;
  else sel.value=sel.options[0]?.value||'';
  const lbl=document.getElementById('tzLabelDisplay');
  if(lbl){ const found=ALL_TZ.find(t=>t.v===sel.value); lbl.textContent=found?found.l:sel.value; }
}
function toggleTheme(){
  const h=document.documentElement,dark=h.dataset.theme==='dark';
  h.dataset.theme=dark?'light':'dark';
  const ico=document.getElementById('pf-t-ico');
  if(ico) ico.textContent=dark?'🌙':'☀️';
  if(window._applyTickColors) window._applyTickColors();
}
document.addEventListener('DOMContentLoaded',function(){
  buildTzDropdown();
  const face=document.getElementById('clockFace');
  const tzSel=document.getElementById('tzSel');
  const timeStr=document.getElementById('timeStr');
  const dateStr=document.getElementById('dateStr');
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.style.cssText='position:absolute;top:0;left:0;pointer-events:none;';
  face.appendChild(svg);
  function applyTickColors(){
    const styles=getComputedStyle(document.documentElement);
    const major=styles.getPropertyValue('--tick-major').trim();
    const minor=styles.getPropertyValue('--tick-minor').trim();
    [...svg.querySelectorAll('line')].forEach((line,i)=>{ line.setAttribute('stroke',i%3===0?major:minor); });
  }
  window._applyTickColors=applyTickColors;
  function drawTicks(){
    const SIZE=face.clientWidth,CX=SIZE/2,CY=SIZE/2;
    svg.setAttribute('width',SIZE); svg.setAttribute('height',SIZE); svg.innerHTML='';
    for(let i=0;i<12;i++){
      const rad=(i*30-90)*Math.PI/180;
      const outerR=CX-(SIZE*0.033);
      const len=i%3===0?SIZE*0.047:SIZE*0.03;
      const innerR=outerR-len;
      const line=document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1',CX+outerR*Math.cos(rad));
      line.setAttribute('y1',CY+outerR*Math.sin(rad));
      line.setAttribute('x2',CX+innerR*Math.cos(rad));
      line.setAttribute('y2',CY+innerR*Math.sin(rad));
      line.setAttribute('stroke-width',i%3===0?'2':'1.5');
      line.setAttribute('stroke-linecap','round');
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
    const map={};
    fmt.formatToParts(now).forEach(p=>{map[p.type]=p.value;});
    return { month:Number(map.month),day:Number(map.day),weekday:map.weekday,hour:Number(map.hour),minute:Number(map.minute),second:Number(map.second),ms:now.getMilliseconds() };
  }
  function tick(){
    const t=getTimeParts(tzSel.value||getDefaultTz());
    const ss=t.second+(t.ms/1000),mm=t.minute+(ss/60),hh=(t.hour%12)+(mm/60);
    face._hour.style.transform=`rotate(${hh*30}deg)`;
    face._minute.style.transform=`rotate(${mm*6}deg)`;
    face._second.style.transform=`rotate(${ss*6}deg)`;
    timeStr.textContent=[t.hour,t.minute,t.second].map(x=>String(x).padStart(2,'0')).join(':');
    dateStr.textContent=`${String(t.month).padStart(2,'0')}월 ${String(t.day).padStart(2,'0')}일 (${t.weekday})`;
    requestAnimationFrame(tick);
  }
  tzSel.addEventListener('change',()=>{ localStorage.setItem(KEY_TZ,tzSel.value); });
  window.addEventListener('resize',drawTicks);
  drawTicks(); tick();
});

const me = JSON.parse(sessionStorage.getItem('fb_user') || 'null');
if (!me || !me.id) { window.location.href = '../../login/index.html'; }
const KEY = 'fb_schedule';
const DEFAULT_DATA = [
  {id:'d0',s:'2026-04-13',e:'2026-04-16',t:'t',l:'상하이 미팅',w:'안선우·전해연'},
  {id:'d1',s:'2026-04-21',e:'2026-04-22',t:'t',l:'서울 현대차',w:'박철완·준유'},
  {id:'d2',s:'2026-04-23',e:'2026-04-28',t:'t',l:'인도 총판',w:'김상윤·사장'},
  {id:'d3',s:'2026-04-28',e:'2026-05-02',t:'t',l:'샤먼 세미나',w:'박철완·전해연·작은사장님'},
  {id:'d4',s:'2026-03-16',t:'l',l:'연차',w:'김다영'},
  {id:'d5',s:'2026-03-24',t:'l',l:'연차',w:'박준유'},
  {id:'d6',s:'2026-03-24',t:'l',l:'월차',w:'안선우'},
  {id:'d7',s:'2026-03-26',t:'l',l:'연차',w:'최혜선'},
  {id:'d8',s:'2026-03-27',t:'l',l:'연차',w:'김다영'},
  {id:'d9',s:'2026-03-27',t:'l',l:'월차',w:'김상윤'},
  {id:'d10',s:'2026-03-27',t:'l',l:'연차',w:'송나겸'},
  {id:'d11',s:'2026-04-03',t:'l',l:'연차',w:'박준유'},
  {id:'d12',s:'2026-04-06',t:'l',l:'연차',w:'김다영'},
  {id:'d13',s:'2026-04-07',t:'h',l:'오전반차',w:'김다영'},
  {id:'d14',s:'2026-04-09',t:'l',l:'연차',w:'김상윤'},
  {id:'d15',s:'2026-04-10',t:'l',l:'연차',w:'김상윤'},
  {id:'d16',s:'2026-04-10',t:'l',l:'월차',w:'안선우'},
  {id:'d17',s:'2026-04-10',t:'h',l:'오후반차',w:'송나겸'},
  {id:'d18',s:'2026-04-15',t:'l',l:'연차',w:'최혜선'},
  {id:'d19',s:'2026-04-16',t:'h',l:'오후반차',w:'박준유'},
  {id:'d20',s:'2026-04-17',t:'l',l:'연차',w:'김다영'},
  {id:'d21',s:'2026-04-20',t:'l',l:'연차',w:'조수빈'},
  {id:'d22',s:'2026-04-20',t:'l',l:'연차',w:'김상윤'},
  {id:'d23',s:'2026-04-24',t:'l',l:'연차',w:'송나겸'},
  {id:'d24',s:'2026-04-29',t:'l',l:'월차',w:'강승훈'},
  {id:'d25',s:'2026-05-04',t:'l',l:'연차',w:'조수빈'},
  {id:'d26',s:'2026-05-04',t:'l',l:'연차',w:'박철완'},
];
function getSchedule(){const s=localStorage.getItem(KEY);if(!s){localStorage.setItem(KEY,JSON.stringify(DEFAULT_DATA));return [...DEFAULT_DATA];}return JSON.parse(s);}
function saveSchedule(list){localStorage.setItem(KEY,JSON.stringify(list));}
const TYPE_MAP={t:'출장',l:'연차',h:'반차',p:'공휴일'};
const TYPE_CLS={t:'type-t',l:'type-l',h:'type-h',p:'type-p'};
let currentFilter='all';
function setFilter(btn,f){
  currentFilter=f;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  renderList();
}
function renderList(){
  const data=getSchedule().filter(e=>currentFilter==='all'||e.t===currentFilter);
  data.sort((a,b)=>b.s.localeCompare(a.s));
  const el=document.getElementById('scheduleList');
  document.getElementById('countBar').textContent='총 '+data.length+'건';
  if(!data.length){el.innerHTML='<div class="empty-row">등록된 일정이 없습니다.</div>';return;}
  el.innerHTML=data.map((e,i)=>`
    <div class="tbl-row">
      <div style="color:var(--text3);font-size:12px">${i+1}</div>
      <div>${e.w}</div>
      <div><span class="type-badge ${TYPE_CLS[e.t]||'type-l'}">${TYPE_MAP[e.t]||e.t}</span></div>
      <div>${e.l}</div>
      <div style="font-size:12.5px">${e.s}</div>
      <div style="font-size:12.5px;color:var(--text2)">${e.e||'-'}</div>
      <div class="actions">
        <button class="act-btn" onclick="openEdit('${e.id}')">수정</button>
        <button class="act-btn del" onclick="deleteEntry('${e.id}')">삭제</button>
      </div>
    </div>`).join('');
}
let editId=null;
function onTypeChange(){
  const t=document.getElementById('mType').value;
  const sub=document.getElementById('mSubRow');
  sub.style.display=t==='l'?'':'none';
  if(t!=='l'){document.getElementById('mLabel').placeholder='예: 중국 샤먼 세미나';}
  else{document.getElementById('mLabel').placeholder='예: 개인 사유';}
}
function openModal(id){
  editId=id||null;
  document.getElementById('modalTitle').textContent=id?'일정 수정':'일정 추가';
  if(id){
    const e=getSchedule().find(x=>x.id===id);
    document.getElementById('mName').value=e.w;
    if(e.t==='h'){
      document.getElementById('mType').value='l';
      document.getElementById('mSubRow').style.display='';
      if(e.l==='오전반차')document.getElementById('mSub').value='ha';
      else document.getElementById('mSub').value='hp';
    }else{
      document.getElementById('mType').value=e.t;
      document.getElementById('mSubRow').style.display=e.t==='l'?'':'none';
      document.getElementById('mSub').value='l';
    }
    document.getElementById('mLabel').value=e.l;
    document.getElementById('mStart').value=e.s;
    document.getElementById('mEnd').value=e.e||'';
  }else{
    document.getElementById('mName').value='';
    document.getElementById('mType').value='t';
    document.getElementById('mSub').value='l';
    document.getElementById('mSubRow').style.display='none';
    document.getElementById('mLabel').value='';
    document.getElementById('mStart').value='';
    document.getElementById('mEnd').value='';
  }
  document.getElementById('modal').style.display='flex';
  setTimeout(()=>document.getElementById('mName').focus(),80);
}
function openEdit(id){openModal(id);}
function closeModal(){document.getElementById('modal').style.display='none';editId=null;}
function saveEntry(){
  const w=document.getElementById('mName').value.trim();
  let t=document.getElementById('mType').value;
  let l=document.getElementById('mLabel').value.trim();
  const s=document.getElementById('mStart').value;
  const e=document.getElementById('mEnd').value||undefined;
  if(!w||!s){alert('이름과 시작일을 입력해주세요.');return;}
  if(t==='l'){
    const sub=document.getElementById('mSub').value;
    if(sub==='ha'){t='h';if(!l)l='오전반차';}
    else if(sub==='hp'){t='h';if(!l)l='오후반차';}
    else{if(!l)l='연차';}
  }
  if(!l){alert('내용을 입력해주세요.');return;}
  const list=getSchedule();
  if(editId){
    const idx=list.findIndex(x=>x.id===editId);
    if(idx>=0)list[idx]={id:editId,s,e,t,l,w};
  }else{
    list.push({id:'u'+Date.now(),s,e,t,l,w});
  }
  saveSchedule(list);
  closeModal();
  renderList();
  renderTripNow();
}
function deleteEntry(id){
  const e=getSchedule().find(x=>x.id===id);
  if(!confirm(`'${e.l} (${e.w})' 일정을 삭제하시겠습니까?`))return;
  saveSchedule(getSchedule().filter(x=>x.id!==id));
  renderList();
  renderTripNow();
}

function renderTripNow(){
  const now=new Date();
  const today=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
  const trips=getSchedule().filter(e=>e.t==='t'&&e.s<=today&&(e.e?e.e>=today:e.s===today));
  const el=document.getElementById('tripNowList');
  if(!el)return;
  if(!trips.length){el.innerHTML='<div class="trip-sub" style="color:var(--text3)">현재 출장 없음</div>';return;}
  const flag=l=>{if(l.includes('중국')||l.includes('상하이')||l.includes('샤먼'))return'🇨🇳';if(l.includes('인도'))return'🇮🇳';if(l.includes('일본'))return'🇯🇵';if(l.includes('미국'))return'🇺🇸';if(l.includes('싱가포르'))return'🇸🇬';if(l.includes('베트남'))return'🇻🇳';return'✈️';};
  el.innerHTML=trips.map(e=>'<div class="trip-now">'+flag(e.l)+' '+e.l+'</div><div class="trip-sub">'+e.w+'</div><div class="trip-sub">'+e.s+(e.e?' → '+e.e:'')+'</div>').join('');
}

// ============================================================
// 사이드바 권한 기반 활성화 + 로그인 사용자 표시
// ============================================================
(function(){
  const fbUser = JSON.parse(sessionStorage.getItem('fb_user') || 'null');
  if (!fbUser) { window.location.href = '../../login/index.html'; return; }
  if (fbUser.role === 'admin') { window.location.href = '../../admin/main/index.html'; return; }
  const footer = document.querySelector('.sb-footer');
  if (footer) {
    const nameEl = document.createElement('div');
    nameEl.style.cssText = 'margin-top:8px;padding-top:8px;border-top:1px solid var(--border);font-size:11.5px;color:var(--text2);display:flex;align-items:center;justify-content:space-between;gap:6px;';
    const nameText = document.createElement('span');
    nameText.textContent = '로그인: ' + (fbUser.name || fbUser.id) + ' (' + (fbUser.role === 'manager' ? '관리부' : '직원') + ')';
    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = '로그아웃';
    logoutBtn.style.cssText = 'background:none;border:1px solid var(--border2);border-radius:4px;padding:2px 7px;font-size:11px;color:var(--text2);cursor:pointer;font-family:inherit;flex-shrink:0;transition:background .1s,color .1s;';
    logoutBtn.onmouseover = () => { logoutBtn.style.background='rgba(220,80,80,.12)'; logoutBtn.style.color='#d95f5f'; logoutBtn.style.borderColor='#d95f5f'; };
    logoutBtn.onmouseout  = () => { logoutBtn.style.background='none'; logoutBtn.style.color='var(--text2)'; logoutBtn.style.borderColor='var(--border2)'; };
    logoutBtn.onclick = () => doLogout();
    nameEl.appendChild(nameText);
    nameEl.appendChild(logoutBtn);
    footer.appendChild(nameEl);
  }
  const permLinks = JSON.parse(localStorage.getItem('fb_perm_links') || '{}');
  const userPerms = fbUser.perms || [];
  const isManager = fbUser.role === 'manager';
  document.querySelectorAll('.sb-item[data-perm]').forEach(item => {
    const perm = item.dataset.perm;
    const hasAccess = isManager || userPerms.includes(perm);
    const url = permLinks[perm];
    if (hasAccess) {
      item.style.opacity = '1';
      if (url) {
        item.style.cursor = 'pointer';
        item.onclick = (e) => { e.stopPropagation(); window.open(url, '_blank'); };
        item.title = url;
      }
    } else {
      item.style.opacity = '0.3';
      item.style.pointerEvents = 'none';
      item.title = '접근 권한이 없습니다.';
    }
  });
})();

// ============================================================
// 채팅
// ============================================================
const KEY_ROOMS = 'fb_chat_rooms';
const KEY_MSGS = rid => 'fb_chat_msgs_' + rid;
const _cu = JSON.parse(sessionStorage.getItem('fb_user') || '{}');
function getRooms() { return JSON.parse(localStorage.getItem(KEY_ROOMS) || '[]'); }
function saveRooms(r) { localStorage.setItem(KEY_ROOMS, JSON.stringify(r)); }
function getMsgs(rid) { return JSON.parse(localStorage.getItem(KEY_MSGS(rid)) || '[]'); }
function addMsg(rid, msg) { const m = getMsgs(rid); m.push(msg); localStorage.setItem(KEY_MSGS(rid), JSON.stringify(m)); }
function getAllUsers() { return JSON.parse(localStorage.getItem('fb_accounts') || '[]'); }
let _chatRoomId = null;
function toggleChat() {
  const p = document.getElementById('chatPopup');
  const open = p.style.display === 'flex';
  p.style.display = open ? 'none' : 'flex';
  if (!open) showRoomList();
}
function showRoomList() {
  _chatRoomId = null;
  document.getElementById('chatRoomsView').style.display = 'flex';
  document.getElementById('chatRoomView').style.display = 'none';
  renderRoomList();
}
function renderRoomList() {
  const rooms = getRooms().filter(r => r.members.includes(_cu.id));
  const el = document.getElementById('roomListBody');
  if (!rooms.length) {
    el.innerHTML = '<div style="padding:24px;text-align:center;font-size:12px;color:var(--text3)">채팅방이 없습니다.<br>아래 버튼으로 시작하세요.</div>';
    return;
  }
  el.innerHTML = rooms.map(r => {
    const msgs = getMsgs(r.id), last = msgs[msgs.length - 1];
    const lt = last ? (last.name + ': ' + last.text).substring(0, 28) : '메시지 없음';
    return `<div class="room-item" onclick="openRoom('${r.id}')"><div class="room-icon">${r.type === 'group' ? '👥' : '💬'}</div><div style="min-width:0"><div class="room-name">${r.name}</div><div class="room-last">${lt}</div></div></div>`;
  }).join('');
}
function openRoom(rid) {
  _chatRoomId = rid;
  const r = getRooms().find(r => r.id === rid);
  document.getElementById('chatRoomsView').style.display = 'none';
  document.getElementById('chatRoomView').style.display = 'flex';
  document.getElementById('chatRoomTitle').textContent = r.name;
  renderMessages();
}
function renderMessages() {
  if (!_chatRoomId) return;
  const msgs = getMsgs(_chatRoomId), uid = _cu.id;
  const el = document.getElementById('chatMsgBody');
  el.innerHTML = msgs.map(m => {
    const meM = m.from === uid;
    return `<div class="msg-wrap ${meM ? 'msg-me' : 'msg-other'}">${!meM ? `<div class="msg-sender">${m.name}</div>` : ''}<div class="msg-bubble ${meM ? 'msg-bubble-me' : 'msg-bubble-other'}">${escH(m.text)}</div><div class="msg-time">${fmtTs(m.ts)}</div></div>`;
  }).join('');
  setTimeout(() => el.scrollTop = el.scrollHeight, 30);
}
function sendMsg() {
  const inp = document.getElementById('chatInput'), text = inp.value.trim();
  if (!text || !_chatRoomId) return;
  addMsg(_chatRoomId, { from: _cu.id, name: _cu.name || _cu.id, text, ts: Date.now() });
  inp.value = ''; renderMessages();
}
function escH(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function fmtTs(ts) {
  const d = new Date(ts);
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
}
function openNewRoomModal(type) {
  document.getElementById('nrType').value = type;
  document.getElementById('nrTitle').textContent = type === 'dm' ? '1:1 채팅 시작' : '단체 채팅방 만들기';
  document.getElementById('nrNameField').style.display = type === 'group' ? '' : 'none';
  document.getElementById('nrRoomName').value = '';
  document.getElementById('newRoomModal').style.display = 'flex';
  const users = getAllUsers().filter(u => u.id !== _cu.id);
  document.getElementById('nrUsers').innerHTML = users.length
    ? users.map(u => `<label style="display:flex;align-items:center;gap:7px;padding:4px 0;cursor:pointer;font-size:13px"><input type="checkbox" value="${u.id}" data-name="${u.name || u.id}" style="accent-color:#9b1b30">${u.name || u.id} (${u.id})</label>`).join('')
    : '<div style="font-size:12px;color:var(--text3)">다른 직원이 없습니다.</div>';
  if (type === 'dm') {
    document.querySelectorAll('#nrUsers input').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) document.querySelectorAll('#nrUsers input').forEach(o => { if (o !== cb) o.checked = false; });
      });
    });
  }
}
function closeNewRoomModal() { document.getElementById('newRoomModal').style.display = 'none'; }
function createRoom() {
  const type = document.getElementById('nrType').value;
  const checked = [...document.querySelectorAll('#nrUsers input:checked')];
  if (!checked.length) { alert('참여자를 선택해주세요.'); return; }
  let name = type === 'dm'
    ? checked[0].dataset.name + '와의 대화'
    : document.getElementById('nrRoomName').value.trim();
  if (type === 'group' && !name) { alert('방 이름을 입력해주세요.'); return; }
  const rooms = getRooms(), rid = 'room_' + Date.now();
  rooms.push({ id: rid, name, type, members: [_cu.id, ...checked.map(c => c.value)], createdAt: Date.now() });
  saveRooms(rooms); closeNewRoomModal(); openRoom(rid);
}
window.addEventListener('storage', e => {
  if (_chatRoomId && e.key === KEY_MSGS(_chatRoomId)) renderMessages();
  else if (!_chatRoomId && document.getElementById('chatPopup').style.display === 'flex') renderRoomList();
  if (e.key === 'fb_schedule') { renderList(); renderTripNow(); }
});

// ============================================================
// 프로필
// ============================================================
function openProfile() {
  const u = JSON.parse(sessionStorage.getItem('fb_user') || '{}');
  document.getElementById('pfName').textContent = u.name || u.id;
  document.getElementById('pfId').textContent = u.id;
  document.getElementById('pfRoleLabel').textContent = u.role === 'manager' ? '관리부' : '직원';
  ['pfPwOld', 'pfPwNew', 'pfPwConfirm'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('pfPwMsg').textContent = '';
  document.getElementById('profileModal').style.display = 'flex';
}
function closeProfile() { document.getElementById('profileModal').style.display = 'none'; }
function changePw() {
  const u = JSON.parse(sessionStorage.getItem('fb_user') || '{}');
  const oldPw = document.getElementById('pfPwOld').value;
  const newPw = document.getElementById('pfPwNew').value;
  const cfm   = document.getElementById('pfPwConfirm').value;
  const msg   = document.getElementById('pfPwMsg');
  if (!oldPw || !newPw || !cfm) { msg.style.color = '#d95f5f'; msg.textContent = '모든 항목을 입력해주세요.'; return; }
  if (newPw !== cfm)            { msg.style.color = '#d95f5f'; msg.textContent = '새 비밀번호가 일치하지 않습니다.'; return; }
  if (newPw.length < 4)         { msg.style.color = '#d95f5f'; msg.textContent = '4자 이상 입력해주세요.'; return; }
  const accounts = JSON.parse(localStorage.getItem('fb_accounts') || '[]');
  const idx = accounts.findIndex(a => a.id === u.id);
  if (idx === -1)                     { msg.style.color = '#d95f5f'; msg.textContent = '계정 정보를 찾을 수 없습니다.'; return; }
  if (accounts[idx].pw !== oldPw)     { msg.style.color = '#d95f5f'; msg.textContent = '현재 비밀번호가 올바르지 않습니다.'; return; }
  accounts[idx].pw = newPw;
  localStorage.setItem('fb_accounts', JSON.stringify(accounts));
  msg.style.color = '#52a874'; msg.textContent = '✅ 비밀번호가 변경되었습니다.';
  ['pfPwOld', 'pfPwNew', 'pfPwConfirm'].forEach(id => document.getElementById(id).value = '');
}
function doLogout() {
  if (!confirm('로그아웃 하시겠습니까?')) return;
  sessionStorage.removeItem('fb_user');
  window.location.href = '../../login/index.html';
}
renderList();
renderTripNow();
