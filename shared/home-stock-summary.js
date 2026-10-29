/* Read-only home stock summaries, using the same data as inventory pages. */
(()=>{
  function summarize(data,today,isPending){
    const products=new Map(),materials=new Map(),expected=new Map();
    const add=(map,id,qty)=>{if(!Number.isFinite(qty)||qty<=0)return;map.set(id,(map.get(id)||0)+qty);};
    for(const p of data.productions||[])if(!p.cancelled&&p.date===today)add(products,p.pid,Number(p.q));
    for(const t of data.transactions||[])if(!t.deleted&&t.date===today&&t.type==='입고'){
      if(t.mid)add(materials,t.mid,Number(t.qty));
      else if(t.pid)add(products,t.pid,Number(t.qty));
    }
    let pendingCount=0;
    for(const o of data.orders||[])if(!o.deleted&&o.due===today&&isPending(o)){add(expected,o.mid,Number(o.qty));pendingCount++;}
    return {products,materials,expected,pendingCount};
  }
  const fmt=n=>new Intl.NumberFormat('ko-KR').format(n);
  function render(){
    const message=document.getElementById('stockSummaryMessage');if(!message)return;
    if(!window.FB){message.textContent='재고 기록을 불러오지 못했어요. 재고 페이지에서 저장 데이터를 확인해주세요.';return;}
    const data=FB.data,today=FB.day(),stats=summarize(data,today,FB.orderIsPending);
    function fill(map,kind,totalId,listId,empty){
      document.getElementById(totalId).textContent=fmt([...map.values()].reduce((a,b)=>a+b,0));
      const list=document.getElementById(listId);list.replaceChildren();
      for(const [id,qty] of map){
        const item=(kind==='product'?data.products:data.materials).find(p=>p.id===id),li=document.createElement('li'),label=document.createElement('span'),amount=document.createElement('span');
        label.className='stock-item-name';label.textContent=item?.name||id;amount.textContent=fmt(qty)+'개';li.append(label,amount);list.append(li);
      }
      if(!map.size){const li=document.createElement('li');li.textContent=empty;list.append(li);}
    }
    fill(stats.products,'product','todayProductQty','todayProductList','오늘 등록된 자재 입고가 없습니다.');
    fill(stats.materials,'material','todayMaterialQty','todayMaterialList','오늘 등록된 부자재 입고가 없습니다.');
    fill(stats.expected,'material','todayExpectedQty','todayExpectedList','오늘로 지정된 입고 예정이 없습니다.');
    document.getElementById('todayExpectedHint').textContent=stats.pendingCount+'건 · 미완료 발주의 발주 수량 기준';
    message.textContent='입고 예정 수량은 발주 수량 기준이며 실제 입고 수량과 다를 수 있어요. 예정일 미정인 발주는 제외됩니다.';
  }
  window.addEventListener('fb-data',render);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
  setInterval(render,60000);
  render();
})();
