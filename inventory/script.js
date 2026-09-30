/* inventory.js */
'use strict';
(()=>{
  const {$,esc,fmt}=UI;let selectedId=FB.data.products[0].id;
  const selected=()=>FB.data.products.find(p=>p.id===selectedId);
  $('categoryFilter').innerHTML=UI.options([['','전체 포장 유형'],...FB.families.map((f,i)=>[i,f])],'');
  function render(){const q=$('search').value.toLowerCase(),family=$('categoryFilter').value;
    const list=FB.data.products.filter(p=>(!p.archived||$('inventoryArchived').checked)&&(family===''||p.family===Number(family))&&(p.name.toLowerCase().includes(q)||p.id.toLowerCase().includes(q)));
    if(!list.some(p=>p.id===selectedId))selectedId=list[0]?.id||'';const p=selected();
    $('materialCount').textContent=list.length+'종';$('products').innerHTML=list.map(p=>`<button class="product ${p.id===selectedId?'active':''}" data-material="${esc(p.id)}"><strong>${esc(p.name)}</strong><span>${p.sample?'샘플':'본품'} · ${esc(FB.families[p.family])}${p.archived?' · 단종':''}</span></button>`).join('')||'<p class="empty">검색 결과가 없습니다.</p>';
    $('inventoryContent').hidden=!p;$('inventoryEmpty').hidden=!!p;if(!p)return;
    $('materialKind').textContent=p.sample?'샘플':'본품';$('productName').textContent=p.name;$('productCode').textContent=p.id+(p.archived?' · 단종':'');$('total').textContent=fmt(p.finished)+'개';
    const productions=FB.data.productions.filter(x=>x.pid===p.id),shipments=FB.data.transactions.filter(t=>t.pid===p.id&&t.type==='완제품 출고');
    $('available').textContent=fmt(productions.filter(x=>!x.cancelled).reduce((n,x)=>n+x.q,0))+'개';$('versionCount').textContent=fmt(shipments.reduce((n,x)=>n+x.qty,0))+'개';
    const rows=[...productions.map(x=>({date:x.date,type:x.cancelled?'생산 취소':'생산 완료',vid:x.lot,qty:x.q,person:x.person,note:x.id+' · '+(x.note||'')})),...shipments].sort((a,b)=>a.date.localeCompare(b.date));
    $('history').innerHTML=rows.reverse().map(t=>`<tr><td>${esc(t.date)}</td><td>${esc(t.type)}</td><td>${esc(t.vid)}</td><td class="num">${t.type==='완제품 출고'?'−':t.type==='생산 취소'?'':'＋'}${fmt(t.qty)}</td><td>${esc(t.person)}</td><td>${esc(t.note)}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">생산·출고 기록이 없습니다.</td></tr>';
    $('recordBtn').disabled=!!p.archived;$('productionBtn').disabled=!!p.archived;
  }
  function openOut(){const p=selected();$('outProduct').textContent=p.name+' · 현재 재고 '+fmt(p.finished)+'개';$('outQty').value='';$('outNote').value='';$('outDate').value=FB.day();$('outPerson').value=FB.user()?.name||'';$('outError').textContent='';$('outDialog').showModal();}
  $('inventoryArchived').onchange=render;$('search').oninput=render;$('categoryFilter').onchange=render;
  $('products').onclick=e=>{const b=e.target.closest('[data-material]');if(b){selectedId=b.dataset.material;render();}};
  $('recordBtn').onclick=openOut;$('closeOut').onclick=()=>$('outDialog').close();
  $('outForm').onsubmit=e=>{e.preventDefault();try{FB.shipProduct({pid:selectedId,qty:Number($('outQty').value),date:$('outDate').value,person:$('outPerson').value,note:$('outNote').value});$('outDialog').close();UI.toast('완제품 출고와 재고를 반영했습니다.');}catch(err){$('outError').textContent=err.message;render();}};
  BOMView.bind(false);
  function history(){
    $('productionHistory').innerHTML=FB.data.productions.slice().reverse().map(r=>`<tr><td>${r.id}</td><td>${esc(r.name)}<br><small>${esc(r.bom)}</small></td><td>${fmt(r.q)}</td><td>${esc(r.date)}</td><td>${esc(r.lot)}</td><td>${esc(r.person)}</td><td>${esc(r.note)||'—'}</td><td>${r.cancelled?'취소됨':`완료 <button data-cancel="${r.id}">생산 취소</button>`}</td></tr>`).join('')||'<tr><td colspan="8" class="empty">생산을 등록하면 내역이 표시됩니다.</td></tr>';
    $('productionTransactions').innerHTML=FB.data.transactions.filter(t=>t.production).slice().reverse().map(t=>`<tr><td>${esc(t.date)}</td><td>${esc(t.type)}</td><td>${esc(t.slot)} · ${esc(t.name)}</td><td>${esc(t.vid)}</td><td class="num">${UI.minus(t.type)?'−':'＋'}${fmt(t.qty)}</td><td>${esc(t.production)}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">생산 시 부자재 사용 내역이 생성됩니다.</td></tr>';
  }
  $('productionBtn').onclick=()=>{BOMView.select(selected()?.id||FB.data.products[0].id);$('productionDate').value=FB.day();$('productionPerson').value=FB.user()?.name||'';$('productionError').textContent='';history();$('productionDialog').showModal();};
  for(const id of ['closeProduction','cancelProductionDialog'])$(id).onclick=()=>$('productionDialog').close();
  $('productionForm').onsubmit=e=>{e.preventDefault();try{FB.produce({pid:BOMView.pid,index:BOMView.index,qty:Number($('productionQty').value),date:$('productionDate').value,lot:$('productionLot').value,person:$('productionPerson').value,note:$('productionNote').value});$('productionError').textContent='';UI.toast('생산과 부자재 사용을 등록했습니다.');}catch(err){$('productionError').textContent=err.message;render();BOMView.render();}};
  $('productionHistory').onclick=e=>{const b=e.target.closest('[data-cancel]');if(!b)return;try{FB.cancelProduction(b.dataset.cancel);UI.toast('생산을 취소하고 재고를 복원했습니다.');}catch(err){$('productionError').textContent=err.message;}};
  window.addEventListener('fb-data',()=>{render();history();if($('productionDialog').open)BOMView.render();});render();history();
})();

