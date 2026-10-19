'use strict';
(()=>{
const {$,esc,fmt}=UI;
if(!FB.user()){location.replace('../login/index.html');return;}
let draft=[],visible=[],selected=new Set(),deliveryPlaceId='fireball';
const materials=()=>FB.data.materials.filter(m=>!m.deleted&&!m.archived&&m.versions.some(v=>!v.deleted&&v.state==='사용'));
const suppliers=()=>FB.data.suppliers.filter(s=>!s.archived);
const supplierName=o=>FB.data.suppliers.find(s=>s.id===o.supplierId)?.name||o.supplier;
const status=o=>o.closed?'closed':o.received>=o.qty?'done':o.received?'partial':'pending';
const statusLabel=o=>({closed:'잔량 마감',done:'입고 완료',partial:'부분 입고',pending:'입고 전'})[status(o)];
const remaining=o=>o.closed?0:Math.max(0,o.qty-o.received);
function renderDraft(){
 $('draftRows').innerHTML=draft.map((r,i)=>'<tr data-row="'+i+'"><td><input data-field="date" type="date" required value="'+esc(r.date)+'"></td><td>'+SearchPicker.markup(materials().find(m=>m.id===r.mid)?materials().find(m=>m.id===r.mid).name+' · '+r.mid:'','제품명')+'</td><td><select data-field="vid" aria-label="버전" required>'+UI.options((FB.data.materials.find(m=>m.id===r.mid)?.versions||[]).filter(v=>!v.deleted&&v.state==='사용').map(v=>[v.id,v.id+' · '+(v.market||'공용 사용')]),r.vid)+'</select></td><td><input data-field="spec" aria-label="규격" maxlength="80" placeholder="예: 44.5 × 49.5 mm" required value="'+esc(r.spec)+'"></td><td><input data-field="qty" aria-label="발주 수량" type="number" min="1" step="1" required value="'+esc(r.qty)+'"></td><td><input data-field="unitPrice" aria-label="단가 원 부가세 별도" type="number" min="0" step="1" required value="'+esc(r.unitPrice)+'"></td><td>'+SearchPicker.markup(suppliers().find(s=>s.id===r.supplierId)?.name||'','업체')+'</td><td><input data-field="note" aria-label="메모" maxlength="200" value="'+esc(r.note)+'"></td><td><button type="button" data-remove="'+i+'">삭제</button></td></tr>').join('');
 document.querySelectorAll('#draftRows tr').forEach(row=>{
 const r=draft[Number(row.dataset.row)],pickers=row.querySelectorAll('.search-picker');
 SearchPicker.bind(pickers[0],materials().map(m=>({id:m.id,label:m.name+' · '+m.id})),id=>{r.mid=id;r.vid=materials().find(m=>m.id===id)?.versions.find(v=>!v.deleted&&v.state==='사용')?.id||'';renderDraft();});
 SearchPicker.bind(pickers[1],suppliers().map(s=>({id:s.id,label:s.name})),id=>{r.supplierId=id;});
 });
 $('orderError').textContent=suppliers().length?'':'먼저 업체 관리에서 업체를 등록하세요.';
}
function addRow(mid=''){
 const m=materials().find(m=>m.id===mid),last=draft[draft.length-1];
 draft.push({date:last?.date||FB.day(),mid:m?.id||'',vid:m?.versions.find(v=>!v.deleted&&v.state==='사용')?.id||'',spec:'',unitPrice:'',qty:'',supplierId:last?.supplierId||'',note:'',due:''});renderDraft();
}
function start(mid=''){if(!UI.allowWrite())return;if(draft.length){$('orderEditor').hidden=false;return;}$('orderEditor').hidden=false;deliveryPlaceId='fireball';$('deliveryAddress').value=FB.defaultDeliveryAddress;renderDeliveryPresets();$('orderPerson').value=FB.user()?.name||FB.user()?.id||'';addRow(mid);$('orderEditor').scrollIntoView({behavior:'smooth',block:'start'});}
function deliveryPlaces(){
 return [{id:'fireball',label:'파이어볼',address:FB.defaultDeliveryAddress},...FB.data.suppliers.filter(s=>!s.archived&&s.name.replace(/주식회사|\(주\)|㈜|\s/g,'')!=='파이어볼').map(s=>({id:'supplier:'+s.id,label:s.name,address:s.address||''}))];
}
function renderDeliveryPresets(){
 const current=$('deliveryAddress').value.trim(),places=deliveryPlaces();
 const match=places.find(p=>p.id===deliveryPlaceId&&p.address===current)||places.find(p=>p.address&&p.address===current);
 deliveryPlaceId=match?.id||'';
 $('deliveryPreset').value=deliveryPlaceId;
 $('deliveryPresetPicker').innerHTML=SearchPicker.markup(match?.label||'','납품처 업체명');
 SearchPicker.bind($('deliveryPresetPicker').querySelector('.search-picker'),[{id:'',label:'직접입력'},...places.map(p=>({id:p.id,label:p.label}))],id=>{
  const place=places.find(p=>p.id===id);deliveryPlaceId=id;$('deliveryAddress').value=place?.address||'';renderDeliveryPresets();
  if(!place||!place.address)$('deliveryAddress').focus();
 });
}
$('deliveryAddress').oninput=()=>{deliveryPlaceId='';renderDeliveryPresets();};
function render(){
 renderDeliveryPresets();
 $('startOrder').hidden=!FB.canAdmin();
 const chosen=$('supplierFilter').value;$('supplierFilter').innerHTML='<option value="">전체 업체</option>'+UI.options(FB.data.suppliers.map(s=>[s.id,s.name+(s.archived?' · 거래 중단':'')]),chosen);
 $('productFilterPicker').innerHTML=SearchPicker.markup(FB.data.materials.find(m=>m.id===$('orderSearch').value)?.name||'','제품명');
 SearchPicker.bind($('productFilterPicker').querySelector('.search-picker'),[{id:'',label:'전체 제품'},...FB.data.materials.filter(m=>!m.deleted).map(m=>({id:m.id,label:m.name+' · '+m.id}))],id=>{$('orderSearch').value=id;render();});
 $('supplierFilterPicker').innerHTML=SearchPicker.markup(FB.data.suppliers.find(s=>s.id===$('supplierFilter').value)?.name||'','업체');
 SearchPicker.bind($('supplierFilterPicker').querySelector('.search-picker'),[{id:'',label:'전체 업체'},...FB.data.suppliers.map(s=>({id:s.id,label:s.name+(s.archived?' · 거래 중단':'')}))],id=>{$('supplierFilter').value=id;render();});
 const q=$('orderSearch').value.trim().toLowerCase(),supplier=$('supplierFilter').value,state=$('statusFilter').value,from=$('fromDate').value,to=$('toDate').value;
 visible=FB.data.orders.filter(o=>(!supplier||o.supplierId===supplier)&&(!state||status(o)===state)&&(!from||o.date>=from)&&(!to||o.date<=to)&&(!q||[o.name,o.mid,o.id,o.note].join(' ').toLowerCase().includes(q))).slice().sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
 $('orderCount').textContent=visible.length+'건';
 $('orderRows').innerHTML=visible.map(o=>'<tr><td><input type="checkbox" data-select="'+esc(o.id)+'" aria-label="'+esc(o.id)+' 선택" '+(selected.has(o.id)?'checked':'')+'></td><td>'+esc(o.date)+'<small>'+esc(o.id)+'</small></td><td>'+esc(FB.data.materials.find(m=>m.id===o.mid)?.name||o.name)+'</td><td>'+esc(o.vid)+'</td><td class="num">'+fmt(o.qty)+'개</td><td><a href="../suppliers/index.html?supplier='+encodeURIComponent(o.supplierId)+'">'+esc(supplierName(o))+'</a></td><td>'+esc(o.note)+'</td><td><span>'+esc(o.due||'미정')+'</span>'+'</td><td><span class="badge">'+statusLabel(o)+'</span></td><td>'+fmt(o.received)+' / '+fmt(remaining(o))+'개</td><td class="order-receipt-cell">'+(o.closed||o.received>=o.qty?'<span class="receipt-control page-note">처리 완료</span>':FB.canAdmin()?'<button class="receipt-control primary" type="button" data-receive="'+esc(o.id)+'">입고 완료</button>':'<span class="receipt-control page-note">조회 전용</span>')+'</td><td class="order-edit-cell">'+(FB.canAdmin()?'<button type="button" data-edit-order="'+esc(o.id)+'">수정</button>':'—')+'</td></tr>').join('')||'<tr><td colspan="12" class="empty">발주 내역이 없습니다.</td></tr>';
 const n=visible.filter(o=>selected.has(o.id)).length;$('selectAll').checked=!!visible.length&&n===visible.length;$('selectAll').indeterminate=n>0&&n<visible.length;$('previewSelected').disabled=!selected.size;
}
let editingOrder=null,editingRevision=0,editingMid='',editingSupplier='';
function editVersions(value){const m=FB.data.materials.find(m=>m.id===editingMid);$('editOrderVersion').innerHTML=UI.options((m?.versions||[]).filter(v=>v.id===value||(!v.deleted&&v.state==='사용')).map(v=>[v.id,v.id]),value);}
$('orderRows').addEventListener('click',e=>{
 const button=e.target.closest('[data-edit-order]');if(!button||!UI.allowWrite())return;
 const o=FB.data.orders.find(o=>o.id===button.dataset.editOrder);if(!o)return;
 editingOrder=structuredClone(o);editingRevision=FB.data.revision;editingMid=o.mid;editingSupplier=o.supplierId;
 const received=FB.data.transactions.some(t=>t.order===o.id)||(o.receipts||[]).some(r=>!r.deleted);
 $('editOrderName').textContent=o.id+' · '+o.name;
 for(const [id,key] of [['editOrderDate','date'],['editOrderDue','due'],['editOrderSpec','spec'],['editOrderQty','qty'],['editOrderPrice','unitPrice'],['editOrderPerson','person'],['editOrderNote','note'],['editOrderAddress','deliveryAddress']])$(id).value=o[key]??'';
 $('editOrderQty').min=Math.max(1,o.received);$('editOrderQty').readOnly=!!o.closed;
 $('editOrderMaterial').innerHTML=SearchPicker.markup(o.name,'제품명');
 const materialPicker=$('editOrderMaterial').querySelector('.search-picker');
 if(received){materialPicker.querySelectorAll('input,button').forEach(el=>el.disabled=true);}else SearchPicker.bind(materialPicker,FB.data.materials.filter(m=>m.id===o.mid||(!m.deleted&&!m.archived)).map(m=>({id:m.id,label:m.name+' · '+m.id})),id=>{editingMid=id;editVersions('');});
 editVersions(o.vid);$('editOrderVersion').disabled=received;
 $('editOrderSupplier').innerHTML=SearchPicker.markup(supplierName(o),'업체');
 SearchPicker.bind($('editOrderSupplier').querySelector('.search-picker'),FB.data.suppliers.filter(s=>!s.archived||s.id===o.supplierId).map(s=>({id:s.id,label:s.name})),id=>editingSupplier=id);
 $('editOrderHelp').textContent=received?'입고 기록이 있어 제품·버전은 보호됩니다. 발주 수량은 정상 입고 수량보다 적게 수정할 수 없습니다.':'수정한 내용은 발주 내역·업체 이력·입고 대기에 함께 반영됩니다.';
 $('orderEditError').textContent='';$('orderEditDialog').showModal();
});
$('closeOrderEdit').onclick=$('cancelOrderEdit').onclick=()=>$('orderEditDialog').close();
$('orderEditForm').onsubmit=e=>{
 e.preventDefault();if(!UI.allowWrite())return;
 const button=$('saveOrderEdit');button.disabled=true;
 try{FB.updateOrder({id:editingOrder.id,revision:editingRevision,mid:editingMid,vid:$('editOrderVersion').value,supplierId:editingSupplier,date:$('editOrderDate').value,due:$('editOrderDue').value,spec:$('editOrderSpec').value,qty:Number($('editOrderQty').value),unitPrice:$('editOrderPrice').value,person:$('editOrderPerson').value,note:$('editOrderNote').value,deliveryAddress:$('editOrderAddress').value});$('orderEditDialog').close();UI.toast('발주 정보를 수정했습니다.');}catch(err){$('orderEditError').textContent=err.message;}finally{button.disabled=false;}
};
$('startOrder').onclick=()=>start();
$('addRow').onclick=()=>{if(UI.allowWrite())addRow();};
$('cancelOrder').onclick=()=>{if(draft.some(r=>r.mid||r.qty||r.note)&&!confirm('작성 중인 발주를 닫을까요? 저장되지 않은 내용은 사라집니다.'))return;draft=[];$('orderEditor').hidden=true;};
$('draftRows').oninput=e=>{const row=e.target.closest('[data-row]');if(!row)return;const r=draft[Number(row.dataset.row)];if(e.target.dataset.field)r[e.target.dataset.field]=e.target.value;};
$('draftRows').onchange=e=>{if(!e.target.dataset.field)return;const r=draft[Number(e.target.closest('[data-row]').dataset.row)];r[e.target.dataset.field]=e.target.value;if(e.target.dataset.field==='mid'){r.vid=FB.data.materials.find(m=>m.id===r.mid)?.versions.find(v=>!v.deleted&&v.state==='사용')?.id||'';renderDraft();}};
$('draftRows').onclick=e=>{const button=e.target.closest('[data-remove]');if(!button)return;draft.splice(Number(button.dataset.remove),1);if(!draft.length)addRow();else renderDraft();};
$('orderForm').onsubmit=e=>{e.preventDefault();if(!UI.allowWrite())return;const button=$('saveOrders');button.disabled=true;try{const ids=FB.createOrders(draft.map(r=>({...r,person:$('orderPerson').value,deliveryAddress:$('deliveryAddress').value})));draft=[];$('orderEditor').hidden=true;ids.forEach(id=>selected.add(id));render();UI.toast(ids.length+'개 품목의 발주를 저장했습니다.');}catch(err){$('orderError').textContent=err.message;}finally{button.disabled=false;}};
for(const id of ['orderSearch','supplierFilter','statusFilter','fromDate','toDate'])$(id).addEventListener(id==='orderSearch'?'input':'change',render);
$('resetFilters').onclick=()=>{for(const id of ['orderSearch','supplierFilter','statusFilter','fromDate','toDate'])$(id).value='';render();};
$('selectAll').onchange=e=>{visible.forEach(o=>e.target.checked?selected.add(o.id):selected.delete(o.id));render();};
$('orderRows').onchange=e=>{if(!e.target.dataset.select)return;e.target.checked?selected.add(e.target.dataset.select):selected.delete(e.target.dataset.select);render();};
$('previewDraft').onclick=()=>{
 try{if(!$('deliveryAddress').value.trim())throw Error('이번 발주의 납품주소를 입력하세요.');if(!draft.length)throw Error('발주할 품목을 추가하세요.');
 const rows=draft.map(r=>{
 const m=FB.data.materials.find(m=>m.id===r.mid&&!m.deleted&&!m.archived),supplier=FB.data.suppliers.find(s=>s.id===r.supplierId&&!s.archived);
 if(!r.spec?.trim()||String(r.unitPrice).trim()===''||!Number.isSafeInteger(Number(r.unitPrice))||Number(r.unitPrice)<0)throw Error('규격과 0원 이상의 정수 단가를 입력하세요.');
 if(!m||!supplier||!r.date||!Number.isSafeInteger(Number(r.qty))||Number(r.qty)<1||!m.versions.some(v=>v.id===r.vid&&v.state==='사용'&&!v.deleted))throw Error('날짜·제품·버전·수량·업체를 모두 입력하세요.');
 return {...r,qty:Number(r.qty),spec:r.spec.trim(),unitPrice:Number(r.unitPrice),supplyAmount:Number(r.qty)*Number(r.unitPrice),taxAmount:Math.round(Number(r.qty)*Number(r.unitPrice)*0.1),taxRate:0.1,name:m.name,supplier:supplier.name,person:$('orderPerson').value,deliveryAddress:$('deliveryAddress').value.trim(),id:'미저장'};
 });OrderDocument.open(rows);
 }catch(e){$('orderError').textContent=OrderDocument.errorMessage(e);}
};
$('previewSelected').onclick=()=>{const rows=FB.data.orders.filter(o=>selected.has(o.id));if(!rows.length){UI.toast('인쇄할 발주를 선택하세요.');return;}try{OrderDocument.open(rows);}catch(e){UI.toast(OrderDocument.errorMessage(e));}};
window.addEventListener('fb-data',render);render();
const initial=new URLSearchParams(location.search).get('material');if(initial&&FB.canAdmin())start(initial);
})();