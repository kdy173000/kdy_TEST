'use strict';
(()=>{
const {$,esc,fmt}=UI;
if(!FB.user()){location.replace('../login/index.html');return;}
let draft=[],visible=[],selected=new Set();
const materials=()=>FB.data.materials.filter(m=>!m.deleted&&!m.archived&&m.versions.some(v=>!v.deleted&&v.state==='사용'));
const suppliers=()=>FB.data.suppliers.filter(s=>!s.archived);
const supplierName=o=>FB.data.suppliers.find(s=>s.id===o.supplierId)?.name||o.supplier;
const status=o=>o.closed?'closed':o.received>=o.qty?'done':o.received?'partial':'pending';
const statusLabel=o=>({closed:'잔량 마감',done:'입고 완료',partial:'부분 입고',pending:'입고 전'})[status(o)];
const remaining=o=>o.closed?0:Math.max(0,o.qty-o.received);
function materialOptions(value,q=''){const query=q.trim().toLowerCase();return '<option value="">제품 선택</option>'+UI.options(materials().filter(m=>m.id===value||!query||(m.name+' '+m.id).toLowerCase().includes(query)).map(m=>[m.id,m.name+' · '+m.id]),value);}
function renderDraft(){
 $('draftRows').innerHTML=draft.map((r,i)=>'<tr data-row="'+i+'"><td><input data-field="date" type="date" required value="'+esc(r.date)+'"></td><td><input class="material-search" type="search" aria-label="제품 검색" placeholder="부자재명 · 코드 검색"><select data-field="mid" aria-label="제품명" required>'+materialOptions(r.mid)+'</select></td><td><select data-field="vid" aria-label="버전" required>'+UI.options((FB.data.materials.find(m=>m.id===r.mid)?.versions||[]).filter(v=>!v.deleted&&v.state==='사용').map(v=>[v.id,v.id+' · '+(v.market||'공용 사용')]),r.vid)+'</select></td><td><input data-field="qty" aria-label="발주 수량" type="number" min="1" step="1" required value="'+esc(r.qty)+'"></td><td><select data-field="supplierId" aria-label="업체" required><option value="">업체 선택</option>'+UI.options(suppliers().map(s=>[s.id,s.name]),r.supplierId)+'</select></td><td><input data-field="note" aria-label="메모" maxlength="200" value="'+esc(r.note)+'"></td><td><input data-field="due" aria-label="입고 예정일" type="date" value="'+esc(r.due)+'"></td><td><button type="button" data-remove="'+i+'">삭제</button></td></tr>').join('');
 $('orderError').textContent=suppliers().length?'':'먼저 업체 관리에서 업체를 등록하세요.';
}
function addRow(mid=''){
 const m=materials().find(m=>m.id===mid),last=draft[draft.length-1];
 draft.push({date:last?.date||FB.day(),mid:m?.id||'',vid:m?.versions.find(v=>!v.deleted&&v.state==='사용')?.id||'',qty:'',supplierId:last?.supplierId||'',note:'',due:last?.due||''});renderDraft();
}
function start(mid=''){if(!UI.allowWrite())return;if(draft.length){$('orderEditor').hidden=false;return;}$('orderEditor').hidden=false;$('orderPerson').value=FB.user()?.name||FB.user()?.id||'';addRow(mid);$('orderEditor').scrollIntoView({behavior:'smooth',block:'start'});}
function render(){
 $('startOrder').hidden=!FB.canAdmin();
 const chosen=$('supplierFilter').value;$('supplierFilter').innerHTML='<option value="">전체 업체</option>'+UI.options(FB.data.suppliers.map(s=>[s.id,s.name+(s.archived?' · 거래 중단':'')]),chosen);
 const q=$('orderSearch').value.trim().toLowerCase(),supplier=$('supplierFilter').value,state=$('statusFilter').value,from=$('fromDate').value,to=$('toDate').value;
 visible=FB.data.orders.filter(o=>(!supplier||o.supplierId===supplier)&&(!state||status(o)===state)&&(!from||o.date>=from)&&(!to||o.date<=to)&&(!q||[o.name,o.mid,o.id,o.note].join(' ').toLowerCase().includes(q))).slice().sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
 $('orderCount').textContent=visible.length+'건';
 $('orderRows').innerHTML=visible.map(o=>'<tr><td><input type="checkbox" data-select="'+esc(o.id)+'" aria-label="'+esc(o.id)+' 선택" '+(selected.has(o.id)?'checked':'')+'></td><td>'+esc(o.date)+'<small>'+esc(o.id)+'</small></td><td>'+esc(FB.data.materials.find(m=>m.id===o.mid)?.name||o.name)+'</td><td>'+esc(o.vid)+'</td><td class="num">'+fmt(o.qty)+'개</td><td><a href="../suppliers/index.html?supplier='+encodeURIComponent(o.supplierId)+'">'+esc(supplierName(o))+'</a></td><td>'+esc(o.note)+'</td><td><span class="badge">'+statusLabel(o)+'</span></td><td>'+fmt(o.received)+' / '+fmt(remaining(o))+'개</td><td><a href="../procurement/index.html?material='+encodeURIComponent(o.mid)+'">재고·입고</a></td></tr>').join('')||'<tr><td colspan="10" class="empty">발주 내역이 없습니다.</td></tr>';
 const n=visible.filter(o=>selected.has(o.id)).length;$('selectAll').checked=!!visible.length&&n===visible.length;$('selectAll').indeterminate=n>0&&n<visible.length;$('downloadOrders').disabled=!selected.size;
}
$('startOrder').onclick=()=>start();
$('addRow').onclick=()=>{if(UI.allowWrite())addRow();};
$('cancelOrder').onclick=()=>{if(draft.some(r=>r.mid||r.qty||r.note)&&!confirm('작성 중인 발주를 닫을까요? 저장되지 않은 내용은 사라집니다.'))return;draft=[];$('orderEditor').hidden=true;};
$('draftRows').oninput=e=>{const row=e.target.closest('[data-row]');if(!row)return;const r=draft[Number(row.dataset.row)];if(e.target.classList.contains('material-search')){row.querySelector('[data-field="mid"]').innerHTML=materialOptions(r.mid,e.target.value);return;}if(e.target.dataset.field)r[e.target.dataset.field]=e.target.value;};
$('draftRows').onchange=e=>{if(!e.target.dataset.field)return;const r=draft[Number(e.target.closest('[data-row]').dataset.row)];r[e.target.dataset.field]=e.target.value;if(e.target.dataset.field==='mid'){r.vid=FB.data.materials.find(m=>m.id===r.mid)?.versions.find(v=>!v.deleted&&v.state==='사용')?.id||'';renderDraft();}};
$('draftRows').onclick=e=>{const button=e.target.closest('[data-remove]');if(!button)return;draft.splice(Number(button.dataset.remove),1);if(!draft.length)addRow();else renderDraft();};
$('orderForm').onsubmit=e=>{e.preventDefault();if(!UI.allowWrite())return;const button=$('saveOrders');button.disabled=true;try{const ids=FB.createOrders(draft.map(r=>({...r,person:$('orderPerson').value})));draft=[];$('orderEditor').hidden=true;ids.forEach(id=>selected.add(id));render();UI.toast(ids.length+'개 품목의 발주를 저장했습니다.');}catch(err){$('orderError').textContent=err.message;}finally{button.disabled=false;}};
for(const id of ['orderSearch','supplierFilter','statusFilter','fromDate','toDate'])$(id).addEventListener(id==='orderSearch'?'input':'change',render);
$('resetFilters').onclick=()=>{for(const id of ['orderSearch','supplierFilter','statusFilter','fromDate','toDate'])$(id).value='';render();};
$('selectAll').onchange=e=>{visible.forEach(o=>e.target.checked?selected.add(o.id):selected.delete(o.id));render();};
$('orderRows').onchange=e=>{if(!e.target.dataset.select)return;e.target.checked?selected.add(e.target.dataset.select):selected.delete(e.target.dataset.select);render();};
$('downloadOrders').onclick=()=>{
 const rows=FB.data.orders.filter(o=>selected.has(o.id));if(!rows.length)return;
 const cell=value=>{let text=String(value??'');if(/^[=+@\t\r-]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
 const data=[['날짜','제품명','버전','수량','업체','메모','입고 예정일','발주번호','입고 상태'],...rows.map(o=>[o.date,o.name,o.vid,o.qty,supplierName(o),o.note,o.due,o.id,statusLabel(o)])];
 const blob=new Blob(['\uFEFF'+data.map(row=>row.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='발주내역_'+FB.day()+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
window.addEventListener('fb-data',render);render();
const initial=new URLSearchParams(location.search).get('material');if(initial&&FB.canAdmin())start(initial);
})();