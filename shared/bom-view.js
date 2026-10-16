'use strict';
window.BOMView=(()=>{
  const {$,esc,fmt}=UI;
  let pid=FB.data.products[0].id,index=0,editable=false;
  const product=()=>FB.data.products.find(p=>p.id===pid),current=()=>product().boms[index];
  const mat=id=>FB.data.materials.find(m=>m.id===id),ver=r=>mat(r.mid).versions.find(v=>v.id===r.vid);
  const materialLabel=m=>m.name+' · '+m.id;
  const addCandidates=()=>FB.data.materials.filter(m=>!m.deleted&&!m.archived&&(!m.scope||m.scope===pid)&&m.versions.some(v=>v.state==='사용'));
  function resolveMaterial(value,candidates){const text=value.trim();const exact=candidates.find(m=>materialLabel(m)===text||m.id===text);if(exact)return exact;const names=candidates.filter(m=>m.name===text);return names.length===1?names[0]:null;}

  const searchKey=v=>v.normalize('NFKC').toLowerCase().replace(/\s+/g,'');
  function picker(id,value,label,disabled=false,attrs=''){return `<div class="bom-picker"><div class="bom-picker-field"><input id="${id}" type="search" class="bom-material-search" role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="${id}-results" aria-label="${esc(label)}" autocomplete="off" placeholder="부자재명 · 코드 검색" value="${esc(value)}" ${disabled?'disabled':''} ${attrs}><button type="button" class="bom-picker-toggle" aria-label="부자재 목록 열기" ${disabled?'disabled':''}>▾</button></div><div id="${id}-results" class="bom-picker-list" role="listbox" hidden></div></div>`;}
  function setupPicker(input,candidates,onPick){
    const box=input.closest('.bom-picker'),list=box.querySelector('.bom-picker-list'),toggle=box.querySelector('.bom-picker-toggle');let matches=[],active=-1;
    const close=()=>{list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');};
    const choose=m=>{input.value=materialLabel(m);close();onPick(m);};
    function show(all=false){if(input.disabled)return;matches=candidates.filter(m=>all||searchKey(materialLabel(m)).includes(searchKey(input.value)));active=-1;list.replaceChildren();
      if(!matches.length){const el=document.createElement('span');el.className='bom-picker-empty';el.textContent='검색 결과가 없습니다.';list.append(el);}
      matches.forEach((m,i)=>{const el=document.createElement('button');el.type='button';el.className='bom-picker-option';el.setAttribute('role','option');el.id=list.id+'-'+i;el.textContent=materialLabel(m);el.onpointerdown=e=>e.preventDefault();el.onclick=()=>choose(m);list.append(el);});
      list.hidden=false;input.setAttribute('aria-expanded','true');
    }
    input.onfocus=()=>{input.select();show(true);};input.oninput=()=>show();
    // Keep pointer focus on the search field; opening must not turn into a close after focus events.
    toggle.onpointerdown=e=>e.preventDefault();
    toggle.onclick=e=>{e.preventDefault();if(input.disabled)return;input.focus({preventScroll:true});show(true);};
    input.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(list.hidden)show(true);active=matches.length?(active+(e.key==='ArrowDown'?1:-1)+matches.length)%matches.length:-1;[...list.querySelectorAll('button')].forEach((el,i)=>{el.classList.toggle('is-active',i===active);el.setAttribute('aria-selected',String(i===active));if(i===active){input.setAttribute('aria-activedescendant',el.id);el.scrollIntoView({block:'nearest'});}});}else if(e.key==='Enter'&&!list.hidden){e.preventDefault();if(active>=0)choose(matches[active]);else if(matches.length===1)choose(matches[0]);}};
    box.onfocusout=()=>queueMicrotask(()=>{if(!box.contains(document.activeElement))close();});
  }
  function render(){
    const p=product(),b=current();$('bomProductPhoto').innerHTML=Photos.markup('product',p.id,p.name,'detail',true);if($('productionVersion')){$('productionVersion').innerHTML=UI.options(p.versions.filter(v=>v.state==='사용').map(v=>[v.id,v.id+' · '+fmt(v.qty)+'개']),$('productionVersion').value);}
    $('familySelect').innerHTML=UI.options(FB.families.map((f,i)=>[i,f]).filter(([i])=>FB.data.products.some(x=>x.family===i&&(!x.archived||x.id===pid))),p.family);
    $('finishedProductSelect').innerHTML=UI.options(FB.data.products.filter(x=>x.family===p.family&&(!x.archived||x.id===pid)).map(x=>[x.id,x.name]),p.id);
    $('bomState').textContent=b.locked?'사용된 BOM · 잠금':editable?'편집 가능':'생산용 구성';
    $('copyBom').hidden=!editable||!b.locked;
    $('bomHelp').textContent=p.sample?'샘플 구성입니다. 재고관리팀이 수정 버튼으로 구성을 변경할 수 있습니다.':editable?(b.locked?'생산에 사용된 구성입니다. 수정 가능한 구성을 만든 뒤 변경하세요.':'부자재명 또는 코드를 검색해 선택하세요. 변경 내용은 즉시 저장됩니다.'):'완제품에 연결된 BOM입니다. 재고관리팀은 위의 수정 버튼으로 구성을 변경할 수 있습니다.';
    $('bomLines').innerHTML=b.rows.map((r,i)=>{
      const m=mat(r.mid),v=ver(r),disabled=!editable||b.locked;
      return `<tr><td>${esc(r.slot)}</td><td>${picker(`bomMaterial-${i}`,materialLabel(m),r.slot+' 부자재 검색',disabled,`data-row="${i}" data-key="mid"`)}</td><td><select aria-label="${esc(r.slot)} 버전" data-row="${i}" data-key="vid" ${disabled?'disabled':''}>${UI.options(m.versions.filter(x=>x.state==='사용'||x.id===r.vid).map(x=>[x.id,x.id+(x.state!=='사용'?' · 중단':'')]),r.vid)}</select></td><td><input aria-label="${esc(r.slot)} 개당 수량" data-row="${i}" data-key="each" type="number" min="1" step="1" value="${r.each}" ${disabled?'disabled':''}></td><td class="num">${fmt(v.qty)}개</td><td class="num" data-need="${i}"></td><td class="bom-row-actions">${editable?`<button type="button" data-remove-row="${i}" ${disabled?'disabled':''}>삭제</button>`:''}</td></tr>`;
    }).join('');
    document.querySelectorAll('#bomLines .bom-material-search').forEach(input=>{const r=b.rows[Number(input.dataset.row)],m=mat(r.mid);const candidates=FB.data.materials.filter(x=>!x.deleted&&!x.archived&&x.slot===m.slot&&(!x.scope||x.scope===p.id)&&x.versions.some(v=>v.state==='사용'));setupPicker(input,candidates,()=>{input.dataset.picked='true';input.dispatchEvent(new Event('change',{bubbles:true}));});});
    if(editable){$('bomAddPicker').innerHTML=picker('bomAddMaterial','','추가할 부자재 검색',b.locked);setupPicker($('bomAddMaterial'),addCandidates(),()=>{});$('bomAddRow').disabled=b.locked;}
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
    $('bomLines').onchange=e=>{if(!editable||!e.target.dataset.key)return;if(e.target.dataset.key==='mid'&&e.target.dataset.picked!=='true')return;const i=Number(e.target.dataset.row),r={...current().rows[i]},key=e.target.dataset.key;try{if(key==='mid'){const picked=resolveMaterial(e.target.value,FB.data.materials.filter(m=>!m.deleted&&!m.archived&&m.slot===mat(r.mid).slot&&(!m.scope||m.scope===pid)&&m.versions.some(v=>v.state==='사용')));if(!picked)throw Error('검색 목록에서 연결할 부자재를 선택해주세요.');r.mid=picked.id;r.vid=picked.versions.find(v=>v.state==='사용').id;}else r[key]=key==='each'?Number(e.target.value):e.target.value;FB.updateBom(pid,index,i,r);$('bomError').textContent='';render();UI.toast('BOM 구성을 저장했습니다.');}catch(err){$('bomError').textContent=err.message;render();}};
    if(editable){$('bomAddRow').onclick=()=>{try{const picked=resolveMaterial($('bomAddMaterial').value,addCandidates());if(!picked)throw Error('검색 목록에서 추가할 부자재를 선택해주세요.');FB.addBomRow(pid,index,picked.id);$('bomError').textContent='';render();}catch(e){$('bomError').textContent=e.message;}};$('bomLines').onclick=e=>{const b=e.target.closest('[data-remove-row]');if(!b)return;try{FB.removeBomRow(pid,index,Number(b.dataset.removeRow));render();}catch(err){$('bomError').textContent=err.message;}};}
    render();
  }
  return {bind,render,update,get pid(){return pid;},get index(){return index;},select(id){pid=id||FB.data.products[0].id;index=product().boms.length-1;render();}};
})();
