/* procurement.js */
'use strict';
(()=>{
  const {$,esc,fmt}=UI;let category='',mode='',target='',selected='cap';
  const material=id=>FB.data.materials.find(m=>m.id===id);
  function filtered(){const q=$('purchaseSearch').value.toLowerCase();return FB.data.materials.filter(m=>(!m.archived||$('purchaseArchived').checked)&&(!category||(category==='라벨'?['전면 라벨','후면 라벨'].includes(m.slot):m.slot===category))&&(m.name.toLowerCase().includes(q)||m.id.toLowerCase().includes(q)));}
  function render(){
    const items=filtered(),ids=new Set(items.map(m=>m.id));
    if(!items.some(m=>m.id===selected))selected=items[0]?.id||'';
    $('stockCount').textContent=items.length+'종';
    $('purchaseMaterials').innerHTML=items.map(m=>`<button class="product ${m.id===selected?'active':''}" data-select="${esc(m.id)}"><strong>${esc(m.name)}</strong><span>${esc(['전면 라벨','후면 라벨'].includes(m.slot)?'라벨':m.slot)} · ${esc(m.id)}${m.archived?' · 단종':''}</span></button>`).join('')||'<p class="empty">검색 결과가 없습니다.</p>';
    $('stockContent').hidden=!selected;$('stockEmpty').hidden=!!selected;
    if(selected)detail(selected);
    const orders=FB.data.orders.filter(o=>ids.has(o.mid)&&!o.closed&&o.received<o.qty);
    $('purchaseOrders').innerHTML=orders.slice().reverse().map(o=>`<tr><td>${o.id}</td><td>${esc(o.name)}<br><small>${esc(o.vid)}</small></td><td>${esc(o.supplier)}</td><td>${esc(o.date)}<br><small>예정 ${esc(o.due)||'—'}</small><br><button data-edit-due="${o.id}">예정일 수정</button></td><td class="num">${fmt(o.qty)}</td><td class="num">${fmt(o.received)}</td><td class="num">${fmt(UI.remaining(o))}${o.closed?`<br><small>마감 ${fmt(o.qty-o.received)}</small>`:''}</td><td>${o.closed?'잔량 마감':o.received===o.qty?'입고 완료':o.received?'부분 입고':'발주 완료'}${!o.closed&&o.received<o.qty?`<br><button data-receive="${o.id}">입고 완료</button><button data-close-order="${o.id}">잔량 마감</button>`:''}</td></tr>`).join('')||'<tr><td colspan="8" class="empty">입고 대기 중인 발주가 없습니다.</td></tr>';

  }
  const field=(label,html)=>`<label class="field"><span>${label}</span>${html}</label>`;
  function open(kind,id){mode=kind;target=id;const order=['receive','due'].includes(kind)?FB.data.orders.find(o=>o.id===id):null,m=material(order?order.mid:id);
    $('purchaseTitle').textContent=kind==='order'?'부자재 발주 등록':kind==='receive'?'입고 완료 확인':'수기 재고 차감';$('purchaseTarget').textContent=m.name+(order?' · '+order.id+' · 입고 대기 '+fmt(UI.remaining(order))+'개':'');
    if(kind==='due'){$('purchaseTitle').textContent='입고 예정일 수정';$('purchaseFields').innerHTML=field('입고 예정일',`<input name="due" type="date" value="${esc(order.due)}">`)+ '<p class="page-note">일정이 바뀌면 다시 수정할 수 있습니다. 날짜를 비우면 미정으로 저장됩니다.</p>';$('purchaseSave').textContent='예정일 저장';$('purchaseError').textContent='';$('purchaseDialog').showModal();return;}
    let fields='';
    if(!order)fields+=field('버전',`<select name="vid">${UI.options(m.versions.filter(v=>v.state==='사용').map(v=>[v.id,v.id+' · '+fmt(v.qty)+'개']),'')}</select>`);
    fields+=field(kind==='order'?'발주 수량':kind==='receive'?'실제 입고 수량':'차감 수량',`<input name="qty" type="number" min="1" step="1" ${order?'max="'+UI.remaining(order)+'" value="'+UI.remaining(order)+'"':''} required>`);
    if(kind==='order')fields+=field('거래처','<input name="supplier" maxlength="80" required>');
    fields+=field(kind==='order'?'발주 날짜':kind==='receive'?'입고 날짜':'차감 날짜',`<input name="date" type="date" value="${FB.day()}" required>`);
    if(kind==='order')fields+=field('입고 예정일','<input name="due" type="date">');
    fields+=field('담당자',`<input name="person" maxlength="30" value="${esc(FB.user()?.name||'')}" required>`);
    if(kind==='adjust')fields+=field('차감 사유','<select name="reason"><option>불량</option><option>파손</option><option>분실</option><option>샘플 사용</option><option>실사 차이</option><option>기타</option></select>');
    fields+=field(kind==='adjust'?'상세 사유':'비고',`<textarea name="note" maxlength="200" ${kind==='adjust'?'required':''}></textarea>`);
    $('purchaseSave').textContent=kind==='receive'?'입고 완료':kind==='order'?'발주 등록':'차감 등록';
    $('purchaseFields').innerHTML=fields;$('purchaseError').textContent='';$('purchaseDialog').showModal();
  }
  function detail(id){const m=material(id),usable=!m.archived&&m.versions.some(v=>v.state==='사용');
    const pending=vid=>FB.data.orders.filter(o=>o.mid===id&&(!vid||o.vid===vid)).reduce((n,o)=>n+UI.remaining(o),0);
    $('stockTitle').textContent=m.name;$('stockKind').textContent=m.slot;$('stockCode').textContent=m.id+(m.archived?' · 단종':'');
    $('stockTotal').textContent=fmt(UI.quantity(m))+'개';$('stockAvailable').textContent=fmt(UI.quantity(m,true))+'개';$('stockPending').textContent=fmt(pending())+'개';
    $('orderMaterial').disabled=!usable;$('adjustMaterial').disabled=!usable;
    $('stockMemo').textContent=m.memo||'발주 입고와 생산 사용 내역이 같은 재고에 반영됩니다.';
    $('stockVersions').innerHTML=m.versions.map(v=>`<div class="version"><div class="versiontop"><h4>${esc(v.id)}</h4><span class="state ${v.state==='사용'?'':'blocked'}">${esc(v.state)}</span></div><strong>${fmt(v.qty)}<small>개</small></strong><p>입고 대기 ${fmt(pending(v.id))}개</p></div>`).join('');
    $('stockHistory').innerHTML=UI.history(FB.data.transactions.filter(t=>t.mid===id));$('stockOrders').innerHTML=FB.data.orders.filter(o=>o.mid===id&&o.received>0).slice().reverse().map(o=>`<tr><td>${esc(o.id)}</td><td>${esc(o.supplier)}<br><small>${esc(o.vid)}</small></td><td>${esc(o.date)}</td><td class="num">${fmt(o.qty)}개</td><td class="num">${fmt(o.received)}개</td><td>${o.closed?'잔량 마감':o.received===o.qty?'입고 완료':'부분 입고 · '+fmt(UI.remaining(o))+'개 대기'}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">입고된 발주가 없습니다.</td></tr>';}
  $('purchaseCategory').innerHTML=UI.options([['','전체 구성품'],...['캡','용기','스웨이드','어플리케이터','라벨','속지','케이스'].map(s=>[s,s])],'');
  $('purchaseCategory').onchange=()=>{category=$('purchaseCategory').value;render();};$('purchaseSearch').oninput=render;$('purchaseArchived').onchange=render;
  $('purchaseMaterials').onclick=e=>{const b=e.target.closest('[data-select]');if(b){selected=b.dataset.select;render();}};
  $('orderMaterial').onclick=()=>open('order',selected);$('adjustMaterial').onclick=()=>open('adjust',selected);
  $('purchaseOrders').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.editDue)open('due',b.dataset.editDue);if(b.dataset.receive)open('receive',b.dataset.receive);if(b.dataset.closeOrder){try{FB.closeOrder(b.dataset.closeOrder);UI.toast('입고 대기 잔량을 마감했습니다. 입고된 재고는 유지됩니다.');}catch(err){UI.toast(err.message);}}};
  $('closePurchase').onclick=()=>$('purchaseDialog').close();
  $('purchaseForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),input=Object.fromEntries(f.entries());input.qty=Number(input.qty);try{if(mode==='due')FB.updateOrderDue({...input,id:target});else if(mode==='order')FB.createOrder({...input,mid:target});else if(mode==='receive')FB.receiveOrder({...input,id:target});else FB.stockMovement({...input,mid:target,type:'재고 조정',note:input.reason+' · '+input.note});$('purchaseDialog').close();UI.toast(mode==='due'?'입고 예정일을 수정했습니다.':mode==='order'?'발주를 등록했습니다. 입고 전에는 재고가 늘지 않습니다.':mode==='receive'?'실제 입고 수량을 재고에 반영했습니다.':'차감 사유와 재고를 기록했습니다.');}catch(err){$('purchaseError').textContent=err.message;render();}};
  UI.bindVersionAddition(()=>material(selected));
  window.addEventListener('fb-data',render);render();
})();

