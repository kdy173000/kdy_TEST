'use strict';
window.FB = (() => {
const KEY='fireball_materials_demo_v3';
const day=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date());
function seed(){
const families=['유리막 50ml','유리막 105ml','뿌리막 200ml','뿌리막 100ml','케미컬 500ml','케미컬 4L'];
const materials=[],products=[],transactions=[],productions=[],orders=[];
function material(id,name,slot,qty=1000,versions){const m={id,name,slot,scope:'',memo:'',archived:false,versions:versions||[{id:'공용',qty,state:'사용'}]};materials.push(m);return id;}
material('cap','20파이 검정 안전캡 (호리병용)','캡');material('bottle','50ml 투명 유리병','용기');material('suede','스웨이드 3P','스웨이드',900);material('block','파이어볼 코팅블럭','어플리케이터');material('insert','74×48×105 속지','속지');
function makeProduct(id,name,family,qty=600,sample=false){const front=material(id+'-front',name,'전면 라벨',qty,[{id:'V01',qty:50,state:'중단'},{id:'V02',qty,state:'사용'}]);const back=material(id+'-back',name+' 후면','후면 라벨',qty,[{id:'V01',qty:50,state:'중단'},{id:'V02',qty,state:'사용'}]);let rows;
if(family===0)rows=[['캡','cap','공용'],['유리병','bottle','공용'],['스웨이드','suede','공용'],['어플리케이터','block','공용'],['전면 라벨',front,'V02'],['후면 라벨',back,'V02'],['속지','insert','공용']];
else {const bottle=material(id+'-bottle',families[family]+' 샘플 용기','용기');const cap=material(id+'-cap',families[family]+' 샘플 캡','캡');rows=[['캡',cap,'공용'],['용기',bottle,'공용'],['전면 라벨',front,'V02'],['후면 라벨',back,'V02']];}
materials.find(m=>m.id===front).scope=id;materials.find(m=>m.id===back).scope=id;
products.push({id,name,family,front,back,sample,finished:0,boms:[{name:'BOM 01',locked:false,rows:rows.map(([slot,mid,vid])=>({slot,mid,vid,each:1}))}]});}
makeProduct('FB-LB-004','나노코트 V3. 50ml',0);makeProduct('FB-LB-001','글라스 쉴드 프로 50ml',0,3500);makeProduct('FB-LB-002','글라스 쉴드 50ml',0);makeProduct('FB-LB-003','나노코트 V2 프로 35ml',0,400,true);
families.slice(1).forEach((name,i)=>makeProduct('DEMO-'+(i+1),name+' 샘플',i+1,600,true));

products.find(p=>p.family===5).name='케미컬 4L';products.find(p=>p.family===5).sample=false;
return {schema:3,revision:0,materials,products,transactions,productions,orders};
}
const defaultCategories=['파이어볼','바인더','코알라티','현대','OEM','ODM'];
function normalizeProducts(d){if(!Array.isArray(d.productCategories))d.productCategories=[...defaultCategories];for(const p of d.products){if(!p.category)p.category='파이어볼';}for(const p of d.products){if(!Array.isArray(p.versions))p.versions=[{id:'V01',qty:p.finished,state:'사용'}];}return d;}
function read(){try{const raw=localStorage.getItem(KEY);if(raw){const d=JSON.parse(raw);if(d.schema!==3||!Array.isArray(d.materials)||!Array.isArray(d.orders))throw Error('저장 데이터 형식이 다릅니다.');const p=d.products.find(p=>p.id==='DEMO-5');if(p&&p.name==='케미컬 4L 샘플'){p.name='케미컬 4L';p.sample=false;}return normalizeProducts(d);}return normalizeProducts(seed());}catch(e){throw Error('이 브라우저의 저장 데이터를 읽을 수 없습니다. '+e.message);}}
let state=read();
function user(){try{const session=JSON.parse(sessionStorage.getItem('fb_user')||'null');if(!session)return null;const accounts=JSON.parse(localStorage.getItem('fb_accounts')||'[]');return accounts.find(a=>a.id===session.id)||session;}catch{return null;}}
const canAdmin=()=>{const u=user();return !!u&&(u.role==='admin'||(u.perms||[]).some(p=>['재고관리자','입출고관리','입출고 관리자'].includes(p)));};
function admin(){if(!canAdmin())throw Error('재고관리자 권한이 필요합니다.');}
function integer(n,min=1){if(!Number.isSafeInteger(n)||n<min)throw Error(`${min} 이상의 정수 수량을 입력하세요.`);return n;}
function required(s,label){const v=String(s||'').trim();if(!v)throw Error(label+'을 입력하세요.');return v;}
const mid=(d,id)=>{const m=d.materials.find(x=>x.id===id);if(!m)throw Error('부자재를 찾을 수 없습니다.');return m;};
const version=(m,id)=>{const v=m.versions.find(x=>x.id===id);if(!v)throw Error('부자재 버전을 찾을 수 없습니다.');return v;};
function usable(m,v){if(m.archived||v.state!=='사용')throw Error('사용 중단된 부자재 또는 버전입니다.');}
function transaction(d,r){d.transactions.push({...r,name:r.name||mid(d,r.mid).name});}
function mutate(fn){admin();const latest=read();if(latest.revision!==state.revision){state=latest;throw Error('다른 화면에서 데이터가 변경되었습니다. 최신 내용을 확인한 뒤 다시 저장하세요.');}const draft=structuredClone(state),result=fn(draft);draft.revision++;try{localStorage.setItem(KEY,JSON.stringify(draft));}catch{throw Error('브라우저에 저장하지 못했습니다. 저장 공간과 브라우저 설정을 확인하세요.');}state=draft;window.dispatchEvent(new Event('fb-data'));return result;}
function linked(d,id){return d.products.flatMap(p=>p.boms).filter(b=>b.rows.some(r=>r.mid===id));}
function saveMaterial(input){admin();return mutate(d=>{const name=required(input.name,'부자재명'),slot=input.slot,scope=input.scope||'';if(!slots.includes(slot)||name.length>80)throw Error('부자재명과 분류를 확인하세요.');if(scope&&!d.products.some(p=>p.id===scope))throw Error('연결 제품을 확인하세요.');if(d.materials.some(m=>!m.deleted&&m.id!==input.id&&m.name.toLowerCase()===name.toLowerCase()&&m.slot===slot&&m.scope===scope))throw Error('동일한 부자재가 이미 있습니다.');if(input.id){const m=mid(d,input.id);if(linked(d,m.id).length&&(slot!==m.slot||scope!==m.scope))throw Error('BOM에 연결된 분류와 제품은 변경할 수 없습니다.');Object.assign(m,{name,slot,scope,memo:String(input.memo||'').trim()});return m.id;}const vid=required(input.vid,'최초 버전'),qty=integer(Number(input.qty),0);const id='MAT-'+String(d.materials.length+1).padStart(4,'0');d.materials.push({id,name,slot,scope,memo:String(input.memo||'').trim(),archived:false,versions:[{id:vid,qty,state:'사용'}]});if(qty)transaction(d,{mid:id,vid,qty,type:'입고',date:day(),person:user()?.name||'관리자',note:'초기 재고 등록'});return id;});}
function deleteMaterial(id){return mutate(d=>{const m=mid(d,id);if(m.deleted)throw Error('이미 삭제된 부자재입니다.');if(linked(d,id).length||d.orders.some(o=>o.mid===id)||d.transactions.some(t=>t.mid===id)||d.productions.some(p=>p.rows.some(r=>r.mid===id))||m.versions.some(v=>v.qty!==0))throw Error('BOM·발주·입출고 기록 또는 재고가 있어 삭제할 수 없습니다. 단종 처리를 사용하세요.');d.deletedMaterials=d.deletedMaterials||[];d.deletedMaterials.push({date:day(),person:user()?.name||'',material:structuredClone(m)});m.deleted=true;m.archived=true;});}
function toggleMaterial(id){admin();return mutate(d=>{const m=mid(d,id);m.archived=!m.archived;});}
function addVersion(id,name){admin();return mutate(d=>{const m=mid(d,id),vid=required(name,'버전명');if(m.archived||m.versions.some(v=>v.id.toLowerCase()===vid.toLowerCase()))throw Error('사용 상태 또는 중복 버전명을 확인하세요.');m.versions.push({id:vid,qty:0,state:'사용'});});}
function toggleVersion(id,vid){admin();return mutate(d=>{const v=version(mid(d,id),vid);if(v.deleted)throw Error('삭제된 버전은 사용 상태를 변경할 수 없습니다.');v.state=v.state==='사용'?'중단':'사용';});}
function stockMovement(input){return mutate(d=>{const m=mid(d,input.mid),v=version(m,input.vid);usable(m,v);const qty=integer(Number(input.qty)),person=required(input.person,'담당자'),date=required(input.date,'날짜'),note=required(input.note,'차감 사유');if(!['출고','재고 조정'].includes(input.type))throw Error('차감 유형을 확인하세요.');if(v.qty<qty)throw Error('차감 가능한 재고가 부족합니다.');v.qty-=qty;transaction(d,{mid:m.id,vid:v.id,qty,type:input.type,date,person,note});});}
function createOrder(input){return mutate(d=>{const m=mid(d,input.mid),v=version(m,input.vid);usable(m,v);const qty=integer(Number(input.qty)),supplier=required(input.supplier,'거래처'),date=required(input.date,'발주 날짜'),person=required(input.person,'담당자');const id='PO-'+String(d.orders.length+1).padStart(4,'0');d.orders.push({id,mid:m.id,vid:v.id,name:m.name,qty,received:0,supplier,date,due:input.due||'',person,note:input.note||'',closed:false});return id;});}
function receiveOrder(input){return mutate(d=>{
const order=d.orders.find(o=>o.id===input.id);
if(!order||order.closed||order.received>=order.qty)throw Error('입고 가능한 발주가 아닙니다.');
const delivered=integer(Number(input.qty),0),defective=integer(Number(input.defective||0),0),finish=input.finish===true;
if(defective>delivered)throw Error('불량 수량은 이번에 받은 전체 수량보다 많을 수 없습니다.');
if(!delivered&&!finish)throw Error('이번에 받은 수량을 입력하거나 남은 수량 취소를 선택하세요.');
const good=delivered-defective,m=mid(d,order.mid),v=version(m,input.vid||order.vid),person=required(input.person,'담당자'),date=required(input.date,'입고 날짜'),note=String(input.note||'').trim();
if(!Number.isSafeInteger(v.qty+good)||!Number.isSafeInteger(order.received+good))throw Error('수량이 너무 큽니다.');
const prior=order.received;v.qty+=good;order.received+=good;
order.delivered=(order.delivered??prior)+delivered;order.defective=(order.defective||0)+defective;
if(!Number.isSafeInteger(order.delivered)||!Number.isSafeInteger(order.defective))throw Error('수량이 너무 큽니다.');
order.receipts=order.receipts||[];order.receipts.push({vid:v.id,orderedVid:order.vid,date,person,delivered,defective,good,note,finish});
if(delivered)transaction(d,{mid:m.id,vid:v.id,qty:good,type:good?'입고':'불량 입고',date,person,note:order.id+' · 전체 '+delivered+'개 / 정상 '+good+'개 / 불량 '+defective+'개'+(note?' · '+note:''),order:order.id,orderedVid:order.vid,delivered,defective,receiptIndex:order.receipts.length-1});
if(finish){order.closed=true;order.closedDate=date;order.closedPerson=person;order.closeNote=note;}
});}
function changeMaterialTransaction(input,remove=false){return mutate(d=>{
if(input.revision!==d.revision)throw Error('기록이 변경되었습니다. 창을 닫고 최신 내역에서 다시 선택하세요.');
const index=integer(Number(input.index),0),t=d.transactions[index];
if(!t||!t.mid||t.production||t.pid||!['입고','불량 입고','출고','재고 조정'].includes(t.type))throw Error('생산 자동 기록은 생산 내역에서 취소해야 합니다.');
const v=version(mid(d,t.mid),t.vid),out=['출고','재고 조정'].includes(t.type),o=t.order?d.orders.find(o=>o.id===t.order):null;
if(t.order&&!o)throw Error('연결 발주를 찾을 수 없습니다.');
const before=structuredClone(t),oldGood=t.qty,oldBad=t.defective||0,oldDelivered=t.delivered??(oldGood+oldBad);
let good=0,bad=0,delivered=0,date=t.date,person=t.person,note=t.note;
if(!remove){date=required(input.date,'날짜');person=required(input.person,'담당자');note=String(input.note||'').trim();if(o){delivered=integer(Number(input.qty),0);bad=integer(Number(input.defective||0),0);if(bad>delivered)throw Error('불량 수량이 전체 수량보다 많습니다.');good=delivered-bad;}else{good=integer(Number(input.qty));if(out&&!note)throw Error('차감 사유를 입력하세요.');}}
const targetVersion=!remove&&o?version(mid(d,t.mid),input.vid||t.vid):v;
const oldSigned=out?-oldGood:oldGood,newSigned=remove?0:(out?-good:good),next=v.qty-oldSigned+(targetVersion===v?newSigned:0);
if(!Number.isSafeInteger(next)||next<0)throw Error('이미 사용된 재고가 있어 이 수량으로 수정하거나 삭제할 수 없습니다.');
if(targetVersion!==v){const targetQty=targetVersion.qty+newSigned;if(!Number.isSafeInteger(targetQty)||targetQty<0)throw Error('입고 버전의 재고를 확인하세요.');targetVersion.qty=targetQty;}v.qty=next;
if(o){
const nextReceived=o.received-oldGood+good;if(!Number.isSafeInteger(nextReceived)||nextReceived<0)throw Error('발주 입고 수량을 확인하세요.');
o.delivered=integer((o.delivered??o.received)-oldDelivered+delivered,0);o.defective=integer((o.defective||0)-oldBad+bad,0);o.received=nextReceived;
let receiptIndex=Number.isInteger(t.receiptIndex)?t.receiptIndex:(o.receipts||[]).findIndex(r=>!r.deleted&&r.good===oldGood&&r.delivered===oldDelivered&&r.defective===oldBad&&r.date===t.date&&r.person===t.person);
if(receiptIndex>=0&&o.receipts?.[receiptIndex]){if(remove)o.receipts[receiptIndex].deleted=true;else Object.assign(o.receipts[receiptIndex],{vid:targetVersion.id,orderedVid:o.vid,date,person,delivered,defective:bad,good,note});}
if(!remove){t.vid=targetVersion.id;t.orderedVid=o.vid;t.qty=good;t.delivered=delivered;t.defective=bad;t.type=good?'입고':'불량 입고';t.date=date;t.person=person;t.note=note;}
}else if(!remove)Object.assign(t,{qty:good,date,person,note});
d.transactionEdits=d.transactionEdits||[];d.transactionEdits.push({action:remove?'삭제':'수정',date:day(),person:user()?.name||person,before,after:remove?null:structuredClone(t)});
if(remove)d.transactions.splice(index,1);
});}
function updateMaterialTransaction(input){return changeMaterialTransaction(input);}
function deleteMaterialTransaction(input){return changeMaterialTransaction(input,true);}
function updateOrderDue(input){return mutate(d=>{const o=d.orders.find(o=>o.id===input.id);if(!o||o.closed||o.received>=o.qty)throw Error('입고 대기 발주만 예정일을 수정할 수 있습니다.');const due=String(input.due||'');if(due&&(!/^\d{4}-\d{2}-\d{2}$/.test(due)||Number.isNaN(Date.parse(due))||new Date(due).toISOString().slice(0,10)!==due))throw Error('올바른 입고 예정일을 입력하세요.');o.due=due;});}
function closeOrder(id){return mutate(d=>{const o=d.orders.find(o=>o.id===id);if(!o||o.closed||o.received===o.qty)throw Error('마감 가능한 미입고 발주가 없습니다.');o.closed=true;});}
function saveProduct(input){admin();return mutate(d=>{const name=required(input.name,'완제품명'),family=Number(input.family),category=input.category||'파이어볼';if(!d.productCategories.includes(category))throw Error('완제품 분류를 확인하세요.');if(name.length>80)throw Error('완제품명은 80자 이내로 입력하세요.');if(!Number.isInteger(family)||family<0||family>=families.length)throw Error('포장 유형을 확인하세요.');if(d.products.some(p=>p.id!==input.id&&p.name===name))throw Error('같은 이름의 완제품이 있습니다.');if(input.id){const p=d.products.find(p=>p.id===input.id);if(!p)throw Error('완제품을 찾을 수 없습니다.');Object.assign(p,{name,family,category,sample:input.sample===true});return p.id;}const id='PROD-'+String(d.products.length+1).padStart(4,'0');d.products.push({id,name,family,category,sample:input.sample===true,archived:false,finished:0,versions:[{id:'V01',qty:0,state:'사용'}],boms:[{name:'BOM 01',locked:false,rows:[]}]});return id;});}
function toggleProduct(id){admin();return mutate(d=>{const p=d.products.find(p=>p.id===id);if(!p)throw Error('완제품을 찾을 수 없습니다.');p.archived=!p.archived;});}
function addProductVersion(id,name){admin();return mutate(d=>{const p=d.products.find(p=>p.id===id),vid=required(name,'버전명');if(!p||p.archived||vid.length>20||p.versions.some(v=>v.id.toLowerCase()===vid.toLowerCase()))throw Error('사용 상태와 중복 버전명을 확인하세요.');p.versions.push({id:vid,qty:0,state:'사용'});});}
function shipProduct(input){return mutate(d=>{const p=d.products.find(p=>p.id===input.pid);if(!p||p.archived)throw Error('출고 가능한 완제품을 선택하세요.');const qty=integer(Number(input.qty)),date=required(input.date,'출고 날짜'),person=required(input.person,'담당자'),note=required(input.note,'출고 사유');const v=version(p,input.vid||'V01');usable(p,v);if(v.qty<qty)throw Error('선택한 완제품 버전의 재고가 부족합니다.');v.qty-=qty;p.finished-=qty;d.transactions.push({pid:p.id,name:p.name,qty,date,person,note,type:'완제품 출고',vid:v.id});});}
function getBom(d,pid,index){const p=d.products.find(p=>p.id===pid),b=p?.boms[index];if(!p||!b)throw Error('BOM을 찾을 수 없습니다.');return {p,b};}
function copyBom(pid,index){admin();return mutate(d=>{const {p,b}=getBom(d,pid,index);const copy=structuredClone(b);copy.locked=false;copy.name='BOM '+String(p.boms.length+1).padStart(2,'0');p.boms.push(copy);return p.boms.length-1;});}
function updateBom(pid,index,row,input){admin();return mutate(d=>{const {p,b}=getBom(d,pid,index);if(b.locked)throw Error('사용된 BOM은 복사한 뒤 수정하세요.');const r=b.rows[row];if(!r)throw Error('구성품을 찾을 수 없습니다.');const m=mid(d,input.mid),v=version(m,input.vid);usable(m,v);if(m.slot!==mid(d,r.mid).slot||m.scope&&m.scope!==p.id)throw Error('구성품 분류와 연결 제품이 맞지 않습니다.');Object.assign(r,{mid:m.id,vid:v.id,each:integer(Number(input.each))});});}
function requirements(d,pid,index,q){integer(q);const {b}=getBom(d,pid,index),map=new Map();for(const r of b.rows){integer(r.each);const amount=integer(r.each*q),key=r.mid+'|'+r.vid,prev=map.get(key);map.set(key,{...r,qty:integer(amount+(prev?.qty||0)),name:mid(d,r.mid).name});}return [...map.values()];}
function produce(input){return mutate(d=>{const q=integer(Number(input.qty)),{p,b}=getBom(d,input.pid,input.index),rows=requirements(d,p.id,input.index,q),date=required(input.date,'생산 날짜'),lot=required(input.lot,'LOT 번호'),person=required(input.person,'담당자');const pv=version(p,input.vid||'V01');usable(p,pv);if(p.archived||!rows.length)throw Error('사용 중인 완제품과 BOM 구성품을 확인하세요.');for(const r of rows){const m=mid(d,r.mid),v=version(m,r.vid);usable(m,v);if(v.qty<r.qty)throw Error(m.name+' 재고가 부족합니다.');}if(!Number.isSafeInteger(p.finished+q))throw Error('생산 수량이 너무 큽니다.');const id='PR-'+String(d.productions.length+1).padStart(4,'0');d.productions.push({id,pid:p.id,name:p.name,bom:b.name,vid:pv.id,q,date,lot,person,note:input.note||'',rows,cancelled:false});for(const r of rows){version(mid(d,r.mid),r.vid).qty-=r.qty;transaction(d,{...r,type:'생산 사용',date,person,note:id,production:id});}p.finished+=q;pv.qty+=q;b.locked=true;return id;});}
function cancelProduction(id){return mutate(d=>{const r=d.productions.find(p=>p.id===id);if(!r||r.cancelled)throw Error('이미 취소된 생산입니다.');const p=d.products.find(p=>p.id===r.pid);const pv=version(p,r.vid||'V01');if(pv.qty<r.q)throw Error('해당 생산 버전의 완제품 재고가 부족합니다.');for(const row of r.rows){const v=version(mid(d,row.mid),row.vid);integer(v.qty+row.qty,0);v.qty+=row.qty;transaction(d,{...row,type:'취소 복원',date:day(),person:user()?.name||r.person,note:id,production:id});}p.finished-=r.q;pv.qty-=r.q;r.cancelled=true;});}
function addBomRow(pid,index,materialId){admin();return mutate(d=>{const {p,b}=getBom(d,pid,index);if(b.locked)throw Error('BOM을 복사한 뒤 수정하세요.');const m=mid(d,materialId),v=m.versions.find(v=>v.state==='사용');if(m.archived||!v||m.scope&&m.scope!==p.id)throw Error('사용 가능한 부자재를 선택하세요.');if(b.rows.some(r=>r.mid===m.id))throw Error('이미 포함된 부자재입니다.');b.rows.push({slot:m.slot,mid:m.id,vid:v.id,each:1});});}
function removeBomRow(pid,index,row){admin();return mutate(d=>{const {b}=getBom(d,pid,index);if(b.locked||b.rows.length<=1)throw Error('잠긴 BOM 또는 마지막 구성품은 삭제할 수 없습니다.');if(!b.rows[row])throw Error('구성품을 찾을 수 없습니다.');b.rows.splice(row,1);});}
function addProductCategory(name){return mutate(d=>{const value=required(name,'분류명');if(value.length>30||d.productCategories.some(x=>x.toLowerCase()===value.toLowerCase()))throw Error('30자 이내의 중복되지 않는 분류명을 입력하세요.');d.productCategories.push(value);return value;});}
function manageVersion(input){return mutate(d=>{
const product=input.kind==='product',entity=(product?d.products:d.materials).find(x=>x.id===input.id);if(!entity)throw Error('항목을 찾을 수 없습니다.');const v=version(entity,input.vid);if(v.deleted)throw Error('삭제된 버전입니다.');
if(input.remove){
if(v.qty!==0)throw Error('재고가 0개인 버전만 삭제할 수 있습니다.');
if(!product&&d.orders.some(o=>o.mid===entity.id&&o.vid===v.id&&!o.closed&&o.received<o.qty))throw Error('입고 대기 발주가 있는 버전입니다. 입고를 먼저 처리하세요.');
if(!product&&d.products.some(p=>p.boms.some(b=>!b.locked&&b.rows.some(r=>r.mid===entity.id&&r.vid===v.id))))throw Error('현재 BOM에 연결된 버전입니다. BOM을 다른 버전으로 변경한 뒤 삭제하세요.');
v.deleted=true;v.state='중단';return;}
const name=required(input.name,'버전명');if(name.length>20||entity.versions.some(x=>x!==v&&x.id.toLowerCase()===name.toLowerCase()))throw Error('20자 이내의 중복되지 않는 버전명을 입력하세요.');
const old=v.id;v.id=name;
for(const t of d.transactions)if(product?t.pid===entity.id:t.mid===entity.id){if(t.vid===old)t.vid=name;if(t.orderedVid===old)t.orderedVid=name;}
for(const p of d.productions){if(product&&p.pid===entity.id&&p.vid===old)p.vid=name;for(const row of p.rows||[])if(!product&&row.mid===entity.id&&row.vid===old)row.vid=name;}
if(!product){for(const p of d.products)for(const b of p.boms)for(const row of b.rows)if(row.mid===entity.id&&row.vid===old)row.vid=name;for(const o of d.orders)if(o.mid===entity.id){if(o.vid===old)o.vid=name;for(const row of o.receipts||[]){if(row.vid===old)row.vid=name;if(row.orderedVid===old)row.orderedVid=name;}}}
d.versionEdits=d.versionEdits||[];d.versionEdits.push({kind:input.kind,id:entity.id,before:old,after:name,date:day(),person:user()?.name||''});
});}
const slots=['캡','용기','스웨이드','어플리케이터','전면 라벨','후면 라벨','속지','케이스'];
const families=['유리막 50ml','유리막 105ml','뿌리막 200ml','뿌리막 100ml','케미컬 500ml','케미컬 4L'];
window.addEventListener('storage',e=>{if(e.key===KEY){state=read();window.dispatchEvent(new Event('fb-data'));}});
return {get data(){return state;},slots,families,day,user,canAdmin,addProductCategory,saveProduct,toggleProduct,addProductVersion,shipProduct,manageVersion,saveMaterial,deleteMaterial,toggleMaterial,addVersion,toggleVersion,stockMovement,updateMaterialTransaction,deleteMaterialTransaction,createOrder,receiveOrder,updateOrderDue,closeOrder,copyBom,updateBom,addBomRow,removeBomRow,requirements:(pid,index,q)=>requirements(state,pid,index,q),produce,cancelProduction};
})();
