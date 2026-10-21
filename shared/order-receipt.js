'use strict';
(()=>{
const {$,fmt}=UI;let orderId='';
function preview(){
 const o=FB.data.orders.find(o=>o.id===orderId);if(!o)return;
 const quantity=Number($('closeActual').value),bad=Number($('closeDefective').value),good=quantity-bad;


 $('closeReceiptSummary').textContent=bad>quantity?'불량 수량은 입고 수량 이하로 입력하세요.':'이번 정상 입고 '+fmt(Math.max(0,good))+'개 · 저장하면 '+($('closeKeepOpen').checked?'입고중으로 유지합니다.':'처리 완료됩니다.');
}
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-receive]');if(!button||!UI.allowWrite())return;
 const o=FB.data.orders.find(o=>o.id===button.dataset.receive),m=FB.data.materials.find(m=>m.id===o?.mid);
 if(!o||!m||!FB.orderIsPending(o)){UI.toast('입고 대기 중인 발주를 선택하세요.');return;}
 orderId=o.id;$('closeKeepOpen').checked=false;$('closeOrderName').textContent=o.id+' · '+o.name;$('closeOrdered').textContent=fmt(o.qty)+'개';$('closeReceived').textContent=fmt(o.received)+'개';
 $('closeReceiptVersion').value=o.vid;
 $('closeActual').value='';$('closeDefective').value=0;$('closeReceiptDate').value=FB.day();$('closeReceiptPerson').value=FB.user()?.name||'';$('closeReceiptNote').value='';$('closeOrderError').textContent='';preview();$('closeOrderDialog').showModal();
});
$('closeKeepOpen').onchange=preview;
for(const id of ['dismissCloseOrder','keepOrder'])$(id).onclick=()=>$('closeOrderDialog').close();
$('closeActual').oninput=preview;$('closeDefective').oninput=preview;
$('closeReceiptForm').onsubmit=e=>{
 e.preventDefault();if(!UI.allowWrite())return;
 const button=$('confirmCloseOrder');button.disabled=true;
 try{FB.receiveOrder({id:orderId,vid:$('closeReceiptVersion').value,qty:Number($('closeActual').value),defective:Number($('closeDefective').value),keepOpen:$('closeKeepOpen').checked,date:$('closeReceiptDate').value,person:$('closeReceiptPerson').value,note:$('closeReceiptNote').value});$('closeOrderDialog').close();UI.toast('실제 입고 수량과 비고를 저장했습니다.');}catch(err){$('closeOrderError').textContent=err.message;}finally{button.disabled=false;}
};
})();