const me = JSON.parse(sessionStorage.getItem('fb_user') || 'null');
if (!me || me.role !== 'admin') { window.location.href = '../../login/index.html'; }

function toggleTheme() {
  const h = document.documentElement, dark = h.dataset.theme === 'dark';
  h.dataset.theme = dark ? 'light' : 'dark';
  document.getElementById('t-ico').textContent = dark ? '🌙' : '☀️';
}
function doLogout() { sessionStorage.removeItem('fb_user'); window.location.href = '../../login/index.html'; }

const KEY = 'fb_emp_data';
const DEFAULT_DATA = {
  sections: [
    {
      id: 'office', name: '사무실',
      teams: [
        { id: 't_mgmt',   name: '관리팀',    employees: [] },
        { id: 't_intl',   name: '해외소통팀', employees: [] },
        { id: 't_design', name: '디자인팀',   employees: [] },
        { id: 't_pr',     name: '국내홍보팀', employees: [] },
        { id: 't_rd',     name: '연구팀',     employees: [] },
      ]
    },
    {
      id: 'field', name: '현장',
      teams: [
        { id: 't_mfg', name: '제조팀', employees: [] },
        { id: 't_sub', name: '소분팀', employees: [] },
        { id: 't_pkg', name: '포장팀', employees: [] },
      ]
    }
  ]
};

function getData() {
  const s = localStorage.getItem(KEY);
  return s ? JSON.parse(s) : JSON.parse(JSON.stringify(DEFAULT_DATA));
}
function saveData(d) { localStorage.setItem(KEY, JSON.stringify(d)); }
function uid() { return 'e_' + Date.now() + '_' + Math.random().toString(36).slice(2,6); }

function findTeam(data, teamId) {
  for (const sec of data.sections)
    for (const t of sec.teams)
      if (t.id === teamId) return t;
  return null;
}

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function render() {
  const data = getData();
  const root = document.getElementById('orgRoot');
  let html = '';
  data.sections.forEach((sec, si) => {
    if (si > 0) html += '<hr class="section-divider">';
    const empCount = sec.teams.reduce((n, t) => n + t.employees.length, 0);
    html += `
    <div class="section-wrap">
      <div class="section-header">
        <span class="section-badge ${sec.id}">${esc(sec.name)}</span>
        <span class="section-count">팀 ${sec.teams.length}개 · 직원 ${empCount}명</span>
      </div>
      <div class="teams-grid" id="grid_${sec.id}" data-section-id="${sec.id}">
        ${sec.teams.map(t => renderTeam(t, sec.id)).join('')}
      </div>
    </div>`;
  });
  root.innerHTML = html;
  attachDragEvents();
}

function renderTeam(team, secId) {
  const empRows = team.employees.length > 0
    ? team.employees.map(e => renderEmp(e, team.id)).join('')
    : '<div class="emp-empty">직원이 없습니다. ＋ 버튼으로 추가하거나 드롭하세요</div>';
  return `
  <div class="team-card" id="team_${team.id}" data-team-id="${team.id}" data-section-id="${secId}" draggable="true">
    <div class="team-header">
      <div class="team-header-left">
        <span class="team-drag-icon">⠿</span>
        <span class="team-name">${esc(team.name)}</span>
        <span class="team-count">(${team.employees.length}명)</span>
      </div>
      <button class="team-add-btn" onclick="openAddEmp('${team.id}')" title="직원 추가">＋</button>
    </div>
    <div class="emp-list" id="emplist_${team.id}" data-team-id="${team.id}">
      ${empRows}
    </div>
  </div>`;
}

function renderEmp(emp, teamId) {
  const rank = emp.rank ? ` [${esc(emp.rank)}]` : '';
  const phone = emp.phone ? `<div class="emp-phone">📱 ${esc(emp.phone)}</div>` : '';
  return `
  <div class="emp-card" id="emp_${emp.id}" data-emp-id="${emp.id}" data-team-id="${teamId}" draggable="true">
    <span class="emp-drag">⠿</span>
    <div class="emp-info">
      <div class="emp-name-line">${esc(emp.name)}${rank}</div>
      ${phone}
    </div>
    <div class="emp-actions">
      <button class="emp-act-btn" onclick="openEditEmp('${emp.id}','${teamId}')">✏️</button>
      <button class="emp-act-btn del" onclick="deleteEmp('${emp.id}','${teamId}')">✕</button>
    </div>
  </div>`;
}

let dragEmpId=null, dragEmpFromTeam=null;
let dragTeamId=null, dragTeamFromSection=null;
let dragType=null;

