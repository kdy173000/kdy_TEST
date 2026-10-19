'use strict';
window.FB = (() => {
const KEY='fireball_materials_demo_v3';
const DEFAULT_DELIVERY_ADDRESS='부산광역시 기장군 장안읍 오리산단8로 53';
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
const VERSION_USES=['공용 사용','국내 전용','해외 전용'];
function versionStatus(v){return ['중단','미사용','사용 중단'].includes(v.state)?'중단':VERSION_USES.includes(v.state)?v.state:VERSION_USES.includes(v.market)?v.market:'공용 사용';}
function normalizeProducts(d){
if(!Array.isArray(d.deliveryAddresses))d.deliveryAddresses=[];
if(!d.deliveryAddresses.some(a=>a.id==='fireball'))d.deliveryAddresses.unshift({id:'fireball',label:'파이어볼',address:DEFAULT_DELIVERY_ADDRESS});
if(!Array.isArray(d.suppliers))d.suppliers=[];
for(const order of d.orders){if(!order.supplierId){const name=String(order.supplier||'미등록 업체').trim()||'미등록 업체';let supplier=d.suppliers.find(s=>s.name===name);if(!supplier){supplier={id:'SUP-'+String(d.suppliers.length+1).padStart(4,'0'),name,contact:'',phone:'',memo:'',archived:false};d.suppliers.push(supplier);}order.supplierId=supplier.id;}}
if(!Array.isArray(d.productCategories))d.productCategories=[...defaultCategories];for(const p of d.products){if(!p.category)p.category='파이어볼';}for(const p of d.products){if(!Array.isArray(p.versions))p.versions=[{id:'V01',qty:p.finished,state:'사용'}];}for(const item of [...d.products,...d.materials])for(const v of item.versions||[]){const status=versionStatus(v);if(status==='중단')v.state='중단';else{v.state='사용';v.market=status;}}return d;}
function read(){try{const raw=localStorage.getItem(KEY);if(raw){const d=JSON.parse(raw);if(d.schema!==3||!Array.isArray(d.materials)||!Array.isArray(d.orders))throw Error('저장 데이터 형식이 다릅니다.');const p=d.products.find(p=>p.id==='DEMO-5');if(p&&p.name==='케미컬 4L 샘플'){p.name='케미컬 4L';p.sample=false;}return normalizeProducts(d);}return normalizeProducts(seed());}catch(e){throw Error('이 브라우저의 저장 데이터를 읽을 수 없습니다. '+e.message);}}
let state=read();
function user(){try{const session=JSON.parse(sessionStorage.getItem('fb_user')||'null');if(!session)return null;const accounts=JSON.parse(localStorage.getItem('fb_accounts')||'[]');return accounts.find(a=>a.id===session.id)||session;}catch{return null;}}
const STOCK_PERMS=['재고관리팀','재고관리자','발주팀','입출고관리','입출고 관리자'];
const DESIGN_PERMS=['디자인팀','디자이너'];
const hasAny=perms=>{const u=user();return !!u&&(u.perms||[]).some(p=>perms.includes(p));};
const canAdmin=()=>user()?.role==='admin'||hasAny(STOCK_PERMS);
const canShip=()=>canAdmin()||hasAny(['출고']);
const canPhoto=()=>hasAny([...STOCK_PERMS,...DESIGN_PERMS]);
function shipping(){if(!canShip())throw Error('출고 또는 재고관리팀 권한이 필요합니다.');}
function admin(){if(!canAdmin())throw Error('재고관리팀 권한이 필요합니다.');}
function integer(n,min=1){if(!Number.isSafeInteger(n)||n<min)throw Error(`${min} 이상의 정수 수량을 입력하세요.`);return n;}
function required(s,label){const v=String(s||'').trim();if(!v)throw Error(label+'을 입력하세요.');return v;}
const mid=(d,id)=>{const m=d.materials.find(x=>x.id===id);if(!m)throw Error('부자재를 찾을 수 없습니다.');return m;};
const version=(m,id)=>{const v=m.versions.find(x=>x.id===id);if(!v)throw Error('부자재 버전을 찾을 수 없습니다.');return v;};
function usable(m,v){if(m.archived||v.state!=='사용')throw Error('사용 중단된 부자재 또는 버전입니다.');}
function transaction(d,r){d.transactions.push({...r,name:r.name||mid(d,r.mid).name});}
function mutate(fn,authorize=admin){authorize();const latest=read();if(latest.revision!==state.revision){state=latest;throw Error('다른 화면에서 데이터가 변경되었습니다. 최신 내용을 확인한 뒤 다시 저장하세요.');}const draft=structuredClone(state),result=fn(draft);draft.revision++;try{localStorage.setItem(KEY,JSON.stringify(draft));}catch{throw Error('브라우저에 저장하지 못했습니다. 저장 공간과 브라우저 설정을 확인하세요.');}state=draft;window.dispatchEvent(new Event('fb-data'));return result;}
function linked(d,id){return d.products.flatMap(p=>p.boms).filter(b=>b.rows.some(r=>r.mid===id));}
function saveMaterial(input){admin();return mutate(d=>{const name=required(input.name,'부자재명'),slot=input.slot,scope=input.scope||'';if(!slots.includes(slot)||name.length>80)throw Error('부자재명과 분류를 확인하세요.');if(scope&&!d.products.some(p=>p.id===scope))throw Error('연결 제품을 확인하세요.');if(d.materials.some(m=>!m.deleted&&m.id!==input.id&&m.name.toLowerCase()===name.toLowerCase()&&m.slot===slot&&m.scope===scope))throw Error('동일한 부자재가 이미 있습니다.');if(input.id){const m=mid(d,input.id);if(linked(d,m.id).length&&(slot!==m.slot||scope!==m.scope))throw Error('BOM에 연결된 분류와 제품은 변경할 수 없습니다.');Object.assign(m,{name,slot,scope,memo:String(input.memo||'').trim()});return m.id;}const vid=required(input.vid,'최초 버전'),qty=integer(Number(input.qty),0);const id='MAT-'+String(d.materials.length+1).padStart(4,'0');d.materials.push({id,name,slot,scope,memo:String(input.memo||'').trim(),archived:false,versions:[{id:vid,qty,state:'사용'}]});if(qty)transaction(d,{mid:id,vid,qty,type:'입고',date:day(),person:user()?.name||'관리자',note:'초기 재고 등록'});return id;});}
function deleteMaterial(id){return mutate(d=>{const m=mid(d,id);if(m.deleted)throw Error('이미 삭제된 부자재입니다.');if(linked(d,id).length||d.orders.some(o=>o.mid===id)||d.transactions.some(t=>t.mid===id)||d.productions.some(p=>p.rows.some(r=>r.mid===id))||m.versions.some(v=>v.qty!==0))throw Error('BOM·발주·입출고 기록 또는 재고가 있어 삭제할 수 없습니다. 단종 처리를 사용하세요.');d.deletedMaterials=d.deletedMaterials||[];d.deletedMaterials.push({date:day(),person:user()?.name||'',material:structuredClone(m)});m.deleted=true;m.archived=true;});}
function toggleMaterial(id){admin();return mutate(d=>{const m=mid(d,id);m.archived=!m.archived;});}
function addVersion(id,name){admin();return mutate(d=>{const m=mid(d,id),vid=required(name,'버전명');if(m.archived||vid.length>20||m.versions.some(v=>v.id.toLowerCase()===vid.toLowerCase()))throw Error('사용 상태 또는 중복 버전명을 확인하세요.');m.versions.push({id:vid,qty:0,state:'사용'});});}
function toggleVersion(id,vid){admin();return mutate(d=>{const v=version(mid(d,id),vid);if(v.deleted)throw Error('삭제된 버전은 사용 상태를 변경할 수 없습니다.');v.state=v.state==='사용'?'중단':'사용';});}
function stockMovement(input){return mutate(d=>{const m=mid(d,input.mid),v=version(m,input.vid);usable(m,v);const qty=integer(Number(input.qty)),person=required(input.person,'담당자'),date=required(input.date,'날짜'),note=required(input.note,'차감 사유');if(!['출고','재고 조정'].includes(input.type))throw Error('차감 유형을 확인하세요.');if(v.qty<qty)throw Error('차감 가능한 재고가 부족합니다.');v.qty-=qty;transaction(d,{mid:m.id,vid:v.id,qty,type:input.type,date,person,note});});}
function saveDeliveryAddress(input){return mutate(d=>{
 const label=required(input.label,'납품처 이름'),address=required(input.address,'납품주소');if(label.length>40||address.length>200)throw Error('납품처 이름은 40자, 주소는 200자 이내로 입력하세요.');
 const existing=d.deliveryAddresses.find(a=>a.address===address||a.label===label);
 if(existing){if(existing.id==='fireball')throw Error('파이어볼 주소는 기본 납품처로 등록되어 있습니다.');if(existing.address!==address)throw Error('같은 이름의 납품처가 있습니다. 다른 이름으로 저장하세요.');return existing.id;}
 const id='ADDR-'+Date.now().toString(36)+'-'+d.deliveryAddresses.length;d.deliveryAddresses.push({id,label,address});return id;
});}
function removeDeliveryAddress(id){return mutate(d=>{if(id==='fireball')throw Error('기본 파이어볼 납품처는 삭제할 수 없습니다.');const index=d.deliveryAddresses.findIndex(a=>a.id===id);if(index<0)throw Error('납품처를 찾을 수 없습니다.');d.deliveryAddresses.splice(index,1);});}
function saveSupplier(input){return mutate(d=>{
const name=required(input.name,'업체명');if(name.length>80)throw Error('업체명은 80자 이내로 입력하세요.');
if(d.suppliers.some(s=>s.id!==input.id&&s.name.toLowerCase()===name.toLowerCase()))throw Error('이미 등록된 업체명입니다.');
const fields={name,contact:String(input.contact||'').trim().slice(0,60),phone:String(input.phone||'').trim().slice(0,60),memo:String(input.memo||'').trim().slice(0,200)};
const previous=d.suppliers.find(s=>s.id===input.id);
for(const [key,limit] of [['businessNumber',12],['representative',60],['openedOn',10],['corporateNumber',14],['address',200],['headOfficeAddress',200],['businessType',100],['businessItem',100]]){fields[key]=String(input[key]===undefined?(previous?.[key]||''):input[key]).trim();if(fields[key].length>limit)throw Error('사업자 정보의 입력 길이를 확인하세요.');}
for(const [key,length,label] of [['businessNumber',10,'사업자등록번호'],['corporateNumber',13,'법인등록번호']]){
 if(!fields[key])continue;
 if(!/^[0-9-]+$/.test(fields[key])||fields[key].replaceAll('-','').length!==length)throw Error(label+' 자릿수를 확인하세요.');
 const number=fields[key].replaceAll('-','');fields[key]=key==='businessNumber'?number.slice(0,3)+'-'+number.slice(3,5)+'-'+number.slice(5):number.slice(0,6)+'-'+number.slice(6);
}
if(fields.businessNumber&&d.suppliers.some(s=>s.id!==input.id&&String(s.businessNumber||'').replaceAll('-','')===fields.businessNumber.replaceAll('-','')))throw Error('동일한 사업자등록번호의 업체가 있습니다.');
if(fields.openedOn&&(!/^\d{4}-\d{2}-\d{2}$/.test(fields.openedOn)||Number.isNaN(Date.parse(fields.openedOn))||new Date(fields.openedOn).toISOString().slice(0,10)!==fields.openedOn))throw Error('개업연월일을 확인하세요.');

if(input.id){const s=d.suppliers.find(s=>s.id===input.id);if(!s)throw Error('업체를 찾을 수 없습니다.');Object.assign(s,fields);return s.id;}
const id='SUP-'+String(d.suppliers.length+1).padStart(4,'0');d.suppliers.push({id,...fields,archived:false});return id;
});}
function toggleSupplier(id){return mutate(d=>{const s=d.suppliers.find(s=>s.id===id);if(!s)throw Error('업체를 찾을 수 없습니다.');s.archived=!s.archived;});}
function createOrders(inputs){return mutate(d=>{
if(!Array.isArray(inputs)||!inputs.length||inputs.length>100)throw Error('1~100개의 발주 품목을 입력하세요.');
const batch='BATCH-'+String(d.orders.length+1).padStart(4,'0'),ids=[];
for(const input of inputs){
const m=mid(d,input.mid),v=version(m,input.vid);usable(m,v);
if(m.deleted||v.deleted)throw Error('삭제된 부자재 또는 버전으로 발주할 수 없습니다.');
const supplier=d.suppliers.find(s=>s.id===input.supplierId&&!s.archived);if(!supplier)throw Error('등록된 사용 중인 업체를 선택하세요.');
const qty=integer(Number(input.qty)),date=required(input.date,'발주 날짜'),person=required(input.person,'담당자'),due=String(input.due||'');
for(const value of [date,due].filter(Boolean)){if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number.isNaN(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)throw Error('올바른 날짜를 입력하세요.');}
const spec=String(input.spec||'').trim();if(spec.length>80)throw Error('규격은 80자 이내로 입력하세요.');
let unitPrice=null,supplyAmount=null,taxAmount=null;
if(input.unitPrice!==undefined&&input.unitPrice!==null){if(String(input.unitPrice).trim()==='')throw Error('단가를 입력하세요.');unitPrice=integer(Number(input.unitPrice),0);supplyAmount=integer(unitPrice*qty,0);taxAmount=integer(Math.round(supplyAmount*0.1),0);if(!Number.isSafeInteger(supplyAmount+taxAmount))throw Error('금액이 너무 큽니다.');}
const personPhone=String(input.personPhone||'').trim();if(personPhone.length>40)throw Error('담당자 전화번호는 40자 이내로 입력하세요.');
const deliveryAddress=String(input.deliveryAddress||'').trim();if(deliveryAddress.length>200)throw Error('납품주소는 200자 이내로 입력하세요.');
const id='PO-'+String(d.orders.length+1).padStart(4,'0');
d.orders.push({id,batch,deliveryAddress,spec,unitPrice,supplyAmount,taxAmount,taxRate:0.1,mid:m.id,vid:v.id,name:m.name,qty,received:0,supplierId:supplier.id,supplier:supplier.name,date,due,person,personPhone,note:String(input.note||'').trim().slice(0,200),closed:false});ids.push(id);
}
return ids;
});}
function createOrder(input){return createOrders([input])[0];}
function receiveOrder(input){return mutate(d=>{
const order=d.orders.find(o=>o.id===input.id);
if(!order||order.closed||order.received>=order.qty)throw Error('입고 가능한 발주가 아닙니다.');
const delivered=integer(Number(input.qty),0),defective=integer(Number(input.defective||0),0),finish=input.finish===true;
if(defective>delivered)throw Error('불량 수량은 이번에 받은 전체 수량보다 많을 수 없습니다.');
if(!delivered&&!finish)throw Error('이번에 받은 수량을 입력하거나 남은 수량 취소를 선택하세요.');
const good=delivered-defective,m=mid(d,order.mid),v=version(m,input.vid||order.vid),person=required(input.person,'담당자'),date=required(input.date,'입고 날짜'),note=String(input.note||'').trim();
if(!Number.isSafeInteger(v.qty+good)||!Number.isSafeInteger(order.received+good))throw Error('수량이 너무 큽니다.');
if(v.deleted)throw Error('삭제된 버전으로는 입고할 수 없습니다.');
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
function updateOrder(input){return mutate(d=>{
 const o=d.orders.find(o=>o.id===input.id);if(!o)throw Error('발주를 찾을 수 없습니다.');
 if(input.revision!==d.revision)throw Error('다른 화면에서 정보가 변경되었습니다. 창을 닫고 최신 발주에서 다시 수정하세요.');
 const midValue=input.mid||o.mid,vidValue=input.vid||o.vid,m=mid(d,midValue),v=version(m,vidValue),changed=midValue!==o.mid||vidValue!==o.vid;
 const hasReceipts=d.transactions.some(t=>t.order===o.id)||(o.receipts||[]).some(r=>!r.deleted);
 if(changed&&hasReceipts)throw Error('입고 기록이 있는 발주의 제품·버전은 변경할 수 없습니다. 입고 내역을 먼저 확인하세요.');
 if(changed){usable(m,v);if(m.deleted||v.deleted)throw Error('삭제된 제품·버전은 선택할 수 없습니다.');}
 const qty=integer(Number(input.qty));if(qty<o.received)throw Error('발주 수량은 이미 정상 입고한 '+o.received+'개보다 적을 수 없습니다.');
 if(o.closed&&qty!==o.qty)throw Error('잔량 마감된 발주의 수량은 변경할 수 없습니다.');
 const supplier=d.suppliers.find(s=>s.id===input.supplierId);if(!supplier||(supplier.archived&&supplier.id!==o.supplierId))throw Error('등록된 사용 중인 업체를 선택하세요.');
 const date=required(input.date,'발주 날짜'),due=String(input.due||'');
 for(const value of [date,due].filter(Boolean))if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number.isNaN(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)throw Error('올바른 날짜를 입력하세요.');
 const spec=String(input.spec||'').trim(),note=String(input.note||'').trim(),deliveryAddress=String(input.deliveryAddress||'').trim(),person=required(input.person,'담당자');
 if(spec.length>80||note.length>200||deliveryAddress.length>200||person.length>30)throw Error('입력 항목의 글자 수를 확인하세요.');
 let unitPrice=null,supplyAmount=null,taxAmount=null;
 if(input.unitPrice!==null&&input.unitPrice!==undefined&&String(input.unitPrice).trim()!==''){unitPrice=integer(Number(input.unitPrice),0);supplyAmount=integer(qty*unitPrice,0);taxAmount=integer(Math.round(supplyAmount*0.1),0);if(!Number.isSafeInteger(supplyAmount+taxAmount))throw Error('금액이 너무 큽니다.');}
 else if(o.unitPrice!==null&&o.unitPrice!==undefined)throw Error('단가를 입력하세요.');
 const personPhone=String(input.personPhone===undefined?(o.personPhone||''):input.personPhone).trim();if(personPhone.length>40)throw Error('담당자 전화번호는 40자 이내로 입력하세요.');
 const before=structuredClone(o);
 Object.assign(o,{mid:m.id,vid:v.id,name:m.name,qty,supplierId:supplier.id,supplier:supplier.name,date,due,spec,note,deliveryAddress,person,personPhone,unitPrice,supplyAmount,taxAmount,taxRate:0.1});
 d.orderEdits=d.orderEdits||[];d.orderEdits.push({id:o.id,date:day(),person:user()?.name||'',before,after:structuredClone(o)});
});}
function updateOrderDue(input){return mutate(d=>{const o=d.orders.find(o=>o.id===input.id);if(!o||o.closed||o.received>=o.qty)throw Error('입고 대기 발주만 예정일을 수정할 수 있습니다.');const due=String(input.due||'');if(due&&(!/^\d{4}-\d{2}-\d{2}$/.test(due)||Number.isNaN(Date.parse(due))||new Date(due).toISOString().slice(0,10)!==due))throw Error('올바른 입고 예정일을 입력하세요.');o.due=due;});}
function closeOrder(id){return mutate(d=>{const o=d.orders.find(o=>o.id===id);if(!o||o.closed||o.received===o.qty)throw Error('마감 가능한 미입고 발주가 없습니다.');o.closed=true;});}
function saveProduct(input){admin();return mutate(d=>{const name=required(input.name,'완제품명'),family=Number(input.family),category=input.category||'파이어볼';if(!d.productCategories.includes(category))throw Error('완제품 분류를 확인하세요.');if(name.length>80)throw Error('완제품명은 80자 이내로 입력하세요.');if(!Number.isInteger(family)||family<0||family>=families.length)throw Error('포장 유형을 확인하세요.');if(d.products.some(p=>p.id!==input.id&&p.name===name))throw Error('같은 이름의 완제품이 있습니다.');if(input.id){const p=d.products.find(p=>p.id===input.id);if(!p)throw Error('완제품을 찾을 수 없습니다.');Object.assign(p,{name,family,category,sample:input.sample===true});return p.id;}const id='PROD-'+String(d.products.length+1).padStart(4,'0');d.products.push({id,name,family,category,sample:input.sample===true,archived:false,finished:0,versions:[{id:'V01',qty:0,state:'사용'}],boms:[{name:'BOM 01',locked:false,rows:[]}]});return id;});}
function deleteProduct(id){return mutate(d=>{
 const p=d.products.find(p=>p.id===id);if(!p||p.deleted)throw Error('삭제할 자재를 찾을 수 없습니다.');
 if(p.finished!==0||p.versions.some(v=>v.qty!==0)||d.productions.some(r=>r.pid===id)||d.transactions.some(t=>t.pid===id)||d.materials.some(m=>!m.deleted&&m.scope===id)||p.boms.some(b=>b.locked))throw Error('재고·생산·출고 기록 또는 연결된 부자재가 있어 삭제할 수 없습니다. 단종 처리를 사용하세요.');
 d.deletedProducts=d.deletedProducts||[];d.deletedProducts.push({date:day(),person:user()?.name||'',product:structuredClone(p)});p.deleted=true;p.archived=true;
});}
function toggleProduct(id){admin();return mutate(d=>{const p=d.products.find(p=>p.id===id);if(!p||p.deleted)throw Error('완제품을 찾을 수 없습니다.');p.archived=!p.archived;});}
function addProductVersion(id,name){admin();return mutate(d=>{const p=d.products.find(p=>p.id===id),vid=required(name,'버전명');if(!p||p.archived||vid.length>20||p.versions.some(v=>v.id.toLowerCase()===vid.toLowerCase()))throw Error('사용 상태와 중복 버전명을 확인하세요.');p.versions.push({id:vid,qty:0,state:'사용'});});}
function shipProduct(input){return mutate(d=>{const p=d.products.find(p=>p.id===input.pid);if(!p||p.archived)throw Error('출고 가능한 완제품을 선택하세요.');const qty=integer(Number(input.qty)),date=required(input.date,'출고 날짜'),person=required(input.person,'담당자'),note=required(input.note,'출고 사유');const v=version(p,input.vid||'V01');usable(p,v);if(v.qty<qty)throw Error('선택한 완제품 버전의 재고가 부족합니다.');v.qty-=qty;p.finished-=qty;d.transactions.push({pid:p.id,name:p.name,qty,date,person,note,type:'완제품 출고',vid:v.id});},shipping);}
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
const requestedState=input.state===undefined?v.state:input.state;
if(!['사용','중단',...VERSION_USES].includes(requestedState))throw Error('사용 상태를 확인하세요.');
const nextState=requestedState==='중단'?'중단':'사용';
const nextMarket=VERSION_USES.includes(requestedState)?requestedState:input.market===undefined?(v.market||'공용 사용'):input.market;
if(!VERSION_USES.includes(nextMarket))throw Error('사용 상태를 확인하세요.');
const old=v.id,oldState=v.state,oldMarket=v.market||'공용 사용';v.id=name;v.state=nextState;v.market=nextMarket;
for(const t of d.transactions)if(product?t.pid===entity.id:t.mid===entity.id){if(t.vid===old)t.vid=name;if(t.orderedVid===old)t.orderedVid=name;}
for(const p of d.productions){if(product&&p.pid===entity.id&&p.vid===old)p.vid=name;for(const row of p.rows||[])if(!product&&row.mid===entity.id&&row.vid===old)row.vid=name;}
if(!product){for(const p of d.products)for(const b of p.boms)for(const row of b.rows)if(row.mid===entity.id&&row.vid===old)row.vid=name;for(const o of d.orders)if(o.mid===entity.id){if(o.vid===old)o.vid=name;for(const row of o.receipts||[]){if(row.vid===old)row.vid=name;if(row.orderedVid===old)row.orderedVid=name;}}}
d.versionEdits=d.versionEdits||[];d.versionEdits.push({kind:input.kind,id:entity.id,before:old,after:name,beforeState:oldState,afterState:nextState,beforeMarket:oldMarket,afterMarket:nextMarket,date:day(),person:user()?.name||''});
});}
const slots=['캡','용기','스웨이드','어플리케이터','전면 라벨','후면 라벨','속지','케이스'];
const families=['유리막 50ml','유리막 105ml','뿌리막 200ml','뿌리막 100ml','케미컬 500ml','케미컬 4L'];
window.addEventListener('storage',e=>{if(e.key===KEY){state=read();window.dispatchEvent(new Event('fb-data'));}});
return {get data(){return state;},slots,families,day,user,versionStatus,canAdmin,canShip,canPhoto,defaultDeliveryAddress:DEFAULT_DELIVERY_ADDRESS,saveDeliveryAddress,removeDeliveryAddress,saveSupplier,toggleSupplier,createOrders,addProductCategory,saveProduct,deleteProduct,toggleProduct,addProductVersion,shipProduct,manageVersion,saveMaterial,deleteMaterial,toggleMaterial,addVersion,toggleVersion,stockMovement,updateMaterialTransaction,deleteMaterialTransaction,createOrder,receiveOrder,updateOrder,updateOrderDue,closeOrder,copyBom,updateBom,addBomRow,removeBomRow,requirements:(pid,index,q)=>requirements(state,pid,index,q),produce,cancelProduction};
})();
