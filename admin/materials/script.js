try{const u=JSON.parse(sessionStorage.getItem('fb_user')||'null');if(u?.role!=='admin')location.replace('../../login/index.html');}catch{location.replace('../../login/index.html');}

/* admin-materials.js */
'use strict';
(()=>{
  if(!FB.canAdmin())return;
  const {$,esc,fmt}=UI;let id=null;
  $('adminSettingsRoot').hidden=false;
  $('materialCategory').innerHTML=UI.options([['','전체 구성품'],...FB.slots.map(s=>[s,s])],'');
  const current=()=>FB.data.materials.find(m=>m.id===id),linked=()=>FB.data.products.flatMap(p=>p.boms).filter(b=>b.rows.some(r=>r.mid===id)).length;
  function list(){const q=$('materialSearch').value.toLowerCase(),slot=$('materialCategory').value;const items=FB.data.materials.filter(m=>(!m.archived||$('showArchived').checked)&&(!slot||m.slot===slot)&&(m.name.toLowerCase().includes(q)||m.id.toLowerCase().includes(q)));
    $('materialList').innerHTML=items.map(m=>`<tr class="${m.id===id?'selected-material':''}"><td><strong>${esc(m.name)}</strong><br><small>${esc(m.id)}</small></td><td>${esc(m.slot)}</td><td class="num">${fmt(UI.quantity(m,true))}개</td><td class="num">${fmt(UI.quantity(m))}개</td><td>${m.archived?'단종':'사용'}</td><td><button data-manage="${esc(m.id)}">관리</button></td></tr>`).join('')||'<tr><td colspan="6" class="empty">등록된 부자재가 없습니다.</td></tr>';
  }
  function stock(){const m=current();if(!m)return;$('materialStockTitle').textContent=m.name+' · 버전별 재고';$('materialLinkedBoms').textContent='연결된 BOM '+linked()+'개';$('materialVersions').innerHTML=m.versions.map(v=>`<tr><td>${esc(v.id)}</td><td class="num">${fmt(v.qty)}개</td><td>${v.state}</td><td><button data-toggle-version="${esc(v.id)}">${v.state==='사용'?'사용 중단':'사용 재개'}</button></td></tr>`).join('')+`<tr><td colspan="4"><form id="versionForm" class="inline-form"><label>새 버전명<input id="newVersionName" required maxlength="20" placeholder="예: V03"></label><button type="submit">버전 추가</button></form><p id="versionError" role="alert"></p></td></tr>`;
    $('materialHistory').innerHTML=UI.history(FB.data.transactions.filter(t=>t.mid===id));$('versionForm').onsubmit=e=>{e.preventDefault();try{FB.addVersion(id,$('newVersionName').value);UI.toast('재고 0개의 새 버전을 추가했습니다.');}catch(err){$('versionError').textContent=err.message;}};
  }
  function select(materialId){id=materialId;const m=current();$('materialEditorTitle').textContent=m?'부자재 정보 수정':'새 부자재 등록';$('materialName').value=m?.name||'';$('materialSlot').innerHTML=UI.options(FB.slots.map(s=>[s,s]),m?.slot||'캡');$('materialScope').innerHTML=UI.options([['','공용 · 모든 제품'],...FB.data.products.map(p=>[p.id,p.name])],m?.scope||'');$('materialSlot').disabled=!!m&&linked()>0;$('materialScope').disabled=!!m&&linked()>0;$('materialMemo').value=m?.memo||'';$('initialMaterialFields').hidden=!!m;$('materialInitialVersion').value='공용';$('materialInitialQty').value='0';$('archiveMaterial').hidden=!m;$('archiveMaterial').textContent=m?.archived?'단종 해제':'단종 처리';$('materialError').textContent='';$('materialStockPanel').hidden=!m;list();stock();}
  $('newMaterial').onclick=()=>select(null);$('materialSearch').oninput=list;$('materialCategory').onchange=list;$('showArchived').onchange=list;
  $('materialList').onclick=e=>{const b=e.target.closest('[data-manage]');if(b)select(b.dataset.manage);};
  $('materialForm').onsubmit=e=>{e.preventDefault();try{const saved=FB.saveMaterial({id,name:$('materialName').value,slot:$('materialSlot').value,scope:$('materialScope').value,memo:$('materialMemo').value,vid:$('materialInitialVersion').value,qty:Number($('materialInitialQty').value)});select(saved);UI.toast('부자재 설정을 저장했습니다.');}catch(err){$('materialError').textContent=err.message;list();}};
  $('archiveMaterial').onclick=()=>{try{FB.toggleMaterial(id);select(id);UI.toast('부자재 사용 상태를 변경했습니다.');}catch(err){$('materialError').textContent=err.message;}};
  $('materialVersions').onclick=e=>{const b=e.target.closest('[data-toggle-version]');if(!b)return;try{FB.toggleVersion(id,b.dataset.toggleVersion);UI.toast('버전 상태를 변경했습니다.');}catch(err){$('materialError').textContent=err.message;}};
  $('showCatalog').onclick=()=>{$('catalogSettings').hidden=false;$('bomSettings').hidden=true;$('showCatalog').classList.add('active');$('showBom').classList.remove('active');};
  $('showBom').onclick=()=>{$('catalogSettings').hidden=true;$('bomSettings').hidden=false;$('showBom').classList.add('active');$('showCatalog').classList.remove('active');BOMView.render();};
  BOMView.bind(true);window.addEventListener('fb-data',()=>{list();stock();$('archiveMaterial').textContent=current()?.archived?'단종 해제':'단종 처리';});select(FB.data.materials[0].id);
})();

