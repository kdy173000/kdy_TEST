'use strict';
window.OrderDocument=(()=>{
 const $=id=>document.getElementById(id),esc=UI.esc;
 let pages=[],current=0;
 function makePages(rows){
  const groups=new Map();
  for(const row of rows){const key=JSON.stringify([row.supplierId,row.date]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(structuredClone(row));}
  const result=[];
  for(const rows of groups.values()){const supplier=structuredClone(FB.data.suppliers.find(s=>s.id===rows[0].supplierId)||{name:rows[0].supplier});for(let i=0;i<rows.length;i+=15)result.push({supplier,date:rows[0].date,rows:rows.slice(i,i+15)});}
  return result;
 }
 function sheet(page,index,total){
  const s=page.supplier,rows=page.rows;
  const body=rows.map((r,i)=>'<tr><td>'+String(i+1)+'</td><td>'+esc(r.name)+'</td><td>'+esc(r.vid)+'</td><td class="num">'+esc(r.qty)+'</td><td></td><td></td><td>'+esc(r.note)+'</td></tr>').join('')+Array.from({length:Math.max(0,15-rows.length)},()=>'<tr>'+Array.from({length:7},()=>'<td>&nbsp;</td>').join('')+'</tr>').join('');
  const due=[...new Set(rows.map(r=>r.due).filter(Boolean))].join(', ')||'미정',person=[...new Set(rows.map(r=>r.person).filter(Boolean))].join(', ');
  return '<article class="invoice-sheet"><h1>발 주 서</h1><div class="invoice-info"><div><strong>공급자 · '+esc(s.name||'')+'</strong><br>발행일자: '+esc(page.date)+'<br>사업자등록번호: '+esc(s.businessNumber||'')+'<br>대표자: '+esc(s.representative||'')+'<br>사업장: '+esc(s.address||'')+'<br>업태 / 종목: '+esc(s.businessType||'')+' / '+esc(s.businessItem||'')+'<br>연락처: '+esc(s.phone||'')+'</div><div><strong>공급받는 자 · ㈜파이어볼</strong><br>등록번호: <br>사업장: <br>전화번호: <br><br>아래와 같이 제품 발주드립니다.</div></div><table><thead><tr><th>번호</th><th>품명</th><th>버전</th><th>수량</th><th>단가</th><th>공급가액</th><th>비고</th></tr></thead><tbody>'+body+'</tbody></table><div class="invoice-total">합계 수량: '+rows.reduce((n,r)=>n+Number(r.qty),0).toLocaleString('ko-KR')+'개</div><div class="invoice-footer">납기일자: '+esc(due)+'<br>납품장소:  ㈜파이어볼<br>담당자: '+esc(person)+'</div><div class="invoice-page-number">'+(index+1)+' / '+total+'</div></article>';
 }
 function render(){if(!pages.length)return;$('previewPaper').innerHTML=sheet(pages[current],current,pages.length);$('pageNumber').textContent=(current+1)+' / '+pages.length;$('previousPage').disabled=current===0;$('nextPage').disabled=current===pages.length-1;}
 function selectedPages(){const range=$('previewRange').value;if(range==='current')return [pages[current]];if(range==='all')return pages;const from=Number($('pageFrom').value),to=Number($('pageTo').value);if(!Number.isInteger(from)||!Number.isInteger(to)||from<1||to<from||to>pages.length)throw Error('1~'+pages.length+' 범위의 페이지를 입력하세요.');return pages.slice(from-1,to);}
 function print(selected){
  const frame=$('orderPrintFrame'),doc=frame.contentDocument;
  const css=[...document.styleSheets].filter(s=>{try{return s.href?.includes('order-pages.css')}catch{return false}}).flatMap(s=>{try{return [...s.cssRules].filter(r=>r.cssText.includes('invoice-')).map(r=>r.cssText)}catch{return []}}).join('\n');
  doc.open();doc.write('<!doctype html><html lang="ko"><head><meta charset="UTF-8"><title>발주서</title><style>'+css+'\n@page{size:A4 portrait;margin:10mm}body{margin:0}*{box-sizing:border-box}.invoice-sheet{width:190mm;min-height:270mm;margin:0;padding:6mm;font-family:Arial,sans-serif;break-after:page;box-shadow:none}.invoice-sheet:last-child{break-after:auto}.invoice-info{display:grid;grid-template-columns:1fr 1fr}.num{text-align:right}</style></head><body>'+selected.map((p,i)=>sheet(p,i,selected.length)).join('')+'</body></html>');doc.close();frame.contentWindow.focus();setTimeout(()=>frame.contentWindow.print(),100);
 }
 const xml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c])).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'');
 const enc=new TextEncoder();
 function zip(files){
  const parts=[],central=[];let offset=0;
  const crc=bytes=>{let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;};
  const bytes=(size,entries)=>{const b=new Uint8Array(size),v=new DataView(b.buffer);for(const [at,value,bits] of entries)bits===16?v.setUint16(at,value,true):v.setUint32(at,value,true);return b;};
  for(const [path,text] of Object.entries(files)){
   const name=enc.encode(path),data=enc.encode(text),sum=crc(data);
   const local=bytes(30,[[0,0x04034b50],[4,20,16],[6,0x800,16],[14,sum],[18,data.length],[22,data.length],[26,name.length,16]]);
   parts.push(local,name,data);
   const header=bytes(46,[[0,0x02014b50],[4,20,16],[6,20,16],[8,0x800,16],[16,sum],[20,data.length],[24,data.length],[28,name.length,16],[42,offset]]);
   central.push(header,name);offset+=local.length+name.length+data.length;
  }
  const length=central.reduce((n,b)=>n+b.length,0),count=Object.keys(files).length;
  return new Blob([...parts,...central,bytes(22,[[0,0x06054b50],[8,count,16],[10,count,16],[12,length],[16,offset]])],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
 }
 function workbook(selected){
  const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main',rels='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const files={
   '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+selected.map((_,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'</Types>',
   '_rels/.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="'+rels+'/officeDocument" Target="xl/workbook.xml"/></Relationships>',
   'xl/workbook.xml':'<workbook xmlns="'+ns+'" xmlns:r="'+rels+'"><sheets>'+selected.map((_,i)=>'<sheet name="발주서 '+(i+1)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+'</sheets></workbook>',
   'xl/_rels/workbook.xml.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+selected.map((_,i)=>'<Relationship Id="rId'+(i+1)+'" Type="'+rels+'/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join('')+'</Relationships>'
  };
  selected.forEach((p,i)=>{
   const s=p.supplier,rows=[['발주서'],['발행일자',p.date],['공급자',s.name],['사업자등록번호',s.businessNumber||''],['대표자',s.representative||''],['사업장 소재지',s.address||''],['업태',s.businessType||'','종목',s.businessItem||''],['공급받는 자','㈜파이어볼'],['등록번호',''],['사업장 소재지',''],[],['번호','품명','버전','수량','단가','공급가액','비고'],...p.rows.map((r,j)=>[j+1,r.name,r.vid,Number(r.qty),'','',r.note]),['합계 수량','','',p.rows.reduce((n,r)=>n+Number(r.qty),0)],['담당자',[...new Set(p.rows.map(r=>r.person).filter(Boolean))].join(', ')]];
   const data=rows.map((row,r)=>'<row r="'+(r+1)+'">'+row.map((v,c)=>{const address=String.fromCharCode(65+c)+(r+1);return typeof v==='number'?'<c r="'+address+'"><v>'+v+'</v></c>':'<c r="'+address+'" t="inlineStr"><is><t xml:space="preserve">'+xml(v)+'</t></is></c>';}).join('')+'</row>').join('');
   files['xl/worksheets/sheet'+(i+1)+'.xml']='<worksheet xmlns="'+ns+'"><cols><col min="1" max="1" width="18" customWidth="1"/><col min="2" max="2" width="44" customWidth="1"/><col min="3" max="6" width="15" customWidth="1"/><col min="7" max="7" width="35" customWidth="1"/></cols><sheetData>'+data+'</sheetData><pageSetup paperSize="9" orientation="portrait" fitToWidth="1"/></worksheet>';
  });
  return zip(files);
 }
 function download(blob){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='발주서_'+FB.day()+'.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function open(rows){
  if(!rows.length)throw Error('미리 볼 발주가 없습니다.');pages=makePages(rows);current=0;$('previewSavePanel').hidden=true;$('previewSaveError').textContent='';$('previewRange').value='all';$('previewRangeFields').hidden=true;$('pageFrom').value=1;$('pageTo').value=pages.length;$('pageFrom').max=$('pageTo').max=pages.length;render();$('orderPreview').showModal();
 }
 document.addEventListener('DOMContentLoaded',()=>{
  $('closePreview').onclick=()=>$('orderPreview').close();$('previousPage').onclick=()=>{if(current>0){current--;render();}};$('nextPage').onclick=()=>{if(current<pages.length-1){current++;render();}};
  $('previewPrint').onclick=()=>print(pages);$('previewSave').onclick=()=>{$('previewSavePanel').hidden=!$('previewSavePanel').hidden;};
  $('cancelPreviewSave').onclick=()=>$('previewSavePanel').hidden=true;$('previewRange').onchange=()=>$('previewRangeFields').hidden=$('previewRange').value!=='range';
  $('confirmPreviewSave').onclick=()=>{try{const selected=selectedPages();if($('previewFormat').value==='xlsx')download(workbook(selected));else print(selected);$('previewSaveError').textContent='';$('previewSavePanel').hidden=true;}catch(e){$('previewSaveError').textContent=e.message;}};
 });
 return {open};
})();