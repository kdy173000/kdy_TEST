'use strict';
window.BOMView=(()=>{
  const {$,esc,fmt}=UI;
  let pid=FB.data.products[0].id,index=0,editable=false;
  const product=()=>FB.data.products.find(p=>p.id===pid),current=()=>product().boms[index];
  const mat=id=>FB.data.materials.find(m=>m.id===id),ver=r=>mat(r.mid).versions.find(v=>v.id===r.vid);
  const materialLabel=m=>m.name+' · '+m.id;
  const addCandidates=()=>FB.data.materials.filter(m=>!m.deleted&&!m.archived&&(!m.scope||m.scope===pid)&&m.versions.some(v=>v.state==='사용'));
  function resolveMaterial(value,candidates){const text=value.trim();const exact=candidates.find(m=>materialLabel(m)===text||m.id===text);if(exact)return exact;const names=candidates.filter(m=>m.name===text);return names.length===1?names[0]:null;}
  function render(){
    const p=product(),b=current();$('bomProductPhoto').innerHTML=Photos.markup('product',p.id,p.name,'detail',true);if($('productionVersion')){$('productionVersion').innerHTML=UI.options(p.versions.filter(v=>v.state==='사용').map(v=>[v.id,v.id+' · '+fmt(v.qty)+'개']),$('productionVersion').value);}
    $('familySelect').innerHTML=UI.options(FB.families.map((f,i)=>[i,f]).filter(([i])=>FB.data.products.some(x=>x.family===i&&(!x.archived||x.id===pid))),p.family);
    $('finishedProductSelect').innerHTML=UI.options(FB.data.products.filter(x=>x.family===p.family&&(!x.archived||x.id===pid)).map(x=>[x.id,x.name]),p.id);
    $('bomState').textContent=b.locked?'사용된 BOM · 잠금':editable?'편집 가능':'생산용 구성';
    $('copyBom').hidden=!editable||!b.locked;
    $('bomHelp').textContent=p.sample?'샘플 구성입니다. 재고관리팀이 수정 버튼으로 구성을 변경할 수 있습니다.':editable?(b.locked?'생산에 사용된 구성입니다. 수정 가능한 구성을 만든 뒤 변경하세요.':'부자재명 또는 코드를 검색해 선택하세요. 변경 내용은 즉시 저장됩니다.'):'완제품에 연결된 BOM입니다. 재고관리팀은 위의 수정 버튼으로 구성을 변경할 수 있습니다.';
    $('bomLines').innerHTML=b.rows.map((r,i)=>{
      const m=mat(r.mid),v=ver(r),disabled=!editable||b.locked;
      const candidates=FB.data.materials.filter(x=>x.id===r.mid||(!x.deleted&&!x.archived&&x.slot===m.slot&&(!x.scope||x.scope===p.id)&&x.versions.some(v=>v.state==='사용')));
      return `<tr><td>${esc(r.slot)}</td><td><div class="bom-photo-choice">${Photos.markup('material',m.id,m.name,'row',true)}<input type="search" class="bom-material-search" aria-label="${esc(r.slot)} 부자재명 또는 코드 검색" placeholder="부자재명 · 코드 검색" list="bomMaterials-${i}" data-row="${i}" data-key="mid" value="${esc(materialLabel(m))}" ${disabled?'disabled':''}><datalist id="bomMaterials-${i}">${candidates.map(x=>`<option value="${esc(materialLabel(x))}"></option>`).join('')}</datalist></div></td><td><select aria-label="${esc(r.slot)} 버전" data-row="${i}" data-key="vid" ${disabled?'disabled':''}>${UI.options(m.versions.filter(x=>x.state==='사용'||x.id===r.vid).map(x=>[x.id,x.id+(x.state!=='사용'?' · 중단':'')]),r.vid)}</select></td><td><input aria-label="${esc(r.slot)} 개당 수량" data-row="${i}" data-key="each" type="number" min="1" step="1" value="${r.each}" ${disabled?'disabled':''}></td><td class="num">${fmt(v.qty)}개</td><td class="num" data-need="${i}"></td><td class="bom-row-actions">${editable?`<button type="button" data-remove-row="${i}" ${disabled?'disabled':''}>삭제</button>`:''}</td></tr>`;
    }).join('');
    if(editable){$('bomAddMaterial').value='';$('bomAddOptions').innerHTML=addCandidates().map(m=>`<option value="${esc(materialLabel(m))}">${esc(m.slot)}</option>`).join('');$('bomAddMaterial').disabled=b.locked;$('bomAddRow').disabled=b.locked;}
    Photos.refresh();update();
  }
  function update(){const q=Number($('productionQty').value),b=current();let short=0,valid=true;try{short=FB.requirements(pid,index,q).filter(r=>{const m=mat(r.mid),v=ver(r);return m.archived||v.state!=='사용'||v.qty<r.qty;}).length;}catch{valid=false;}
    document.querySelectorAll('[data-need]').forEach(el=>{const r=b.rows[Number(el.dataset.need)],v=ver(r);el.textContent=valid?fmt(r.each*q)+'개':'—';el.classList.toggle('shortage',valid&&(v.qty<r.each*q||mat(r.mid).archived||v.state!=='사용'));});
    $('productionSummary').textContent=!valid?'1 이상의 생산 수량을 입력하세요.':short?`부자재 ${short}종 재고 부족 또는 사용 중단 · 생산 등록 불가`:`${fmt(q)}개 생산 · 부자재 ${b.rows.length}종 사용`;
    $('productionSummary').classList.toggle('shortage',short>0);
    if($('finishedSummary'))$('finishedSummary').textContent='완제품 재고 '+fmt(product().finished)+'개';
  }
  function bind(edit=false){editable=edit&&FB.canAdmin();
    $('familySelect').onchange=e=>{pid=FB.data.products.find(p=>p.family===Number(e.target.value)&&!p.archived).id;index=product().boms.length-1;render();};
    $('finishedProductSelect').onchange=e=>{pid=e.target.value;index=product().boms.length-1;render();};
$('productionQty').oninput=update;
    $('copyBom').onclick=()=>{try{index=FB.copyBom(pid,index);render();UI.toast('새 BOM을 만들었습니다.');}catch(e){$('bomError').textContent=e.message;}};
    $('bomLines').onchange=e=>{if(!editable||!e.target.dataset.key)return;const i=Number(e.target.dataset.row),r={...current().rows[i]},key=e.target.dataset.key;try{if(key==='mid'){const picked=resolveMaterial(e.target.value,FB.data.materials.filter(m=>!m.deleted&&!m.archived&&m.slot===mat(r.mid).slot&&(!m.scope||m.scope===pid)&&m.versions.some(v=>v.state==='사용')));if(!picked)throw Error('검색 목록에서 연결할 부자재를 선택해주세요.');r.mid=picked.id;r.vid=picked.versions.find(v=>v.state==='사용').id;}else r[key]=key==='each'?Number(e.target.value):e.target.value;FB.updateBom(pid,index,i,r);$('bomError').textContent='';render();UI.toast('BOM 구성을 저장했습니다.');}catch(err){$('bomError').textContent=err.message;render();}};
    if(editable){$('bomAddRow').onclick=()=>{try{const picked=resolveMaterial($('bomAddMaterial').value,addCandidates());if(!picked)throw Error('검색 목록에서 추가할 부자재를 선택해주세요.');FB.addBomRow(pid,index,picked.id);$('bomError').textContent='';render();}catch(e){$('bomError').textContent=e.message;}};$('bomLines').onclick=e=>{const b=e.target.closest('[data-remove-row]');if(!b)return;try{FB.removeBomRow(pid,index,Number(b.dataset.removeRow));render();}catch(err){$('bomError').textContent=err.message;}};}
    render();
  }
  return {bind,render,update,get pid(){return pid;},get index(){return index;},select(id){pid=id||FB.data.products[0].id;index=product().boms.length-1;render();}};
})();
