/* FESTIVEO Produccions 2027 — sitio público y vista previa con el mismo motor. */
(() => {
  'use strict';
  const qs = s => document.querySelector(s);
  const qsa = s => [...document.querySelectorAll(s)];
  const path = location.pathname.split('/').pop() || 'index.html';
  const files = { 'index.html':'inicio.json', 'nosaltres.html':'nosaltres.json', 'serveis.html':'serveis.json', 'esdeveniments.html':'esdeveniments.json', 'artistes.html':'artistes.json', 'contacte.html':'contacte.json' };
  const section = { 'index.html':'inicio', 'nosaltres.html':'nosaltres', 'serveis.html':'servicios', 'esdeveniments.html':'eventos', 'artistes.html':'artistas', 'contacte.html':'contacto' }[path] || 'inicio';
  const preview = new URLSearchParams(location.search).has('cms-preview');
  const state = {lang:'ca',page:null,settings:null,services:null,artists:null,events:null,draft:null};
  try { state.lang = localStorage.getItem('festiveo-lang') === 'es' ? 'es' : 'ca'; } catch(e) {}
  const tr = v => typeof v === 'string' ? v : String(v?.[state.lang] ?? v?.ca ?? '');
  const hasImage = v => typeof v === 'string' && (/^https:\/\//i.test(v) || /^\/(?!\/)/.test(v) || /^(?:assets|images)\//.test(v) || /^blob:/.test(v));
  const hasUrl = v => typeof v === 'string' && /^https:\/\//i.test(v);
  const hasHref = v => typeof v === 'string' && (hasUrl(v) || /^[\w./#?=&%-]+$/.test(v) || /^mailto:[^\s]+$/i.test(v) || /^tel:[+\d\s-]+$/i.test(v));
  const plain = (parent,value) => { parent.textContent = String(value ?? ''); };
  function rich(parent, value) {
    // Solo la etiqueta <em> tiene significado; el resto de lo escrito en el CMS se trata como texto.
    const chunks = String(value ?? '').split(/(<em>[\s\S]*?<\/em>)/gi);
    parent.replaceChildren(...chunks.map(chunk => {
      if (/^<em>[\s\S]*<\/em>$/i.test(chunk)) { const em=document.createElement('em');em.textContent=chunk.slice(4,-5);return em; }
      return document.createTextNode(chunk);
    }));
  }
  const effective = (which) => state.draft?.which === which ? state.draft.data : state[which];
  function renderThemeAndContacts() {
    const data = effective('settings'); if (!data) return;
    const pairs = [['gold','--gold'],['background','--black'],['foreground','--white']];
    for (const [key,css] of pairs) if (/^#[0-9a-fA-F]{6}$/.test(data[key] || '')) document.documentElement.style.setProperty(css,data[key]);
    qsa('.brand img').forEach(img => { if (hasImage(data.logo) && img.getAttribute('src') !== data.logo) img.src=data.logo; });
    qsa('.hero').forEach(hero => {
      if (hasImage(data.hero_image)) {
        const image=data.hero_image.replace(/["\\]/g,'');
        hero.style.backgroundImage='linear-gradient(90deg,rgba(0,0,0,.78),rgba(0,0,0,.36)),url("'+image+'")';
        hero.style.backgroundSize='cover';hero.style.backgroundPosition='center';
      } else { hero.style.removeProperty('background-image');hero.style.removeProperty('background-size');hero.style.removeProperty('background-position'); }
    });
    qsa('#nav a').forEach((a,i) => {
      const item = data.menu?.[i];if (!item)return;
      plain(a.querySelector('span') || a,tr(item));
      if (hasHref(item.href)) a.href=item.href;
    });
    if (data.phone) {
      const clean=String(data.phone).replace(/[^+\d]/g,'');
      qsa('[data-phone]').forEach(a => {a.href='tel:'+clean;plain(a,data.phone);});
      const wa=qs('a[href^="https://wa.me/"]'); if (wa) wa.href='https://wa.me/'+clean.replace(/\D/g,'');
    }
    if (data.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      qsa('[data-email]').forEach(a=> {a.href='mailto:'+data.email;plain(a,data.email);});
      const mail=qs('a[href^="mailto:"]:not([data-email])');if (mail) mail.href='mailto:'+data.email;
    }
    if (data.location) qsa('[data-location]').forEach(node=>plain(node,data.location));
    const socials = qs('#social-links');if (socials) {
      socials.replaceChildren();
      for (const service of ['instagram','facebook','tiktok']) if (hasUrl(data[service])) {
        const a=document.createElement('a');a.href=data[service];a.target='_blank';a.rel='noopener noreferrer';a.textContent=service[0].toUpperCase()+service.slice(1);socials.append(a);
      }
    }
    const slot=qs('#forvenues-slot'); if(slot){slot.replaceChildren();if (hasUrl(data.forvenues_url)) {
      const a=document.createElement('a');a.className='button primary';a.target='_blank';a.rel='noopener noreferrer';a.href=data.forvenues_url;a.textContent=state.lang==='ca'?'COMPRAR ENTRADES':'COMPRAR ENTRADAS';slot.append(a);
    }}
  }
  function renderText() {
    const data=effective('page');if (!data) return;
    qsa('[data-text]').forEach(node => { const item=data.texts?.[node.dataset.text];if (item) rich(node,tr(item)); });
    qsa('[data-eyebrow]').forEach(node=> {const item=data.eyebrows?.[node.dataset.eyebrow];if (item) plain(node,tr(item));});
    qsa('[data-button]').forEach(node=> {const item=data.buttons?.[node.dataset.button];if (hasHref(item?.href))node.href=item.href;});
    document.title=tr(data.seo_title)||document.title;
    const meta=qs('meta[name="description"]');if(meta)meta.content=tr(data.seo_description)||meta.content;
  }
  function renderCardList(target,items,kind) {
    const el=qs(target);if(!el || !Array.isArray(items))return;
    el.replaceChildren();
    for (const item of items){
      const card=document.createElement('article');card.className='feature';
      if(hasImage(item.image)) {const im=document.createElement('img');im.src=item.image;im.loading='lazy';im.alt=tr(item.title||item.name);im.style.cssText='width:100%;aspect-ratio:4/3;object-fit:cover';card.append(im);}
      const title=document.createElement('h3');title.textContent=tr(item.title||item.name);
      const desc=document.createElement('p');desc.textContent=tr(item.description||item.bio);card.append(title,desc);
      if (hasUrl(item.url)){const a=document.createElement('a');a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';a.className='event-link';a.textContent=state.lang==='ca'?'MÉS INFORMACIÓ →':'MÁS INFORMACIÓN →';card.append(a);}
      el.append(card);
    }
  }
  function renderLists() {
    const services=effective('services');if(services)renderCardList('#services-list',services.items,'service');
    const artists=effective('artists');if(artists){
      const items=artists.items||[];renderCardList('#artists-list',items,'artist');
      const cat=qs('#artist-categories'),note=qs('#artists-note');if(cat)cat.hidden=!!items.length;if(note)note.hidden=!!items.length;
    }
    const events=effective('events');const grid=qs('#event-gallery');if(!grid||!events)return;
    grid.replaceChildren();
    const items=Array.isArray(events)?events:(events.items||[]);
    if(!items.length){const note=document.createElement('p');note.className='empty-note';note.textContent=state.lang==='ca'?'Properament publicarem nous esdeveniments.':'Próximamente publicaremos nuevos eventos.';grid.append(note);return;}
    for(const item of items) {
      const card=document.createElement('article');card.className='event-card';
      const photos=(Array.isArray(item.photos)?item.photos:[]).map(v=>typeof v==='string'?v:v?.image).filter(hasImage);
      if(photos.length){const img=document.createElement('img');img.src=photos[0];img.alt=tr(item.title);img.loading='lazy';img.tabIndex=0;img.setAttribute('role','button');img.setAttribute('aria-label','Ver foto: '+tr(item.title));img.addEventListener('click',()=>openGallery(photos[0],tr(item.title)));img.addEventListener('keydown',e=>{if(e.key==='Enter')openGallery(photos[0],tr(item.title));});card.append(img);}
      const info=document.createElement('div');info.className='event-info';const date=document.createElement('span');date.className='event-date';date.textContent=item.date||'';
      const title=document.createElement('h3');title.textContent=tr(item.title);const desc=document.createElement('p');desc.textContent=tr(item.description);
      info.append(date,title,desc);
      if(photos.length>1){const thumbs=document.createElement('div');thumbs.className='thumbs';photos.slice(1).forEach(url=>{const button=document.createElement('button');button.type='button';button.setAttribute('aria-label','Abrir foto');const im=document.createElement('img');im.src=url;im.loading='lazy';im.alt=tr(item.title);button.append(im);button.addEventListener('click',()=>openGallery(url,tr(item.title)));thumbs.append(button);});info.append(thumbs);}
      if(hasUrl(item.url)){const a=document.createElement('a');a.href=item.url;a.className='event-link';a.target='_blank';a.rel='noopener noreferrer';a.textContent=state.lang==='ca'?'MÉS INFORMACIÓ →':'MÁS INFORMACIÓN →';info.append(a);}
      card.append(info);grid.append(card);
    }
  }
  function openGallery(src,title) {
    if(!hasImage(src))return;
    let modal=qs('#photo-modal');if(!modal){modal=document.createElement('div');modal.className='gallery-modal';modal.id='photo-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.hidden=true;const b=document.createElement('button');b.type='button';b.textContent='×';b.setAttribute('aria-label','Cerrar');const img=document.createElement('img');const label=document.createElement('p');modal.append(b,img,label);document.body.append(modal);b.addEventListener('click',closeGallery);modal.addEventListener('click',e=>{if(e.target===modal)closeGallery()});}
    modal.querySelector('img').src=src;plain(modal.querySelector('p'),title);modal.hidden=false;document.body.classList.add('no-scroll');modal.querySelector('button').focus();
  }
  function closeGallery(){const modal=qs('#photo-modal');if(modal)modal.hidden=true;document.body.classList.remove('no-scroll');}
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeGallery();});
  function render(){document.documentElement.lang=state.lang;renderThemeAndContacts();renderText();renderLists();qsa('[data-lang]').forEach(b=>{const active=b.dataset.lang===state.lang;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});}
  function scopeToState(scope){return {apariencia:'settings',inicio:'page',nosaltres:'page',servicios:scope===section?'page':'services',artistas:scope===section?'page':'artists',eventos:scope===section?'page':'events',contacto:'page'}[scope] || null;}
  if(preview){
    window.addEventListener('message',e=>{
      // Only the CMS parent window can change a preview; never activate on the public site.
      if((e.source!==window.parent && e.source!==window.top) || (e.origin!==location.origin && e.origin!=='null') || e.data?.type!=='festiveo:preview-draft')return;
      if(e.data.scope!==section && e.data.scope!=='apariencia')return;
      const pageOrList=e.data.name==='pagina'?'page':e.data.name==='ajustes'?'settings':e.data.name==='listado_eventos'?'events':e.data.name==='listado'?(section==='servicios'?'services':section==='artistas'?'artists':null):null;
      if(!pageOrList || !e.data.content || typeof e.data.content!=='object')return;
      state.draft={which:pageOrList,data:e.data.content};render();
    });
  }
  qsa('[data-lang]').forEach(button=>button.addEventListener('click',()=>{state.lang=button.dataset.lang;try{localStorage.setItem('festiveo-lang',state.lang)}catch(e){}render();}));
  const toggle=qs('#menu');if(toggle)toggle.addEventListener('click',()=>{const nav=qs('#nav');const isOpen=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(isOpen));});
  qsa('#nav a').forEach(a=>a.addEventListener('click',()=>{qs('#nav')?.classList.remove('open');toggle?.setAttribute('aria-expanded','false');}));
  const year=qs('#year');if(year)year.textContent=new Date().getFullYear();
  async function read(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error(url+' HTTP '+r.status);return r.json();}
  const tasks=[read('/cms/settings.json').then(x=>{state.settings=x;render();}),read('/cms/'+(files[path]||'inicio.json')).then(x=>{state.page=x;render();})];
  if(path==='serveis.html')tasks.push(read('/cms/services.json').then(x=>{state.services=x;render();}));
  if(path==='artistes.html')tasks.push(read('/cms/artists.json').then(x=>{state.artists=x;render();}));
  if(path==='esdeveniments.html')tasks.push(read('/events.json').then(x=>{state.events=x;render();}));
  Promise.allSettled(tasks).then(results=>{results.filter(x=>x.status==='rejected').forEach(x=>console.warn('FESTIVEO:',x.reason));render();if(preview)window.parent.postMessage({type:'festiveo:preview-ready'},'*');});
  render();
  if(preview)window.parent.postMessage({type:'festiveo:preview-ready'},'*');
})();
