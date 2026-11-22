'use strict';
(()=>{
 const host=document.getElementById('participant'),M=ShippingForms;
 try{
  const params=new URLSearchParams(location.search),owner=params.get('owner'),id=params.get('form');
  if(!owner||!id)throw Error('작성할 폼을 선택해주세요.');
  const form=M.forms(owner).find(f=>f.id===id);if(!form)throw Error('이 브라우저에 저장된 폼이 없습니다. 출고 폼 관리에서 저장한 뒤 작성 화면을 열어주세요.');
  document.title=form.title+' · 파이어볼';
  M.render(host,form,answers=>{M.submit(owner,id,form.revision,answers);host.replaceChildren(M.node('h1','', '제출을 완료했어요.'),M.node('p','muted','테스트 응답이 이 브라우저에 저장되었습니다. 출고 폼 관리의 응답 탭에서 확인할 수 있어요.'));});
 }catch(e){host.replaceChildren(M.node('h1','','폼을 열 수 없습니다.'),M.node('p','muted',e.message));}
})();