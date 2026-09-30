'use strict';
window.BOMView=(()=>{
  const {$,esc,fmt}=UI;
  let pid=FB.data.products[0].id,index=0,editable=false;
  const product=()=>FB.data.products.find(p=>p.id===pid),current=()=>product().boms[index];
  const mat=id=>FB.data.materials.find(m=>m.id===id),ver=r=>mat(r.mid).versions.find(v=>v.id===r.vid);
  function render(){
    const p=product(),b=current();
    $('familySelect').innerHTML=UI.options(FB.families.map((f,i)=>[i,f]),p.family);
    $('finishedProductSelect').innerHTML=UI.options(FB.data.products.filter(x=>x.family===p.family).map(x=>[x.id,x.name]),p.id);
    $('bomSelect').innerHTML=UI.options(p.boms.map((b,i)=>[i,b.name+(b.locked?' · 사용됨':' · 기본 구성')]),index);
    $('bomState').textContent=b.locked?'사용된 BOM · 잠금':editable?'편집 가능':'생산용 구성';
    $('copyBom').hidden=!editable;
    $('bomHelp').textContent=p.sample?'샘플 구성입니다. 실제 사양은 관리자 설정에서 변경하세요.':editable?(b.locked?'사용된 구성입니다. 복사 후 수정하세요.':'종류·버전·개당 수량을 변경하면 기본 구성이 저장됩니다.'):'관리자가 등록한 BOM입니다. 부자재 구성 변경은 관리자 설정에서 가능합니다.';
    $('bomLines').innerHTML=b.rows.map((r,i)=>{
      const m=mat(r.mid),v=ver(r),disabled=!editable||b.locked;
      const candidates=FB.data.materials.filter(x=>x.id===r.mid||(!x.archived&&x.slot===m.slot&&(!x.scope||x.scope===p.id)&&x.versions.some(v=>v.state==='사용')));
      return `<tr><td>${esc(r.slot)}</td><td><select aria-label="${esc(r.slot)} 종류" data-row="${i}" data-key="mid" ${disabled?'disabled':''}>${UI.options(candidates.map(x=>[x.id,x.name+(x.archived?' · 중단':'')]),r.mid)}</select></td><td><select aria-label="${esc(r.slot)} 버전" data-row="${i}" data-key="vid" ${disabled?'disabled':''}>${UI.options(m.versions.filter(x=>x.state==='사용'||x.id===r.vid).map(x=>[x.id,x.id+(x.state!=='사용'?' · 중단':'')]),r.vid)}</select></td><td><input aria-label="${esc(r.slot)} 개당 수량" data-row="${i}" data-key="each" type="number" min="1" step="1" value="${r.each}" ${disabled?'disabled':''}></td><td class="num">${fmt(v.qty)}개</td><td class="num" data-need="${i}"></td>${editable?`<td><button type="button" data-remove-row="${i}" ${disabled?'disabled':''}>삭제</button></td>`:''}</tr>`;
    }).join('');
    if(editable){$('bomAddMaterial').innerHTML=UI.options(FB.data.materials.filter(m=>!m.archived&&(!m.scope||m.scope===p.id)&&m.versions.some(v=>v.state==='사용')).map(m=>[m.id,m.slot+' · '+m.name]),'');$('bomAddRow').disabled=b.locked;}
    update();
  }
  function update(){const q=Number($('productionQty').value),b=current();let short=0,valid=true;try{short=FB.requirements(pid,index,q).filter(r=>{const m=mat(r.mid),v=ver(r);return m.archived||v.state!=='사용'||v.qty<r.qty;}).length;}catch{valid=false;}
    document.querySelectorAll('[data-need]').forEach(el=>{const r=b.rows[Number(el.dataset.need)],v=ver(r);el.textContent=valid?fmt(r.each*q)+'개':'—';el.classList.toggle('shortage',valid&&(v.qty<r.each*q||mat(r.mid).archived||v.state!=='사용'));});
    $('productionSummary').textContent=!valid?'1 이상의 생산 수량을 입력하세요.':short?`부자재 ${short}종 재고 부족 또는 사용 중단 · 생산 등록 불가`:`${fmt(q)}개 생산 · 부자재 ${b.rows.length}종 사용`;
    $('productionSummary').classList.toggle('shortage',short>0);
    if($('finishedSummary'))$('finishedSummary').textContent='완제품 재고 '+fmt(product().finished)+'개';
  }
  function bind(edit=false){editable=edit&&FB.canAdmin();
    $('familySelect').onchange=e=>{pid=FB.data.products.find(p=>p.family===Number(e.target.value)).id;index=product().boms.length-1;render();};
    $('finishedProductSelect').onchange=e=>{pid=e.target.value;index=product().boms.length-1;render();};
    $('bomSelect').onchange=e=>{index=Number(e.target.value);render();};$('productionQty').oninput=update;
    $('copyBom').onclick=()=>{try{index=FB.copyBom(pid,index);render();UI.toast('새 BOM을 만들었습니다.');}catch(e){$('bomError').textContent=e.message;}};
    $('bomLines').onchange=e=>{if(!editable||!e.target.dataset.key)return;const i=Number(e.target.dataset.row),r={...current().rows[i]},key=e.target.dataset.key;r[key]=key==='each'?Number(e.target.value):e.target.value;if(key==='mid')r.vid=mat(r.mid).versions.find(v=>v.state==='사용').id;try{FB.updateBom(pid,index,i,r);$('bomError').textContent='';render();UI.toast('BOM 구성을 저장했습니다.');}catch(err){$('bomError').textContent=err.message;render();}};
    if(editable){$('bomAddRow').onclick=()=>{try{FB.addBomRow(pid,index,$('bomAddMaterial').value);$('bomError').textContent='';render();}catch(e){$('bomError').textContent=e.message;}};$('bomLines').onclick=e=>{const b=e.target.closest('[data-remove-row]');if(!b)return;try{FB.removeBomRow(pid,index,Number(b.dataset.removeRow));render();}catch(err){$('bomError').textContent=err.message;}};}
    render();
  }
  return {bind,render,update,get pid(){return pid;},get index(){return index;},select(id){pid=id||FB.data.products[0].id;index=product().boms.length-1;render();}};
})();