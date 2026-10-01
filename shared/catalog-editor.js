'use strict';
window.CatalogEditor=(()=>{
 const {$,esc}=UI;let itemId='',config;
 const item=()=> (config.kind==='product'?FB.data.products:FB.data.materials).find(x=>x.id===itemId);
 function versions(){const m=item();if(!m||config.kind!=='material')return;$('catalogVersionList').innerHTML=m.versions.map(v=>`<div class="catalog-version"><strong>${esc(v.id)}</strong><span>${esc(v.state)} · ${UI.fmt(v.qty)}개</span><button type="button" data-catalog-version="${esc(v.id)}">${v.state==='사용'?'사용 중단':'사용 재개'}</button></div>`).join('');}
 function open(id=''){
  if(!UI.allowWrite())return;itemId=id;const x=item();$('catalogTitle').textContent=(x?'정보 수정':'새 '+(config.kind==='product'?'완제품':'부자재')+' 등록');
  if(config.kind==='product'){
   $('adminProductName').value=x?.name||'';$('adminProductFamily').innerHTML=UI.options(FB.families.map((v,i)=>[i,v]),x?.family??0);$('adminProductCategory').innerHTML=UI.options(FB.data.productCategories.map(v=>[v,v]),x?.category||'파이어볼');$('adminProductSample').value=String(x?.sample||false);$('archiveProduct').hidden=!x;$('archiveProduct').textContent=x?.archived?'단종 해제':'단종 처리';$('productError').textContent='';
  }else{
   const linked=x&&FB.data.products.some(p=>p.boms.some(b=>b.rows.some(r=>r.mid===x.id)));
   $('materialName').value=x?.name||'';$('materialSlot').innerHTML=UI.options(FB.slots.map(v=>[v,v]),x?.slot||'캡');$('materialScope').innerHTML=UI.options([['','공용 · 모든 제품'],...FB.data.products.map(p=>[p.id,p.name])],x?.scope||'');$('materialSlot').disabled=!!linked;$('materialScope').disabled=!!linked;$('materialMemo').value=x?.memo||'';$('initialMaterialFields').hidden=!!x;$('materialInitialVersion').value='공용';$('materialInitialQty').value=0;$('archiveMaterial').hidden=!x;$('archiveMaterial').textContent=x?.archived?'단종 해제':'단종 처리';$('materialError').textContent='';$('catalogVersions').hidden=!x;$('catalogHint').textContent=linked?'BOM에 연결된 분류와 제품은 보호됩니다. 이름과 메모는 수정할 수 있습니다.':'단종 처리해도 기존 재고와 기록은 보존됩니다.';versions();
  }
  $('catalogDialog').showModal();
 }
 function bind(options){config=options;document.querySelectorAll('[data-catalog-action]').forEach(b=>b.hidden=!FB.canAdmin());$('newCatalogItem').onclick=()=>open();$('editCatalogItem').onclick=()=>open(config.selected()?.id);
  if(config.kind==='product'){
   $('productForm').onsubmit=e=>{e.preventDefault();try{const id=FB.saveProduct({id:itemId||undefined,name:$('adminProductName').value,family:$('adminProductFamily').value,category:$('adminProductCategory').value,sample:$('adminProductSample').value==='true'});config.saved(id);$('catalogDialog').close();UI.toast('완제품 정보를 저장했습니다.');}catch(err){$('productError').textContent=err.message;}};
   $('archiveProduct').onclick=()=>{try{FB.toggleProduct(itemId);config.saved(itemId);$('catalogDialog').close();UI.toast('완제품 사용 상태를 변경했습니다.');}catch(err){$('productError').textContent=err.message;}};
   $('categoryForm').onsubmit=e=>{e.preventDefault();try{const name=FB.addProductCategory($('newCategoryName').value);$('adminProductCategory').innerHTML=UI.options(FB.data.productCategories.map(v=>[v,v]),name);$('newCategoryName').value='';$('categoryError').textContent='';UI.toast('분류를 추가했습니다.');}catch(err){$('categoryError').textContent=err.message;}};
  }else{
   $('materialForm').onsubmit=e=>{e.preventDefault();try{const id=FB.saveMaterial({id:itemId||undefined,name:$('materialName').value,slot:$('materialSlot').value,scope:$('materialScope').value,memo:$('materialMemo').value,vid:$('materialInitialVersion').value,qty:Number($('materialInitialQty').value)});config.saved(id);$('catalogDialog').close();UI.toast('부자재 정보를 저장했습니다.');}catch(err){$('materialError').textContent=err.message;}};
   $('archiveMaterial').onclick=()=>{try{FB.toggleMaterial(itemId);config.saved(itemId);$('catalogDialog').close();UI.toast('부자재 사용 상태를 변경했습니다.');}catch(err){$('materialError').textContent=err.message;}};
   $('catalogVersionList').onclick=e=>{const b=e.target.closest('[data-catalog-version]');if(!b)return;try{FB.toggleVersion(itemId,b.dataset.catalogVersion);versions();UI.toast('버전 사용 상태를 변경했습니다.');}catch(err){$('materialError').textContent=err.message;}};
  }
 }
 return {bind};
})();
