'use strict';
(()=>{
 const entries=new Map();let serial=0,queued=false;
 const normalize=v=>String(v??'').normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,'');
 function close(entry){const {list,input,select}=entry;if(list.matches(':popover-open'))list.hidePopover();list.hidden=true;input.value=select.selectedOptions[0]?.label||'';input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');}
 function closeAll(except){for(const entry of entries.values())if(entry!==except&&!entry.list.hidden)close(entry);}
 function sync(entry){
 const {select,box,input,toggle}=entry;
 const signature=JSON.stringify([select.value,select.matches(':disabled'),select.hidden,select.required,[...select.options].map(o=>[o.value,o.label,o.disabled,o.hidden,o.parentElement?.tagName==='OPTGROUP'?o.parentElement.label:''])]);
 if(signature===entry.signature)return;entry.signature=signature;close(entry);
 box.hidden=select.hidden;input.disabled=toggle.disabled=select.matches(':disabled');input.setAttribute('aria-required',String(select.required));
 input.setAttribute('aria-label',select.getAttribute('aria-label')||select.labels?.[0]?.textContent?.trim()||'항목 검색');
 input.placeholder='입력해서 검색 · 선택';input.setCustomValidity('');input.removeAttribute('aria-invalid');
 }
 function show(entry,all=false){
 const {select,input,list,box}=entry;if(select.matches(':disabled')||select.hidden)return;
 closeAll(entry);entry.matches=[...select.options].filter(o=>!o.disabled&&!o.hidden&&!(o.parentElement?.tagName==='OPTGROUP'&&o.parentElement.disabled)).filter(o=>all||normalize(o.label).includes(normalize(input.value)));entry.active=-1;list.replaceChildren();
 if(!entry.matches.length){const empty=document.createElement('p');empty.className='portal-select-empty';empty.textContent='검색 결과가 없습니다.';list.append(empty);}
 entry.matches.forEach((option,i)=>{const button=document.createElement('button');button.type='button';button.id=list.id+'-'+i;button.setAttribute('role','option');button.setAttribute('aria-selected',String(option.selected));button.textContent=option.label;button.onpointerdown=e=>e.preventDefault();button.onclick=()=>{if(select.matches(':disabled'))return;select.value=option.value;input.setCustomValidity('');input.removeAttribute('aria-invalid');close(entry);select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));queue();};list.append(button);});
 list.hidden=false;const rect=box.getBoundingClientRect(),viewport=window.innerHeight,up=viewport-rect.bottom<180&&rect.top>viewport-rect.bottom,width=Math.min(rect.width,window.innerWidth-24);
 list.style.width=width+'px';list.style.left=Math.max(12,Math.min(rect.left,window.innerWidth-width-12))+'px';list.style.maxHeight=Math.max(60,Math.min(260,(up?rect.top:viewport-rect.bottom)-18))+'px';list.style.top=(rect.bottom+6)+'px';
 if(list.showPopover&&!list.matches(':popover-open'))list.showPopover();list.style.top=(up?Math.max(12,rect.top-6-list.getBoundingClientRect().height):rect.bottom+6)+'px';input.setAttribute('aria-expanded','true');
 }
 function enhance(select){
 if(select.multiple||select.hidden||select.closest('[data-native-select]'))return;
 if(entries.has(select)){sync(entries.get(select));return;}
 const box=document.createElement('div');box.className='portal-search-select';
 const input=document.createElement('input');input.type='search';input.autocomplete='off';input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-expanded','false');
 const toggle=document.createElement('button');toggle.type='button';toggle.className='portal-select-toggle';toggle.textContent='▾';toggle.setAttribute('aria-label','목록 열기');
 const list=document.createElement('div');list.className='portal-select-list';list.id='portal-search-select-'+(++serial);list.setAttribute('role','listbox');list.setAttribute('popover','manual');list.hidden=true;input.setAttribute('aria-controls',list.id);box.append(input,toggle,list);
 select.after(box);select.classList.add('portal-select-source');select.tabIndex=-1;select.setAttribute('aria-hidden','true');
 const entry={select,box,input,toggle,list,signature:'',matches:[],active:-1};entries.set(select,entry);sync(entry);
 input.onfocus=()=>{sync(entry);input.select();show(entry,true);};input.oninput=()=>{input.setCustomValidity('');show(entry);};
 toggle.onpointerdown=e=>e.preventDefault();toggle.onclick=()=>{if(!list.hidden){close(entry);return;}input.focus({preventScroll:true});show(entry,true);};
 input.onkeydown=e=>{
 if(e.key==='Escape'&&!list.hidden){e.preventDefault();e.stopPropagation();close(entry);}
 else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(list.hidden)show(entry,true);entry.active=entry.matches.length?(entry.active+(e.key==='ArrowDown'?1:-1)+entry.matches.length)%entry.matches.length:-1;[...list.querySelectorAll('button')].forEach((b,i)=>{b.classList.toggle('is-active',i===entry.active);b.setAttribute('aria-selected',String(i===entry.active));if(i===entry.active){input.setAttribute('aria-activedescendant',b.id);b.scrollIntoView({block:'nearest'});}});}
 else if(e.key==='Enter'&&!list.hidden){e.preventDefault();const buttons=list.querySelectorAll('button');if(entry.active>=0)buttons[entry.active]?.click();else if(buttons.length===1)buttons[0].click();}
 else if(e.key==='Tab')close(entry);
 };
 box.onfocusout=()=>queueMicrotask(()=>{if(!box.contains(document.activeElement))close(entry);});
 select.addEventListener('focus',()=>input.focus());select.addEventListener('change',()=>sync(entry));
 select.addEventListener('invalid',e=>{e.preventDefault();input.focus();input.setAttribute('aria-invalid','true');input.setCustomValidity('목록에서 항목을 선택해주세요.');input.reportValidity();});
 }
 function scan(){
 queued=false;
 for(const [select,entry] of entries){if(!select.isConnected){entry.box.remove();entries.delete(select);}else sync(entry);}
 document.querySelectorAll('select').forEach(enhance);
 }
 function queue(){if(!queued){queued=true;queueMicrotask(scan);}}
 document.addEventListener('pointerdown',e=>{for(const entry of entries.values())if(!entry.box.contains(e.target)&&!entry.list.hidden)close(entry);},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&[...entries.values()].some(entry=>!entry.list.hidden)){e.preventDefault();e.stopPropagation();closeAll();}},true);
 document.addEventListener('scroll',e=>{if(!e.target?.closest?.('.portal-select-list'))closeAll();},true);window.addEventListener('resize',()=>closeAll());
 document.addEventListener('change',queue);document.addEventListener('reset',()=>setTimeout(queue,0));window.addEventListener('focus',queue);
 const start=()=>{scan();new MutationObserver(queue).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled','selected','hidden','required','style','value'],characterData:true});};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();