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
