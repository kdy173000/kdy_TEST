(function(){
  var raw = sessionStorage.getItem('fb_user');
  if (!raw) { window.location.replace('../login/index.html'); return; }
  try {
    var u = JSON.parse(raw);
    if (!u || !u.id) { window.location.replace('../login/index.html'); return; }
    if (u.role === 'admin') { window.location.replace('../admin/main/index.html'); return; }
  } catch(e) { window.location.replace('../login/index.html'); }
})();

const ALL_TZ = [
  {v:'Asia/Seoul',      l:'대한민국 / 서울'},
  {v:'Asia/Tokyo',      l:'일본 / 도쿄'},
  {v:'Asia/Shanghai',   l:'중국 / 상하이'},
  {v:'Asia/Singapore',  l:'싱가포르'},
  {v:'Asia/Brunei',     l:'브루나이'},
  {v:'Asia/Manila',     l:'필리핀 / 마닐라'},
  {v:'Asia/Ho_Chi_Minh',l:'베트남 / 호치민'},
  {v:'Asia/Bangkok',    l:'태국 / 방콕'},
  {v:'Asia/Jakarta',    l:'인도네시아 / 자카르타'},
  {v:'Asia/Kolkata',    l:'인도 / 뉴델리'},
  {v:'Asia/Tashkent',   l:'우즈베키스탄 / 타슈켄트'},
  {v:'Asia/Dubai',      l:'아랍에미리트 / 두바이'},
  {v:'Europe/London',   l:'영국 / 런던'},
  {v:'Europe/Paris',    l:'프랑스 / 파리'},
  {v:'Europe/Berlin',   l:'독일 / 베를린'},
  {v:'Europe/Warsaw',   l:'폴란드 / 바르샤바'},
  {v:'Europe/Kyiv',     l:'우크라이나 / 키이우'},
  {v:'Europe/Istanbul', l:'튀르키에 / 이스탄불'},
  {v:'Europe/Moscow',   l:'러시아 / 모스크바'},
  {v:'America/New_York',l:'미국 / 뉴욕'},
  {v:'America/Chicago', l:'미국 / 시카고'},
  {v:'America/Denver',  l:'미국 / 덴버'},
  {v:'America/Los_Angeles',l:'미국 / 로스앤젤레스'},
  {v:'America/Toronto', l:'캐나다 / 토론토'},
  {v:'America/Puerto_Rico',l:'푸에르토리코'},
  {v:'America/Sao_Paulo',l:'브라질 / 상파울루'},
  {v:'America/Santiago',l:'칠레 / 산티아고'},
  {v:'Australia/Sydney',l:'호주 / 시드니'},
  {v:'Pacific/Auckland',l:'뉴질랜드 / 오클랜드'},
];

const KEY_PW='admin_pw', KEY_DEFAULT='admin_tz_default', KEY_ENABLED='admin_tz_enabled';
const KEY_SESSION='admin_session', KEY_TZ='tz';
const DEFAULT_PW='kdy17300', DEFAULT_TZ='Asia/Kolkata';

