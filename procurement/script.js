/* procurement.js */
'use strict';
(()=>{
  const {$,esc,fmt}=UI;let category='',target='',selected=new URLSearchParams(location.search).get('material')||'cap';
  const material=id=>FB.data.materials.find(m=>m.id===id);
  function receiptMemo(t,order){
    if(!order)return t.note||'';
    const receipt=order.receipts?.[t.receiptIndex]||(order.receipts||[]).find(r=>!r.deleted&&r.date===t.date&&r.person===t.person&&r.good===t.qty&&r.delivered===(t.delivered??t.qty+(t.defective||0))&&r.defective===(t.defective||0));
    if(typeof receipt?.note==='string')return receipt.note;
    const note=String(t.note||''),prefix=order.id+' · ';
    if(!note.startsWith(prefix))return note;
    const summary=note.slice(prefix.length).match(/^전체 \d+개 \/ 정상 \d+개 \/ 불량 \d+개(?: · ([\s\S]*))?$/);
    return summary?(summary[1]||''):note;
  }
  function transactionSupplier(t){const order=t.order?FB.data.orders.find(o=>o.id===t.order):null;return t.supplier||order?.supplier||FB.data.suppliers.find(s=>s.id===(t.supplierId||order?.supplierId))?.name||'';}
  function filtered(){const q=$('purchaseSearch').value.toLowerCase();return FB.data.materials.filter(m=>!m.deleted&&(!m.archived||$('purchaseArchived').checked)&&(!category||(category==='라벨'?['전면 라벨','후면 라벨'].includes(m.slot):m.slot===category))&&(m.name.toLowerCase().includes(q)||m.id.toLowerCase().includes(q)));}
  function render(){
    const items=filtered();
    if(!items.some(m=>m.id===selected))selected=items[0]?.id||'';
    $('stockCount').textContent=items.length+'종';
    $('purchaseMaterials').innerHTML=items.map(m=>`<div class="product-list-row"><button class="product ${m.id===selected?'active':''}" aria-pressed="${m.id===selected}" data-select="${esc(m.id)}">${Photos.markup('material',m.id,m.name,'list')}<strong>${esc(m.name)}</strong><span>${esc(['전면 라벨','후면 라벨'].includes(m.slot)?'라벨':m.slot)} · ${esc(m.id)}${m.archived?' · 단종':''}</span></button><div class="catalog-list-actions"><button type="button" class="product-info-edit management-button" data-edit-material="${esc(m.id)}" aria-label="${esc(m.name)} 정보 수정" ${FB.canAdmin()?'':'disabled title="발주팀 권한이 필요합니다."'}>정보 수정</button><button type="button" class="product-info-delete" data-delete-material="${esc(m.id)}" aria-label="${esc(m.name)} 삭제" ${FB.canAdmin()?'':'disabled title="발주팀 권한이 필요합니다."'}>삭제</button></div></div>`).join('')||'<p class="empty">검색 결과가 없습니다.</p>';
    $('stockContent').hidden=!selected;$('stockEmpty').hidden=!!selected;
    if(selected)detail(selected);
    const orders=FB.data.orders.filter(o=>o.mid===selected&&FB.orderIsPending(o));
    $('pendingOrderCount').textContent=orders.length+'건';
    $('purchaseOrders').innerHTML=orders.slice().reverse().map(o=>`<article class="order-card"><div class="order-card-main"><div class="order-card-heading"><strong>${esc(o.supplier)}</strong><span class="badge">${o.manualPending===true||o.received?'입고중':'입고 전'}</span></div><p class="order-meta">${esc(o.id)} · 발주 버전 <strong>${esc(o.vid)}</strong></p><p class="order-dates">발주 ${esc(o.date)} · 입고 예정 <strong>${esc(o.due)||'미정'}</strong></p>${o.note?`<p class="order-note">${esc(o.note)}</p>`:''}</div><div class="order-quantities"><div><span>정상 입고</span><strong>${fmt(o.received)}<small>개</small></strong></div><div><span>발주 수량</span><strong>${fmt(o.qty)}<small>개</small></strong></div><div><span>불량</span><strong>${fmt(o.defective??0)}<small>개</small></strong></div></div></article>`).join('')||'<p class="empty">입고 대기 중인 발주가 없습니다.<br>발주 등록과 입고 처리는 발주 관리에서 진행하세요.</p>';
    UI.applyAccess();if(selected){const m=material(selected),blocked=!FB.canAdmin()||!!m.archived;$('addMaterialVersion').disabled=blocked;}



  }
  const field=(label,html)=>`<label class="field"><span>${label}</span>${html}</label>`;
  function openAdjustment(id,vid){if(!UI.allowWrite())return;target=id;const m=material(id);if(!m||m.archived)return;const v=m.versions.find(v=>v.id===vid&&!v.deleted&&v.state==='사용');if(!v){UI.toast('사용 가능한 버전이 없습니다. 버전 수정에서 공용 사용·국내 전용·해외 전용 중 하나를 선택하세요.');return;}
    $('purchaseHint').textContent='선택한 버전의 재고에서 입력한 수량을 차감합니다. 사유를 함께 기록하세요.';$('purchaseDialog').classList.add('task-dialog');$('purchaseTitle').textContent='수기 재고 차감';$('purchaseTarget').textContent=m.name+' · '+vid;
    let fields='';
    fields+=field('차감 버전',`<input name="vid" value="${esc(vid)}" readonly aria-readonly="true">`);
    fields+=field('차감 수량',`<input name="qty" type="number" min="1" step="1" required>`);
    fields+=field('차감 날짜',`<input name="date" type="date" value="${FB.day()}" required>`);
    fields+=field('담당자',`<input name="person" maxlength="30" value="${esc(FB.user()?.name||'')}" required>`);
    fields+=field('차감 사유','<select name="reason"><option>불량</option><option>파손</option><option>분실</option><option>샘플 사용</option><option>실사 차이</option><option>기타</option></select>');
    fields+=field('상세 사유',`<textarea name="note" maxlength="200" required></textarea>`);
    $('purchaseSave').textContent='차감 등록';
    $('purchaseFields').innerHTML=fields;$('purchaseFields').lastElementChild.classList.add('wide');$('purchaseError').textContent='';$('purchaseDialog').showModal();
  }
  function detail(id){const m=material(id);
    const pending=()=>FB.data.orders.filter(o=>o.mid===id&&FB.orderIsPending(o)).length;
    $('materialPhoto').innerHTML=Photos.markup('material',m.id,m.name,'summary');Photos.refresh();
    $('stockTitle').textContent=m.name;$('stockKind').textContent=m.slot;$('stockCode').textContent=m.id+(m.archived?' · 단종':'');
    $('stockTotal').textContent=fmt(UI.quantity(m))+'개';$('stockAvailable').textContent=fmt(UI.quantity(m,true))+'개';$('stockPending').textContent=fmt(pending())+'건';
    $('stockMemo').textContent=m.memo||'발주 입고와 생산 사용 내역이 같은 재고에 반영됩니다.';
    $('stockVersions').innerHTML=UI.versionCards('material',m,{hideStopped:$('hideStoppedVersions').checked});
    $('stockHistory').innerHTML=FB.data.transactions.map((t,index)=>({t,index})).filter(r=>{const t=r.t,type=$('historyType').value,q=$('historySearch').value.trim().toLowerCase();return t.mid===id&&(!type||(type==='입고'?['입고','불량 입고'].includes(t.type):type==='생산'?!!t.production:UI.minus(t.type)&&!t.production))&&[t.vid,t.person,t.note,t.date,transactionSupplier(t)].join(' ').toLowerCase().includes(q);}).reverse().map(({t,index})=>{
const editable=!t.production&&!t.pid&&['입고','불량 입고','출고','재고 조정'].includes(t.type);
return `<tr><td>${esc(t.date)}</td><td>${esc(t.type)}</td><td>${esc(transactionSupplier(t))||'—'}</td><td>${esc(t.vid)}</td><td class="num">${UI.minus(t.type)?'−':'＋'}${fmt(t.qty)}</td><td>${esc(t.person)}</td><td>${esc(t.note)}</td><td>${editable?`<div class="history-actions"><button data-edit-transaction="${index}" ${FB.canAdmin()?'':'disabled title="발주팀 권한이 필요합니다."'}>수정</button><button class="delete-button" data-delete-transaction="${index}" ${FB.canAdmin()?'':'disabled title="발주팀 권한이 필요합니다."'}>삭제</button></div>`:`<small>${t.production?'생산 내역에서 관리':'조회 전용'}</small>`}</td></tr>`;
}).join('')||'<tr><td colspan="8" class="empty">조건에 맞는 내역이 없습니다.</td></tr>';}
  $('purchaseCategory').innerHTML=UI.options([['','전체 구성품'],...['캡','용기','스웨이드','어플리케이터','라벨','속지','케이스'].map(s=>[s,s])],'');
  $('purchaseCategory').onchange=()=>{category=$('purchaseCategory').value;render();};$('purchaseSearch').oninput=render;$('purchaseArchived').onchange=render;
  $('purchaseMaterials').onclick=e=>{const remove=e.target.closest('[data-delete-material]');if(remove){if(!remove.disabled)CatalogEditor.remove(remove.dataset.deleteMaterial);return;}const edit=e.target.closest('[data-edit-material]');if(edit){if(!UI.allowWrite())return;selected=edit.dataset.editMaterial;render();CatalogEditor.open(selected);return;}const b=e.target.closest('[data-select]');if(b){selected=b.dataset.select;render();}};
  $('stockVersions').addEventListener('click',e=>{const b=e.target.closest('[data-material-workflow]');if(!b||b.disabled||!UI.allowWrite())return;const m=material(selected),v=m?.versions.find(v=>v.id===b.dataset.vid&&!v.deleted);if(!m||m.archived||!v||FB.versionStatus(v)==='중단')return;if(b.dataset.materialWorkflow==='order')location.href='../orders/index.html?material='+encodeURIComponent(m.id)+'&version='+encodeURIComponent(v.id);else if(b.dataset.materialWorkflow==='adjust')openAdjustment(m.id,v.id);});

  $('closePurchase').onclick=()=>$('purchaseDialog').close();
  $('purchaseForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),input=Object.fromEntries(f.entries());input.qty=Number(input.qty);try{FB.stockMovement({...input,mid:target,type:'재고 조정',note:input.reason+' · '+input.note});$('purchaseDialog').close();UI.toast('차감 사유와 재고를 기록했습니다.');}catch(err){$('purchaseError').textContent=err.message;render();}};

  let transactionIndex=-1,transactionRevision=-1;
  function previewTransactionReceipt(){
    const t=FB.data.transactions[transactionIndex],o=FB.data.orders.find(o=>o.id===t?.order);if(!o)return;
    const actual=Number($('transactionQty').value),bad=Number($('transactionDefective').value),good=Math.max(0,actual-bad);
    $('transactionOrdered').value=o.qty;
    $('transactionReceiptSummary').textContent=bad>actual?'불량 수량은 입고 수량을 넘을 수 없습니다.':'요약 · 정상 입고 '+fmt(good)+'개 · 발주 상태 '+($('transactionKeepOpen').checked?'입고중':'처리 완료');
  }
  $('transactionKeepOpen').onchange=previewTransactionReceipt;$('transactionQty').oninput=previewTransactionReceipt;$('transactionDefective').oninput=previewTransactionReceipt;
  $('historyType').onchange=()=>selected&&detail(selected);$('historySearch').oninput=()=>selected&&detail(selected);
  $('resetCatalog').onclick=()=>{$('purchaseSearch').value='';$('purchaseCategory').value='';category='';$('purchaseArchived').checked=false;render();};
  $('stockHistory').onclick=e=>{if(!UI.allowWrite())return;
    const button=e.target.closest('button');if(!button)return;
    const index=Number(button.dataset.editTransaction??button.dataset.deleteTransaction),t=FB.data.transactions[index];if(!t)return;
    if(button.dataset.deleteTransaction!==undefined){
      const revision=FB.data.revision;
      if(!confirm('정말 삭제하시겠습니까?\n\n'+t.date+' · '+t.type+' · '+fmt(t.qty)+'개\n이 기록의 재고 반영을 되돌리고, 연결 발주 수량도 수정합니다.'))return;
      try{FB.deleteMaterialTransaction({index,revision});UI.toast('기록을 삭제하고 재고를 다시 계산했습니다.');}catch(err){UI.toast(err.message);}return;
    }
    transactionIndex=index;transactionRevision=FB.data.revision;
    $('transactionTarget').textContent=t.name+' · '+t.vid+' · '+t.type;
    const receipt=!!t.order;
    $('transactionTitle').textContent=receipt?'입고 내역 수정':'입출고 내역 수정';
    $('transactionDialog').classList.toggle('receipt-dialog',receipt);$('transactionForm').classList.toggle('receipt-fields',receipt);
    $('transactionQuantities').className=receipt?'receipt-quantities receipt-wide':'';
    for(const id of ['transactionOrderStats','transactionQtyHelp','transactionKeepOpenField','transactionReceiptSummary','transactionReceiptVersionField'])$(id).hidden=!receipt;
    $('transactionDateLabel').textContent=receipt?'입고 · 처리 날짜':'날짜';$('transactionNoteLabel').textContent=receipt?'비고 · 직접 입력':'사유 · 비고';$('transactionNote').placeholder=receipt?'예: 불량 5개는 다음 배송에 교환 예정':'차감 사유나 참고 내용을 입력하세요.';
    if(receipt){const o=FB.data.orders.find(o=>o.id===t.order);$('transactionReceiptVersion').value=o?.vid||t.vid;$('transactionKeepOpen').checked=!!o&&FB.orderIsPending(o);}
    $('transactionQtyLabel').textContent=receipt?'입고 수량':'수량';
    $('transactionQty').min=t.order?'0':'1';$('transactionQty').value=t.order?(t.delivered??t.qty+(t.defective||0)):t.qty;
    $('transactionDefectField').hidden=!t.order;$('transactionDefective').value=t.defective||0;
    $('transactionDate').value=t.date;$('transactionPerson').value=t.person;const order=t.order?FB.data.orders.find(o=>o.id===t.order):null;$('transactionNote').value=receiptMemo(t,order);$('transactionError').textContent='';previewTransactionReceipt();$('transactionDialog').showModal();
  };
  $('closeTransaction').onclick=$('cancelTransaction').onclick=()=>$('transactionDialog').close();
  $('transactionForm').onsubmit=e=>{e.preventDefault();try{
    FB.updateMaterialTransaction({keepOpen:$('transactionKeepOpen').checked,index:transactionIndex,revision:transactionRevision,vid:$('transactionReceiptVersion').value,qty:Number($('transactionQty').value),defective:Number($('transactionDefective').value),date:$('transactionDate').value,person:$('transactionPerson').value,note:$('transactionNote').value});
    $('transactionDialog').close();UI.toast('기록과 재고를 수정했습니다.');
  }catch(err){$('transactionError').textContent=err.message;}};
  CatalogEditor.bind({kind:'material',selected:()=>material(selected),saved:id=>{$('purchaseSearch').value='';$('purchaseCategory').value='';category='';$('purchaseArchived').checked=!!material(id)?.archived;selected=id;render();}});
  $('hideStoppedVersions').onchange=render;
  UI.bindVersionManagement('stockVersions','material');
  UI.bindVersionAddition(()=>material(selected));
  window.addEventListener('fb-data',render);render();
})();


