'use strict';
const search = document.getElementById('contact-search');
const cards = [...document.querySelectorAll('.contact-card')];
const normalize = value => value.toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
function filterContacts(){
 const query=normalize(search.value); const words=query.split(/\s+/); let count=0;
 for(const card of cards){const text=normalize(card.dataset.search);const phoneQuery=search.value.replace(/\D/g,'');const phoneMatch=phoneQuery.length>=4&&[...card.querySelectorAll('a[href^="tel:"]')].some(a=>a.getAttribute('href').replace(/\D/g,'').includes(phoneQuery));const visible=words.every(word=>text.includes(word))||phoneMatch;card.hidden=!visible;if(visible)count++;}
 document.getElementById('contact-count').textContent=`Контактов: ${count}`;
 document.getElementById('contacts-empty').hidden=count!==0;
}
search.addEventListener('input',filterContacts);
document.getElementById('clear-contacts').addEventListener('click',()=>{search.value='';filterContacts();search.focus();});
