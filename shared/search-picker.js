'use strict';
window.SearchPicker=(()=>{
 let serial=0;
 const key=v=>String(v).normalize('NFKC').toLowerCase().replace(/\s+/g,'');
 function markup(value,label){return '<div class="search-picker"><div class="search-picker-field"><input type="search" role="combobox" autocomplete="off" aria-autocomplete="list" aria-expanded="false" aria-label="'+UI.esc(label)+'" placeholder="'+UI.esc(label)+' 검색 · 선택" value="'+UI.esc(value)+'"><button type="button" aria-label="'+UI.esc(label)+' 목록 열기">▾</button></div><div class="search-picker-list" popover="manual" role="listbox" hidden></div></div>';}
 function bind(box,items,pick){
 const input=box.querySelector('input'),toggle=box.querySelector('button'),list=box.querySelector('.search-picker-list');let selected=input.value,matches=[],active=-1;list.id='search-picker-'+(++serial);input.setAttribute('aria-controls',list.id);
 const close=()=>{if(list.matches(':popover-open'))list.hidePopover();list.hidden=true;input.value=selected;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');};list._closePicker=close;
 const choose=item=>{selected=item.label;close();pick(item.id);};
 function show(all=false){matches=items.filter(item=>all||key(item.label).includes(key(input.value)));active=-1;list.replaceChildren();
 document.querySelectorAll('.search-picker-list:not([hidden])').forEach(other=>{if(other!==list)other._closePicker?.();});
 if(!matches.length){const empty=document.createElement('span');empty.textContent='검색 결과가 없습니다.';empty.className='search-picker-empty';list.append(empty);}
 matches.forEach((item,i)=>{const button=document.createElement('button');button.type='button';button.setAttribute('role','option');button.id=list.id+'-'+i;button.textContent=item.label;button.onpointerdown=e=>e.preventDefault();button.onclick=()=>choose(item);list.append(button);});
 list.hidden=false;const r=box.getBoundingClientRect(),up=window.innerHeight-r.bottom<180&&r.top>window.innerHeight-r.bottom,width=Math.min(Math.max(r.width,240),window.innerWidth-24);
 list.style.width=width+'px';list.style.left=Math.max(12,Math.min(r.left,window.innerWidth-width-12))+'px';list.style.maxHeight=Math.max(70,Math.min(240,(up?r.top:window.innerHeight-r.bottom)-18))+'px';
 if(!list.matches(':popover-open'))list.showPopover();list.style.top=(up?r.top-6-list.getBoundingClientRect().height:r.bottom+6)+'px';input.setAttribute('aria-expanded','true');
 }
 input.onfocus=()=>{input.select();show(true);};input.oninput=()=>show();toggle.onpointerdown=e=>e.preventDefault();toggle.onclick=()=>{if(!list.hidden){close();return;}input.focus({preventScroll:true});show(true);};
 input.onkeydown=e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(list.hidden)show(true);active=matches.length?(active+(e.key==='ArrowDown'?1:-1)+matches.length)%matches.length:-1;[...list.querySelectorAll('button')].forEach((button,i)=>{button.classList.toggle('is-active',i===active);button.setAttribute('aria-selected',String(i===active));if(i===active){input.setAttribute('aria-activedescendant',button.id);button.scrollIntoView({block:'nearest'});}});}else if(e.key==='Enter'&&!list.hidden){e.preventDefault();if(active>=0)choose(matches[active]);else if(matches.length===1)choose(matches[0]);}};
 box.onfocusout=()=>queueMicrotask(()=>{if(!box.contains(document.activeElement))close();});
 }
 document.addEventListener('pointerdown',e=>document.querySelectorAll('.search-picker-list:not([hidden])').forEach(list=>{if(!list.closest('.search-picker').contains(e.target))list._closePicker?.();}),true);
 document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const lists=[...document.querySelectorAll('.search-picker-list:not([hidden])')];if(lists.length){e.preventDefault();e.stopPropagation();lists.forEach(list=>list._closePicker?.());}},true);
 const closeAll=e=>{if(e?.target?.closest?.('.search-picker-list'))return;document.querySelectorAll('.search-picker-list:not([hidden])').forEach(list=>list._closePicker?.());};
 document.addEventListener('scroll',closeAll,true);window.addEventListener('resize',closeAll);
 return {markup,bind};
})();