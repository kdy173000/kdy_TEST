/* Shared notices: browser-local storage, writing and home visibility. */
(()=>{
  const KEY='fb_notices_v1',categories=['제품공지','사내공지','일반공지'];
  const defaults=[
  {
    "tag": "tp",
    "category": "제품공지",
    "title": "5월 출시 제품",
    "body": "5월에 출시되는 신제품 목록에는 나노코트 V3 50ml와 왁스부스터 50ml가 포함되어 있습니다.",
    "author": "관리자"
  },
  {
    "tag": "ti",
    "category": "사내공지",
    "title": "5월 도시락 담당",
    "body": "5월 도시락 담당자는 철완, 다영, 해연이다.",
    "author": "관리자"
  },
  {
    "tag": "ti",
    "category": "사내공지",
    "title": "4월 도시락 담당",
    "body": "4월 도시락 담당자는 준유, 혜선, 수빈입니다.",
    "author": "관리자"
  },
  {
    "tag": "ti",
    "category": "사내공지",
    "title": "슬리퍼 관련 공지사항",
    "body": "안전사고 예방을 위해 슬리퍼 착용에 대한 규정이 있습니다.",
    "author": "관리자"
  },
  {
    "tag": "ti",
    "category": "사내공지",
    "title": "6월 도시락 담당",
    "body": "6월 도시락 담당자는 상덕, 나겸, 현지로 지정되었습니다.",
    "author": "관리자"
  },
  {
    "tag": "ti",
    "category": "사내공지",
    "title": "3월 도시락 담당",
    "body": "3월 도시락 담당자는 김과장님, 선우, 리암입니다.",
    "author": "관리자"
  },
  {
    "tag": "tg",
    "category": "일반공지",
    "title": "산업안전보건교육",
    "body": "신입사원들을 위한 산업안전보건교육이 2026년 3월 31일 화요일 7시 55분에 진행됩니다.",
    "author": "관리자"
  }
].map((n,i)=>({...n,id:'notice-seed-'+i,createdBy:null,showHome:true,revision:0}));
  const clone=value=>JSON.parse(JSON.stringify(value));
  function read(){
    const raw=localStorage.getItem(KEY);if(!raw)return clone(defaults);
    const value=JSON.parse(raw);
    if(value?.schema!==1||!Array.isArray(value.notices)||value.notices.some(n=>typeof n.id!=='string'||typeof n.title!=='string'||typeof n.body!=='string'||!categories.includes(n.category)))throw Error('공지 저장 데이터를 읽을 수 없습니다.');
    return value.notices;
  }
  function user(){
    let current;try{current=JSON.parse(sessionStorage.getItem('fb_user')||'null');}catch{}
    if(!current?.id||window.FBSession&& !window.FBSession.check())throw Error('로그인 후 공지사항을 작성해주세요.');
    return current;
  }
  const canEdit=(n,u)=>u?.role==='admin'||!!n.createdBy&&n.createdBy===u?.id;
  function commit(change){
    const u=user(),items=read(),result=change(items,u);
    try{localStorage.setItem(KEY,JSON.stringify({schema:1,notices:items}));}catch{throw Error('공지사항을 저장하지 못했어요. 브라우저 저장 공간을 확인해주세요.');}
    render();return result;
  }
  function save(input){
    const title=String(input.title||'').trim(),body=String(input.body||'').trim(),category=input.category;
    if(!title||title.length>100)throw Error('제목은 1~100자로 입력해주세요.');
    if(!body||body.length>10000)throw Error('내용은 1~10,000자로 입력해주세요.');
    if(!categories.includes(category))throw Error('공지 분류를 선택해주세요.');
    return commit((items,u)=>{
      const n=input.id?items.find(n=>n.id===input.id):null;
      if(input.id&&!n)throw Error('공지를 찾을 수 없습니다.');
      if(n&&!canEdit(n,u))throw Error('직접 작성한 공지만 수정할 수 있어요.');
      if(n&&n.revision!==input.revision)throw Error('다른 화면에서 수정한 공지입니다. 다시 열어주세요.');
      const now=new Date().toISOString();
      if(n){Object.assign(n,{title,body,category,showHome:input.showHome===true,updatedAt:now,revision:n.revision+1});return n.id;}
      const id='notice-'+crypto.randomUUID();items.unshift({id,title,body,category,tag:category==='제품공지'?'tp':category==='사내공지'?'ti':'tg',author:u.name||u.id,createdBy:u.id,createdAt:now,updatedAt:now,showHome:input.showHome===true,revision:0});return id;
    });
  }
  function setHome(id,value){return commit(items=>{const n=items.find(n=>n.id===id);if(!n)throw Error('공지를 찾을 수 없습니다.');n.showHome=value===true;n.revision=(n.revision||0)+1;});}
  function el(tag,className,text){const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;}
  function status(text){
    let node=document.getElementById('noticeStatus');
    if(!node){node=el('p','notice-feedback');node.id='noticeStatus';node.setAttribute('role','status');document.querySelector('[data-notice-list]')?.before(node);}
    node.textContent=text;
  }
  function render(){
    let items;try{items=read();}catch(e){status(e.message);return;}
    let u=null;try{u=user();}catch{}
    document.querySelectorAll('[data-notice-create]').forEach(b=>{b.disabled=!u;b.title=u?'공지 작성':'로그인이 필요합니다.';});
    document.querySelectorAll('[data-notice-list]').forEach(list=>{
      const home=list.dataset.noticeList==='home',shown=home?items.filter(n=>n.showHome===true):items;
      list.replaceChildren();
      if(!shown.length){list.append(el('p','notice-empty',home?'메인에 표시할 공지가 없습니다. 공지사항에서 메인 노출을 선택해주세요.':'등록된 공지사항이 없습니다.'));return;}
      for(const n of shown){
        const article=el('article','home-notice-row'),tag=el('span','tag '+(n.category==='제품공지'?'tp':n.category==='사내공지'?'ti':'tg'),n.category),body=el('div'),title=el('h2','row-title'),open=el('button','notice-title-button',n.title),summary=el('p','row-sum',n.body),meta=el('div','home-notice-author');
        open.type='button';open.addEventListener('click',()=>view(n));title.append(open);body.append(title,summary);meta.append(el('span','notice-author-name',n.author||''));
        if(!home){
          if(n.createdAt)meta.append(el('time','notice-date',new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(n.createdAt))));
          const label=el('label','notice-home-toggle'),checkbox=el('input');checkbox.type='checkbox';checkbox.checked=n.showHome===true;checkbox.disabled=!u;checkbox.setAttribute('aria-label',n.title+' 메인 노출');
          checkbox.addEventListener('change',()=>{try{setHome(n.id,checkbox.checked);status('메인 화면 노출 설정을 저장했어요.');}catch(e){checkbox.checked=n.showHome===true;status(e.message);}});
          label.append(checkbox,document.createTextNode('메인 노출'));meta.append(label);
          if(canEdit(n,u)){const edit=el('button','notice-secondary','수정');edit.type='button';edit.addEventListener('click',()=>editor(n));meta.append(edit);}
        }
        article.append(tag,body,meta);list.append(article);
      }
    });
  }
  let editDialog,viewDialog,editing;
  function editor(n=null){
    try{user();}catch(e){status(e.message);return;}
    if(!editDialog){
      editDialog=el('dialog','notice-dialog');editDialog.setAttribute('aria-labelledby','noticeEditorTitle');
      editDialog.innerHTML='<form id="noticeForm"><div class="notice-dialog-heading"><h2 id="noticeEditorTitle">공지 작성</h2><button type="button" class="notice-secondary" data-notice-cancel aria-label="공지 작성 닫기">닫기</button></div><label class="notice-field"><span>분류</span><select name="category"><option>사내공지</option><option>제품공지</option><option>일반공지</option></select></label><label class="notice-field"><span>제목</span><input name="title" maxlength="100" required placeholder="공지 제목을 입력하세요"></label><label class="notice-field"><span>내용</span><textarea name="body" maxlength="10000" required placeholder="전달할 내용을 입력하세요"></textarea></label><label class="notice-home-toggle"><input type="checkbox" name="showHome">메인 화면에 노출</label><p class="notice-storage-help">공지는 현재 브라우저에 저장됩니다.</p><p class="notice-error" role="alert" id="noticeFormError"></p><div class="notice-dialog-footer"><button type="button" class="notice-secondary" data-notice-cancel>취소</button><button type="submit" class="notice-primary">저장</button></div></form>';
      document.body.append(editDialog);
      editDialog.querySelectorAll('[data-notice-cancel]').forEach(b=>b.addEventListener('click',()=>editDialog.close()));
      editDialog.querySelector('form').addEventListener('submit',event=>{
        event.preventDefault();const fields=editDialog.querySelector('form').elements;
        try{save({id:editing?.id,revision:editing?.revision,title:fields.namedItem('title').value,body:fields.namedItem('body').value,category:fields.namedItem('category').value,showHome:fields.namedItem('showHome').checked});editDialog.close();status('공지사항을 저장했어요.');}
        catch(e){document.getElementById('noticeFormError').textContent=e.message;}
      });
    }
    editing=n?clone(n):null;const fields=editDialog.querySelector('form').elements;
    fields.namedItem('title').value=n?.title||'';fields.namedItem('body').value=n?.body||'';fields.namedItem('category').value=n?.category||'사내공지';fields.namedItem('showHome').checked=n?.showHome===true;
    document.getElementById('noticeEditorTitle').textContent=n?'공지 수정':'공지 작성';document.getElementById('noticeFormError').textContent='';
    editDialog.showModal();fields.namedItem('title').focus();
  }
  function view(n){
    if(!viewDialog){viewDialog=el('dialog','notice-dialog notice-reader');document.body.append(viewDialog);}
    viewDialog.replaceChildren();viewDialog.setAttribute('aria-labelledby','noticeReaderTitle');
    const head=el('div','notice-dialog-heading'),title=el('h2','',n.title),close=el('button','notice-secondary','닫기');title.id='noticeReaderTitle';close.type='button';close.addEventListener('click',()=>viewDialog.close());
    head.append(title,close);viewDialog.append(head,el('p','notice-reader-meta',n.category+' · '+n.author),el('p','notice-reader-body',n.body));viewDialog.showModal();
  }
  window.PortalNotices=Object.freeze({list:()=>clone(read()),save,setHome});
  document.querySelectorAll('[data-notice-create]').forEach(b=>b.addEventListener('click',()=>editor()));
  window.addEventListener('storage',e=>{if(e.key===KEY||e.key===null)render();});
  render();
})();
