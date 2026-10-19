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
UI.allowWrite=function(){if(FB.canAdmin())return true;UI.toast('조회 모드입니다. 계정 관리에서 재고관리팀 권한을 부여받으세요.');return false;};
UI.applyAccess=function(){const writable=FB.canAdmin(),shipping=FB.canShip(),photo=FB.canPhoto();const note=this.$('accessNote');
 if(note)note.textContent=writable?'재고관리팀 · 발주·재고·BOM 관리가 가능합니다.':shipping?(photo?'출고·사진 편집 권한 · 재고와 BOM은 조회만 가능합니다.':'출고 권한 · 출고 등록과 재고 조회가 가능합니다.'):photo?'디자인팀 · 사진만 편집할 수 있으며 재고와 BOM은 조회만 가능합니다.':'조회 모드 · 부여받은 권한에 따라 관리 기능을 사용할 수 있습니다.';
 document.querySelectorAll('[data-write-action]').forEach(button=>{button.disabled=!writable;button.title=writable?'':'재고관리팀 권한이 필요합니다.';});
 document.querySelectorAll('[data-shipping-action]').forEach(button=>{button.disabled=!shipping;button.title=shipping?'':'출고 또는 재고관리팀 권한이 필요합니다.';});};
document.querySelectorAll('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>document.getElementById(button.dataset.closeDialog).close()));
document.querySelectorAll('.materials-nav a').forEach(a=>{if(new URL(a.href).pathname===location.pathname){a.setAttribute('aria-current','page');}});

UI.versionActions=function(kind,id,vid){return FB.canAdmin()?`<div class="action-group"><button type="button" data-version-edit="${this.esc(vid)}" data-entity="${this.esc(id)}">수정</button><button type="button" data-version-delete="${this.esc(vid)}" data-entity="${this.esc(id)}">삭제</button></div>`:'';};
UI.bindVersionManagement=function(container,kind){
 const dialog=document.createElement('dialog');dialog.className='out-dialog';dialog.setAttribute('aria-label','버전 수정');
 dialog.innerHTML='<div class="modalhead"><h2>버전 수정</h2><button type="button" data-dismiss aria-label="버전 수정 닫기">✕</button></div><form><label class="field"><span>버전명</span><input name="versionName" maxlength="20" required></label><label class="field"><span>사용 상태</span><select name="versionState"><option value="사용">사용</option><option value="중단">미사용</option></select></label><p class="page-note">미사용 버전은 재고와 과거 기록을 보존하며, 새 생산·출고·발주 대상에서 제외됩니다.</p><p data-error role="alert"></p><div class="modalfoot"><button type="button" data-dismiss>취소</button><button type="submit" class="primary">저장</button></div></form>';
 document.body.append(dialog);
 const form=dialog.querySelector('form'),error=dialog.querySelector('[data-error]');let target=null;
 dialog.querySelectorAll('[data-dismiss]').forEach(button=>button.onclick=()=>dialog.close());
 form.onsubmit=e=>{e.preventDefault();if(!this.allowWrite()){dialog.close();return;}try{
   FB.manageVersion({...target,name:form.elements.versionName.value,state:form.elements.versionState.value});
   dialog.close();this.toast('버전명과 사용 상태를 수정했습니다.');
 }catch(err){error.textContent=err.message;}};
 this.$(container).addEventListener('click',e=>{
   const b=e.target.closest('[data-version-edit],[data-version-delete]');if(!b||!this.allowWrite())return;
   const remove=b.dataset.versionDelete!==undefined,vid=remove?b.dataset.versionDelete:b.dataset.versionEdit,id=b.dataset.entity;
   if(remove){if(!confirm(vid+' 버전을 목록에서 삭제할까요? 재고가 0개일 때만 가능하며 과거 기록은 보존됩니다.'))return;try{FB.manageVersion({kind,id,vid,remove:true});this.toast('버전을 목록에서 삭제했습니다.');}catch(err){this.toast(err.message);}return;}
   const entity=(kind==='product'?FB.data.products:FB.data.materials).find(x=>x.id===id),version=entity?.versions.find(v=>v.id===vid&&!v.deleted);
   if(!version){this.toast('버전을 찾을 수 없습니다.');return;}
   target={kind,id,vid};form.elements.versionName.value=vid;form.elements.versionState.value=version.state==='사용'?'사용':'중단';error.textContent='';dialog.showModal();
 });
};

UI.allowShipping=function(){if(FB.canShip())return true;UI.toast('출고 또는 재고관리팀 권한이 필요합니다.');return false;};
