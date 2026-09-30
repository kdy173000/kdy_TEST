/* inventory.js */
'use strict';
(()=>{
  const {$,esc,fmt}=UI;let selectedId=FB.data.materials[0].id;
  const selected=()=>FB.data.materials.find(m=>m.id===selectedId);
  $('categoryFilter').innerHTML=UI.options([['','전체 구성품'],...FB.slots.map(s=>[s,s])],'');
  function render(){const m=selected(),q=$('search').value.toLowerCase(),slot=$('categoryFilter').value;
    const list=FB.data.materials.filter(m=>(!slot||m.slot===slot)&&(m.name.toLowerCase().includes(q)||m.id.toLowerCase().includes(q)));
    $('materialCount').textContent=list.length+'개';$('products').innerHTML=list.map(m=>`<button class="product ${m.id===selectedId?'active':''}" data-material="${esc(m.id)}"><strong>${esc(m.name)}</strong><span>${esc(m.slot)} · ${esc(m.id)}${m.archived?' · 중단':''}</span></button>`).join('')||'<p class="empty">검색 결과가 없습니다.</p>';
    $('materialKind').textContent=m.slot;$('productName').textContent=m.name;$('productCode').textContent=m.id+(m.archived?' · 사용 중단':'');$('total').textContent=fmt(UI.quantity(m))+'개';$('available').textContent=fmt(UI.quantity(m,true))+'개';$('versionCount').textContent=m.versions.length+'개';
    $('versions').innerHTML=m.versions.map(v=>`<article class="version"><div class="versiontop"><h4>${esc(v.id)}</h4><span class="badge">${v.state}</span></div><strong>${fmt(v.qty)}<small> 개</small></strong><p>${m.archived||v.state!=='사용'?'사용 중단된 부자재 또는 버전입니다.':'생산·출고에 사용할 수 있습니다.'}</p><button data-out="${esc(v.id)}" ${m.archived||v.state!=='사용'?'disabled':''}>출고</button></article>`).join('');
    const filter=$('filter').value;$('filter').innerHTML=UI.options([['','전체 버전'],...m.versions.map(v=>[v.id,v.id])],filter);$('history').innerHTML=UI.history(FB.data.transactions.filter(t=>t.mid===m.id&&(!$('filter').value||t.vid===$('filter').value)));
    $('recordBtn').disabled=m.archived||!m.versions.some(v=>v.state==='사용');
  }
  function openOut(vid){const m=selected();$('outProduct').textContent=m.name;$('outVersion').innerHTML=UI.options(m.versions.filter(v=>v.state==='사용').map(v=>[v.id,v.id+' · '+fmt(v.qty)+'개']),vid);$('outQty').value='';$('outNote').value='';$('outDate').value=FB.day();$('outPerson').value=FB.user()?.name||'';$('outError').textContent='';$('outDialog').showModal();}
  $('search').oninput=render;$('categoryFilter').onchange=render;$('filter').onchange=render;
  $('products').onclick=e=>{const b=e.target.closest('[data-material]');if(b){selectedId=b.dataset.material;$('filter').value='';render();}};
  $('versions').onclick=e=>{const b=e.target.closest('[data-out]');if(b)openOut(b.dataset.out);};$('recordBtn').onclick=()=>openOut();$('closeOut').onclick=()=>$('outDialog').close();
  $('outForm').onsubmit=e=>{e.preventDefault();try{FB.stockMovement({mid:selectedId,vid:$('outVersion').value,type:'출고',qty:Number($('outQty').value),date:$('outDate').value,person:$('outPerson').value,note:$('outNote').value});$('outDialog').close();UI.toast('출고와 재고를 반영했습니다.');}catch(err){$('outError').textContent=err.message;render();}};
  BOMView.bind(false);
  function history(){
    $('productionHistory').innerHTML=FB.data.productions.slice().reverse().map(r=>`<tr><td>${r.id}</td><td>${esc(r.name)}<br><small>${esc(r.bom)}</small></td><td>${fmt(r.q)}</td><td>${esc(r.date)}</td><td>${esc(r.lot)}</td><td>${esc(r.person)}</td><td>${esc(r.note)||'—'}</td><td>${r.cancelled?'취소됨':`완료 <button data-cancel="${r.id}">생산 취소</button>`}</td></tr>`).join('')||'<tr><td colspan="8" class="empty">생산을 등록하면 내역이 표시됩니다.</td></tr>';
    $('productionTransactions').innerHTML=FB.data.transactions.filter(t=>t.production).slice().reverse().map(t=>`<tr><td>${esc(t.date)}</td><td>${esc(t.type)}</td><td>${esc(t.slot)} · ${esc(t.name)}</td><td>${esc(t.vid)}</td><td class="num">${UI.minus(t.type)?'−':'＋'}${fmt(t.qty)}</td><td>${esc(t.production)}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">생산 시 부자재 사용 내역이 생성됩니다.</td></tr>';
  }
  $('productionBtn').onclick=()=>{BOMView.select(selected().scope||FB.data.products[0].id);$('productionDate').value=FB.day();$('productionPerson').value=FB.user()?.name||'';$('productionError').textContent='';history();$('productionDialog').showModal();};
  for(const id of ['closeProduction','cancelProductionDialog'])$(id).onclick=()=>$('productionDialog').close();
  $('productionForm').onsubmit=e=>{e.preventDefault();try{FB.produce({pid:BOMView.pid,index:BOMView.index,qty:Number($('productionQty').value),date:$('productionDate').value,lot:$('productionLot').value,person:$('productionPerson').value,note:$('productionNote').value});$('productionError').textContent='';UI.toast('생산과 부자재 사용을 등록했습니다.');}catch(err){$('productionError').textContent=err.message;render();BOMView.render();}};
  $('productionHistory').onclick=e=>{const b=e.target.closest('[data-cancel]');if(!b)return;try{FB.cancelProduction(b.dataset.cancel);UI.toast('생산을 취소하고 재고를 복원했습니다.');}catch(err){$('productionError').textContent=err.message;}};
  window.addEventListener('fb-data',()=>{render();history();if($('productionDialog').open)BOMView.render();});render();history();
})();