function attachDragEvents() {
  document.querySelectorAll('.emp-card').forEach(el => {
    el.addEventListener('dragstart', e => {
      dragType='emp'; dragEmpId=el.dataset.empId; dragEmpFromTeam=el.dataset.teamId;
      setTimeout(()=>el.classList.add('dragging'),0);
      e.dataTransfer.effectAllowed='move'; e.stopPropagation();
    });
    el.addEventListener('dragend', () => {
      el.classList.remove('dragging');
      document.querySelectorAll('.emp-list').forEach(l=>l.classList.remove('drag-over'));
      dragType=null;
    });
  });

  document.querySelectorAll('.emp-list').forEach(zone => {
    zone.addEventListener('dragover', e => {
      if (dragType!=='emp') return;
      e.preventDefault(); e.stopPropagation();
      e.dataTransfer.dropEffect='move';
      zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', e => {
      if (!zone.contains(e.relatedTarget)) zone.classList.remove('drag-over');
    });
    zone.addEventListener('drop', e => {
      e.preventDefault(); e.stopPropagation();
      zone.classList.remove('drag-over');
      if (dragType!=='emp'||!dragEmpId) return;
      const toTeam=zone.dataset.teamId;
      if (toTeam===dragEmpFromTeam) return;
      const data=getData();
      const fromT=findTeam(data,dragEmpFromTeam);
      const toT=findTeam(data,toTeam);
      if(!fromT||!toT) return;
      const idx=fromT.employees.findIndex(e=>e.id===dragEmpId);
      if(idx<0) return;
      const [emp]=fromT.employees.splice(idx,1);
      toT.employees.push(emp);
      saveData(data); render();
    });
  });

  document.querySelectorAll('.team-card').forEach(el => {
    el.addEventListener('dragstart', e => {
      if (dragType==='emp') return;
      dragType='team'; dragTeamId=el.dataset.teamId; dragTeamFromSection=el.dataset.sectionId;
      setTimeout(()=>el.classList.add('dragging-team'),0);
      e.dataTransfer.effectAllowed='move';
    });
    el.addEventListener('dragend', () => {
      el.classList.remove('dragging-team');
      document.querySelectorAll('.team-card').forEach(t=>t.classList.remove('drag-over-team'));
      dragType=null;
    });
    el.addEventListener('dragover', e => {
      if (dragType!=='team'||el.dataset.teamId===dragTeamId) return;
      e.preventDefault(); e.stopPropagation();
      document.querySelectorAll('.team-card').forEach(t=>t.classList.remove('drag-over-team'));
      el.classList.add('drag-over-team');
    });
    el.addEventListener('drop', e => {
      e.preventDefault(); e.stopPropagation();
      document.querySelectorAll('.team-card').forEach(t=>t.classList.remove('drag-over-team'));
      if (dragType!=='team'||!dragTeamId||el.dataset.teamId===dragTeamId) return;
      const toTeamId=el.dataset.teamId, toSecId=el.dataset.sectionId;
      const data=getData();
      const fromSec=data.sections.find(s=>s.id===dragTeamFromSection);
      const toSec=data.sections.find(s=>s.id===toSecId);
      if(!fromSec||!toSec) return;
      const fromIdx=fromSec.teams.findIndex(t=>t.id===dragTeamId);
      if(fromIdx<0) return;
      const [movedTeam]=fromSec.teams.splice(fromIdx,1);
      const toIdx=toSec.teams.findIndex(t=>t.id===toTeamId);
      toSec.teams.splice(toIdx,0,movedTeam);
      saveData(data); render();
    });
  });
}

let _editEmpId=null, _editEmpTeam=null;

function buildTeamOptions(selectedTeamId) {
  const data=getData();
  const sel=document.getElementById('empTeamSel');
  sel.innerHTML='';
  data.sections.forEach(sec=>{
    const og=document.createElement('optgroup'); og.label=sec.name;
    sec.teams.forEach(t=>{
      const opt=document.createElement('option');
      opt.value=t.id; opt.textContent=t.name;
      if(t.id===selectedTeamId) opt.selected=true;
      og.appendChild(opt);
    });
    sel.appendChild(og);
  });
}

function openAddEmp(teamId) {
  _editEmpId=null; _editEmpTeam=null;
  document.getElementById('empModalTitle').textContent='직원 추가';
  document.getElementById('empName').value='';
  document.getElementById('empRank').value='';
  document.getElementById('empPhone').value='';
  buildTeamOptions(teamId);
  document.getElementById('empModal').style.display='flex';
  setTimeout(()=>document.getElementById('empName').focus(),100);
}

function openEditEmp(empId, teamId) {
  _editEmpId=empId; _editEmpTeam=teamId;
  const data=getData();
  const team=findTeam(data,teamId);
  const emp=team?.employees.find(e=>e.id===empId);
  if(!emp) return;
  document.getElementById('empModalTitle').textContent='직원 수정';
  document.getElementById('empName').value=emp.name||'';
  document.getElementById('empRank').value=emp.rank||'';
  document.getElementById('empPhone').value=emp.phone||'';
  buildTeamOptions(teamId);
  document.getElementById('empModal').style.display='flex';
}

function closeEmpModal() { document.getElementById('empModal').style.display='none'; }

function saveEmp() {
  const name=document.getElementById('empName').value.trim();
  const rank=document.getElementById('empRank').value.trim();
  const phone=document.getElementById('empPhone').value.trim();
  const teamId=document.getElementById('empTeamSel').value;
  if(!name){alert('이름을 입력해주세요.');return;}
  const data=getData();
  if(_editEmpId){
    const oldTeam=findTeam(data,_editEmpTeam);
    const idx=oldTeam?.employees.findIndex(e=>e.id===_editEmpId);
    if(idx==null||idx<0) return;
    const emp=oldTeam.employees[idx];
    emp.name=name; emp.rank=rank; emp.phone=phone;
    if(teamId!==_editEmpTeam){
      oldTeam.employees.splice(idx,1);
      const newTeam=findTeam(data,teamId);
      if(newTeam) newTeam.employees.push(emp);
    }
  } else {
    const team=findTeam(data,teamId);
    if(!team) return;
    team.employees.push({id:uid(),name,rank,phone});
  }
  saveData(data); closeEmpModal(); render();
}

function deleteEmp(empId, teamId) {
  if(!confirm('해당 직원을 삭제하시겠습니까?')) return;
  const data=getData();
  const team=findTeam(data,teamId);
  if(!team) return;
  const idx=team.employees.findIndex(e=>e.id===empId);
  if(idx>=0) team.employees.splice(idx,1);
  saveData(data); render();
}

render();