function getAdminPw()    { return localStorage.getItem(KEY_PW) || DEFAULT_PW; }
function getDefaultTz()  { return localStorage.getItem(KEY_DEFAULT) || DEFAULT_TZ; }
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
  document.getElementById('pf-t-ico').textContent=dark?'🌙':'☀️';
  if(window._applyTickColors) window._applyTickColors();
}
function go(id){ document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'}); }

function openAdmin(){
  document.getElementById('adminOverlay').style.display='flex';
  document.getElementById('adminPwInput').value='';
  document.getElementById('adminErr').textContent='';
  if(sessionStorage.getItem(KEY_SESSION)==='1') showSettings();
  else{
    document.getElementById('adminLoginView').style.display='';
    document.getElementById('adminSettingsView').style.display='none';
    setTimeout(()=>document.getElementById('adminPwInput').focus(),100);
  }
}
function closeAdmin(){ document.getElementById('adminOverlay').style.display='none'; }
function overlayClick(e){ if(e.target===document.getElementById('adminOverlay')) closeAdmin(); }
function adminLogin(){
  const pw=document.getElementById('adminPwInput').value;
  if(pw===getAdminPw()){ sessionStorage.setItem(KEY_SESSION,'1'); showSettings(); }
  else document.getElementById('adminErr').textContent='비밀번호가 일치하지 않습니다.';
}
function adminLogout(){
  sessionStorage.removeItem(KEY_SESSION);
  document.getElementById('adminLoginView').style.display='';
  document.getElementById('adminSettingsView').style.display='none';
  document.getElementById('adminPwInput').value='';
  document.getElementById('adminErr').textContent='';
}
function showSettings(){
  document.getElementById('adminLoginView').style.display='none';
  document.getElementById('adminSettingsView').style.display='';
  document.getElementById('saveSuccess').style.display='none';
  document.getElementById('pwErr').textContent='';
  document.getElementById('newPw1').value='';
  document.getElementById('newPw2').value='';
  const defSel=document.getElementById('adminDefaultTzSel');
  defSel.innerHTML='';
  ALL_TZ.forEach(t=>{ const opt=document.createElement('option'); opt.value=t.v; opt.textContent=t.l; defSel.appendChild(opt); });
  defSel.value=getDefaultTz();
  const enabled=getEnabledList();
  const list=document.getElementById('adminTzList');
  list.innerHTML='';
  ALL_TZ.forEach(t=>{
    const item=document.createElement('div'); item.className='admin-tz-item';
    const cb=document.createElement('input'); cb.type='checkbox'; cb.value=t.v; cb.checked=enabled.includes(t.v);
    const lbl=document.createElement('span'); lbl.textContent=t.l;
    if(cb.checked) lbl.className='checked';
    cb.addEventListener('change',()=>{ lbl.className=cb.checked?'checked':''; });
    item.appendChild(cb); item.appendChild(lbl);
    item.addEventListener('click',e=>{ if(e.target!==cb){ cb.checked=!cb.checked; cb.dispatchEvent(new Event('change')); } });
    list.appendChild(item);
  });
}
function saveAdminSettings(){
  const p1=document.getElementById('newPw1').value;
  const p2=document.getElementById('newPw2').value;
  if(p1||p2){
    if(p1.length<6){ document.getElementById('pwErr').textContent='비밀번호는 6자 이상이어야 합니다.'; return; }
    if(p1!==p2){ document.getElementById('pwErr').textContent='비밀번호가 일치하지 않습니다.'; return; }
    localStorage.setItem(KEY_PW,p1);
    document.getElementById('pwErr').textContent='';
  }
  const def=document.getElementById('adminDefaultTzSel').value;
  localStorage.setItem(KEY_DEFAULT,def);
  const checked=[...document.querySelectorAll('#adminTzList input[type=checkbox]')].filter(cb=>cb.checked).map(cb=>cb.value);
  if(checked.length===0){ alert('타임존을 하나 이상 선택해주세요.'); return; }
  localStorage.setItem(KEY_ENABLED,JSON.stringify(checked));
  buildTzDropdown();
  const sel=document.getElementById('tzSel');
  if(![...sel.options].some(o=>o.value===sel.value)) sel.value=def;
  localStorage.setItem(KEY_TZ,sel.value);
  const suc=document.getElementById('saveSuccess');
  suc.style.display='flex';
  setTimeout(()=>suc.style.display='none',3000);
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
    const fmt=new Intl.DateTimeFormat('ko-KR',{
      timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',
      weekday:'short',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'
    });
    const map={};
    fmt.formatToParts(now).forEach(p=>{map[p.type]=p.value;});
    return { month:Number(map.month),day:Number(map.day),weekday:map.weekday,
      hour:Number(map.hour),minute:Number(map.minute),second:Number(map.second),ms:now.getMilliseconds() };
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

let cY,cM2;
const HOL={
  '2026-01-01':'신정','2026-01-28':'설날 연휴','2026-01-29':'설날','2026-01-30':'설날 연휴',
  '2026-03-01':'삼일절','2026-03-02':'대체공휴일','2026-05-01':'근로자의날',
  '2026-05-05':'어린이날','2026-05-24':'부처님오신날','2026-06-04':'지방선거',
  '2026-06-06':'현충일','2026-07-17':'제헌절','2026-08-15':'광복절',
  '2026-09-24':'추석 연휴','2026-09-25':'추석','2026-09-26':'추석 연휴',
  '2026-10-03':'개천절','2026-10-09':'한글날','2026-12-25':'크리스마스'
};
const EVS=[
  {s:'2026-04-13',e:'2026-04-16',t:'t',l:'상하이 미팅',w:'안선우·전해연'},
  {s:'2026-04-21',e:'2026-04-22',t:'t',l:'서울 현대차',w:'박철완·준유'},
  {s:'2026-04-23',e:'2026-04-28',t:'t',l:'인도 총판',w:'김상윤·사장'},
  {s:'2026-04-28',e:'2026-05-02',t:'t',l:'샤먼 세미나',w:'박철완·전해연'},
  {s:'2026-03-16',t:'l',l:'연차',w:'김다영'},
  {s:'2026-03-24',t:'l',l:'연차',w:'박준유'},
  {s:'2026-03-24',t:'l',l:'월차',w:'안선우'},
  {s:'2026-03-26',t:'l',l:'연차',w:'최혜선'},
  {s:'2026-03-27',t:'l',l:'연차',w:'김다영'},
  {s:'2026-03-27',t:'l',l:'월차',w:'김상윤'},
  {s:'2026-03-27',t:'l',l:'연차',w:'송나겸'},
  {s:'2026-04-03',t:'l',l:'연차',w:'박준유'},
  {s:'2026-04-06',t:'l',l:'연차',w:'김다영'},
  {s:'2026-04-07',t:'h',l:'오전반차',w:'김다영'},
  {s:'2026-04-09',t:'l',l:'연차',w:'김상윤'},
  {s:'2026-04-10',t:'l',l:'연차',w:'김상윤'},
  {s:'2026-04-10',t:'l',l:'월차',w:'안선우'},
  {s:'2026-04-10',t:'h',l:'오후반차',w:'송나겸'},
  {s:'2026-04-15',t:'l',l:'연차',w:'최혜선'},
  {s:'2026-04-16',t:'h',l:'오후반차',w:'박준유'},
  {s:'2026-04-17',t:'l',l:'연차',w:'김다영'},
  {s:'2026-04-20',t:'l',l:'연차',w:'조수빈'},
  {s:'2026-04-20',t:'l',l:'연차',w:'김상윤'},
  {s:'2026-04-24',t:'l',l:'연차',w:'송나겸'},
  {s:'2026-04-29',t:'l',l:'월차',w:'강승훈'},
  {s:'2026-05-04',t:'l',l:'연차',w:'조수빈'},
  {s:'2026-05-04',t:'l',l:'연차',w:'박철완'},
];
function dk(y,m,d){return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;}
function getSchedule(){const s=localStorage.getItem('fb_schedule');if(!s){const seed=EVS.map((e,i)=>({...e,id:'d'+i}));localStorage.setItem('fb_schedule',JSON.stringify(seed));return seed;}return JSON.parse(s);}
function renderTripNow(){const now=new Date();const today=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');const trips=getSchedule().filter(e=>e.t==='t'&&e.s<=today&&(e.e?e.e>=today:e.s===today));const el=document.getElementById('tripNowList');if(!el)return;if(!trips.length){el.innerHTML='<div class="trip-sub" style="color:var(--text3)">현재 출장 없음</div>';return;}const flag=l=>{if(l.includes('중국')||l.includes('상하이')||l.includes('샤먼'))return'🇨🇳';if(l.includes('인도'))return'🇮🇳';if(l.includes('일본'))return'🇯🇵';if(l.includes('미국'))return'🇺🇸';if(l.includes('싱가포르'))return'🇸🇬';if(l.includes('베트남'))return'🇻🇳';return'✈️';};el.innerHTML=trips.map(e=>'<div class="trip-now">'+flag(e.l)+' '+e.l+'</div><div class="trip-sub">'+e.w+'</div><div class="trip-sub">'+e.s+(e.e?' → '+e.e:'')+'</div>').join('');}
function renderCal(){
  const now=new Date();
  if(cY===undefined){cY=now.getFullYear();cM2=now.getMonth()+1;}
  document.getElementById('cal-title').textContent=`${cY}년 ${cM2}월`;
  const first=new Date(cY,cM2-1,1).getDay();
  const dim=new Date(cY,cM2,0).getDate();
  const prev=new Date(cY,cM2-1,0).getDate();
  const todK=dk(now.getFullYear(),now.getMonth()+1,now.getDate());
  const weeks=Math.ceil((first+dim)/7);
  const sched=getSchedule();
  let html='';
  for(let w=0;w<weeks;w++){
    const wDates=[];
    for(let d=0;d<7;d++){
      const i=w*7+d;
      let day,yr=cY,mo=cM2,numCls='',cellCls='',isDim=false;
      if(i<first){day=prev-first+i+1;yr=cM2===1?cY-1:cY;mo=cM2===1?12:cM2-1;isDim=true;numCls='dim';}
      else if(i>=first+dim){day=i-first-dim+1;yr=cM2===12?cY+1:cY;mo=cM2===12?1:cM2+1;isDim=true;numCls='dim';}
      else{day=i-first+1;if(d===0)numCls='sun';else if(d===6)numCls='sat';}
      const key=dk(yr,mo,day);
      if(key===todK){cellCls='today-cell';numCls='today';}
      wDates.push({key,day,numCls,cellCls,isDim});
    }
    html+='<div class="cal-week">';
    for(const wd of wDates){
      const hol=HOL[wd.key];
      let nC=wd.numCls;if(hol&&!wd.isDim&&!nC.includes('today'))nC+=' hol';
      html+=`<div class="cal-cell ${wd.cellCls}"><div class="cal-num ${nC}">${wd.day}</div>${(hol&&!wd.isDim)?`<div class="ev-hol">${hol}</div>`:''}</div>`;
    }
    html+='</div>';
    const wStart=wDates[0].key,wEnd=wDates[6].key;
    const wEvs=[];
    for(const ev of sched){
      const es=ev.s,ee=ev.e||ev.s;
      if(es>wEnd||ee<wStart)continue;
      let cs=-1,ce=-1;
      for(let i=0;i<7;i++){if(wDates[i].key>=es&&cs===-1)cs=i;}
      for(let i=6;i>=0;i--){if(wDates[i].key<=ee&&ce===-1)ce=i;}
      if(cs<0||ce<0||cs>ce)continue;
      wEvs.push({...ev,cs,ce});
    }
    if(wEvs.length){
      html+='<div class="cal-evrow">';
      for(const ev of wEvs){
        const cls=ev.t==='t'?'ev-bar-t':ev.t==='h'?'ev-bar-h':ev.t==='p'?'ev-bar-p':'ev-bar-l';
        const lbl=ev.t==='p'?ev.l:`${ev.l} ${ev.w}`;
        html+=`<div class="ev-bar ${cls}" style="grid-column:${ev.cs+1}/${ev.ce+2}" title="${lbl}">${lbl}</div>`;
      }
      html+='</div>';
    }
  }
  document.getElementById('cal-body').innerHTML=html;
}
function chMon(d){cM2+=d;if(cM2>12){cM2=1;cY++;}if(cM2<1){cM2=12;cY--;}renderCal();renderTripNow();}
function goToday(){const n=new Date();cY=n.getFullYear();cM2=n.getMonth()+1;renderCal();renderTripNow();}

// ============================================================
// 로그인 체크 및 권한 기반 사이드바 제어
// ============================================================
(function(){
  const fbUser = JSON.parse(sessionStorage.getItem('fb_user') || 'null');
  if (!fbUser) { window.location.href = '../login/index.html'; return; }
  if (fbUser.role === 'admin') { window.location.href = '../admin/main/index.html'; return; }

  // 사용자 이름 표시
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
  const isManager = fbUser.role === 'manager'; // 관리부: 메인 전체 접근

  document.querySelectorAll('.sb-item[data-perm]').forEach(item => {
    const perm = item.dataset.perm;
    const hasAccess = isManager || userPerms.includes(perm) || (perm === '재고관리자' && userPerms.some(p=>['입출고관리','입출고 관리자'].includes(p))) || (perm === '재고조회' && userPerms.includes('재고관리자'));
    const url = permLinks[perm] || (perm==='재고관리자'&&permLinks['입출고관리']) || item.dataset.defaultUrl;
    if (hasAccess) {
      item.style.opacity = '1';
      if (url) {
        item.style.cursor = 'pointer';
        item.onclick = (e) => { e.stopPropagation(); if (url === item.dataset.defaultUrl) window.location.href = url; else window.open(url, '_blank'); };
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
    return `<div class="room-item" onclick="openRoom('${r.id}')"><br>      <div class="room-icon">${r.type === 'group' ? '👥' : '💬'}</div><br>      <div style="min-width:0"><br>        <div class="room-name">${r.name}</div><br>        <div class="room-last">${lt}</div><br>      </div><br>    </div>`;
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
    const me = m.from === uid;
    return `<div class="msg-wrap ${me ? 'msg-me' : 'msg-other'}"><br>      ${!me ? `<div class="msg-sender">${m.name}</div>` : ''}<br>      <div class="msg-bubble ${me ? 'msg-bubble-me' : 'msg-bubble-other'}">${escH(m.text)}</div><br>      <div class="msg-time">${fmtTs(m.ts)}</div><br>    </div>`;
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
  window.location.href = '../login/index.html';
}
renderCal();renderTripNow();

function togglePortalMenu(force){const nav=document.getElementById('portalSidebar'),btn=document.getElementById('portalMenuBtn');const open=typeof force==='boolean'?force:!nav.classList.contains('open');nav.classList.toggle('open',open);btn.setAttribute('aria-expanded',String(open));document.getElementById('portalNavBackdrop').hidden=!open;}
document.addEventListener('keydown',event=>{if(event.key==='Escape')togglePortalMenu(false);});
document.querySelectorAll('.sb-item').forEach(item=>{if(item.style.pointerEvents==='none')return;item.tabIndex=0;item.setAttribute('role','button');item.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();item.click();}});});

window.addEventListener('DOMContentLoaded',()=>{if(location.hash==='#profile')openProfile();});
window.addEventListener('hashchange',()=>{if(location.hash==='#profile')openProfile();});
