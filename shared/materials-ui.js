'use strict';
window.UI={
  $:id=>document.getElementById(id),
  esc:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
  fmt:n=>n.toLocaleString('ko-KR'),
  options(items,value){return items.map(([v,t])=>`<option value="${this.esc(v)}" ${String(v)===String(value)?'selected':''}>${this.esc(t)}</option>`).join('');},
  toast(message){const el=this.$('toast');el.textContent=message;el.classList.add('show');clearTimeout(this.timer);this.timer=setTimeout(()=>el.classList.remove('show'),3000);},
  minus:type=>['출고','생산 사용','재고 조정'].includes(type),
  history(rows){return rows.slice().reverse().map(t=>`<tr><td>${this.esc(t.date)}</td><td>${this.esc(t.type)}</td><td>${this.esc(t.vid)}</td><td class="num">${this.minus(t.type)?'−':'＋'}${this.fmt(t.qty)}</td><td>${this.esc(t.person)}</td><td>${this.esc(t.note)}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">등록된 내역이 없습니다.</td></tr>';},
  quantity(m,available=false){return available&&m.archived?0:m.versions.filter(v=>!available||v.state==='사용').reduce((n,v)=>n+v.qty,0);},
  remaining(o){return o.closed?0:Math.max(0,o.qty-o.received);}
};
document.querySelectorAll('[data-admin-link]').forEach(a=>a.hidden=!FB.canAdmin());

UI.bindVersionAddition=function(selected){
  const {$}=UI;let target='';
  $('addMaterialVersion').onclick=()=>{if(!FB.canAdmin()){UI.toast('재고관리자 권한으로 버전을 추가할 수 있습니다.');return;}const m=selected();if(!m||m.archived){UI.toast('사용 중인 부자재를 선택하세요.');return;}target=m.id;$('versionMaterial').textContent=m.name;$('versionName').value='';$('addVersionError').textContent='';$('versionDialog').showModal();};
  $('closeVersion').onclick=()=>$('versionDialog').close();
  $('addVersionForm').onsubmit=e=>{e.preventDefault();try{FB.addVersion(target,$('versionName').value);$('versionDialog').close();UI.toast('새 버전을 추가했습니다. 초기 재고는 0개입니다.');}catch(err){$('addVersionError').textContent=err.message;}};
};

// Shared permission and closing behavior across material workflows.
UI.allowWrite=function(){if(FB.canAdmin())return true;UI.toast('조회 모드입니다. 계정 관리에서 재고관리자 권한을 부여받으세요.');return false;};
UI.applyAccess=function(){const writable=FB.canAdmin();const note=this.$('accessNote');if(note)note.textContent=writable?'재고관리자 · 등록과 수정이 가능합니다.':'조회 모드 · 등록과 수정은 재고관리자 권한이 필요합니다.';
 document.querySelectorAll('[data-write-action]').forEach(button=>{button.disabled=!writable;button.title=writable?'':'재고관리자 권한이 필요합니다.';});};
document.querySelectorAll('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>document.getElementById(button.dataset.closeDialog).close()));
document.querySelectorAll('.materials-nav a').forEach(a=>{if(new URL(a.href).pathname===location.pathname){a.setAttribute('aria-current','page');}});

UI.versionActions=function(kind,id,vid){return FB.canAdmin()?`<div class="action-group"><button type="button" data-version-edit="${this.esc(vid)}" data-entity="${this.esc(id)}">버전명 수정</button><button type="button" data-version-delete="${this.esc(vid)}" data-entity="${this.esc(id)}">삭제</button></div>`:'';};
UI.bindVersionManagement=function(container,kind){this.$(container).addEventListener('click',e=>{const b=e.target.closest('[data-version-edit],[data-version-delete]');if(!b||!this.allowWrite())return;const remove=b.dataset.versionDelete!==undefined,vid=remove?b.dataset.versionDelete:b.dataset.versionEdit;let name;if(remove){if(!confirm(vid+' 버전을 목록에서 삭제할까요? 재고가 0개일 때만 가능하며 과거 기록은 보존됩니다.'))return;}else{name=prompt('새 버전명을 입력하세요.',vid);if(name===null)return;}try{FB.manageVersion({kind,id:b.dataset.entity,vid,remove,name});this.toast(remove?'버전을 목록에서 삭제했습니다.':'버전명과 연결 정보를 수정했습니다.');}catch(err){this.toast(err.message);}});};
