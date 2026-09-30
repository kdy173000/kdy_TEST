/* procurement.js */
'use strict';
(()=>{
  const {$,esc,fmt}=UI;let category='',mode='',target='';
  const material=id=>FB.data.materials.find(m=>m.id===id);
  function filtered(){const q=$('purchaseSearch').value.toLowerCase();return FB.data.materials.filter(m=>(!m.archived||$('purchaseArchived').checked)&&(!category||m.slot===category)&&(m.name.toLowerCase().includes(q)||m.id.toLowerCase().includes(q)));}
  function render(){
    const items=filtered(),ids=new Set(items.map(m=>m.id));
    $('categoryButtons').innerHTML=[['','전체'],...FB.slots.map(s=>[s,s])].map(([v,t])=>`<button data-category="${esc(v)}" class="${category===v?'active':''}">${esc(t)}</button>`).join('');
    $('stockCount').textContent=items.length+'종';
    $('purchaseMaterials').innerHTML=items.map(m=>{const pending=FB.data.orders.filter(o=>o.mid===m.id).reduce((n,o)=>n+UI.remaining(o),0),usable=!m.archived&&m.versions.some(v=>v.state==='사용');return `<tr><td><strong>${esc(m.name)}</strong><br><small>${esc(m.id)}${m.archived?' · 중단':''}</small></td><td>${esc(m.slot)}</td><td class="num">${fmt(UI.quantity(m,true))}</td><td class="num">${fmt(UI.quantity(m))}</td><td class="num">${fmt(pending)}</td><td class="action-cell"><button data-detail="${esc(m.id)}">재고 상세</button><button data-order="${esc(m.id)}" ${usable?'':'disabled'}>발주</button><button data-adjust="${esc(m.id)}" ${usable?'':'disabled'}>수기 차감</button></td></tr>`;}).join('')||'<tr><td colspan="6" class="empty">해당하는 부자재가 없습니다.</td></tr>';
    const filter=$('orderFilter').value;
    const orders=FB.data.orders.filter(o=>ids.has(o.mid)&&(filter==='all'||filter==='pending'&&!o.closed&&o.received<o.qty||filter==='received'&&o.received===o.qty||filter==='closed'&&o.closed));
    $('purchaseOrders').innerHTML=orders.slice().reverse().map(o=>`<tr><td>${o.id}</td><td>${esc(o.name)}<br><small>${esc(o.vid)}</small></td><td>${esc(o.supplier)}</td><td>${esc(o.date)}<br><small>예정 ${esc(o.due)||'—'}</small></td><td class="num">${fmt(o.qty)}</td><td class="num">${fmt(o.received)}</td><td class="num">${fmt(UI.remaining(o))}${o.closed?`<br><small>마감 ${fmt(o.qty-o.received)}</small>`:''}</td><td>${o.closed?'잔량 마감':o.received===o.qty?'입고 완료':o.received?'부분 입고':'발주 완료'}${!o.closed&&o.received<o.qty?`<br><button data-receive="${o.id}">입고 처리</button><button data-close-order="${o.id}">잔량 마감</button>`:''}</td></tr>`).join('')||'<tr><td colspan="8" class="empty">등록된 발주가 없습니다.</td></tr>';
    $('purchaseHistory').innerHTML=FB.data.transactions.filter(t=>ids.has(t.mid)).slice().reverse().map(t=>`<tr><td>${esc(t.date)}</td><td>${esc(t.name)}</td><td>${esc(t.type)}</td><td>${esc(t.vid)}</td><td class="num">${UI.minus(t.type)?'−':'＋'}${fmt(t.qty)}</td><td>${esc(t.person)}</td><td>${esc(t.note)}</td></tr>`).join('')||'<tr><td colspan="7" class="empty">등록된 재고 변경 내역이 없습니다.</td></tr>';
  }
  const field=(label,html)=>`<label class="field"><span>${label}</span>${html}</label>`;
  function open(kind,id){mode=kind;target=id;const order=kind==='receive'?FB.data.orders.find(o=>o.id===id):null,m=material(order?order.mid:id);
    $('purchaseTitle').textContent=kind==='order'?'부자재 발주 등록':kind==='receive'?'발주 입고 처리':'수기 재고 차감';$('purchaseTarget').textContent=m.name+(order?' · '+order.id+' · 미입고 '+fmt(UI.remaining(order))+'개':'');
    let fields='';
    if(!order)fields+=field('버전',`<select name="vid">${UI.options(m.versions.filter(v=>v.state==='사용').map(v=>[v.id,v.id+' · '+fmt(v.qty)+'개']),'')}</select>`);
    fields+=field(kind==='order'?'발주 수량':kind==='receive'?'실제 입고 수량':'차감 수량',`<input name="qty" type="number" min="1" step="1" ${order?'max="'+UI.remaining(order)+'"':''} required>`);
    if(kind==='order')fields+=field('거래처','<input name="supplier" maxlength="80" required>');
    fields+=field(kind==='order'?'발주 날짜':kind==='receive'?'입고 날짜':'차감 날짜',`<input name="date" type="date" value="${FB.day()}" required>`);
    if(kind==='order')fields+=field('입고 예정일','<input name="due" type="date">');
    fields+=field('담당자',`<input name="person" maxlength="30" value="${esc(FB.user()?.name||'')}" required>`);
    if(kind==='adjust')fields+=field('차감 사유','<select name="reason"><option>불량</option><option>파손</option><option>분실</option><option>샘플 사용</option><option>실사 차이</option><option>기타</option></select>');
    fields+=field(kind==='adjust'?'상세 사유':'비고',`<textarea name="note" maxlength="200" ${kind==='adjust'?'required':''}></textarea>`);
    $('purchaseFields').innerHTML=fields;$('purchaseError').textContent='';$('purchaseDialog').showModal();
  }
  function detail(id){target=id;const m=material(id);$('stockTitle').textContent=m.name+' · 재고 상세';$('stockMemo').textContent=m.memo||'등록된 관리 메모가 없습니다.';$('stockVersions').innerHTML=m.versions.map(v=>`<tr><td>${esc(v.id)}</td><td>${v.state}</td><td class="num">${fmt(v.qty)}개</td><td class="num">${fmt(FB.data.orders.filter(o=>o.mid===m.id&&o.vid===v.id).reduce((n,o)=>n+UI.remaining(o),0))}개</td></tr>`).join('');$('stockHistory').innerHTML=UI.history(FB.data.transactions.filter(t=>t.mid===id));}
  $('categoryButtons').onclick=e=>{const b=e.target.closest('[data-category]');if(b){category=b.dataset.category;render();}};$('purchaseSearch').oninput=render;$('purchaseArchived').onchange=render;$('orderFilter').onchange=render;
  $('purchaseMaterials').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.order)open('order',b.dataset.order);if(b.dataset.adjust)open('adjust',b.dataset.adjust);if(b.dataset.detail){detail(b.dataset.detail);$('stockDialog').showModal();}};
  $('purchaseOrders').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.receive)open('receive',b.dataset.receive);if(b.dataset.closeOrder){try{FB.closeOrder(b.dataset.closeOrder);UI.toast('미입고 잔량을 마감했습니다. 입고된 재고는 유지됩니다.');}catch(err){UI.toast(err.message);}}};
  $('closePurchase').onclick=()=>$('purchaseDialog').close();$('closeStock').onclick=()=>$('stockDialog').close();
  $('purchaseForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),input=Object.fromEntries(f.entries());input.qty=Number(input.qty);try{if(mode==='order')FB.createOrder({...input,mid:target});else if(mode==='receive')FB.receiveOrder({...input,id:target});else FB.stockMovement({...input,mid:target,type:'재고 조정',note:input.reason+' · '+input.note});$('purchaseDialog').close();UI.toast(mode==='order'?'발주를 등록했습니다. 입고 전에는 재고가 늘지 않습니다.':mode==='receive'?'실제 입고 수량을 재고에 반영했습니다.':'차감 사유와 재고를 기록했습니다.');}catch(err){$('purchaseError').textContent=err.message;render();}};
  window.addEventListener('fb-data',()=>{render();if($('stockDialog').open)detail(target);});render();
})();
