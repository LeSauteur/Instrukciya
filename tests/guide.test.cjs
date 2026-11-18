const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const guide=read('index.html');
const contacts=read('contacts.html');
const offices=JSON.parse(read('assets/offices.json'));
const groups=JSON.parse(read('assets/groups.json'));
test('all local links and hash destinations exist',()=>{
 for(const [file,html] of [['index.html',guide],['contacts.html',contacts]]){
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length,'duplicate IDs in '+file);
  for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
   const href=match[1];if(/^(?:https?:|tel:|mailto:)/.test(href))continue;
   if(href.startsWith('#'))assert.ok(ids.includes(href.slice(1).split('?')[0]),href);
   else assert.ok(fs.existsSync(path.join(root,href)),href);
  }
 }
});
test('departed staff and obsolete messenger links are removed',()=>{
 assert.doesNotMatch(guide+contacts,/Арлашин|Деменков|Потапов|79885618612|79289097483|whatsapp|wa\.me|Ватсап/i);
 assert.match(guide,/Лилекина Инна Сергеевна/);
 assert.match(guide,/Барлаухян Кристина/);
 assert.match(guide,/Плешаков Тимур/);
});
test('registration has every document, deadline, recipient and the correct fee',()=>{
 const registration=guide.match(/<section[^>]*id="registration"[\s\S]*?<\/section>/)[0];
 for(const text of ['до 16:00','16:00–18:00','следующим днём','ИНН','СНИЛС','Анкета с двух сторон','Чек оплаты','Поползина Екатерина','+79287741010','2202 2080 2009 3028','450','45%','в один день']) assert.ok(registration.includes(text),text);
 assert.equal((registration.match(/type="checkbox"/g)||[]).length,6);
 assert.doesNotMatch(guide,/<form|type="file"|localStorage|sessionStorage/);
 assert.match(guide,/2,5% с оборота сделки агента/);
 assert.doesNotMatch(guide,/10% с заработной платы/);
});
test('closed offices and archival offices are excluded; active records are unique',()=>{
 assert.equal(offices.length,68);
 assert.equal(new Set(offices.map(o=>o.id)).size,offices.length);
 assert.ok(offices.every(o=>![2,21,23,4,13,14,30,31,35,42,45,57].includes(o.id)));
 assert.doesNotMatch(JSON.stringify(offices),/Баев|Князев|Котовская/);
 assert.ok(offices.some(o=>o.id===7&&o.address.includes('Маяковского')));
 assert.equal(offices.filter(o=>o.group==='orlov').length,9);
});
test('all supplied MAX groups are present with unique HTTPS links',()=>{
 assert.equal(groups.length,43);
 assert.equal(new Set(groups.map(g=>g.url)).size,43);
 assert.equal(groups.filter(g=>g.category==='Новостройки').length,35);
 for(const g of groups){const url=new URL(g.url);assert.equal(url.protocol,'https:');assert.ok(['max.ru','web.max.ru'].includes(url.hostname));assert.doesNotMatch(g.url,/\\|\s/);}
 assert.equal(groups.find(g=>g.name==='Чат франшизы').url,'https://web.max.ru/-69693060838746');
 assert.equal(groups.find(g=>g.name==='Рассылка Франшизным офисам').url,'https://web.max.ru/-77435612847450');
});
test('agent contacts page is independent of all manager content and navigation',()=>{
 assert.doesNotMatch(contacts,/app\.js|groups\.json|offices\.json|index\.html|href="#|<nav|роялти|2,5%|450 рублей|2202 2080|registration-template/);
 assert.equal((contacts.match(/class="contact-card"/g)||[]).length,19);
 assert.equal((contacts.match(/<h1>/g)||[]).length,1);
 for(const match of contacts.matchAll(/href="([^"]+)"/g))assert.ok(match[1].startsWith('tel:')||match[1].startsWith('assets/'),match[1]);
});
test('all three downloadable documents are nonempty and have the expected binary format',()=>{
 for(const name of ['anketa-2026.doc','admin-offer.docx','agent-offer.docx']){
  const data=fs.readFileSync(path.join(root,'documents',name));assert.ok(data.length>3000);
  assert.equal(data.subarray(0,2).toString('hex'),name.endsWith('.docx')?'504b':'d0cf');
 }
});
test('JavaScript parses and external tab links use safe opener behavior',()=>{
 for(const script of ['assets/app.js','assets/contacts.js'])execFileSync(process.execPath,['--check',path.join(root,script)]);
 for(const html of [guide,contacts])for(const link of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g))assert.match(link[0],/rel="noopener noreferrer"/);
});
