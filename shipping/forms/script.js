'use strict';
(()=>{
 const user=window.OrderAccess?.currentUser();
 if(!window.FBSession?.check()){location.replace('../../login/index.html');return;}
 if(!user||!(user.role==='admin'||user.perms?.includes('출고팀'))){location.replace('../../main/index.html');return;}
 const $=id=>document.getElementById(id),M=ShippingForms,n=M.node;
 let forms=[],active=null,revision=0,dirty=false;
 function status(message){$('status').textContent=message;}
 function mark(){dirty=true;$('saveState').textContent='저장하지 않은 변경사항';}
 function allowSwitch(){return !dirty||confirm('저장하지 않은 변경사항을 닫을까요?');}
 function drawList(){
  const host=$('formList');host.replaceChildren();
  for(const f of forms){const b=n('button','form-list-item'),title=n('strong','',f.title),meta=n('span','muted',f.questions.length+'개 질문');b.type='button';b.setAttribute('aria-pressed',String(f.id===active));b.append(title,meta);b.onclick=()=>{if(allowSwitch())select(f);};host.append(b);}
  if(!forms.length)host.append(n('p','muted','저장한 폼이 없습니다.'));
 }
 function updateNumbers(){[...$('questions').children].forEach((row,i)=>{row.querySelector('legend').textContent='질문 '+(i+1);row.querySelector('[data-up]').disabled=i===0;row.querySelector('[data-down]').disabled=i===$('questions').children.length-1;});}
 function field(text,input){const label=n('label','form-field');label.append(n('span','',text),input);return label;}
 function question(q={}){
  const row=n('fieldset','question form-card');row.dataset.id=q.id||crypto.randomUUID();row.append(n('legend','','질문'));
  const title=n('input');title.name='question';title.required=true;title.maxLength=200;title.value=q.title||'';title.placeholder='질문을 입력하세요';
  const type=n('select');type.name='type';for(const t of M.TYPES){const o=n('option','',t);o.value=t;type.append(o);}type.value=q.type||'단답형';
  const options=n('textarea');options.name='options';options.rows=3;options.maxLength=10000;options.placeholder='선택지 1\n선택지 2';options.value=(q.options||[]).join('\n');
  const optionLabel=field('선택지 · 한 줄에 하나',options);
  const required=n('input');required.type='checkbox';required.name='required';required.checked=!!q.required;
  const requiredLabel=n('label','required-option');requiredLabel.append(required,n('span','','필수 응답'));
  const tools=n('div','question-tools');
  for(const [label,attr,action] of [['위로','up',()=>{const p=row.previousElementSibling;if(p)row.parentNode.insertBefore(row,p);}],['아래로','down',()=>{const next=row.nextElementSibling;if(next)row.parentNode.insertBefore(next,row);}],['삭제','delete',()=>row.remove()]]){
   const b=n('button','',label);b.type='button';b.dataset[attr]='';b.setAttribute('aria-label','질문 '+label);b.onclick=()=>{action();updateNumbers();mark();};tools.append(b);
  }
  const sync=()=>{const choice=['객관식','체크박스','드롭다운'].includes(type.value);optionLabel.hidden=!choice;options.disabled=!choice;options.required=choice;};
  type.onchange=()=>{sync();mark();};sync();
  row.append(field('질문 문구',title),field('응답 유형',type),optionLabel,requiredLabel,tools);$('questions').append(row);updateNumbers();
 }
 function readDraft(){
  return M.normalize({id:active,title:$('title').value,description:$('description').value,questions:[...$('questions').children].map(row=>{
   const get=name=>row.querySelector('[name='+name+']');
   return {id:row.dataset.id,title:get('question').value,type:get('type').value,options:get('options').value.split('\n'),required:get('required').checked};
  })});
 }
 function switchTab(key){
  if(key==='preview'){try{M.render($('preview'),readDraft());}catch(e){status(e.message);return;}}
  if(key==='responses')drawResponses();
  for(const name of ['edit','preview','responses']){const on=name===key;$(name+'Panel').hidden=!on;$(name+'Tab').setAttribute('aria-selected',String(on));$(name+'Tab').tabIndex=on?0:-1;}
 }
 function select(f){
  active=f.id;revision=f.revision||0;dirty=false;$('saveState').textContent=forms.some(x=>x.id===active)?'저장됨':'새 폼';
  $('empty').hidden=true;$('formWorkspace').hidden=false;$('title').value=f.title;$('description').value=f.description||'';$('questions').replaceChildren();f.questions.forEach(question);
  drawList();drawResponses();switchTab('edit');status('');
 }
 function drawResponses(){
  const rows=M.responses(user.id,active).slice().reverse();$('responseCount').textContent=String(rows.length);$('responseList').replaceChildren();
  if(!rows.length){$('responseList').append(n('p','muted','아직 응답이 없습니다. 저장한 폼의 ‘작성 화면 열기’에서 테스트해보세요.'));return;}
  for(const [index,r] of rows.entries()){
   const detail=n('details','response-record'),summary=n('summary','','응답 '+(rows.length-index)+' · '+new Date(r.submittedAt).toLocaleString('ko-KR'));detail.append(summary);
   for(const a of r.answers){const block=n('div','response-answer');block.append(n('strong','',a.title),n('p','',Array.isArray(a.value)?a.value.join(', '):a.value||'미응답'));detail.append(block);}
   $('responseList').append(detail);
  }
 }
 $('newForm').onclick=()=>{if(!allowSwitch())return;select({id:crypto.randomUUID(),title:'',description:'',questions:[{title:'성함',type:'단답형',required:true},{title:'연락처',type:'단답형',required:true},{title:'배송 주소',type:'장문형',required:true}]});$('title').focus();};
 $('editor').oninput=mark;$('addQuestion').onclick=()=>{question();mark();};
 $('editor').onsubmit=e=>{e.preventDefault();try{const saved=M.save(user.id,{...readDraft(),revision});forms=M.forms(user.id);revision=saved.revision;dirty=false;$('saveState').textContent='저장됨';drawList();status('폼을 저장했어요.');}catch(e){status(e.message);}};
 for(const key of ['edit','preview','responses'])$(key+'Tab').onclick=()=>switchTab(key);
 document.querySelector('.form-tabs').onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const keys=['edit','preview','responses'],i=keys.findIndex(k=>k+'Tab'===e.target.id);if(i<0)return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;switchTab(keys[next]);if($(keys[next]+'Tab').getAttribute('aria-selected')==='true')$(keys[next]+'Tab').focus();};
 $('openParticipant').onclick=()=>{
  if(dirty||!forms.some(f=>f.id===active)){status('작성 화면을 열기 전에 폼을 저장해주세요.');return;}
  const url=new URL('participate.html',location.href);url.searchParams.set('owner',user.id);url.searchParams.set('form',active);window.open(url.href,'_blank','noopener');
 };
 $('refreshResponses').onclick=()=>{try{drawResponses();status('응답을 새로 불러왔어요.');}catch(e){status(e.message);}};
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
 window.addEventListener('storage',()=>{try{forms=M.forms(user.id);drawList();if(active)drawResponses();}catch(e){status(e.message);}});
 try{forms=M.forms(user.id);drawList();if(forms.length)select(forms[0]);}catch(e){status(e.message);}
 $('workspace').hidden=false;
})();