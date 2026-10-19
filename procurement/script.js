/* procurement.js */
'use strict';
(()=>{
  const {$,esc,fmt}=UI;let category='',target='',selected=new URLSearchParams(location.search).get('material')||'cap';
  const material=id=>FB.data.materials.find(m=>m.id===id);
  function filtered(){const q=$('purchaseSearch').value.toLowerCase();return FB.data.materials.filter(m=>!m.deleted&&(!m.archived||$('purchaseArchived').checked)&&(!category||(category==='라벨'?['전면 라벨','후면 라벨'].includes(m.slot):m.slot===category))&&(m.name.toLowerCase().includes(q)||m.id.toLowerCase().includes(q)));}
  function render(){
    const items=filtered();
    if(!items.some(m=>m.id===selected))selected=items[0]?.id||'';
    $('stockCount').textContent=items.length+'종';
    $('purchaseMaterials').innerHTML=items.map(m=>`<button class="product ${m.id===selected?'active':''}" aria-pressed="${m.id===selected}" data-select="${esc(m.id)}">${Photos.markup('material',m.id,m.name,'list')}<strong>${esc(m.name)}</strong><span>${esc(['전면 라벨','후면 라벨'].includes(m.slot)?'라벨':m.slot)} · ${esc(m.id)}${m.archived?' · 단종':''}</span></button>`).join('')||'<p class="empty">검색 결과가 없습니다.</p>';
    $('stockContent').hidden=!selected;$('stockEmpty').hidden=!!selected;
    if(selected)detail(selected);
    const orders=FB.data.orders.filter(o=>o.mid===selected&&!o.closed&&o.received<o.qty);
    $('pendingOrderCount').textContent=orders.length+'건';
    $('purchaseOrders').innerHTML=orders.slice().reverse().map(o=>`<article class="order-card"><div class="order-card-main"><div class="order-card-heading"><strong>${esc(o.supplier)}</strong><span class="badge">${o.received?'부분 입고':'입고 전'}</span></div><p class="order-meta">${esc(o.id)} · 발주 버전 <strong>${esc(o.vid)}</strong></p><div class="order-quantities"><div><span>발주 수량</span><strong>${fmt(o.qty)}<small>개</small></strong></div><div><span>정상 입고</span><strong>${fmt(o.received)}<small>개</small></strong></div><div><span>추가 입고 필요</span><strong>${fmt(UI.remaining(o))}<small>개</small></strong></div></div><p class="order-dates">발주 ${esc(o.date)} · 입고 예정 <strong>${esc(o.due)||'미정'}</strong></p>${o.note?`<p class="order-note">${esc(o.note)}</p>`:''}</div></article>`).join('')||'<p class="empty">입고 대기 중인 발주가 없습니다.<br>발주 등록과 입고 처리는 발주 관리에서 진행하세요.</p>';
    UI.applyAccess();if(selected){const m=material(selected),blocked=!FB.canAdmin()||!!m.archived;$('orderMaterial').disabled=blocked;$('adjustMaterial').disabled=blocked;$('addMaterialVersion').disabled=blocked;}



  }
  const field=(label,html)=>`<label class="field"><span>${label}</span>${html}</label>`;
  function openAdjustment(id){if(!UI.allowWrite())return;target=id;const m=material(id);if(!m||m.archived)return;if(!m.versions.some(v=>!v.deleted&&v.state==='사용')){UI.toast('사용 가능한 버전이 없습니다. 버전 수정에서 공용 사용·국내 전용·해외 전용 중 하나를 선택하세요.');return;}
    $('purchaseHint').textContent='선택한 버전의 재고에서 입력한 수량을 차감합니다. 사유를 함께 기록하세요.';$('purchaseDialog').classList.add('task-dialog');$('purchaseTitle').textContent='수기 재고 차감';$('purchaseTarget').textContent=m.name;
    let fields='';
    fields+=field('차감 버전',`<select name="vid">${UI.options(m.versions.filter(v=>v.state==='사용').map(v=>[v.id,v.id+' · '+fmt(v.qty)+'개']),'')}</select>`);
    fields+=field('차감 수량',`<input name="qty" type="number" min="1" step="1" required>`);
    fields+=field('차감 날짜',`<input name="date" type="date" value="${FB.day()}" required>`);
    fields+=field('담당자',`<input name="person" maxlength="30" value="${esc(FB.user()?.name||'')}" required>`);
    fields+=field('차감 사유','<select name="reason"><option>불량</option><option>파손</option><option>분실</option><option>샘플 사용</option><option>실사 차이</option><option>기타</option></select>');
    fields+=field('상세 사유',`<textarea name="note" maxlength="200" required></textarea>`);
    $('purchaseSave').textContent='차감 등록';
    $('purchaseFields').innerHTML=fields;$('purchaseFields').lastElementChild.classList.add('wide');$('purchaseError').textContent='';$('purchaseDialog').showModal();
  }
  function detail(id){const m=material(id);
    const pending=vid=>FB.data.orders.filter(o=>o.mid===id&&(!vid||o.vid===vid)).reduce((n,o)=>n+UI.remaining(o),0);
    $('materialPhoto').innerHTML=Photos.markup('material',m.id,m.name,'summary');Photos.refresh();
    $('stockTitle').textContent=m.name;$('stockKind').textContent=m.slot;$('stockCode').textContent=m.id+(m.archived?' · 단종':'');
    $('stockTotal').textContent=fmt(UI.quantity(m))+'개';$('stockAvailable').textContent=fmt(UI.quantity(m,true))+'개';$('stockPending').textContent=fmt(pending())+'개';
    $('stockMemo').textContent=m.memo||'발주 입고와 생산 사용 내역이 같은 재고에 반영됩니다.';
    $('stockVersions').innerHTML=UI.versionCards('material',m,{hideStopped:$('hideStoppedVersions').checked,pending});
    $('stockHistory').innerHTML=FB.data.transactions.map((t,index)=>({t,index})).filter(r=>{const t=r.t,type=$('historyType').value,q=$('historySearch').value.trim().toLowerCase();return t.mid===id&&(!type||(type==='입고'?['입고','불량 입고'].includes(t.type):type==='생산'?!!t.production:UI.minus(t.type)&&!t.production))&&[t.vid,t.person,t.note,t.date].join(' ').toLowerCase().includes(q);}).reverse().map(({t,index})=>{
const editable=FB.canAdmin()&&!t.production&&!t.pid&&['입고','불량 입고','출고','재고 조정'].includes(t.type);
return `<tr><td>${esc(t.date)}</td><td>${esc(t.type)}</td><td>${t.order?`발주 ${esc(FB.data.orders.find(o=>o.id===t.order)?.vid||t.vid)}<br>입고 ${esc(t.vid)}`:esc(t.vid)}</td><td class="num">${UI.minus(t.type)?'−':'＋'}${fmt(t.qty)}</td><td>${esc(t.person)}</td><td>${esc(t.note)}</td><td>${editable?`<div class="history-actions"><button data-edit-transaction="${index}">수정</button><button class="delete-button" data-delete-transaction="${index}">삭제</button></div>`:`<small>${t.production?'생산 내역에서 관리':'조회 전용'}</small>`}</td></tr>`;
}).join('')||'<tr><td colspan="7" class="empty">조건에 맞는 내역이 없습니다.</td></tr>';}
  $('purchaseCategory').innerHTML=UI.options([['','전체 구성품'],...['캡','용기','스웨이드','어플리케이터','라벨','속지','케이스'].map(s=>[s,s])],'');
  $('purchaseCategory').onchange=()=>{category=$('purchaseCategory').value;render();};$('purchaseSearch').oninput=render;$('purchaseArchived').onchange=render;
  $('purchaseMaterials').onclick=e=>{const b=e.target.closest('[data-select]');if(b){selected=b.dataset.select;render();}};
  $('orderMaterial').onclick=()=>{if(!UI.allowWrite())return;location.href='../orders/index.html?material='+encodeURIComponent(selected);};$('adjustMaterial').onclick=()=>openAdjustment(selected);

  $('closePurchase').onclick=()=>$('purchaseDialog').close();
  $('purchaseForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),input=Object.fromEntries(f.entries());input.qty=Number(input.qty);try{FB.stockMovement({...input,mid:target,type:'재고 조정',note:input.reason+' · '+input.note});$('purchaseDialog').close();UI.toast('차감 사유와 재고를 기록했습니다.');}catch(err){$('purchaseError').textContent=err.message;render();}};

  let transactionIndex=-1,transactionRevision=-1;
  function previewTransactionReceipt(){
    const t=FB.data.transactions[transactionIndex],o=FB.data.orders.find(o=>o.id===t?.order);if(!o)return;
    const actual=Number($('transactionQty').value),bad=Number($('transactionDefective').value),good=Math.max(0,actual-bad);
    const otherGood=o.received-t.qty,otherDelivered=(o.delivered??o.received)-(t.delivered??t.qty+(t.defective||0));
    $('transactionOrdered').textContent=fmt(o.qty)+'개';$('transactionReceived').textContent=fmt(otherGood)+'개';
    $('transactionRemaining').value=Math.max(0,o.qty-otherDelivered-actual);
    $('transactionReceiptSummary').textContent=bad>actual?'불량 수량은 입고 수량을 넘을 수 없습니다.':'정상 입고 '+fmt(good)+'개 · 추가 정상 입고 필요 '+fmt(Math.max(0,o.qty-otherGood-good))+'개'+(otherGood+good>o.qty?' · 초과 정상 입고 '+fmt(otherGood+good-o.qty)+'개':'');
  }
  $('transactionQty').oninput=previewTransactionReceipt;$('transactionDefective').oninput=previewTransactionReceipt;
  $('historyType').onchange=()=>selected&&detail(selected);$('historySearch').oninput=()=>selected&&detail(selected);
  $('resetCatalog').onclick=()=>{$('purchaseSearch').value='';$('purchaseCategory').value='';category='';$('purchaseArchived').checked=false;render();};
  $('stockHistory').onclick=e=>{if(!UI.allowWrite())return;
    const button=e.target.closest('button');if(!button)return;
    const index=Number(button.dataset.editTransaction??button.dataset.deleteTransaction),t=FB.data.transactions[index];if(!t)return;
    if(button.dataset.deleteTransaction!==undefined){
      const revision=FB.data.revision;
      if(!confirm(t.date+' · '+t.type+' '+fmt(t.qty)+'개 기록을 삭제할까요?\n이 기록의 재고 반영을 되돌리고, 연결 발주 수량도 수정합니다.'))return;
      try{FB.deleteMaterialTransaction({index,revision});UI.toast('기록을 삭제하고 재고를 다시 계산했습니다.');}catch(err){UI.toast(err.message);}return;
    }
    transactionIndex=index;transactionRevision=FB.data.revision;
    $('transactionTarget').textContent=t.name+' · '+t.vid+' · '+t.type;
    const receipt=!!t.order;
    $('transactionTitle').textContent=receipt?'입고 내역 수정':'입출고 내역 수정';
    $('transactionDialog').classList.toggle('receipt-dialog',receipt);$('transactionForm').classList.toggle('receipt-fields',receipt);
    $('transactionQuantities').className=receipt?'receipt-quantities receipt-wide':'';
    for(const id of ['transactionOrderStats','transactionQtyHelp','transactionRemainingField','transactionReceiptSummary','transactionOrderedVersionField','transactionReceiptVersionField'])$(id).hidden=!receipt;
    $('transactionDateLabel').textContent=receipt?'입고 · 처리 날짜':'날짜';$('transactionNoteLabel').textContent=receipt?'비고':'사유 · 비고';
    if(receipt){const o=FB.data.orders.find(o=>o.id===t.order);$('transactionOrderedVersion').value=o?.vid||t.vid;$('transactionReceiptVersion').innerHTML=UI.options(material(t.mid).versions.filter(v=>v.state==='사용'||v.id===t.vid).map(v=>[v.id,v.id]),t.vid);}
    $('transactionQtyLabel').textContent=receipt?'입고 수량':'수량';
    $('transactionQty').min=t.order?'0':'1';$('transactionQty').value=t.order?(t.delivered??t.qty+(t.defective||0)):t.qty;
    $('transactionDefectField').hidden=!t.order;$('transactionDefective').value=t.defective||0;
    $('transactionDate').value=t.date;$('transactionPerson').value=t.person;const order=t.order?FB.data.orders.find(o=>o.id===t.order):null,receiptNote=order?.receipts?.[t.receiptIndex]?.note;$('transactionNote').value=receiptNote??t.note??'';$('transactionError').textContent='';previewTransactionReceipt();$('transactionDialog').showModal();
  };
  $('closeTransaction').onclick=$('cancelTransaction').onclick=()=>$('transactionDialog').close();
  $('transactionForm').onsubmit=e=>{e.preventDefault();try{
    FB.updateMaterialTransaction({index:transactionIndex,revision:transactionRevision,vid:$('transactionReceiptVersion').value,qty:Number($('transactionQty').value),defective:Number($('transactionDefective').value),date:$('transactionDate').value,person:$('transactionPerson').value,note:$('transactionNote').value});
    $('transactionDialog').close();UI.toast('기록과 재고를 수정했습니다.');
  }catch(err){$('transactionError').textContent=err.message;}};
  CatalogEditor.bind({kind:'material',selected:()=>material(selected),saved:id=>{$('purchaseSearch').value='';$('purchaseCategory').value='';category='';$('purchaseArchived').checked=!!material(id)?.archived;selected=id;render();}});
  $('hideStoppedVersions').onchange=render;
  UI.bindVersionManagement('stockVersions','material');
  UI.bindVersionAddition(()=>material(selected));
  window.addEventListener('fb-data',render);render();
})();


