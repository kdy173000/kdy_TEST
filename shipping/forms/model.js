'use strict';
window.ShippingForms=(()=>{
 const TYPES=['단답형','장문형','객관식','체크박스','드롭다운','날짜'];
 const clone=x=>JSON.parse(JSON.stringify(x));
 const formKey=owner=>'fb_shipping_forms_v1:'+owner;
 const responseKey=owner=>'fb_shipping_responses_v1:'+owner;
 function read(key){try{const rows=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(rows))throw Error();return rows;}catch{throw Error('저장된 폼 데이터를 읽을 수 없습니다.');}}
 function forms(owner){return read(formKey(owner)).map(f=>({...f,revision:f.revision||0,questions:(f.questions||[]).map((q,i)=>({...q,id:q.id||f.id+'-q'+i}))}));}
 function text(value,max,label){const s=String(value||'').trim();if(!s||s.length>max)throw Error(label+'을 확인해주세요.');return s;}
 function normalize(d){
  const title=text(d.title,100,'폼 제목'),description=String(d.description||'').trim();
  if(description.length>1000)throw Error('설명은 1,000자 이내로 입력하세요.');
  if(!Array.isArray(d.questions)||!d.questions.length||d.questions.length>100)throw Error('질문을 1~100개 추가하세요.');
  const ids=new Set(),questions=d.questions.map(q=>{
   const id=q.id||crypto.randomUUID();if(ids.has(id))throw Error('질문 식별자가 중복됩니다.');ids.add(id);
   if(!TYPES.includes(q.type))throw Error('응답 유형을 확인하세요.');
   const choice=['객관식','체크박스','드롭다운'].includes(q.type),options=choice?[...new Set((q.options||[]).map(x=>String(x).trim()).filter(Boolean))]:[];
   if(choice&&(options.length<2||options.length>100||options.some(x=>x.length>200)))throw Error('선택지는 서로 다른 내용으로 2~100개 입력하세요. 각 선택지는 200자 이내여야 합니다.');
   return {id,title:text(q.title,200,'질문 문구'),type:q.type,required:!!q.required,options};
  });return {id:d.id||crypto.randomUUID(),title,description,questions};
 }
 function save(owner,draft){
  let u;try{u=JSON.parse(sessionStorage.getItem('fb_user')||'null');}catch{}
  try{const accounts=JSON.parse(localStorage.getItem('fb_accounts')||'[]');if(Array.isArray(accounts))u=accounts.find(a=>a.id===u?.id)||u;}catch{}
  if(!u||u.id!==owner||!(u.role==='admin'||u.perms?.includes('출고팀')))throw Error('출고팀 권한이 필요합니다.');
  const value=normalize(draft),all=forms(owner),previous=all.find(f=>f.id===value.id);
  if(previous&&previous.revision!==(draft.revision||0))throw Error('다른 창에서 폼이 수정되었습니다. 새로고침 후 다시 열어주세요.');
  const next={...value,revision:(previous?.revision||0)+1,updatedAt:new Date().toISOString()};
  try{localStorage.setItem(formKey(owner),JSON.stringify(previous?all.map(f=>f.id===next.id?next:f):[...all,next]));}catch{throw Error('폼을 저장하지 못했습니다. 브라우저 저장 공간을 확인하세요.');}return clone(next);
 }
 function validate(form,answers){
  return form.questions.map(q=>{
   const value=answers[q.id],multiple=q.type==='체크박스';
   const answer=multiple?(Array.isArray(value)?value.map(String):[]):String(value??'').trim();
   if(q.required&&(multiple?!answer.length:!answer))throw Error('“'+q.title+'”에 응답해주세요.');
   if(['객관식','체크박스','드롭다운'].includes(q.type)){
    if((multiple?answer:answer?[answer]:[]).some(x=>!q.options.includes(x)))throw Error('“'+q.title+'”의 선택지를 다시 확인하세요.');
   }else if(answer.length>10000)throw Error('응답은 10,000자 이내로 입력하세요.');
   if(q.type==='날짜'&&answer&&(!/^\d{4}-\d{2}-\d{2}$/.test(answer)||Number.isNaN(Date.parse(answer))||new Date(answer).toISOString().slice(0,10)!==answer))throw Error('올바른 날짜를 입력하세요.');
   return {questionId:q.id,title:q.title,type:q.type,value:answer};
  });
 }
 function responses(owner,id){return read(responseKey(owner)).filter(r=>r.formId===id);}
 function submit(owner,id,revision,answers){
  const form=forms(owner).find(f=>f.id===id);if(!form)throw Error('폼을 찾을 수 없습니다.');
  if(form.revision!==revision)throw Error('질문이 변경되었습니다. 페이지를 새로고침한 뒤 다시 작성해주세요.');
  const response={id:crypto.randomUUID(),formId:id,formTitle:form.title,formRevision:revision,submittedAt:new Date().toISOString(),answers:validate(form,answers)};
  const all=read(responseKey(owner));try{localStorage.setItem(responseKey(owner),JSON.stringify([...all,response]));}catch{throw Error('응답을 저장하지 못했습니다. 다시 시도해주세요.');}return response;
 }
 function node(tag,cls,content){const e=document.createElement(tag);if(cls)e.className=cls;if(content!==undefined)e.textContent=content;return e;}
 function render(host,form,onSubmit){
  host.replaceChildren();host.append(node('h2','respond-title',form.title));
  if(form.description)host.append(node('p','form-description',form.description));
  host.append(node('p','muted','* 표시는 필수 질문입니다.'));
  const htmlForm=node('form','respond-form'),getters=[];
  for(const [index,q] of form.questions.entries()){
   const field=node('fieldset','answer-question'),legend=node('legend','',String(index+1)+'. '+q.title+(q.required?' *':''));
   field.append(legend);const controls=[];
   if(['객관식','체크박스'].includes(q.type)){
    for(const [i,option] of q.options.entries()){
     const label=node('label','answer-option'),input=node('input');input.type=q.type==='객관식'?'radio':'checkbox';input.name=q.id;input.value=option;if(q.required&&input.type==='radio')input.required=true;label.append(input,node('span','',option));field.append(label);controls.push(input);
    }getters.push(()=>[q.id,q.type==='체크박스'?controls.filter(x=>x.checked).map(x=>x.value):controls.find(x=>x.checked)?.value||'']);
   }else{
    const input=node(q.type==='장문형'?'textarea':q.type==='드롭다운'?'select':'input');
    if(q.type==='드롭다운'){const empty=node('option','','선택하세요');empty.value='';input.append(empty);q.options.forEach(v=>{const o=node('option','',v);o.value=v;input.append(o);});}
    else if(q.type!=='장문형')input.type=q.type==='날짜'?'date':'text';
    input.required=q.required;input.maxLength=10000;input.setAttribute('aria-label',q.title);field.append(input);getters.push(()=>[q.id,input.value]);
   }htmlForm.append(field);
  }
  const error=node('p','form-error');error.setAttribute('role','alert');
  const button=node('button','public-primary',onSubmit?'제출':'미리보기 제출');button.type='submit';htmlForm.append(error,button);
  htmlForm.onsubmit=event=>{event.preventDefault();button.disabled=true;try{const answers=Object.fromEntries(getters.map(get=>get()));validate(form,answers);if(onSubmit)onSubmit(answers);else error.textContent='미리보기입니다. 응답은 저장되지 않았어요.';}catch(e){error.textContent=e.message;}finally{button.disabled=false;}};
  host.append(htmlForm);
 }
 return Object.freeze({TYPES,forms,save,responses,submit,validate,normalize,render,node});
})();
