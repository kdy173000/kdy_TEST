'use strict';
window.BusinessCertificates=(()=>{
 const MIME=['image/png','image/jpeg','image/webp','application/pdf'],DB='fireball-business-certificates';let opening,generation=0,activeUrl='',viewUrl='',modal;
 function database(){if(!opening)opening=new Promise((resolve,reject)=>{const request=indexedDB.open(DB,1);request.onupgradeneeded=()=>request.result.createObjectStore('documents',{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(Error('사업자등록증 저장소를 열 수 없습니다.'));});return opening;}
 async function read(id){const db=await database();return new Promise((resolve,reject)=>{const request=db.transaction('documents').objectStore('documents').get(id);request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(Error('등록증을 읽지 못했습니다.'));});}
 function authorized(){if(!FB.canAdmin())throw Error('재고관리팀 권한이 필요합니다.');}
 async function save(id,file){
 authorized();if(!FB.data.deliveryAddresses.some(a=>a.id===id))throw Error('저장된 납품처를 먼저 선택하세요.');if(!MIME.includes(file.type))throw Error('JPG·PNG·WebP 이미지 또는 PDF를 선택하세요.');if(!file.size||file.size>10*1024*1024)throw Error('10MB 이하의 파일을 선택하세요.');
 const db=await database();authorized();
 await new Promise((resolve,reject)=>{const tx=db.transaction('documents','readwrite');tx.objectStore('documents').put({id,blob:file,name:file.name,type:file.type,updatedAt:Date.now()});tx.oncomplete=resolve;tx.onerror=()=>reject(Error('등록증을 저장하지 못했습니다.'));tx.onabort=()=>reject(Error('등록증 저장이 취소되었습니다.'));});
 }
 async function remove(id){authorized();const db=await database();authorized();await new Promise((resolve,reject)=>{const tx=db.transaction('documents','readwrite');tx.objectStore('documents').delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(Error('등록증을 삭제하지 못했습니다.'));});}
 function viewer(record,label){
 if(!modal){modal=document.createElement('dialog');modal.className='out-dialog certificate-dialog';modal.addEventListener('close',()=>{if(viewUrl)URL.revokeObjectURL(viewUrl);viewUrl='';modal.replaceChildren();});document.body.append(modal);}
 if(viewUrl)URL.revokeObjectURL(viewUrl);viewUrl=URL.createObjectURL(record.blob);
 const head=document.createElement('div');head.className='modalhead';const title=document.createElement('h2');title.textContent=label+' · 사업자등록증';const close=document.createElement('button');close.type='button';close.textContent='닫기';close.onclick=()=>modal.close();head.append(title,close);
 const preview=document.createElement(record.type==='application/pdf'?'iframe':'img');preview.src=viewUrl;if(preview.tagName==='IMG')preview.alt=label+' 사업자등록증';else preview.title=label+' 사업자등록증';modal.replaceChildren(head,preview);modal.showModal();
 }
 async function show(container,place){
 const token=++generation;if(activeUrl){URL.revokeObjectURL(activeUrl);activeUrl='';}container.replaceChildren();
 const head=document.createElement('div');head.className='delivery-certificate-head';const title=document.createElement('strong');title.textContent=(place?.label||'납품처')+' · 사업자등록증';head.append(title);container.append(head);
 const info=document.createElement('p');info.textContent=place?'등록증을 확인하는 중입니다.':'납품처를 선택하거나 주소를 저장하면 사업자등록증을 연결할 수 있습니다.';container.append(info);if(!place)return;
 try{
 const record=await read(place.id);if(token!==generation)return;
 info.textContent=record?record.name:'등록된 사업자등록증이 없습니다.';
 const actions=document.createElement('div');actions.className='action-group';head.append(actions);
 if(record){const view=document.createElement('button');view.type='button';view.textContent='사업자등록증 보기';view.onclick=()=>viewer(record,place.label);actions.append(view);
 if(record.type!=='application/pdf'){activeUrl=URL.createObjectURL(record.blob);const thumb=document.createElement('button');thumb.type='button';thumb.className='certificate-thumbnail';thumb.setAttribute('aria-label',place.label+' 사업자등록증 보기');const img=document.createElement('img');img.src=activeUrl;img.alt=place.label+' 사업자등록증';thumb.append(img);thumb.onclick=()=>viewer(record,place.label);container.append(thumb);}}
 if(FB.canAdmin()){
 const file=document.createElement('input');file.type='file';file.accept=MIME.join(',');file.hidden=true;
 const upload=document.createElement('button');upload.type='button';upload.textContent=record?'등록증 변경':'사업자등록증 등록';upload.onclick=()=>file.click();actions.append(upload,file);
 file.onchange=async()=>{if(!file.files[0])return;if(record&&!confirm('기존 사업자등록증을 이 파일로 바꿀까요?'))return;upload.disabled=true;try{await save(place.id,file.files[0]);UI.toast('사업자등록증을 저장했습니다.');if(token===generation)await show(container,place);}catch(e){UI.toast(e.message);}finally{upload.disabled=false;}};
 if(record){const del=document.createElement('button');del.type='button';del.textContent='등록증 삭제';del.onclick=async()=>{if(!confirm(place.label+' 사업자등록증을 삭제할까요?'))return;try{await remove(place.id);if(token===generation)await show(container,place);UI.toast('사업자등록증을 삭제했습니다.');}catch(e){UI.toast(e.message);}};actions.append(del);}
 }
 }catch(e){if(token===generation)info.textContent=e.message;}
 }
 return {show};
})();