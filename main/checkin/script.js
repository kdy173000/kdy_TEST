(function(){
  var raw = sessionStorage.getItem('fb_user');
  if (!raw) { window.location.replace('../../login/index.html'); return; }
  try { JSON.parse(raw); }
  catch(e) { window.location.replace('../../login/index.html'); }
})();

// ══════════════════════════════════════════════════════
// 관리자 설정 연동
// 관리자 페이지에서 아래 키로 localStorage에 저장하면 자동 반영
//   fb_workplaces  : JSON 배열 [{name,addr,lat,lng,radius}]
//   fb_work_start  : 출근 기준 시간 (예: "09:00")
//   fb_work_end    : 퇴근 기준 시간 (예: "18:00")
// ══════════════════════════════════════════════════════
function loadWorkplaces() {
  try {
    const s = localStorage.getItem('fb_workplaces');
    if (s) return JSON.parse(s);
  } catch(e) {}
  // 기본값 (관리자 미설정 시)
  return [
    { name:'파이어볼 본사', addr:'부산 양산시 물금읍', lat:35.2945, lng:128.9741, radius:300 },
    { name:'파이어볼 2사무소', addr:'부산 해운대구 우동', lat:35.1635, lng:129.1653, radius:200 },
  ];
}
function loadWorkStart() { return localStorage.getItem('fb_work_start') || '09:00'; }
function loadWorkEnd()   { return localStorage.getItem('fb_work_end')   || '18:00'; }

// ── State ─────────────────────────────────────────────
let currentUser = null;
let currentLat = null, currentLng = null;
let gpsOk = false, inZone = false, activeZoneName = '';
let calYear, calMonth, selectedDate = null;
let WORKPLACES = [];

// ── Init ──────────────────────────────────────────────
(function init() {
  const raw = sessionStorage.getItem('fb_user');
  if (!raw) return;
  currentUser = JSON.parse(raw);
  document.getElementById('userGreet').textContent =
    `안녕하세요, ${currentUser.name || currentUser.id}님! GPS 위치를 기반으로 출퇴근을 기록합니다.`;
  WORKPLACES = loadWorkplaces();
  const now = new Date();
  calYear = now.getFullYear(); calMonth = now.getMonth();
  startClock();
  renderZones([]);
  renderCalendar();
  updateWorkbar();
  renderButtons();
  getLocation();
})();

// ── Clock ─────────────────────────────────────────────
function startClock() {
  function tick() {
    const n = new Date();
    document.getElementById('clockTime').textContent =
      `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`;
    const days = ['일','월','화','수','목','금','토'];
    document.getElementById('clockDate').textContent =
      `${n.getFullYear()}년 ${n.getMonth()+1}월 ${n.getDate()}일`;
    document.getElementById('clockDay').textContent = `${days[n.getDay()]}요일`;
    updateWorkbarTimer();
  }
  tick(); setInterval(tick, 1000);
}

// ── GPS ───────────────────────────────────────────────
function getLocation() {
  const dot = document.getElementById('gpsDot');
  const lbl = document.getElementById('gpsLabel');
  const crd = document.getElementById('gpsCoords');
  dot.className = 'gps-dot searching';
  lbl.textContent = '위치 확인 중...';
  crd.textContent = 'GPS 신호를 요청하고 있습니다';
  if (!navigator.geolocation) {
    dot.className = 'gps-dot error';
    lbl.textContent = 'GPS 미지원';
    crd.textContent = '이 브라우저는 위치 서비스를 지원하지 않습니다';
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      currentLat = pos.coords.latitude;
      currentLng = pos.coords.longitude;
      dot.className = 'gps-dot ok';
      lbl.textContent = 'GPS 연결됨';
      crd.textContent = `${currentLat.toFixed(5)}, ${currentLng.toFixed(5)}  (정확도 ±${Math.round(pos.coords.accuracy)}m)`;
      gpsOk = true;
      checkZones();
    },
    err => {
      dot.className = 'gps-dot error';
      const msgs = {1:'위치 권한이 거부되었습니다',2:'위치 신호를 받을 수 없습니다',3:'위치 요청 시간이 초과되었습니다'};
      lbl.textContent = '위치 오류';
      crd.textContent = msgs[err.code] || '알 수 없는 오류';
      gpsOk = false; inZone = false; activeZoneName = '';
      renderZones([]); renderButtons();
    },
    {enableHighAccuracy:true, timeout:10000, maximumAge:0}
  );
}

