'use strict';
(()=>{
const {$,fmt}=UI;let orderId='';
function preview(){
 const o=FB.data.orders.find(o=>o.id===orderId);if(!o)return;
 const quantity=Number($('closeActual').value),bad=Number($('closeDefective').value),good=quantity-bad;
 $('closeRemaining').value=Math.max(0,o.qty-(o.delivered??o.received)-Math.max(0,quantity));
 const remaining=Math.max(0,o.qty-o.received-Math.max(0,good)),extra=Math.max(0,o.received+good-o.qty);
 $('closeReceiptSummary').textContent=bad>quantity?'불량 수량은 입고 수량 이하로 입력하세요.':'이번 정상 입고 '+fmt(Math.max(0,good))+'개 · 정상 수량 기준 추가 입고 필요 '+fmt(remaining)+'개'+(extra?' · 정상 수량 초과 '+fmt(extra)+'개':'');
}
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-receive]');if(!button||!UI.allowWrite())return;
 const o=FB.data.orders.find(o=>o.id===button.dataset.receive),m=FB.data.materials.find(m=>m.id===o?.mid);
 if(!o||!m||o.closed||o.received>=o.qty){UI.toast('입고 대기 중인 발주를 선택하세요.');return;}
 orderId=o.id;$('closeOrderName').textContent=o.id+' · '+o.name;$('closeOrdered').textContent=fmt(o.qty)+'개';$('closeReceived').textContent=fmt(o.received)+'개';$('closeOrderedVersion').value=o.vid;
 $('closeReceiptVersion').innerHTML=UI.options(m.versions.filter(v=>!v.deleted&&(v.state==='사용'||v.id===o.vid)).map(v=>[v.id,v.id]),o.vid);
 $('closeActual').value='';$('closeDefective').value=0;$('closeReceiptDate').value=FB.day();$('closeReceiptPerson').value=FB.user()?.name||'';$('closeReceiptNote').value='';$('closeOrderError').textContent='';preview();$('closeOrderDialog').showModal();
});
for(const id of ['dismissCloseOrder','keepOrder'])$(id).onclick=()=>$('closeOrderDialog').close();
$('closeActual').oninput=preview;$('closeDefective').oninput=preview;
$('closeReceiptForm').onsubmit=e=>{
 e.preventDefault();if(!UI.allowWrite())return;
 const button=$('confirmCloseOrder');button.disabled=true;
 try{FB.receiveOrder({id:orderId,vid:$('closeReceiptVersion').value,qty:Number($('closeActual').value),defective:Number($('closeDefective').value),finish:false,date:$('closeReceiptDate').value,person:$('closeReceiptPerson').value,note:$('closeReceiptNote').value});$('closeOrderDialog').close();UI.toast('실제 입고 수량과 비고를 저장했습니다.');}catch(err){$('closeOrderError').textContent=err.message;}finally{button.disabled=false;}
};
})();