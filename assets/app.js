/* Static reference guide. No candidate data is collected or stored. */
'use strict';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const normalize = value => String(value).toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const matches = (text,query) => normalize(query).split(/\s+/).every(word => normalize(text).includes(word));
const tel = value => { const digits = value.replace(/\D/g,''); return 'tel:+'+(digits.startsWith('8') ? '7'+digits.slice(1) : digits); };
let groups = [], offices = [], groupCategory = 'Все', officeCategory = 'all';
const pageIndex = $$('.content-page').map(page => ({id:page.id,title:page.querySelector('h1').textContent,text:page.textContent.replace(/\s+/g,' ')}));
function toast(message){ $('#toast').textContent=message; $('#toast').classList.add('visible'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>$('#toast').classList.remove('visible'),2500); }
function closeMenu(){ $('#sidebar').classList.remove('open'); $('#menu-toggle').setAttribute('aria-expanded','false'); }
function route(focus=false){
 const [raw,query=''] = location.hash.slice(1).split('?');
 const id = document.getElementById(raw)?.classList.contains('page') ? raw : 'home';
 $('#global-search').value=''; $('#search-results').hidden=true;
 $$('.page').forEach(page=>page.hidden=page.id!==id);
 $$('[data-nav]').forEach(link=>{ if(link.dataset.nav===id)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current'); });
 const title=id==='home'?'Главная':document.getElementById(id).querySelector('h1').textContent;
 $('#current-section').textContent=title; document.title=title+' — Домиан';
 if(id==='groups' && query){ groupCategory=new URLSearchParams(query).get('category')||'Все'; renderGroups(); }
 closeMenu(); window.scrollTo({top:0,behavior:'instant'}); if(focus)document.getElementById(id).focus({preventScroll:true});
}
function renderGroups(){
 const query=$('#group-search').value;
 const result=groups.filter(g=>(groupCategory==='Все'||g.category===groupCategory)&&matches(g.name+' '+g.category,query));
 $('#group-list').innerHTML=result.map(g=>`<a class="group-link" href="${escapeHTML(g.url)}" target="_blank" rel="noopener noreferrer"><strong>${escapeHTML(g.name)}</strong><small>${escapeHTML(g.category)} · MAX</small><span aria-hidden="true">↗</span></a>`).join('');
 $('#group-count').textContent=`Показано ${result.length} из ${groups.length} групп`; $('#group-empty').hidden=result.length!==0;
 $$('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===groupCategory)));
}
function renderOffices(){
 const query=$('#office-search').value;
 const result=offices.filter(o=>(officeCategory==='all'||o.group===officeCategory)&&(matches([o.name,o.owner,o.address,o.phone].join(' '),query)||(/\d{4}/.test(query.replace(/\D/g,''))&&o.phone.replace(/\D/g,'').includes(query.replace(/\D/g,'')))));
 $('#office-list').innerHTML=result.map(o=>`<article class="office-card"><span class="eyebrow">${o.group==='orlov'?'Офис Павла Орлова':'Франшизный офис'}</span><h3>${escapeHTML(o.name)}</h3><p>${escapeHTML(o.address||'Адрес уточняется')}</p><p>${escapeHTML(o.owner)}</p>${o.phone?`<a class="phone" href="${tel(o.phone)}">${escapeHTML(o.phone)}</a>`:''}${o.address&&!/без офиса|без адреса/i.test(o.address)?`<a class="map-link" href="https://yandex.ru/maps/?text=${encodeURIComponent(o.address)}" target="_blank" rel="noopener noreferrer">Найти на карте ↗</a>`:''}</article>`).join('');
 $('#office-count').textContent=`Показано ${result.length} из ${offices.length} офисов`; $('#office-empty').hidden=result.length!==0;
 $$('[data-office]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.office===officeCategory)));
}
function search(){
 const query=$('#global-search').value.trim();
 if(!query){route();return;}
 $$('.page').forEach(page=>page.hidden=true); $('#search-results').hidden=false;
 const result=[];
 for(const page of pageIndex){if(matches(page.text,query)){const idx=normalize(page.text).indexOf(normalize(query).split(' ')[0]); const text=page.text.slice(Math.max(0,idx-35),Math.max(0,idx-35)+190); result.push({href:'#'+page.id,type:'Раздел',title:page.title,text});}}
 for(const g of groups){if(matches(g.name+' '+g.category,query))result.push({href:g.url,type:'Группа MAX · '+g.category,title:g.name,text:'Открыть группу в MAX',external:true});}
 for(const o of offices){if(matches([o.name,o.address,o.owner,o.phone].join(' '),query))result.push({href:'#offices',type:'Офис сети',title:o.name,text:o.address+' · '+o.owner,officeQuery:o.name});}
 $('#search-count').textContent=result.length?`Найдено: ${result.length}`:'Ничего не найдено. Попробуйте другой запрос.';
 $('#search-list').innerHTML=result.map(r=>`<a class="search-result" href="${escapeHTML(r.href)}"${r.external?' target="_blank" rel="noopener noreferrer"':''}${r.officeQuery?` data-office-query="${escapeHTML(r.officeQuery)}"`:''}><small>${escapeHTML(r.type)}</small><strong>${escapeHTML(r.title)} ${r.external?'↗':'→'}</strong><p>${escapeHTML(r.text)}</p></a>`).join('');
}
$('#global-search').addEventListener('input',search);
$('#group-search').addEventListener('input',renderGroups); $('#office-search').addEventListener('input',renderOffices);
$('#group-filters').addEventListener('click',e=>{const button=e.target.closest('[data-category]');if(button){groupCategory=button.dataset.category;renderGroups();}});
$('#office-filters').addEventListener('click',e=>{const button=e.target.closest('[data-office]');if(button){officeCategory=button.dataset.office;renderOffices();}});
$('#reset-groups').addEventListener('click',()=>{$('#group-search').value='';groupCategory='Все';renderGroups();$('#group-search').focus();});
$('#reset-offices').addEventListener('click',()=>{$('#office-search').value='';officeCategory='all';renderOffices();$('#office-search').focus();});
$('#menu-toggle').addEventListener('click',()=>{const open=$('#sidebar').classList.toggle('open');$('#menu-toggle').setAttribute('aria-expanded',String(open));});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();$('#global-search').focus();}if(e.key==='Escape'){closeMenu();if(document.activeElement===$('#global-search')){$('#global-search').value='';route();}}});
document.addEventListener('click',async e=>{
 const skip=e.target.closest('.skip');
 if(skip){e.preventDefault();$('#main').setAttribute('tabindex','-1');$('#main').focus();return;}
 const copy=e.target.closest('[data-copy]');
 if(copy){try{await navigator.clipboard.writeText(document.getElementById(copy.dataset.copy).textContent.trim());toast('Скопировано');}catch{toast('Не удалось скопировать. Выделите и скопируйте текст вручную.');}}
 const officeResult=e.target.closest('[data-office-query]');
 if(officeResult){e.preventDefault();location.hash='offices';route(true);$('#office-search').value=officeResult.dataset.officeQuery;officeCategory='all';renderOffices();}
 const nav=e.target.closest('a[href^="#"]');
 if(nav&&!officeResult){const target=nav.getAttribute('href').slice(1).split('?')[0];if(document.getElementById(target)?.classList.contains('page')&&location.hash===nav.getAttribute('href')){e.preventDefault();route(true);}}
 if(!e.target.closest('.sidebar,.mobile-header'))closeMenu();
});
$$('.checklist input').forEach(input=>input.addEventListener('change',()=>{$('#check-progress').textContent=`Готово ${$$('.checklist input:checked').length} из 6`;}));
window.addEventListener('hashchange',()=>route(true));
route();
async function load(){
 const results=await Promise.allSettled([fetch('assets/groups.json').then(r=>{if(!r.ok)throw Error('groups');return r.json();}),fetch('assets/offices.json').then(r=>{if(!r.ok)throw Error('offices');return r.json();})]);
 if(results[0].status==='fulfilled'){groups=results[0].value;$('#group-filters').innerHTML=['Все',...new Set(groups.map(g=>g.category))].map(c=>`<button type="button" data-category="${escapeHTML(c)}" aria-pressed="${c===groupCategory}">${escapeHTML(c)}</button>`).join('');renderGroups();}else{$('#group-count').textContent='Не удалось загрузить группы. Обновите страницу.';}
 if(results[1].status==='fulfilled'){offices=results[1].value;renderOffices();}else{$('#office-count').textContent='Не удалось загрузить офисы. Обновите страницу или откройте исходный справочник выше.';}
 if($('#global-search').value)search();
}
load();