function haversine(lat1,lng1,lat2,lng2) {
  const R=6371000, dLat=(lat2-lat1)*Math.PI/180, dLng=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

function checkZones() {
  WORKPLACES = loadWorkplaces();
  if (!gpsOk) { inZone=false; activeZoneName=''; renderZones([]); renderButtons(); return; }
  const dists = WORKPLACES.map(wp => ({
    ...wp,
    dist: Math.round(haversine(currentLat,currentLng,wp.lat,wp.lng)),
    inside: haversine(currentLat,currentLng,wp.lat,wp.lng) <= wp.radius
  }));
  const active = dists.find(d => d.inside);
  inZone = !!active;
  activeZoneName = active ? active.name : '';
  renderZones(dists);
  renderButtons();
}

function renderZones(dists) {
  const list = document.getElementById('zoneList');
  if (!WORKPLACES.length) {
    list.innerHTML = '<div style="font-size:12px;color:var(--text3);padding:6px 0;">등록된 사업장이 없습니다. 관리자 페이지에서 설정해주세요.</div>';
    return;
  }
  list.innerHTML = WORKPLACES.map((wp,i) => {
    const d = dists[i];
    const inside = d ? d.inside : false;
    const dist = d ? d.dist : null;
    return `<div class="zone-item${inside?' active-zone':''}">
      <div class="zone-left">
        <div class="zone-icon">${inside?'📍':'🏢'}</div>
        <div>
          <div class="zone-name">${wp.name}</div>
          <div class="zone-addr">${wp.addr} · 반경 ${wp.radius}m</div>
        </div>
      </div>
      <div style="text-align:right">
        <div class="zone-badge ${inside?'in':'out'}">${inside?'범위 내':'범위 외'}</div>
        ${dist!==null?`<div class="zone-dist">${dist>=1000?(dist/1000).toFixed(1)+'km':dist+'m'}</div>`:''}
      </div>
    </div>`;
  }).join('');
}

// ── 출퇴근 ────────────────────────────────────────────
function storageKey() { return `fb_att_${currentUser?.id||'anon'}`; }
function loadRecords() { return JSON.parse(localStorage.getItem(storageKey())||'[]'); }
function saveRecords(r) { localStorage.setItem(storageKey(),JSON.stringify(r)); }
function todayStr() {
  const n=new Date();
  return `${n.getFullYear()}-${pad(n.getMonth()+1)}-${pad(n.getDate())}`;
}
function getTodayRecord() { return loadRecords().find(r=>r.date===todayStr())||null; }

function doCheckin() {
  if (!gpsOk) { showToast('warn','📡 GPS 위치 확인이 필요합니다'); return; }
  if (!inZone) { showToast('error','❌ 사업장 범위 내에서만 출근 가능합니다'); return; }
  const today = getTodayRecord();
  if (today?.checkin) { showToast('warn','⚠️ 이미 출근 처리되었습니다'); return; }
  const now = new Date();
  const timeStr = fmtTime(now);
  const records = loadRecords();
  records.push({
    date: todayStr(),
    checkin: now.toISOString(), checkinTime: timeStr, checkinPlace: activeZoneName,
    checkinLat: currentLat, checkinLng: currentLng,
    checkout: null, checkoutTime: null, checkoutPlace: '',
    status: isLate(now) ? 'late' : 'normal'
  });
  saveRecords(records);
  showToast('success', `✅ 출근 완료 · ${timeStr}${isLate(now)?' (지각)':''}`);
  renderButtons(); updateWorkbar(); renderCalendar();
}

function doCheckout() {
  const today = getTodayRecord();
  if (!today?.checkin) { showToast('warn','⚠️ 출근 기록이 없습니다'); return; }
  if (today?.checkout) { showToast('warn','⚠️ 이미 퇴근 처리되었습니다'); return; }
  const now = new Date();
  const timeStr = fmtTime(now);
  const records = loadRecords();
  const idx = records.findIndex(r=>r.date===todayStr());
  records[idx].checkout = now.toISOString();
  records[idx].checkoutTime = timeStr;
  records[idx].checkoutPlace = activeZoneName || records[idx].checkinPlace;
  if (records[idx].status !== 'late') records[idx].status = isEarlyLeave(now) ? 'early' : 'normal';
  saveRecords(records);
  showToast('success', `🏠 퇴근 완료 · ${timeStr} (근무 ${calcDuration(records[idx].checkin, now.toISOString())})`);
  renderButtons(); updateWorkbar(); renderCalendar();
  if (selectedDate === todayStr()) showDetail(todayStr());
}

function isLate(now) {
  const [h,m] = loadWorkStart().split(':').map(Number);
  return now.getHours()>h||(now.getHours()===h&&now.getMinutes()>m);
}
function isEarlyLeave(now) {
  const [h,m] = loadWorkEnd().split(':').map(Number);
  return now.getHours()<h||(now.getHours()===h&&now.getMinutes()<m);
}

// ── 버튼 렌더 ─────────────────────────────────────────
function renderButtons() {
  const today = getTodayRecord();
  const ci = document.getElementById('btnCheckin');
  const co = document.getElementById('btnCheckout');

  if (today?.checkin && !today?.checkout) {
    ci.disabled = true;  co.disabled = false;
    ci.innerHTML = `<div class="btn-icon">✅</div><div class="btn-label">출근</div><div class="btn-time">${today.checkinTime}</div>${today.checkinPlace?`<div class="btn-place">📍 ${today.checkinPlace}</div>`:''}`;
    co.innerHTML = `<div class="btn-icon">🔴</div><div class="btn-label">퇴근</div><div class="btn-sub">퇴근하기</div>`;
  } else if (today?.checkin && today?.checkout) {
    ci.disabled = true;  co.disabled = true;
    ci.innerHTML = `<div class="btn-icon">✅</div><div class="btn-label">출근</div><div class="btn-time">${today.checkinTime}</div>${today.checkinPlace?`<div class="btn-place">📍 ${today.checkinPlace}</div>`:''}`;
    co.innerHTML = `<div class="btn-icon">✅</div><div class="btn-label">퇴근</div><div class="btn-time">${today.checkoutTime}</div>${today.checkoutPlace?`<div class="btn-place">📍 ${today.checkoutPlace}</div>`:''}`;
  } else {
    ci.disabled = !inZone || !gpsOk;  co.disabled = true;
    ci.innerHTML = `<div class="btn-icon">🟢</div><div class="btn-label">출근</div><div class="btn-sub">${!gpsOk?'위치 확인 필요':inZone?'사업장 범위 내':'사업장 범위 외'}</div>`;
    co.innerHTML = `<div class="btn-icon">🔴</div><div class="btn-label">퇴근</div><div class="btn-sub">출근 기록 필요</div>`;
  }
}

// ── 근무 바 ───────────────────────────────────────────
function updateWorkbar() {
  const today = getTodayRecord();
  const bar = document.getElementById('workbar');
  if (!today?.checkin) { bar.classList.remove('visible'); return; }
  bar.classList.add('visible');
  document.getElementById('wbCheckin').textContent = today.checkinTime || '—';
  document.getElementById('wbCheckout').textContent = today.checkoutTime || '—';
  document.getElementById('wbDuration').textContent =
    today.checkout ? calcDuration(today.checkin, today.checkout) : calcDuration(today.checkin, new Date().toISOString());
}
function updateWorkbarTimer() {
  const today = getTodayRecord();
  if (today?.checkin && !today?.checkout)
    document.getElementById('wbDuration').textContent = calcDuration(today.checkin, new Date().toISOString());
}

// ── 달력 ─────────────────────────────────────────────
function changeMonth(dir) {
  calMonth += dir;
  if (calMonth<0){calMonth=11;calYear--;}
  if (calMonth>11){calMonth=0;calYear++;}
  selectedDate = null;
  document.getElementById('detailPanel').classList.remove('visible');
  renderCalendar();
}

function renderCalendar() {
  document.getElementById('calMonth').textContent = `${calYear}년 ${calMonth+1}월`;
  const records = loadRecords();
  const recMap = {};
  records.forEach(r => { recMap[r.date] = r; });

  const today = new Date();
  const todayIso = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  const daysInPrev = new Date(calYear, calMonth, 0).getDate();
  const totalCells = Math.ceil((firstDay+daysInMonth)/7)*7;
  let html = '';

  for (let i=0; i<totalCells; i++) {
    let dayNum, dateStr, isOther=false;
    const dow = i%7;
    if (i < firstDay) {
      dayNum = daysInPrev - firstDay + i + 1;
      const pm = calMonth===0?12:calMonth, py = calMonth===0?calYear-1:calYear;
      dateStr = `${py}-${pad(pm)}-${pad(dayNum)}`; isOther=true;
    } else if (i >= firstDay+daysInMonth) {
      dayNum = i - firstDay - daysInMonth + 1;
      const nm = calMonth===11?1:calMonth+2, ny = calMonth===11?calYear+1:calYear;
      dateStr = `${ny}-${pad(nm)}-${pad(dayNum)}`; isOther=true;
    } else {
      dayNum = i - firstDay + 1;
      dateStr = `${calYear}-${pad(calMonth+1)}-${pad(dayNum)}`;
    }

    const rec = recMap[dateStr];
    const isToday = dateStr===todayIso;
    const isSel = dateStr===selectedDate;
    const dowCls = dow===0?'sun':dow===6?'sat':'';
    const cls = [
      'cal-day',
      isOther?'other-month':'',
      isToday?'today':'',
      isSel?'selected':'',
      dowCls,
      rec?'has-record':''
    ].filter(Boolean).join(' ');

    let dotHtml='', timesHtml='';
    if (rec) {
      dotHtml = `<div class="cal-dot-row">${rec.checkin?'<div class="cal-dot in"></div>':''}${rec.checkout?'<div class="cal-dot out"></div>':''}</div>`;
      timesHtml = `<div class="cal-times">${rec.checkinTime?`<div class="t-in">${rec.checkinTime}</div>`:''}${rec.checkoutTime?`<div class="t-out">${rec.checkoutTime}</div>`:''}</div>`;
    }

    html += `<div class="${cls}"${rec?` onclick="selectDate('${dateStr}')"`:''}>
      <div class="cal-d-num">${dayNum}</div>
      ${dotHtml}${timesHtml}
    </div>`;
  }
  document.getElementById('calDays').innerHTML = html;
}

function selectDate(dateStr) {
  if (selectedDate===dateStr) {
    selectedDate=null;
    document.getElementById('detailPanel').classList.remove('visible');
    renderCalendar(); return;
  }
  selectedDate = dateStr;
  renderCalendar();
  showDetail(dateStr);
}

function showDetail(dateStr) {
  const rec = loadRecords().find(r=>r.date===dateStr);
  const panel = document.getElementById('detailPanel');
  if (!rec) { panel.classList.remove('visible'); return; }

  const [yyyy,mm,dd] = dateStr.split('-');
  const dow = ['일','월','화','수','목','금','토'][new Date(dateStr).getDay()];
  const statusLabel = {normal:'정상',late:'지각',early:'조기퇴근',absent:'결근'};
  const statusClass = {normal:'tag-normal',late:'tag-late',early:'tag-early',absent:'tag-absent'};
  const dur = rec.checkin&&rec.checkout ? calcDuration(rec.checkin,rec.checkout) : rec.checkin ? '근무 중' : '—';

  panel.innerHTML = `
    <div class="detail-date">
      ${yyyy}년 ${mm}월 ${dd}일 (${dow})
      <span class="status-tag ${statusClass[rec.status]||'tag-normal'}">${statusLabel[rec.status]||'—'}</span>
    </div>
    <div class="detail-row">
      <div class="detail-item">
        <div class="di-label">출근 시간</div>
        <div class="di-val green">${rec.checkinTime||'—'}</div>
        ${rec.checkinPlace?`<div class="di-place">📍 ${rec.checkinPlace}</div>`:''}
      </div>
      <div class="detail-item">
        <div class="di-label">퇴근 시간</div>
        <div class="di-val red">${rec.checkoutTime||'—'}</div>
        ${rec.checkoutPlace?`<div class="di-place">📍 ${rec.checkoutPlace}</div>`:''}
      </div>
    </div>
    <div class="detail-dur">
      <div class="dur-label">총 근무시간</div>
      <div class="dur-val">${dur}</div>
    </div>`;
  panel.classList.add('visible');
}

// ── Utilities ─────────────────────────────────────────
function pad(n) { return String(n).padStart(2,'0'); }
function fmtTime(d) { return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function calcDuration(s,e) {
  const ms=new Date(e)-new Date(s);
  if(ms<0) return '—';
  return `${Math.floor(ms/3600000)}시간 ${pad(Math.floor((ms%3600000)/60000))}분`;
}
function showToast(type, msg) {
  const t=document.getElementById('toast');
  t.textContent=msg; t.className=`toast ${type} show`;
  clearTimeout(t._timer); t._timer=setTimeout(()=>t.classList.remove('show'),3200);
}
function toggleTheme() {
  const h=document.documentElement, dark=h.dataset.theme==='dark';
  h.dataset.theme=dark?'light':'dark';
  document.getElementById('t-ico').textContent=dark?'🌙':'☀️';
}
function doLogout() {
  if(!confirm('로그아웃 하시겠습니까?')) return;
  sessionStorage.removeItem('fb_user');
  window.location.href='../../login/index.html';
}
