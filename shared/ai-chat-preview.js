'use strict';
(() => {
 const popup=document.getElementById('chatPopup'),rooms=document.getElementById('chatRoomsView'),room=document.getElementById('chatRoomView');
 if(!popup||!rooms||!room)return;
 const footer=rooms.querySelector('.room-list-footer');
 if(!footer)return;
 const launch=document.createElement('button');launch.type='button';launch.className='room-footer-btn ai-chat-launch';launch.textContent='AI 채팅';footer.append(launch);
 const view=document.createElement('section');view.id='aiChatView';view.className='ai-chat-view';view.hidden=true;view.setAttribute('aria-label','AI 채팅 미리보기');
 view.innerHTML=`<div class="ai-chat-heading"><button type="button" data-ai-back aria-label="대화 목록으로 돌아가기">‹</button><strong>파이어볼 AI</strong><span>연결 준비 중</span></div>
 <div class="ai-chat-scroll"><div class="ai-chat-intro"><span class="ai-chat-mark" aria-hidden="true">AI</span><h3>업무를 더 간편하게</h3><p>사업자등록증 등록과 재고·발주 조회를<br>한곳에서 준비하고 있어요.</p></div>
 <div class="ai-chat-suggestions"><button type="button" data-ai-prompt="이 제품의 버전별 재고를 알려줘"><strong>재고 조회</strong><span>제품 · 버전별 재고 확인</span></button><button type="button" data-ai-prompt="입고중인 발주 내역을 알려줘"><strong>발주 조회</strong><span>업체별 발주 · 입고 상태 확인</span></button><button type="button" data-ai-attach><strong>사업자등록증 등록</strong><span>사진 첨부 → 정보 확인 → 업체 등록</span></button></div>
 <section class="ai-document-card" data-ai-document hidden><div class="ai-document-heading"><strong>첨부한 사업자등록증</strong><button type="button" data-ai-remove>첨부 삭제</button></div><img data-ai-image alt="첨부한 사업자등록증 미리보기"><p data-ai-filename></p><p class="ai-local-note">사진은 현재 화면에서 미리보기만 제공됩니다.</p><button type="button" disabled title="AI 연결 후 사용할 수 있습니다.">정보 추출</button><dl><div><dt>상호</dt><dd>추출 후 표시</dd></div><div><dt>사업자등록번호</dt><dd>추출 후 표시</dd></div><div><dt>대표자</dt><dd>추출 후 표시</dd></div><div><dt>사업장 주소</dt><dd>추출 후 표시</dd></div><div><dt>업태 · 종목</dt><dd>추출 후 표시</dd></div></dl><button type="button" disabled title="추출 내용을 확인한 뒤 발주팀 또는 관리자가 등록할 수 있습니다.">확인 후 업체 등록</button><small>업체 등록은 발주팀·관리자 권한으로 진행합니다.</small></section>
 <p class="ai-chat-notice" role="status">화면 미리보기입니다. AI 답변·정보 추출·업체 등록은 연결 후 사용할 수 있습니다.</p></div>
 <div class="ai-chat-composer"><input data-ai-file type="file" accept="image/jpeg,image/png,image/webp" hidden><label class="ai-chat-draft-label"><span>질문 작성</span><textarea data-ai-draft rows="2" maxlength="2000" placeholder="연결 후 재고·발주 정보를 물어보세요"></textarea></label><div><button type="button" data-ai-attach aria-label="사업자등록증 사진 첨부">＋ 사진 첨부</button><button type="button" class="ai-chat-send" disabled title="AI 연결 후 전송할 수 있습니다.">전송</button></div><p data-ai-error role="alert"></p></div>`;
 popup.append(view);
 const find=s=>view.querySelector(s),file=find('[data-ai-file]'),image=find('[data-ai-image]'),documentCard=find('[data-ai-document]'),error=find('[data-ai-error]');let previewUrl='';
 function removeAttachment(){if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl='';image.removeAttribute('src');documentCard.hidden=true;file.value='';find('[data-ai-filename]').textContent='';error.textContent='';}
 launch.onclick=()=>{if(typeof window.showRoomList==='function')window.showRoomList();rooms.style.display='none';room.style.display='none';view.hidden=false;};
 find('[data-ai-back]').onclick=()=>{view.hidden=true;if(typeof window.showRoomList==='function')window.showRoomList();else rooms.style.display='flex';};
 view.querySelectorAll('[data-ai-prompt]').forEach(button=>button.onclick=()=>{find('[data-ai-draft]').value=button.dataset.aiPrompt;find('[data-ai-draft]').focus();});
 view.querySelectorAll('[data-ai-attach]').forEach(button=>button.onclick=()=>file.click());
 find('[data-ai-remove]').onclick=removeAttachment;
 file.onchange=()=>{const photo=file.files?.[0];if(!photo)return;if(!['image/jpeg','image/png','image/webp'].includes(photo.type)||photo.size>10*1024*1024){error.textContent='10MB 이하의 JPG·PNG·WEBP 사진을 선택하세요.';file.value='';return;}removeAttachment();previewUrl=URL.createObjectURL(photo);image.src=previewUrl;find('[data-ai-filename]').textContent=photo.name;documentCard.hidden=false;documentCard.scrollIntoView({block:'nearest'});};
 window.addEventListener('pagehide',removeAttachment);
})();
