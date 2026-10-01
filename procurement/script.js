/* procurement.js */
'use strict';
(()=>{
  const {$,esc,fmt}=UI;let category='',mode='',target='',selected='cap';
  const material=id=>FB.data.materials.find(m=>m.id===id);
  function filtered(){const q=$('purchaseSearch').value.toLowerCase();return FB.data.materials.filter(m=>(!m.archived||$('purchaseArchived').checked)&&(!category||(category==='라벨'?['전면 라벨','후면 라벨'].includes(m.slot):m.slot===category))&&(m.name.toLowerCase().includes(q)||m.id.toLowerCase().includes(q)));}
  function render(){
    const items=filtered();
    if(!items.some(m=>m.id===selected))selected=items[0]?.id||'';
    $('stockCount').textContent=items.length+'종';
    $('purchaseMaterials').innerHTML=items.map(m=>`<button class="product ${m.id===selected?'active':''}" aria-pressed="${m.id===selected}" data-select="${esc(m.id)}"><strong>${esc(m.name)}</strong><span>${esc(['전면 라벨','후면 라벨'].includes(m.slot)?'라벨':m.slot)} · ${esc(m.id)}${m.archived?' · 단종':''}</span></button>`).join('')||'<p class="empty">검색 결과가 없습니다.</p>';
    $('stockContent').hidden=!selected;$('stockEmpty').hidden=!!selected;
    if(selected)detail(selected);
    const orders=FB.data.orders.filter(o=>o.mid===selected&&!o.closed&&o.received<o.qty);
    $('pendingOrderCount').textContent=orders.length+'건';
    $('purchaseOrders').innerHTML=orders.slice().reverse().map(o=>`<article class="order-card"><div class="order-card-main"><div class="order-card-heading"><strong>${esc(o.supplier)}</strong><span class="badge">${o.received?'부분 입고':'입고 전'}</span></div><p class="order-meta">${esc(o.id)} · 발주 버전 <strong>${esc(o.vid)}</strong></p><div class="order-quantities"><div><span>발주 수량</span><strong>${fmt(o.qty)}<small>개</small></strong></div><div><span>정상 입고</span><strong>${fmt(o.received)}<small>개</small></strong></div><div><span>추가 입고 필요</span><strong>${fmt(UI.remaining(o))}<small>개</small></strong></div></div><p class="order-dates">발주 ${esc(o.date)} · 입고 예정 <strong>${esc(o.due)||'미정'}</strong> <button data-edit-due="${esc(o.id)}" data-write-action>예정일 수정</button></p>${o.note?`<p class="order-note">${esc(o.note)}</p>`:''}</div><div class="order-actions"><button class="primary" data-receive="${esc(o.id)}" data-write-action>입고 완료</button></div></article>`).join('')||'<p class="empty">입고 대기 중인 발주가 없습니다.<br>새 발주는 위의 발주 등록 버튼으로 추가하세요.</p>';
    UI.applyAccess();if(selected){const m=material(selected),usable=!m.archived&&m.versions.some(v=>v.state==='사용');$('orderMaterial').disabled=!FB.canAdmin()||!usable;$('adjustMaterial').disabled=!FB.canAdmin()||!usable;$('addMaterialVersion').disabled=!FB.canAdmin()||m.archived;}



  }
  const field=(label,html)=>`<label class="field"><span>${label}</span>${html}</label>`;
  function open(kind,id){if(!UI.allowWrite())return;mode=kind;target=id;const order=kind==='due'?FB.data.orders.find(o=>o.id===id):null,m=material(order?order.mid:id);
    $('purchaseHint').textContent=kind==='order'?'발주할 버전과 수량을 입력하세요. 실제 입고 전까지 현재 재고는 그대로입니다.':kind==='due'?'입고 예정일은 일정이 바뀔 때마다 수정할 수 있습니다.':'선택한 버전의 재고에서 입력한 수량을 차감합니다. 사유를 함께 기록하세요.';$('purchaseDialog').classList.toggle('task-dialog',kind!=='due');$('purchaseTitle').textContent=kind==='order'?'부자재 발주 등록':'수기 재고 차감';$('purchaseTarget').textContent=m.name+(order?' · '+order.id+' · 입고 대기 '+fmt(UI.remaining(order))+'개':'');
    if(kind==='due'){$('purchaseTitle').textContent='입고 예정일 수정';$('purchaseFields').innerHTML=field('입고 예정일',`<input name="due" type="date" value="${esc(order.due)}">`)+ '<p class="page-note">일정이 바뀌면 다시 수정할 수 있습니다. 날짜를 비우면 미정으로 저장됩니다.</p>';$('purchaseSave').textContent='예정일 저장';$('purchaseError').textContent='';$('purchaseDialog').showModal();return;}
    let fields='';
    if(!order)fields+=field(kind==='order'?'발주 버전':'차감 버전',`<select name="vid">${UI.options(m.versions.filter(v=>v.state==='사용').map(v=>[v.id,v.id+' · '+fmt(v.qty)+'개']),'')}</select>`);
    fields+=field(kind==='order'?'발주 수량':'차감 수량',`<input name="qty" type="number" min="1" step="1" ${order?'value="'+UI.remaining(order)+'"':''} required>`);
    if(kind==='order')fields+=field('거래처','<input name="supplier" maxlength="80" required>');
    fields+=field(kind==='order'?'발주 날짜':'차감 날짜',`<input name="date" type="date" value="${FB.day()}" required>`);
    if(kind==='order')fields+=field('입고 예정일','<input name="due" type="date">');
    fields+=field('담당자',`<input name="person" maxlength="30" value="${esc(FB.user()?.name||'')}" required>`);
    if(kind==='adjust')fields+=field('차감 사유','<select name="reason"><option>불량</option><option>파손</option><option>분실</option><option>샘플 사용</option><option>실사 차이</option><option>기타</option></select>');
    fields+=field(kind==='adjust'?'상세 사유':'비고 (선택)',`<textarea name="note" maxlength="200" ${kind==='adjust'?'required':''}></textarea>`);
    $('purchaseSave').textContent=kind==='order'?'발주 등록':'차감 등록';
    $('purchaseFields').innerHTML=fields;$('purchaseFields').lastElementChild.classList.add('wide');$('purchaseError').textContent='';$('purchaseDialog').showModal();
  }
  function detail(id){const m=material(id),usable=!m.archived&&m.versions.some(v=>v.state==='사용');
    const pending=vid=>FB.data.orders.filter(o=>o.mid===id&&(!vid||o.vid===vid)).reduce((n,o)=>n+UI.remaining(o),0);
    $('stockTitle').textContent=m.name;$('stockKind').textContent=m.slot;$('stockCode').textContent=m.id+(m.archived?' · 단종':'');
    $('stockTotal').textContent=fmt(UI.quantity(m))+'개';$('stockAvailable').textContent=fmt(UI.quantity(m,true))+'개';$('stockPending').textContent=fmt(pending())+'개';
    $('orderMaterial').disabled=!usable;$('adjustMaterial').disabled=!usable;
    $('stockMemo').textContent=m.memo||'발주 입고와 생산 사용 내역이 같은 재고에 반영됩니다.';
    $('stockVersions').innerHTML=m.versions.map(v=>`<div class="version"><div class="versiontop"><h4>${esc(v.id)}</h4><span class="state ${v.state==='사용'?'':'blocked'}">${esc(v.state)}</span></div><strong>${fmt(v.qty)}<small>개</small></strong><p>입고 대기 ${fmt(pending(v.id))}개</p></div>`).join('');
    $('stockHistory').innerHTML=FB.data.transactions.map((t,index)=>({t,index})).filter(r=>{const t=r.t,type=$('historyType').value,q=$('historySearch').value.trim().toLowerCase();return t.mid===id&&(!type||(type==='입고'?['입고','불량 입고'].includes(t.type):type==='생산'?!!t.production:UI.minus(t.type)&&!t.production))&&[t.vid,t.person,t.note,t.date].join(' ').toLowerCase().includes(q);}).reverse().map(({t,index})=>{
const editable=FB.canAdmin()&&!t.production&&!t.pid&&['입고','불량 입고','출고','재고 조정'].includes(t.type);
return `<tr><td>${esc(t.date)}</td><td>${esc(t.type)}</td><td>${t.order?`발주 ${esc(FB.data.orders.find(o=>o.id===t.order)?.vid||t.vid)}<br>입고 ${esc(t.vid)}`:esc(t.vid)}</td><td class="num">${UI.minus(t.type)?'−':'＋'}${fmt(t.qty)}</td><td>${esc(t.person)}</td><td>${esc(t.note)}</td><td>${editable?`<div class="history-actions"><button data-edit-transaction="${index}">수정</button><button class="delete-button" data-delete-transaction="${index}">삭제</button></div>`:`<small>${t.production?'생산 내역에서 관리':'조회 전용'}</small>`}</td></tr>`;
}).join('')||'<tr><td colspan="7" class="empty">조건에 맞는 내역이 없습니다.</td></tr>';}
  $('purchaseCategory').innerHTML=UI.options([['','전체 구성품'],...['캡','용기','스웨이드','어플리케이터','라벨','속지','케이스'].map(s=>[s,s])],'');
  $('purchaseCategory').onchange=()=>{category=$('purchaseCategory').value;render();};$('purchaseSearch').oninput=render;$('purchaseArchived').onchange=render;
  $('purchaseMaterials').onclick=e=>{const b=e.target.closest('[data-select]');if(b){selected=b.dataset.select;render();}};
  $('orderMaterial').onclick=()=>open('order',selected);$('adjustMaterial').onclick=()=>open('adjust',selected);

  let closingId='';
  function previewReceipt(){const o=FB.data.orders.find(o=>o.id===closingId);if(!o)return;const q=Number($('closeActual').value),bad=Number($('closeDefective').value),good=q-bad,remaining=Math.max(0,o.qty-o.received-Math.max(0,good)),missing=Math.max(0,o.qty-(o.delivered??o.received)-Math.max(0,q)),extra=Math.max(0,o.received+good-o.qty);$('closeRemaining').value=missing;$('closeReceiptSummary').textContent=bad>q?'불량 수량은 입고 수량 이하로 입력하세요.':'이번 정상 입고 '+fmt(Math.max(0,good))+'개 · 정상 수량 기준 추가 입고 필요 '+fmt(remaining)+'개'+(extra?' · 정상 수량 초과 '+fmt(extra)+'개':'');}
  $('purchaseOrders').onclick=e=>{if(!e.target.closest('button')||!UI.allowWrite())return;const b=e.target.closest('button');if(!b)return;if(b.dataset.editDue)open('due',b.dataset.editDue);if(b.dataset.receive){closingId=b.dataset.receive;const o=FB.data.orders.find(o=>o.id===closingId);$('closeOrderName').textContent=o.id+' · '+o.name;$('closeOrdered').textContent=fmt(o.qty)+'개';$('closeReceived').textContent=fmt(o.received)+'개';$('closeOrderedVersion').value=o.vid;$('closeReceiptVersion').innerHTML=UI.options(material(o.mid).versions.filter(v=>v.state==='사용'||v.id===o.vid).map(v=>[v.id,v.id]),o.vid);$('closeActual').value='';$('closeDefective').value=0;$('closeReceiptDate').value=FB.day();$('closeReceiptPerson').value=FB.user()?.name||'';$('closeReceiptNote').value='';$('closeOrderError').textContent='';previewReceipt();$('closeOrderDialog').showModal();}};
  for(const id of ['dismissCloseOrder','keepOrder'])$(id).onclick=()=>$('closeOrderDialog').close();
  $('closeActual').oninput=previewReceipt;$('closeDefective').oninput=previewReceipt;
  $('closeReceiptForm').onsubmit=e=>{e.preventDefault();try{const o=FB.data.orders.find(o=>o.id===closingId);selected=o.mid;FB.receiveOrder({id:closingId,vid:$('closeReceiptVersion').value,qty:Number($('closeActual').value),defective:Number($('closeDefective').value),finish:false,date:$('closeReceiptDate').value,person:$('closeReceiptPerson').value,note:$('closeReceiptNote').value});$('closeOrderDialog').close();UI.toast('실제 입고 수량과 비고를 저장했습니다.');}catch(err){$('closeOrderError').textContent=err.message;}};
  $('closePurchase').onclick=()=>$('purchaseDialog').close();
  $('purchaseForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),input=Object.fromEntries(f.entries());input.qty=Number(input.qty);try{if(mode==='due')FB.updateOrderDue({...input,id:target});else if(mode==='order')FB.createOrder({...input,mid:target});else FB.stockMovement({...input,mid:target,type:'재고 조정',note:input.reason+' · '+input.note});$('purchaseDialog').close();UI.toast(mode==='due'?'입고 예정일을 수정했습니다.':mode==='order'?'발주를 등록했습니다. 입고 전에는 재고가 늘지 않습니다.':'차감 사유와 재고를 기록했습니다.');}catch(err){$('purchaseError').textContent=err.message;render();}};

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
  UI.bindVersionAddition(()=>material(selected));
  window.addEventListener('fb-data',render);render();
})();

