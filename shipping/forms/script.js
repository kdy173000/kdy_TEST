'use strict';
(() => {
  const user=window.OrderAccess?.currentUser();
  if(!window.FBSession?.check()){location.replace('../../login/index.html');return;}
  if(!user || !(user.role==='admin'||user.perms?.includes('출고팀'))){location.replace('../../main/index.html');return;}
  const $=id=>document.getElementById(id);
  const key='fb_shipping_forms_v1:'+user.id;
  const types=['단답형','장문형','객관식','체크박스','날짜'];
  let forms,active=null;
  function status(message){$('status').textContent=message;}
  try{forms=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(forms))throw Error();}catch{$('workspace').hidden=false;status('저장된 폼을 읽을 수 없습니다.');return;}
  function node(tag,text){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;}
  function label(text,field){const wrap=node('label');wrap.append(node('span',text),field);return wrap;}
  function publicUrl(value){
    if(!value.trim())return '';
    const u=new URL(value.trim());
    if(u.protocol!=='https:'||u.username||u.password||!((u.hostname==='docs.google.com'&&/^\/forms\/(?:u\/\d+\/)?d\/(?:e\/)?[^/]+\/viewform\/?$/.test(u.pathname))||['forms.gle','naver.me','form.naver.com','forms.office.com'].includes(u.hostname)))throw Error('구글폼·네이버폼 등의 공개 참여 링크를 입력하세요. 편집 링크는 사용할 수 없습니다.');
    return u.href;
  }
  function drawList(){const list=$('formList');list.replaceChildren();for(const form of forms){const b=node('button',form.title);b.type='button';b.onclick=()=>select(form);list.append(b);}}
  function addQuestion(q={}){
    const row=node('fieldset');row.className='question';row.append(node('legend','질문'));
    const title=node('input');title.name='question';title.required=true;title.maxLength=200;title.value=q.title||'';
    const type=node('select');type.name='type';for(const t of types)type.append(node('option',t));type.value=q.type||types[0];
    const options=node('textarea');options.name='options';options.maxLength=1500;options.value=(q.options||[]).join('\n');
    const optionLabel=label('선택지 (한 줄에 하나)',options);
    const required=node('input');required.type='checkbox';required.name='required';required.checked=!!q.required;
    const requiredLabel=label('필수 응답',required);requiredLabel.className='required';
    const remove=node('button','질문 삭제');remove.type='button';remove.onclick=()=>row.remove();
    const sync=()=>{const choice=['객관식','체크박스'].includes(type.value);optionLabel.hidden=!choice;options.disabled=!choice;options.required=choice;};type.onchange=sync;sync();
    row.append(label('질문 문구',title),label('응답 유형',type),optionLabel,requiredLabel,remove);$('questions').append(row);
  }
  function select(form){
    active=form.id;$('editor').hidden=false;$('title').value=form.title;$('description').value=form.description;$('publicLink').value=form.link;
    $('questions').replaceChildren();form.questions.forEach(addQuestion);syncLink(form.link);status('');
  }
  function syncLink(link){
    try{link=publicUrl(link);}catch{link='';}
    $('copyLink').disabled=!link;$('openLink').hidden=!link;
    if(link)$('openLink').href=link;else $('openLink').removeAttribute('href');
  }
  function readDraft(){
    const title=$('title').value.trim();if(!title)throw Error('폼 제목을 입력하세요.');
    const questions=[...$('questions').children].map(row=>{
      const get=name=>row.querySelector('[name='+name+']'),title=get('question').value.trim(),type=get('type').value,options=get('options').disabled?[]:get('options').value.split('\n').map(x=>x.trim()).filter(Boolean);
      if(!title)throw Error('질문 문구를 입력하세요.');
      if(!get('options').disabled&&new Set(options).size<2)throw Error('선택형 질문에는 서로 다른 선택지를 2개 이상 입력하세요.');
      return {title,type,options,required:get('required').checked};
    });
    if(!questions.length)throw Error('질문을 하나 이상 추가하세요.');
    return {id:active,title,description:$('description').value.trim(),questions};
  }
  async function copy(value){try{await navigator.clipboard.writeText(value);status('복사했어요.');}catch{status('자동 복사가 안 됐어요. 내용을 직접 선택해 복사하세요.');}}
  $('newForm').onclick=()=>{select({id:crypto.randomUUID(),title:'',description:'',link:'',questions:[{}]});$('title').focus();};
  $('addQuestion').onclick=()=>addQuestion();
  $('publicLink').oninput=()=>syncLink($('publicLink').value);
  $('copyLink').onclick=()=>{try{const url=publicUrl($('publicLink').value);if(url)copy(url);}catch(e){status(e.message);}};
  $('copyOutline').onclick=()=>{try{const d=readDraft();copy([d.title,d.description,...d.questions.map((q,i)=>[String(i+1)+'. '+q.title+' ['+q.type+(q.required?' · 필수':'')+']',...q.options.map(o=>'- '+o)].join('\n'))].join('\n\n'));}catch(e){status(e.message);}};
  $('editor').onsubmit=e=>{e.preventDefault();try{const d={...readDraft(),link:publicUrl($('publicLink').value)};const next=forms.some(f=>f.id===active)?forms.map(f=>f.id===active?d:f):[...forms,d];localStorage.setItem(key,JSON.stringify(next));forms=next;drawList();status('저장했어요.');}catch(e){status(e.message);}};
  drawList();if(forms.length)select(forms[0]);$('workspace').hidden=false;
})();
